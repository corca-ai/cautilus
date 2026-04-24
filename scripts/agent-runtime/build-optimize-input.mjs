import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { readActiveRunDir } from "./active-run.mjs";
import { BEHAVIOR_DIMENSIONS, buildBehaviorIntentProfile } from "./behavior-intent.mjs";
import {
	OPTIMIZE_INPUTS_SCHEMA,
	SCENARIO_HISTORY_SCHEMA,
} from "./contract-versions.mjs";
import { validateReportPacket } from "./report-packet.mjs";

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
		"  node ./scripts/agent-runtime/build-optimize-input.mjs --report-file <file> [--review-summary <file>] [--history-file <file>] [--repo-root <dir>] [--target <prompt|adapter>] [--target-file <file>] [--budget <light|medium|heavy>] [--output <file>]",
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
			"--budget": "budget",
			"--output": "output",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		options[field] = readRequiredValue(argv, index + 1, arg);
		index += 1;
	}
	if (!["prompt", "adapter"].includes(options.target)) {
		fail("--target must be prompt or adapter");
	}
	if (!Object.prototype.hasOwnProperty.call(OPTIMIZER_BUDGETS, options.budget)) {
		fail(`--budget must be one of: ${Object.keys(OPTIMIZER_BUDGETS).join(", ")}`);
	}
	return options;
}

function maybeUseExistingActiveRunFile(activeRunDir, relativePath) {
	if (!activeRunDir) {
		return null;
	}
	const candidate = join(activeRunDir, relativePath);
	return existsSync(candidate) ? candidate : null;
}

function resolveCommandOptions(options, { env = process.env } = {}) {
	const activeRunDir = readActiveRunDir({ env });
	const resolved = {
		...options,
		repoRoot: resolve(options.repoRoot),
		reportFile: options.reportFile,
		reviewSummary: options.reviewSummary,
		historyFile: options.historyFile,
		output: options.output,
	};
	if (!resolved.reportFile && activeRunDir) {
		resolved.reportFile = join(activeRunDir, "report.json");
	}
	if (!resolved.reportFile) {
		fail("--report-file is required");
	}
	resolved.reviewSummary ||= maybeUseExistingActiveRunFile(activeRunDir, "review-summary.json");
	resolved.historyFile ||= maybeUseExistingActiveRunFile(activeRunDir, "scenario-history.snapshot.json");
	if (!resolved.output && activeRunDir) {
		resolved.output = join(activeRunDir, "optimize-input.json");
	}
	return resolved;
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
	try {
		validateReportPacket(report.packet);
	} catch (error) {
		fail(`${report.path}: ${error.message}`);
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

function buildOptimizerPlan(budget) {
	return {
		budget,
		plan: {
			...OPTIMIZER_BUDGETS[budget],
		},
	};
}

export function buildOptimizeInput(inputOptions, { now = new Date() } = {}) {
	const options = resolveCommandOptions(parseArgs(inputOptions));
	const repoRoot = options.repoRoot;
	const report = parseReportFile(options.reportFile);
	const reviewSummary = options.reviewSummary ? parseReviewSummaryFile(options.reviewSummary) : null;
	const scenarioHistory = options.historyFile ? parseHistoryFile(options.historyFile) : null;
	const targetFile = summarizeTargetFile(repoRoot, options.targetFile);
	const optimizer = buildOptimizerPlan(options.budget);
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
		const options = resolveCommandOptions(parseArgs(argv));
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
