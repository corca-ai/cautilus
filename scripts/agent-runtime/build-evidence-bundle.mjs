import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
	EVIDENCE_BUNDLE_INPUTS_SCHEMA,
	EVIDENCE_BUNDLE_SCHEMA,
} from "./contract-versions.mjs";

const SEVERITY_PRIORITY = new Map([
	["high", 3],
	["medium", 2],
	["low", 1],
]);

const SCENARIO_RESULT_SEVERITY = new Map([
	["failed", "high"],
	["regressed", "high"],
	["missing", "high"],
	["noisy", "medium"],
	["unchanged", "medium"],
]);

const RUN_AUDIT_WARNING_DEFINITIONS = [
	["slow_llm_runs", "run_audit.warning", "high", "Slow LLM warnings detected"],
	["slow_transition_runs", "run_audit.warning", "medium", "Slow transition warnings detected"],
	["high_token_runs", "run_audit.warning", "medium", "High token usage warnings detected"],
];

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/build-evidence-bundle.mjs --input <file> [--output <file>]",
		"",
		"Output packet:",
		`  schemaVersion: ${EVIDENCE_BUNDLE_SCHEMA}`,
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index];
	if (!value) {
		fail(`Missing value for ${option}`);
	}
	return value;
}

function parseArgs(argv) {
	const options = {
		input: null,
		output: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		const field = {
			"--input": "input",
			"--output": "output",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		options[field] = readRequiredValue(argv, index + 1, arg);
		index += 1;
	}
	if (!options.input) {
		fail("--input is required");
	}
	return options;
}

function parseInputFile(path) {
	const resolved = resolve(path);
	if (!existsSync(resolved)) {
		fail(`evidence input not found: ${resolved}`);
	}
	const parsed = JSON.parse(readFileSync(resolved, "utf-8"));
	if (parsed?.schemaVersion !== EVIDENCE_BUNDLE_INPUTS_SCHEMA) {
		fail(`evidence input must use schemaVersion ${EVIDENCE_BUNDLE_INPUTS_SCHEMA}`);
	}
	return { path: resolved, packet: parsed };
}

function normalizeScenarioKey(value, index, fallbackPrefix) {
	if (typeof value === "string") {
		return value;
	}
	if (!value || typeof value !== "object") {
		return `${fallbackPrefix}-${index + 1}`;
	}
	if (typeof value.scenarioId === "string" && value.scenarioId.length > 0) {
		return value.scenarioId;
	}
	if (typeof value.metric === "string" && value.metric.length > 0) {
		return value.metric;
	}
	return `${fallbackPrefix}-${index + 1}`;
}

function asObject(value) {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		return value;
	}
	return {};
}

function buildScenarioListSignals(items, { idPrefix, sourceKind, severity, fallbackPrefix, summaryPrefix }) {
	return items.map((item, index) => {
		const key = normalizeScenarioKey(item, index, fallbackPrefix);
		return {
			id: `${idPrefix}:${key}`,
			sourceKind,
			severity,
			summary: `${summaryPrefix}: ${key}`,
		};
	});
}

function buildReviewFindingSignal(finding, index) {
	if (!finding || typeof finding !== "object") {
		return null;
	}
	const findingRecord = finding;
	const message =
		typeof findingRecord.message === "string" ? findingRecord.message : `review-finding-${index + 1}`;
	const severity =
		typeof findingRecord.severity === "string" && findingRecord.severity.toLowerCase() === "blocker"
			? "high"
			: "medium";
	return {
		id: `report.review:${index + 1}`,
		sourceKind: "report.review_finding",
		severity,
		summary: `Review finding: ${message}`,
	};
}

function gatherReportSignals(report) {
	if (!report || typeof report !== "object") {
		return [];
	}
	const regressedSignals = buildScenarioListSignals(
		Array.isArray(report.regressed) ? report.regressed : [],
		{
			idPrefix: "report.regressed",
			sourceKind: "report.regressed",
			severity: "high",
			fallbackPrefix: "regressed",
			summaryPrefix: "Regressed evidence",
		},
	);
	const noisySignals = buildScenarioListSignals(Array.isArray(report.noisy) ? report.noisy : [], {
		idPrefix: "report.noisy",
		sourceKind: "report.noisy",
		severity: "medium",
		fallbackPrefix: "noisy",
		summaryPrefix: "Noisy evidence",
	});
	const findingSignals = (Array.isArray(report.humanReviewFindings) ? report.humanReviewFindings : [])
		.map((finding, index) => buildReviewFindingSignal(finding, index))
		.filter(Boolean);
	return [...regressedSignals, ...noisySignals, ...findingSignals];
}

function buildScenarioResultSignal(result, index) {
	const record = asObject(result);
	if (!record.status) {
		return null;
	}
	const status = typeof record.status === "string" ? record.status : "unknown";
	const severity = SCENARIO_RESULT_SEVERITY.get(status);
	if (!severity) {
		return null;
	}
	const scenarioId = typeof record.scenarioId === "string" ? record.scenarioId : `scenario-${index + 1}`;
	return {
		id: `scenario_results:${scenarioId}`,
		sourceKind: "scenario_results",
		severity,
		summary: `Scenario result ${status}: ${scenarioId}`,
	};
}

function gatherScenarioResultSignals(scenarioResults) {
	if (!scenarioResults || typeof scenarioResults !== "object") {
		return [];
	}
	return (Array.isArray(scenarioResults.results) ? scenarioResults.results : [])
		.map((result, index) => buildScenarioResultSignal(result, index))
		.filter(Boolean);
}

function buildRunAuditWarningSignal(warnings, [field, sourceKind, severity, summaryText]) {
	const count = typeof warnings[field] === "number" ? warnings[field] : 0;
	if (count <= 0) {
		return null;
	}
	return {
		id: `run_audit:${field}`,
		sourceKind,
		severity,
		summary: `${summaryText} (${count})`,
	};
}

function buildLaunchOnlySignal(totals) {
	const launchOnlyRuns = typeof totals.launch_only_runs === "number" ? totals.launch_only_runs : 0;
	if (launchOnlyRuns <= 0) {
		return null;
	}
	return {
		id: "run_audit:launch_only_runs",
		sourceKind: "run_audit.depth",
		severity: "medium",
		summary: `Launch-only runs present (${launchOnlyRuns})`,
	};
}

function gatherRunAuditSignals(runAudit) {
	if (!runAudit || typeof runAudit !== "object") {
		return [];
	}
	const summary = asObject(runAudit.summary);
	const warnings = asObject(summary.warnings);
	const totals = asObject(summary.totals);
	const warningSignals = RUN_AUDIT_WARNING_DEFINITIONS.map((definition) =>
		buildRunAuditWarningSignal(warnings, definition),
	).filter(Boolean);
	const launchOnlySignal = buildLaunchOnlySignal(totals);
	if (launchOnlySignal) {
		warningSignals.push(launchOnlySignal);
	}
	return warningSignals;
}

function isLatestResultUnstable(stats) {
	const recent = Array.isArray(stats.recentTrainResults) ? stats.recentTrainResults : [];
	const latest = recent[0];
	if (!latest || typeof latest !== "object") {
		return false;
	}
	return latest.status !== "passed" || latest.overallScore !== 100 || latest.passRate !== 1;
}

function buildHistorySignal(scenarioId, stats) {
	const record = asObject(stats);
	if (!isLatestResultUnstable(record)) {
		return null;
	}
	return {
		id: `scenario_history:${scenarioId}`,
		sourceKind: "scenario_history",
		severity: "medium",
		summary: `Recent history remains unstable: ${scenarioId}`,
	};
}

function gatherHistorySignals(scenarioHistory) {
	if (!scenarioHistory || typeof scenarioHistory !== "object") {
		return [];
	}
	return Object.entries(asObject(scenarioHistory.scenarioStats))
		.map(([scenarioId, stats]) => buildHistorySignal(scenarioId, stats))
		.filter(Boolean);
}

function dedupeSignals(signals) {
	const table = new Map();
	for (const signal of signals) {
		if (!table.has(signal.id)) {
			table.set(signal.id, signal);
		}
	}
	return [...table.values()];
}

function sortSignals(signals) {
	return [...signals].sort((left, right) => {
		const leftPriority = SEVERITY_PRIORITY.get(left.severity) || 0;
		const rightPriority = SEVERITY_PRIORITY.get(right.severity) || 0;
		return rightPriority - leftPriority || left.id.localeCompare(right.id);
	});
}

function summarizeSignals(signals) {
	const summary = {
		signalCount: signals.length,
		highSignalCount: 0,
		mediumSignalCount: 0,
		lowSignalCount: 0,
		sourceKinds: [],
	};
	const sourceKinds = new Set();
	for (const signal of signals) {
		sourceKinds.add(signal.sourceKind);
		if (signal.severity === "high") {
			summary.highSignalCount += 1;
		} else if (signal.severity === "medium") {
			summary.mediumSignalCount += 1;
		} else {
			summary.lowSignalCount += 1;
		}
	}
	summary.sourceKinds = [...sourceKinds].sort((left, right) => left.localeCompare(right));
	return summary;
}

function buildMiningFocus(signals) {
	const focus = signals.slice(0, 5).map((signal) => signal.summary);
	if (focus.length === 0) {
		return ["No blocking evidence was surfaced in the current bundle."];
	}
	return focus;
}

export function buildEvidenceBundle(packet, { now = new Date(), inputFile = null } = {}) {
	const signals = sortSignals(
		dedupeSignals([
			...gatherReportSignals(packet.report),
			...gatherScenarioResultSignals(packet.scenarioResults),
			...gatherRunAuditSignals(packet.runAudit),
			...gatherHistorySignals(packet.scenarioHistory),
		]),
	);
	return {
		schemaVersion: EVIDENCE_BUNDLE_SCHEMA,
		generatedAt: now.toISOString(),
		...(inputFile ? { inputFile } : {}),
		repoRoot: packet.repoRoot,
		sources: Array.isArray(packet.sources) ? packet.sources : [],
		summary: summarizeSignals(signals),
		signals,
		guidance: {
			miningFocus: buildMiningFocus(signals),
			loopRules: [
				"Keep source ownership explicit: hosts own raw readers and storage access.",
				"Use this bundle to propose one bounded next slice, not an open-ended retry loop.",
				"Do not weaken held-out, comparison, or review gates when acting on this bundle.",
			],
		},
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const input = parseInputFile(options.input);
		const bundle = buildEvidenceBundle(input.packet, {
			now: new Date(),
			inputFile: input.path,
		});
		const text = `${JSON.stringify(bundle, null, 2)}\n`;
		if (options.output) {
			writeFileSync(resolve(options.output), text, "utf-8");
			return;
		}
		process.stdout.write(text);
	} catch (error) {
		if (error instanceof Error) {
			process.stderr.write(`${error.message}\n`);
		} else {
			process.stderr.write(`${String(error)}\n`);
		}
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
