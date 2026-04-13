import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/release/publish-homebrew-formula.mjs --tap-repo <owner/name> --formula-file <path> --version <v0.2.0> [--formula-name cautilus.rb]",
	].join("\n");
	const stream = exitCode === 0 ? process.stdout : process.stderr;
	stream.write(`${text}\n`);
	process.exit(exitCode);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index + 1] || "";
	if (!value) {
		throw new Error(`${option} requires a value`);
	}
	return value;
}

function parseArgs(argv = process.argv.slice(2)) {
	const options = {
		tapRepo: "",
		formulaFile: "",
		formulaName: "cautilus.rb",
		version: "",
	};
	for (let index = 0; index < argv.length; index += 1) {
		index = applyArg(options, argv, index);
	}
	if (!options.tapRepo) {
		throw new Error("--tap-repo is required");
	}
	if (!options.formulaFile) {
		throw new Error("--formula-file is required");
	}
	if (!options.version) {
		throw new Error("--version is required");
	}
	return options;
}

function applyArg(options, argv, index) {
	const arg = argv[index];
	if (arg === "-h" || arg === "--help") {
		usage(0);
	}
	const optionMap = {
		"--tap-repo": "tapRepo",
		"--formula-file": "formulaFile",
		"--formula-name": "formulaName",
		"--version": "version",
	};
	const target = optionMap[arg];
	if (!target) {
		throw new Error(`Unknown argument: ${arg}`);
	}
	options[target] = readRequiredValue(argv, index, arg);
	return index + 1;
}

function git(cwd, args, options = {}) {
	return execFileSync("git", args, {
		cwd,
		encoding: "utf-8",
		stdio: options.stdio ?? "pipe",
	});
}

export function publishHomebrewFormula({ tapRepo, formulaFile, formulaName = "cautilus.rb", version, token }) {
	if (!token) {
		throw new Error("HOMEBREW_TAP_TOKEN is required");
	}
	const resolvedFormula = resolve(formulaFile);
	if (!existsSync(resolvedFormula)) {
		throw new Error(`formula file does not exist: ${resolvedFormula}`);
	}
	const workspace = mkdtempSync(join(tmpdir(), "cautilus-homebrew-tap-"));
	try {
		const remoteUrl = `https://x-access-token:${token}@github.com/${tapRepo}.git`;
		git(process.cwd(), ["clone", remoteUrl, workspace], { stdio: "inherit" });
		git(workspace, ["config", "user.name", "github-actions[bot]"]);
		git(workspace, ["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
		const formulaDir = join(workspace, "Formula");
		mkdirSync(formulaDir, { recursive: true });
		const formulaTarget = join(formulaDir, formulaName);
		cpSync(resolvedFormula, formulaTarget);
		const status = git(workspace, ["status", "--short", "--", formulaTarget]);
		if (!String(status || "").trim()) {
			return { updated: false, formulaPath: formulaTarget };
		}
		git(workspace, ["add", formulaTarget]);
		git(workspace, ["commit", "-m", `Update cautilus formula to ${version}`], { stdio: "inherit" });
		git(workspace, ["push", "origin", "HEAD"], { stdio: "inherit" });
		return {
			updated: true,
			formulaPath: formulaTarget,
			formulaPreview: readFileSync(formulaTarget, "utf-8"),
		};
	} finally {
		rmSync(workspace, { recursive: true, force: true });
	}
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const result = publishHomebrewFormula({
			...options,
			token: process.env.HOMEBREW_TAP_TOKEN || "",
		});
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
