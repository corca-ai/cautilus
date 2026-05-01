#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import process from "node:process";

export const PHASES = [
	{ id: "lint:eslint", label: "lint · eslint" },
	{ id: "lint:specs", label: "lint · specs" },
	{ id: "lint:scenario-normalizers", label: "lint · scenario normalizers" },
	{ id: "lint:contracts", label: "lint · contracts" },
	{ id: "lint:links", label: "lint · links" },
	{ id: "lint:skill-disclosure", label: "lint · skill disclosure" },
	{ id: "lint:go", label: "lint · golangci-lint" },
	{ id: "vet:go", label: "lint · go vet" },
	{ id: "security:govulncheck", label: "security · govulncheck" },
	{ id: "security:secrets", label: "security · secret scan" },
	{ id: "test:go:race", label: "test · go race" },
	{ id: "test:node", verboseId: "test:node:spec", label: "test · node" },
];

export function parseArgs(argv) {
	let verbose = false;
	for (const arg of argv) {
		if (arg === "-h" || arg === "--help") {
			return { verbose: false, help: true };
		}
		if (arg === "--verbose") {
			verbose = true;
			continue;
		}
		throw new Error(`run-verify: unknown argument ${arg}`);
	}
	return { verbose, help: false };
}

function formatDuration(ms) {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

export function resolveScript(phase, { verbose }) {
	return verbose && phase.verboseId ? phase.verboseId : phase.id;
}

export function runPhases(
	phases,
	{ verbose = false, spawn = spawnSync, stdout, stderr } = {},
) {
	const out = stdout || process.stdout;
	const err = stderr || process.stderr;
	const totalStarted = Date.now();
	for (const phase of phases) {
		const script = resolveScript(phase, { verbose });
		const started = Date.now();
		out.write(`\n▶ ${phase.label} (npm run ${script})\n`);
		const result = spawn("npm", ["run", "--silent", script], {
			stdio: "inherit",
		});
		const elapsed = Date.now() - started;
		if (result && result.error) {
			err.write(
				`✖ ${phase.label} failed to start: ${result.error.message}\n`,
			);
			return { ok: false, status: 1, failedPhase: phase.id };
		}
		const status = result && typeof result.status === "number" ? result.status : 1;
		if (status !== 0) {
			err.write(
				`✖ ${phase.label} failed (exit ${status}) after ${formatDuration(elapsed)}\n`,
			);
			return { ok: false, status, failedPhase: phase.id };
		}
		out.write(`✔ ${phase.label} (${formatDuration(elapsed)})\n`);
	}
	const totalElapsed = Date.now() - totalStarted;
	out.write(
		`\nverify · all phases passed (${formatDuration(totalElapsed)})\n`,
	);
	return { ok: true, status: 0, totalElapsedMs: totalElapsed };
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
				"",
				"Runs the repo's verify phases with labels so a failing sub-phase is",
				"locatable without scrolling the log. --verbose swaps the dot reporter",
				"for Node's spec reporter on test:node.",
			].join("\n") + "\n",
		);
		process.exit(0);
	}
	const result = runPhases(PHASES, { verbose: parsed.verbose });
	process.exit(result.status);
}

const invokedAsScript =
	import.meta.url === `file://${process.argv[1]}` ||
	process.argv[1]?.endsWith("/run-verify.mjs");
if (invokedAsScript) {
	main();
}
