#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

export const PHASES = [
	{ id: "lint:eslint", label: "lint · eslint" },
	{ id: "audit:surface:check", label: "lint · surface honesty audit" },
	{ id: "lint:specs", label: "lint · specs" },
	{ id: "lint:scenario-normalizers", label: "lint · scenario normalizers" },
	{ id: "lint:contracts", label: "lint · contracts" },
	{ id: "claims:audit-evidence", label: "lint · claim evidence hashes" },
	{ id: "claims:evidence-state:check", label: "lint · claim evidence state" },
	{ id: "release:claim-freshness", label: "lint · release claim freshness" },
	{ id: "claims:status-report:check", label: "lint · claim status report" },
	{ id: "lint:links", label: "lint · links" },
	{ id: "lint:skill-disclosure", label: "lint · skill disclosure" },
	{ id: "lint:go", label: "lint · golangci-lint" },
	{ id: "vet:go", label: "lint · go vet" },
	{ id: "security:govulncheck", label: "security · govulncheck" },
	{ id: "security:secrets", label: "security · secret scan" },
	{ id: "test:go:race", label: "test · go race" },
	{ id: "test:node", verboseId: "test:node:spec", label: "test · node" },
	{ id: "test:coverage", label: "test · coverage" },
	{ id: "coverage:floor:check", label: "test · coverage floor" },
];

export function parseArgs(argv) {
	let verbose = false;
	let runtimeSignalPath = null;
	for (const arg of argv) {
		if (runtimeSignalPath === "") {
			runtimeSignalPath = arg;
			continue;
		}
		if (arg === "-h" || arg === "--help") {
			return { verbose: false, help: true, runtimeSignalPath: null };
		}
		if (arg === "--verbose") {
			verbose = true;
			continue;
		}
		if (arg === "--runtime-signal") {
			runtimeSignalPath = "";
			continue;
		}
		throw new Error(`run-verify: unknown argument ${arg}`);
	}
	if (runtimeSignalPath === "") {
		throw new Error("run-verify: --runtime-signal requires a path");
	}
	return { verbose, help: false, runtimeSignalPath };
}

function formatDuration(ms) {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

export function resolveScript(phase, { verbose }) {
	return verbose && phase.verboseId ? phase.verboseId : phase.id;
}

function phaseCommand(script) {
	return ["npm", "run", "--silent", script];
}

function failedStartPhaseResult(phase, script, elapsed, error) {
	return {
		id: phase.id,
		label: phase.label,
		script,
		command: phaseCommand(script),
		status: "failed_to_start",
		exitCode: 1,
		durationMs: elapsed,
		error: error.message,
	};
}

function completedPhaseResult(phase, script, elapsed, exitCode) {
	return {
		id: phase.id,
		label: phase.label,
		script,
		command: phaseCommand(script),
		status: exitCode === 0 ? "passed" : "failed",
		exitCode,
		durationMs: elapsed,
	};
}

function finishRun(runtimeSignalPath, result, totalStarted) {
	writeRuntimeSignalIfRequested(runtimeSignalPath, result, totalStarted);
	return result;
}

export function runPhases(
	phases,
	{ verbose = false, spawn = spawnSync, stdout, stderr, runtimeSignalPath } = {},
) {
	const out = stdout || process.stdout;
	const err = stderr || process.stderr;
	const totalStarted = Date.now();
	const phaseResults = [];
	for (const phase of phases) {
		const script = resolveScript(phase, { verbose });
		const started = Date.now();
		out.write(`\n▶ ${phase.label} (npm run ${script})\n`);
		const result = spawn("npm", ["run", "--silent", script], {
			stdio: "inherit",
		});
		const elapsed = Date.now() - started;
		if (result && result.error) {
			phaseResults.push(failedStartPhaseResult(phase, script, elapsed, result.error));
			err.write(
				`✖ ${phase.label} failed to start: ${result.error.message}\n`,
			);
			const failedResult = { ok: false, status: 1, failedPhase: phase.id, phaseResults };
			return finishRun(runtimeSignalPath, failedResult, totalStarted);
		}
		const status = result && typeof result.status === "number" ? result.status : 1;
		phaseResults.push(completedPhaseResult(phase, script, elapsed, status));
		if (status !== 0) {
			err.write(
				`✖ ${phase.label} failed (exit ${status}) after ${formatDuration(elapsed)}\n`,
			);
			const failedResult = { ok: false, status, failedPhase: phase.id, phaseResults };
			return finishRun(runtimeSignalPath, failedResult, totalStarted);
		}
		out.write(`✔ ${phase.label} (${formatDuration(elapsed)})\n`);
	}
	const totalElapsed = Date.now() - totalStarted;
	out.write(
		`\nverify · all phases passed (${formatDuration(totalElapsed)})\n`,
	);
	const passedResult = { ok: true, status: 0, totalElapsedMs: totalElapsed, phaseResults };
	return finishRun(runtimeSignalPath, passedResult, totalStarted);
}

export function runtimeSignalPayload(result, totalStarted) {
	const phaseResults = result.phaseResults || [];
	const totalDurationMs =
		typeof result.totalElapsedMs === "number"
			? result.totalElapsedMs
			: phaseResults.reduce((sum, phase) => sum + (phase.durationMs || 0), 0);
	return {
		schemaVersion: "cautilus.quality_runtime_signal.v1",
		generatedAt: new Date().toISOString(),
		command: "npm run verify",
		status: result.ok ? "passed" : "failed",
		exitCode: result.status,
		totalDurationMs,
		phaseCount: phaseResults.length,
		failedPhase: result.failedPhase || null,
		startedAtEpochMs: totalStarted,
		phases: phaseResults,
	};
}

function writeRuntimeSignalIfRequested(runtimeSignalPath, result, totalStarted) {
	if (!runtimeSignalPath) {
		return;
	}
	const outputPath = resolve(runtimeSignalPath);
	mkdirSync(dirname(outputPath), { recursive: true });
	writeFileSync(
		outputPath,
		`${JSON.stringify(runtimeSignalPayload(result, totalStarted), null, 2)}\n`,
	);
}

function main() {
	let parsed;
	try {
		parsed = parseArgs(process.argv.slice(2));
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(2);
	}
	if (parsed.help) {
		process.stdout.write(
			[
				"Usage: node scripts/run-verify.mjs [--verbose]",
				"       node scripts/run-verify.mjs [--verbose] --runtime-signal <file>",
				"",
				"Runs the repo's verify phases with labels so a failing sub-phase is",
				"locatable without scrolling the log. --verbose swaps the dot reporter",
				"for Node's spec reporter on test:node.",
				"--runtime-signal writes a structured timing packet for quality review.",
			].join("\n") + "\n",
		);
		process.exit(0);
	}
	const result = runPhases(PHASES, {
		verbose: parsed.verbose,
		runtimeSignalPath: parsed.runtimeSignalPath,
	});
	process.exit(result.status);
}

const invokedAsScript =
	import.meta.url === `file://${process.argv[1]}` ||
	process.argv[1]?.endsWith("/run-verify.mjs");
if (invokedAsScript) {
	main();
}
