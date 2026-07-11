#!/usr/bin/env node
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const NPM_COMMAND = process.platform === "win32" ? "npm.cmd" : "npm";

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

export async function runCoverage(options = {}) {
	const runScript = options.runScript ?? runNpmScript;
	const aggregate = options.aggregate ?? aggregateCoverage;
	const results = await Promise.allSettled([
		runScript("test:go:coverage"),
		runScript("test:node:coverage"),
	]);
	const failures = results
		.map((result, index) => ({ result, name: ["test:go:coverage", "test:node:coverage"][index] }))
		.filter(({ result }) => result.status === "rejected")
		.map(({ result, name }) => `${name}: ${result.reason?.message ?? result.reason}`);
	if (failures.length > 0) {
		throw new Error(failures.join("; "));
	}
	await aggregate();
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	try {
		await runCoverage();
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exitCode = 1;
	}
}
