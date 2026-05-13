import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import process from "node:process";

import { normalizeVersion } from "./bump-version.mjs";

function usage(exitCode = 0) {
	const stream = exitCode === 0 ? process.stdout : process.stderr;
	stream.write(
		[
			"Usage:",
			"  node ./scripts/release/prepare-release.mjs <version> [--repo-root <dir>]",
		].join("\n") + "\n",
	);
	process.exit(exitCode);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index + 1] || "";
	if (!value) {
		throw new Error(`${option} requires a value`);
	}
	return value;
}

export function parseArgs(argv = process.argv.slice(2)) {
	const options = {
		repoRoot: process.cwd(),
		version: "",
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--repo-root") {
			options.repoRoot = readRequiredValue(argv, index, arg);
			index += 1;
			continue;
		}
		if (!options.version) {
			options.version = normalizeVersion(arg);
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	if (!options.version) {
		throw new Error("A target version is required");
	}
	return {
		repoRoot: resolve(options.repoRoot),
		version: options.version,
	};
}

function runChecked(command, args, { repoRoot, run = spawnSync }) {
	const result = run(command, args, {
		cwd: repoRoot,
		stdio: "inherit",
	});
	if (result.status !== 0) {
		throw new Error(`${command} ${args.join(" ")} failed with exit ${result.status ?? "unknown"}`);
	}
}

export function prepareRelease({ repoRoot, version, run = spawnSync }) {
	const commands = [
		["npm", ["run", "skills:sync-packaged"]],
		["node", ["scripts/release/bump-version.mjs", version]],
		["npm", ["run", "release:claim-freshness"]],
	];
	for (const [command, args] of commands) {
		runChecked(command, args, { repoRoot, run });
	}
	return { repoRoot, version, commands };
}

export function main(argv = process.argv.slice(2), { run = spawnSync, stderr = process.stderr, exit = process.exit } = {}) {
	try {
		const options = parseArgs(argv);
		prepareRelease({ ...options, run });
		return 0;
	} catch (error) {
		stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		exit(1);
		return 1;
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
