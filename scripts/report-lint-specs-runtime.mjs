#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const DEFAULT_SIGNAL_PATH = ".charness/quality/runtime-signals.json";
const DEFAULT_COMMAND_LABEL = "lint · specs";
const DEFAULT_PROFILE = "local-verify";

export function parseArgs(argv) {
	const parsed = {
		help: false,
		json: false,
		profile: process.env.CHARNESS_RUNTIME_PROFILE || DEFAULT_PROFILE,
		signalPath: DEFAULT_SIGNAL_PATH,
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
		if (arg === "--json") {
			parsed.json = true;
			continue;
		}
		if (arg === "--profile") {
			pendingValue = "profile";
			continue;
		}
		if (arg === "--signal") {
			pendingValue = "signal";
			continue;
		}
		throw new Error(`report-lint-specs-runtime: unknown argument ${arg}`);
	}
	assertNoPendingArgValue(pendingValue);
	return parsed;
}

function applyPendingArgValue(parsed, pendingValue, arg) {
	if (pendingValue === "profile") {
		parsed.profile = arg;
		return;
	}
	if (pendingValue === "signal") {
		parsed.signalPath = arg;
	}
}

function assertNoPendingArgValue(pendingValue) {
	if (pendingValue === "profile") {
		throw new Error("report-lint-specs-runtime: --profile requires an id");
	}
	if (pendingValue === "signal") {
		throw new Error("report-lint-specs-runtime: --signal requires a path");
	}
}

function readRuntimeSignals(signalPath) {
	const resolvedPath = resolve(signalPath);
	if (!existsSync(resolvedPath)) {
		throw new Error(
			`runtime signal not found: ${signalPath}; run npm run verify:runtime first`,
		);
	}
	try {
		return JSON.parse(readFileSync(resolvedPath, "utf-8"));
	} catch (error) {
		throw new Error(`runtime signal is not valid JSON: ${signalPath}: ${error.message}`);
	}
}

function integerOrNull(value) {
	return Number.isInteger(value) && value >= 0 ? value : null;
}

function stringOrNull(value) {
	return typeof value === "string" && value ? value : null;
}

function subphaseReportEntry([label, summary]) {
	const latest = summary?.latest && typeof summary.latest === "object"
		? summary.latest
		: {};
	return {
		label,
		latestElapsedMs: integerOrNull(latest.elapsed_ms),
		latestTimestamp: stringOrNull(latest.timestamp),
		medianRecentElapsedMs: integerOrNull(summary?.median_recent_elapsed_ms),
		maxRecentElapsedMs: integerOrNull(summary?.max_recent_elapsed_ms),
		samples: Number.isInteger(summary?.samples) && summary.samples >= 0 ? summary.samples : 0,
		recentElapsedMs: Array.isArray(summary?.recent_elapsed_ms)
			? summary.recent_elapsed_ms.filter((value) => integerOrNull(value) !== null)
			: [],
	};
}

function commandLatestSummary(commandSummary) {
	const latest = commandSummary?.latest && typeof commandSummary.latest === "object"
		? commandSummary.latest
		: {};
	return {
		commandLatestElapsedMs: integerOrNull(latest.elapsed_ms),
		commandLatestTimestamp: stringOrNull(latest.timestamp),
	};
}

function staleSubphaseLabels(subphases, commandLatestTimestamp) {
	if (!commandLatestTimestamp) return [];
	return subphases
		.filter((subphase) => subphase.latestTimestamp !== commandLatestTimestamp)
		.map((subphase) => subphase.label);
}

function reportWarnings(runtimeSignals, report) {
	const warnings = [];
	if (report.signalStatus !== "passed") {
		warnings.push(
			`runtime signal status is ${report.signalStatus}; subphase samples may include preserved earlier timings`,
		);
	}
	const staleLabels = staleSubphaseLabels(report.subphases, report.commandLatestTimestamp);
	if (staleLabels.length) {
		warnings.push(
			`subphase samples older than command latest: ${staleLabels.join(", ")}`,
		);
	}
	if (runtimeSignals?.failedPhase) {
		warnings.push(`runtime signal failed phase: ${runtimeSignals.failedPhase}`);
	}
	return warnings;
}

export function lintSpecsSubphaseReport(
	runtimeSignals,
	{
		profile = DEFAULT_PROFILE,
		signalPath = DEFAULT_SIGNAL_PATH,
		commandLabel = DEFAULT_COMMAND_LABEL,
	} = {},
) {
	const commandSummary = requireCommandSummary(runtimeSignals, { profile, commandLabel });
	const subphases = requireSubphaseSamples(commandSummary, { profile, commandLabel });
	const entries = sortedSubphaseEntries(subphases, { profile, commandLabel });
	const report = {
		schemaVersion: "cautilus.lint_specs_runtime_subphases.v1",
		commandLabel,
		profile,
		signalPath,
		signalStatus: stringOrNull(runtimeSignals?.status) || "unknown",
		failedPhase: stringOrNull(runtimeSignals?.failedPhase),
		generatedAt: stringOrNull(runtimeSignals?.generatedAt),
		...commandLatestSummary(commandSummary),
		subphases: entries,
	};
	return {
		...report,
		warnings: reportWarnings(runtimeSignals, report),
	};
}

function requireCommandSummary(runtimeSignals, { profile, commandLabel }) {
	const commandSummary = runtimeSignals?.profiles?.[profile]?.commands?.[commandLabel];
	if (commandSummary) return commandSummary;
	throw new Error(
		`runtime signal has no ${commandLabel} samples for profile ${profile}; run npm run verify:runtime`,
	);
}

function requireSubphaseSamples(commandSummary, { profile, commandLabel }) {
	const subphases = commandSummary.subphases;
	if (subphases && typeof subphases === "object" && !Array.isArray(subphases)) {
		return subphases;
	}
	throw new Error(
		`runtime signal has no ${commandLabel} subphase samples for profile ${profile}; run npm run verify:runtime`,
	);
}

function sortedSubphaseEntries(subphases, { profile, commandLabel }) {
	const entries = Object.entries(subphases)
		.map(subphaseReportEntry)
		.filter((entry) => entry.latestElapsedMs !== null)
		.sort((left, right) => right.latestElapsedMs - left.latestElapsedMs || left.label.localeCompare(right.label));
	if (entries.length) return entries;
	throw new Error(
		`runtime signal has no valid ${commandLabel} subphase timings for profile ${profile}; run npm run verify:runtime`,
	);
}

export function formatDuration(ms) {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function formatOptionalDuration(ms) {
	return ms === null ? "n/a" : formatDuration(ms);
}

export function formatTextReport(report) {
	const lines = [
		`${report.commandLabel} subphases (profile ${report.profile}, source ${report.signalPath})`,
		`runtime status ${report.signalStatus}; command latest ${formatOptionalDuration(report.commandLatestElapsedMs)} at ${report.commandLatestTimestamp || "n/a"}`,
	];
	for (const warning of report.warnings || []) {
		lines.push(`warning: ${warning}`);
	}
	for (const subphase of report.subphases) {
		lines.push(
			`- ${subphase.label}: latest ${formatDuration(subphase.latestElapsedMs)} at ${subphase.latestTimestamp || "n/a"}, median ${formatOptionalDuration(subphase.medianRecentElapsedMs)}, max ${formatOptionalDuration(subphase.maxRecentElapsedMs)}, samples ${subphase.samples}`,
		);
	}
	return `${lines.join("\n")}\n`;
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
				"Usage: node scripts/report-lint-specs-runtime.mjs [--json] [--profile <id>] [--signal <file>]",
				"",
				"Reads the quality runtime signal and reports stored lint:specs",
				"subphase samples. Run npm run verify:runtime first to refresh",
				"the default signal at .charness/quality/runtime-signals.json.",
			].join("\n") + "\n",
		);
		process.exit(0);
	}
	try {
		const runtimeSignals = readRuntimeSignals(parsed.signalPath);
		const report = lintSpecsSubphaseReport(runtimeSignals, parsed);
		if (parsed.json) {
			process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
		} else {
			process.stdout.write(formatTextReport(report));
		}
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const invokedAsScript =
	import.meta.url === `file://${process.argv[1]}` ||
	process.argv[1]?.endsWith("/report-lint-specs-runtime.mjs");
if (invokedAsScript) {
	main();
}
