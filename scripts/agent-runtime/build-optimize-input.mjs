import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { BEHAVIOR_DIMENSIONS, buildBehaviorIntentProfile } from "./behavior-intent.mjs";
import {
	OPTIMIZE_INPUTS_SCHEMA,
	REPORT_PACKET_SCHEMA,
	SCENARIO_HISTORY_SCHEMA,
} from "./contract-versions.mjs";

const OPTIMIZATION_OBJECTIVE =
	"Propose one bounded next revision without weakening held-out, comparison, or review discipline.";
const OPTIMIZATION_CONSTRAINTS = [
	"Prefer repairing explicit regressions over widening scope.",
	"Treat review findings as first-class evidence, not optional commentary.",
	"Use scenario history only to focus the next bounded probe, not to justify overfitting.",
	"Stop after one bounded revision and rerun the relevant gates.",
];
const OPTIMIZATION_GUARDRAIL_DIMENSIONS = [
	BEHAVIOR_DIMENSIONS.REPAIR_EXPLICIT_REGRESSIONS_FIRST,
	BEHAVIOR_DIMENSIONS.REVIEW_FINDINGS_BINDING,
	BEHAVIOR_DIMENSIONS.HISTORY_FOCUSES_NEXT_PROBE,
	BEHAVIOR_DIMENSIONS.RERUN_RELEVANT_GATES,
];
const OPTIMIZER_KINDS = ["repair", "reflection", "history_followup"];
const OPTIMIZER_BUDGETS = {
	light: {
		evidenceLimit: 3,
		suggestedChangeLimit: 2,
		reviewVariantLimit: 1,
		historySignalLimit: 1,
	},
	medium: {
		evidenceLimit: 5,
		suggestedChangeLimit: 3,
		reviewVariantLimit: 2,
		historySignalLimit: 2,
	},
	heavy: {
		evidenceLimit: 8,
		suggestedChangeLimit: 4,
		reviewVariantLimit: 3,
		historySignalLimit: 4,
	},
};

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/build-optimize-input.mjs --report-file <file> [--review-summary <file>] [--history-file <file>] [--repo-root <dir>] [--target <prompt|adapter>] [--target-file <file>] [--optimizer <repair|reflection|history_followup>] [--budget <light|medium|heavy>] [--output <file>]",
		"",
		"Output packet:",
		`  schemaVersion: ${OPTIMIZE_INPUTS_SCHEMA}`,
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
		repoRoot: process.cwd(),
		reportFile: null,
		reviewSummary: null,
		historyFile: null,
		target: "prompt",
		targetFile: null,
		optimizer: "repair",
		budget: "medium",
		output: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		const field = {
			"--repo-root": "repoRoot",
			"--report-file": "reportFile",
			"--review-summary": "reviewSummary",
			"--history-file": "historyFile",
			"--target": "target",
			"--target-file": "targetFile",
			"--optimizer": "optimizer",
			"--budget": "budget",
			"--output": "output",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		options[field] = readRequiredValue(argv, index + 1, arg);
		index += 1;
	}
	if (!options.reportFile) {
		fail("--report-file is required");
	}
	if (!["prompt", "adapter"].includes(options.target)) {
		fail("--target must be prompt or adapter");
	}
	if (!OPTIMIZER_KINDS.includes(options.optimizer)) {
		fail(`--optimizer must be one of: ${OPTIMIZER_KINDS.join(", ")}`);
	}
	if (!Object.prototype.hasOwnProperty.call(OPTIMIZER_BUDGETS, options.budget)) {
		fail(`--budget must be one of: ${Object.keys(OPTIMIZER_BUDGETS).join(", ")}`);
	}
	return options;
}

function parseJsonFile(path, label) {
	const resolved = resolve(path);
	if (!existsSync(resolved)) {
		fail(`${label} not found: ${resolved}`);
	}
	try {
		return {
			path: resolved,
			packet: JSON.parse(readFileSync(resolved, "utf-8")),
		};
	} catch (error) {
		fail(`Failed to read JSON from ${resolved}: ${error.message}`);
	}
}

function parseReportFile(path) {
	const report = parseJsonFile(path, "report file");
	if (report.packet?.schemaVersion !== REPORT_PACKET_SCHEMA) {
		fail(`report file must use schemaVersion ${REPORT_PACKET_SCHEMA}`);
	}
	return report;
}

function parseReviewSummaryFile(path) {
	const reviewSummary = parseJsonFile(path, "review summary");
	if (
		typeof reviewSummary.packet !== "object" ||
		reviewSummary.packet === null ||
		!Array.isArray(reviewSummary.packet.variants)
	) {
		fail("review summary must be an object with a variants array");
	}
	return reviewSummary;
}

function parseHistoryFile(path) {
	const history = parseJsonFile(path, "scenario history");
	if (history.packet?.schemaVersion !== SCENARIO_HISTORY_SCHEMA) {
		fail(`scenario history must use schemaVersion ${SCENARIO_HISTORY_SCHEMA}`);
	}
	return history;
}

function summarizeTargetFile(repoRoot, targetFile) {
	if (!targetFile) {
		return null;
	}
	const path = resolve(repoRoot, targetFile);
	return {
		path,
		exists: existsSync(path),
	};
}

function buildOptimizerPlan(kind, budget) {
	return {
		kind,
		budget,
		plan: {
			...OPTIMIZER_BUDGETS[budget],
		},
	};
}

export function buildOptimizeInput(inputOptions, { now = new Date() } = {}) {
	const options = parseArgs(inputOptions);
	const repoRoot = resolve(options.repoRoot);
	const report = parseReportFile(options.reportFile);
	const reviewSummary = options.reviewSummary ? parseReviewSummaryFile(options.reviewSummary) : null;
	const scenarioHistory = options.historyFile ? parseHistoryFile(options.historyFile) : null;
	const targetFile = summarizeTargetFile(repoRoot, options.targetFile);
	const optimizer = buildOptimizerPlan(options.optimizer, options.budget);
	return {
		schemaVersion: OPTIMIZE_INPUTS_SCHEMA,
		generatedAt: now.toISOString(),
		repoRoot,
		optimizationTarget: options.target,
		intentProfile: buildBehaviorIntentProfile({
			intent: report.packet.intent,
			intentProfile: report.packet.intentProfile,
			defaultGuardrailDimensions: OPTIMIZATION_GUARDRAIL_DIMENSIONS,
		}),
		optimizer,
		...(targetFile ? { targetFile } : {}),
		reportFile: report.path,
		report: report.packet,
		...(reviewSummary
			? {
				reviewSummaryFile: reviewSummary.path,
				reviewSummary: reviewSummary.packet,
			}
			: {}),
		...(scenarioHistory
			? {
				scenarioHistoryFile: scenarioHistory.path,
				scenarioHistory: scenarioHistory.packet,
			}
			: {}),
		objective: {
			summary: OPTIMIZATION_OBJECTIVE,
			constraints: OPTIMIZATION_CONSTRAINTS,
		},
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const packet = buildOptimizeInput(argv);
		const text = `${JSON.stringify(packet, null, 2)}\n`;
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
