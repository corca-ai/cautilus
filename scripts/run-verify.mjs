#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, machine, platform } from "node:os";
import { dirname, resolve } from "node:path";
import process from "node:process";

export const PHASES = [
	{ id: "lint:eslint", label: "lint · eslint" },
	{ id: "audit:surface:check", label: "lint · surface honesty audit" },
	{ id: "lint:specs", label: "lint · specs", captureStdout: true },
	{ id: "specdown:project:check", label: "lint · specdown gold-set projection" },
	{ id: "specdown:claim-state:check", label: "lint · projected claim state" },
	{ id: "lint:scenario-normalizers", label: "lint · scenario normalizers" },
	{ id: "lint:contracts", label: "lint · contracts" },
	{ id: "claims:audit-evidence", label: "lint · claim evidence hashes" },
	{ id: "claims:evidence-state:check", label: "lint · claim evidence state" },
	{ id: "claims:source-freshness:check", label: "lint · claim source freshness" },
	{ id: "release:claim-freshness", label: "lint · release claim freshness" },
	{ id: "claims:canonical-map:check", label: "lint · canonical claim map" },
	{ id: "claims:status-report:check", label: "lint · claim status report" },
	{ id: "claims:review-drops:check", label: "lint · claim review drops" },
	{ id: "lint:links", label: "lint · links" },
	{ id: "lint:skill-disclosure", label: "lint · skill disclosure" },
	{ id: "lint:go", label: "lint · golangci-lint" },
	{ id: "vet:go", label: "lint · go vet" },
	{ id: "security:govulncheck", label: "security · govulncheck" },
	{ id: "security:secrets", label: "security · secret scan" },
	{ id: "test:go:race", label: "test · go race" },
	{ id: "test:coverage", verboseId: "test:coverage:spec", label: "test · coverage" },
	{ id: "coverage:floor:check", label: "test · coverage floor" },
];

export function parseArgs(argv) {
	const parsed = {
		verbose: false,
		help: false,
		runtimeSignalPath: null,
		runtimeProfile: null,
	};
	let pendingValue = null;
	for (const arg of argv) {
		if (pendingValue) {
			applyPendingArgValue(parsed, pendingValue, arg);
			pendingValue = null;
			continue;
		}
		if (arg === "-h" || arg === "--help") {
			return { ...parsed, help: true };
		}
		if (arg === "--verbose") {
			parsed.verbose = true;
			continue;
		}
		if (arg === "--runtime-signal") {
			pendingValue = "runtime-signal";
			continue;
		}
		if (arg === "--runtime-profile") {
			pendingValue = "runtime-profile";
			continue;
		}
		throw new Error(`run-verify: unknown argument ${arg}`);
	}
	assertNoPendingArgValue(pendingValue);
	return parsed;
}

function applyPendingArgValue(parsed, pendingValue, arg) {
	if (pendingValue === "runtime-signal") {
		parsed.runtimeSignalPath = arg;
		return;
	}
	if (pendingValue === "runtime-profile") {
		parsed.runtimeProfile = arg;
	}
}

function assertNoPendingArgValue(pendingValue) {
	if (pendingValue === "runtime-signal") {
		throw new Error("run-verify: --runtime-signal requires a path");
	}
	if (pendingValue === "runtime-profile") {
		throw new Error("run-verify: --runtime-profile requires a profile id");
	}
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

function parseDurationMs(value) {
	const match = /^(\d+)(?:ms|\.(\d{2})s)$/.exec(value);
	if (!match) return null;
	if (!match[2]) return Number.parseInt(match[1], 10);
	return (Number.parseInt(match[1], 10) * 1000) + (Number.parseInt(match[2], 10) * 10);
}

export function parseLintSpecsTiming(output) {
	const line = String(output || "").split(/\r?\n/).find((candidate) => candidate.startsWith("lint-specs timing: "));
	if (!line) return [];
	const rawParts = line.replace("lint-specs timing: ", "").split(", ");
	const timings = [];
	for (const rawPart of rawParts) {
		const [label, rawDuration] = rawPart.split("=");
		if (!label || !rawDuration || label === "total") continue;
		const durationMs = parseDurationMs(rawDuration);
		if (durationMs === null) continue;
		timings.push({ label, durationMs });
	}
	return timings;
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

function completedPhaseResult(phase, script, elapsed, exitCode, spawnResult) {
	const result = {
		id: phase.id,
		label: phase.label,
		script,
		command: phaseCommand(script),
		status: exitCode === 0 ? "passed" : "failed",
		exitCode,
		durationMs: elapsed,
	};
	if (phase.id === "lint:specs") {
		const subphases = parseLintSpecsTiming(spawnResult?.stdout);
		if (subphases.length) {
			result.subphases = subphases;
		}
	}
	return result;
}

function spawnOptionsForPhase(phase) {
	if (phase.captureStdout) {
		return {
			stdio: ["inherit", "pipe", "inherit"],
			encoding: "utf-8",
			maxBuffer: 20 * 1024 * 1024,
		};
	}
	return { stdio: "inherit" };
}

function replayCapturedStdout(phase, result, out) {
	if (!phase.captureStdout || typeof result?.stdout !== "string" || result.stdout.length === 0) {
		return;
	}
	out.write(result.stdout);
}

function finishRun(runtimeSignalPath, result, totalStarted, runtimeProfile) {
	writeRuntimeSignalIfRequested(runtimeSignalPath, result, totalStarted, runtimeProfile);
	return result;
}

export function runPhases(
	phases,
	{
		verbose = false,
		spawn = spawnSync,
		stdout,
		stderr,
		runtimeSignalPath,
		runtimeProfile,
	} = {},
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
			...spawnOptionsForPhase(phase),
		});
		const elapsed = Date.now() - started;
		replayCapturedStdout(phase, result, out);
		if (result && result.error) {
			phaseResults.push(failedStartPhaseResult(phase, script, elapsed, result.error));
			err.write(
				`✖ ${phase.label} failed to start: ${result.error.message}\n`,
			);
			const failedResult = { ok: false, status: 1, failedPhase: phase.id, phaseResults };
			return finishRun(runtimeSignalPath, failedResult, totalStarted, runtimeProfile);
		}
		const status = result && typeof result.status === "number" ? result.status : 1;
		phaseResults.push(completedPhaseResult(phase, script, elapsed, status, result));
		if (status !== 0) {
			err.write(
				`✖ ${phase.label} failed (exit ${status}) after ${formatDuration(elapsed)}\n`,
			);
			const failedResult = { ok: false, status, failedPhase: phase.id, phaseResults };
			return finishRun(runtimeSignalPath, failedResult, totalStarted, runtimeProfile);
		}
		out.write(`✔ ${phase.label} (${formatDuration(elapsed)})\n`);
	}
	const totalElapsed = Date.now() - totalStarted;
	out.write(
		`\nverify · all phases passed (${formatDuration(totalElapsed)})\n`,
	);
	const passedResult = { ok: true, status: 0, totalElapsedMs: totalElapsed, phaseResults };
	return finishRun(runtimeSignalPath, passedResult, totalStarted, runtimeProfile);
}

export function runtimeSignalPayload(result, totalStarted) {
	const phaseResults = result.phaseResults || [];
	const totalDurationMs =
		typeof result.totalElapsedMs === "number"
			? result.totalElapsedMs
			: phaseResults.reduce((sum, phase) => sum + (phase.durationMs || 0), 0);
	const generatedAt = new Date().toISOString();
	return {
		schemaVersion: "cautilus.quality_runtime_signal.v1",
		generatedAt,
		updated_at: generatedAt,
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

function normalizeRuntimeProfile(value) {
	const raw = String(value || "default").trim() || "default";
	return raw.toLowerCase().replace(/[^A-Za-z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "") || "default";
}

export function machineRuntimeProfile() {
	const system = platform() || "unknown-os";
	const arch = machine() || "unknown-arch";
	const cpuCount = cpus().length || 1;
	return normalizeRuntimeProfile(`local-${system}-${arch}-${cpuCount}cpu`);
}

function medianInteger(values) {
	if (!values.length) return null;
	const sorted = [...values].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) return sorted[middle];
	return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function previousProfileCommands(existingSignals, runtimeProfile) {
	const profileEntry = existingSignals?.profiles?.[runtimeProfile];
	const commands = profileEntry?.commands;
	return commands && typeof commands === "object" && !Array.isArray(commands)
		? commands
		: {};
}

function initialProfileCommands(payload, previousCommands) {
	return payload.status === "passed" ? {} : { ...previousCommands };
}

function existingProfiles(existingSignals) {
	return existingSignals.profiles && typeof existingSignals.profiles === "object"
		? existingSignals.profiles
		: {};
}

function previousRecentDurations(entry) {
	if (Array.isArray(entry.recent_elapsed_ms)) {
		return entry.recent_elapsed_ms.filter(
			(value) => Number.isInteger(value) && value >= 0,
		);
	}
	const latest = entry.latest;
	const latestElapsed =
		latest && typeof latest === "object" ? latest.elapsed_ms : null;
	return Number.isInteger(latestElapsed) && latestElapsed >= 0
		? [latestElapsed]
		: [];
}

function elapsedRuntimeSummary(elapsed, generatedAt, previousEntry) {
	if (elapsed === null || elapsed < 0) return null;
	const previousRecent = previousRecentDurations(previousEntry);
	const recent = [...previousRecent, elapsed].slice(-10);
	const previousSamples = Number.isInteger(previousEntry.samples)
		? previousEntry.samples
		: previousRecent.length;
	return {
		latest: {
			timestamp: generatedAt,
			elapsed_ms: elapsed,
		},
		median_recent_elapsed_ms: medianInteger(recent),
		max_recent_elapsed_ms: Math.max(...recent),
		recent_elapsed_ms: recent,
		samples: previousSamples + 1,
	};
}

function subphaseRuntimeSummaries(phase, generatedAt, previousEntry) {
	if (!Array.isArray(phase.subphases)) return {};
	const previousSubphases =
		previousEntry.subphases && typeof previousEntry.subphases === "object" && !Array.isArray(previousEntry.subphases)
			? previousEntry.subphases
			: {};
	const subphases = {};
	for (const subphase of phase.subphases) {
		if (!subphase || typeof subphase.label !== "string" || !subphase.label) continue;
		const elapsed = Number.isInteger(subphase.durationMs) ? subphase.durationMs : null;
		const summary = elapsedRuntimeSummary(elapsed, generatedAt, previousSubphases[subphase.label] || {});
		if (summary) {
			subphases[subphase.label] = summary;
		}
	}
	return subphases;
}

function commandRuntimeSummary(phase, generatedAt, previousEntry) {
	const elapsed = Number.isInteger(phase.durationMs) ? phase.durationMs : null;
	const summary = elapsedRuntimeSummary(elapsed, generatedAt, previousEntry);
	if (!summary) return null;
	const subphases = subphaseRuntimeSummaries(phase, generatedAt, previousEntry);
	if (Object.keys(subphases).length) {
		summary.subphases = subphases;
	} else if (previousEntry.subphases && typeof previousEntry.subphases === "object" && !Array.isArray(previousEntry.subphases)) {
		summary.subphases = previousEntry.subphases;
	}
	return summary;
}

function readExistingRuntimeSignals(runtimeSignalPath) {
	const outputPath = resolve(runtimeSignalPath);
	if (!existsSync(outputPath)) return {};
	try {
		const parsed = JSON.parse(readFileSync(outputPath, "utf-8"));
		return parsed && typeof parsed === "object" && !Array.isArray(parsed)
			? parsed
			: {};
	} catch {
		return {};
	}
}

export function withRuntimeSignalSamples(
	payload,
	{ existingSignals = {}, runtimeProfile = machineRuntimeProfile() } = {},
) {
	const profile = normalizeRuntimeProfile(runtimeProfile);
	const previousCommands = previousProfileCommands(existingSignals, profile);
	const commands = initialProfileCommands(payload, previousCommands);
	for (const phase of payload.phases || []) {
		const label = phase.label || phase.id;
		if (typeof label !== "string" || !label) continue;
		const previousEntry = previousCommands[label] || {};
		const summary = commandRuntimeSummary(phase, payload.generatedAt, previousEntry);
		if (summary) {
			commands[label] = summary;
		}
	}
	return {
		...payload,
		runtimeProfile: profile,
		profiles: {
			...existingProfiles(existingSignals),
			[profile]: {
				commands,
			},
		},
	};
}

function writeRuntimeSignalIfRequested(runtimeSignalPath, result, totalStarted, runtimeProfile) {
	if (!runtimeSignalPath) {
		return;
	}
	const outputPath = resolve(runtimeSignalPath);
	const existingSignals = readExistingRuntimeSignals(outputPath);
	const payload = withRuntimeSignalSamples(runtimeSignalPayload(result, totalStarted), {
		existingSignals,
		runtimeProfile: runtimeProfile || process.env.CHARNESS_RUNTIME_PROFILE || undefined,
	});
	mkdirSync(dirname(outputPath), { recursive: true });
	writeFileSync(
		outputPath,
		`${JSON.stringify(payload, null, 2)}\n`,
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
				"       node scripts/run-verify.mjs [--verbose] --runtime-profile <id> --runtime-signal <file>",
				"",
				"Runs the repo's verify phases with labels so a failing sub-phase is",
				"locatable without scrolling the log. --verbose swaps the dot reporter",
				"for Node's spec reporter inside the coverage phase.",
				"--runtime-signal writes a structured timing packet for quality review.",
				"--runtime-profile names the runner class used for timing budgets.",
			].join("\n") + "\n",
		);
		process.exit(0);
	}
	const result = runPhases(PHASES, {
		verbose: parsed.verbose,
		runtimeSignalPath: parsed.runtimeSignalPath,
		runtimeProfile: parsed.runtimeProfile,
	});
	process.exit(result.status);
}

const invokedAsScript =
	import.meta.url === `file://${process.argv[1]}` ||
	process.argv[1]?.endsWith("/run-verify.mjs");
if (invokedAsScript) {
	main();
}
