#!/usr/bin/env node
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const NPM_COMMAND = process.platform === "win32" ? "npm.cmd" : "npm";
const NODE_COVERAGE_SCRIPTS = new Set(["test:node:coverage", "test:node:coverage:spec"]);

function runCommand(command, args, label) {
	return new Promise((resolvePromise, rejectPromise) => {
		const child = spawn(command, args, { cwd: REPO_ROOT, stdio: "inherit" });
		child.once("error", rejectPromise);
		child.once("exit", (code, signal) => {
			if (code === 0) {
				resolvePromise();
				return;
			}
			const outcome = signal ? `signal ${signal}` : `exit ${code}`;
			rejectPromise(new Error(`${label} failed (${outcome})`));
		});
	});
}

function runNpmScript(name) {
	return runCommand(NPM_COMMAND, ["run", name], name);
}

function aggregateCoverage() {
	return runCommand(
		process.execPath,
		[resolve(REPO_ROOT, "scripts", "aggregate-coverage.mjs")],
		"coverage aggregation",
	);
}

function parseArgs(argv) {
	if (argv.length === 0) {
		return {};
	}
	if (argv.length === 2 && argv[0] === "--node-script" && NODE_COVERAGE_SCRIPTS.has(argv[1])) {
		return { nodeScript: argv[1] };
	}
	throw new Error("--node-script must be test:node:coverage or test:node:coverage:spec");
}

export async function runCoverage(options = {}) {
	const runScript = options.runScript ?? runNpmScript;
	const aggregate = options.aggregate ?? aggregateCoverage;
	const scriptNames = ["test:go:coverage", options.nodeScript ?? "test:node:coverage"];
	const results = await Promise.allSettled(scriptNames.map((name) => runScript(name)));
	const failures = results
		.map((result, index) => ({ result, name: scriptNames[index] }))
		.filter(({ result }) => result.status === "rejected")
		.map(({ result, name }) => `${name}: ${result.reason?.message ?? result.reason}`);
	if (failures.length > 0) {
		throw new Error(failures.join("; "));
	}
	await aggregate();
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	try {
		await runCoverage(parseArgs(process.argv.slice(2)));
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exitCode = 1;
	}
}
