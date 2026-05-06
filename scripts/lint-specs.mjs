import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { relative, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { checkSpecs } from "./check-specs.mjs";

function fail(message) {
	throw new Error(message);
}

function usage() {
	return [
		"Usage: node scripts/lint-specs.mjs [spec-file ...]",
		"",
		"Without spec-file arguments, validates the public spec graph and runs the full specdown suite.",
		"With spec-file arguments, validates those files' links and runs specdown with each file as the temporary entry.",
	].join("\n");
}

function parseArgs(argv) {
	if (argv.includes("-h") || argv.includes("--help")) {
		return { help: true, targets: [] };
	}
	for (const arg of argv) {
		if (arg.startsWith("-")) {
			throw fail(`unknown argument: ${arg}`);
		}
	}
	return { help: false, targets: argv };
}

function repoRelative(repoRoot, filePath) {
	return relative(repoRoot, resolve(repoRoot, filePath)).replaceAll("\\", "/");
}

function runCommand(command, args, options = {}) {
	const result = spawnSync(command, args, {
		cwd: options.cwd,
		stdio: "inherit",
	});
	if (result.error) {
		throw result.error;
	}
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

function readSpecdownConfig(repoRoot) {
	const configPath = resolve(repoRoot, "specdown.json");
	if (!existsSync(configPath)) {
		throw fail("Missing required file: specdown.json");
	}
	return JSON.parse(readFileSync(configPath, "utf-8"));
}

function runFullSpecdown(repoRoot) {
	runCommand("specdown", ["run", "-quiet"], { cwd: repoRoot });
}

function runFocusedSpecdown(repoRoot, target, index) {
	const config = readSpecdownConfig(repoRoot);
	const targetEntry = repoRelative(repoRoot, target);
	const tempConfigPath = resolve(repoRoot, `.specdown-focus-${process.pid}-${index}.json`);
	writeFileSync(tempConfigPath, `${JSON.stringify({ ...config, entry: targetEntry }, null, 2)}\n`, "utf-8");
	try {
		process.stdout.write(`specdown focused run: ${targetEntry}\n`);
		runCommand("specdown", ["run", "-config", tempConfigPath, "-quiet", "-no-report"], { cwd: repoRoot });
	} finally {
		unlinkSync(tempConfigPath);
	}
}

export function main(argv = process.argv.slice(2)) {
	const repoRoot = process.cwd();
	try {
		const options = parseArgs(argv);
		if (options.help) {
			process.stdout.write(`${usage()}\n`);
			return;
		}

		const result = checkSpecs({ repoRoot, targets: options.targets });
		const suffix = result.selected ? " selected spec(s)" : " specs";
		process.stdout.write(`spec checks passed (${result.specCount}${suffix})\n`);

		if (options.targets.length === 0) {
			runFullSpecdown(repoRoot);
			return;
		}

		options.targets.forEach((target, index) => {
			runFocusedSpecdown(repoRoot, target, index);
		});
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
