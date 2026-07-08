import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { parseArgs, runInstallSmoke } from "./run-install-smoke.mjs";

export function readCurrentVersion(repoRoot = process.cwd()) {
	const pkg = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf-8"));
	return `v${pkg.version}`;
}

export function buildCurrentInstallSmokeArgs(argv = process.argv.slice(2), repoRoot = process.cwd()) {
	for (const arg of argv) {
		if (arg === "--version" || arg === "--channel") {
			throw new Error(`release:smoke-install:current owns ${arg}; pass only smoke options such as --skip-update or --json`);
		}
	}
	return ["--channel", "install_sh", "--version", readCurrentVersion(repoRoot), ...argv];
}

export async function runCurrentInstallSmoke(argv = process.argv.slice(2), dependencies = {}) {
	const repoRoot = dependencies.repoRoot || process.cwd();
	const options = parseArgs(buildCurrentInstallSmokeArgs(argv, repoRoot));
	return runInstallSmoke(options, dependencies);
}

export async function main(argv = process.argv.slice(2)) {
	try {
		const result = await runCurrentInstallSmoke(argv);
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	await main();
}
