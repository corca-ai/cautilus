import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { readActiveRunDir } from "./active-run.mjs";
import {
	OPTIMIZE_SEARCH_INPUTS_SCHEMA,
	OPTIMIZE_SEARCH_RESULT_SCHEMA,
} from "./contract-versions.mjs";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/run-optimize-search.mjs --input <file> [--output <file>] [--json]",
		"",
		"Output packet:",
		`  schemaVersion: ${OPTIMIZE_SEARCH_RESULT_SCHEMA}`,
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function fail(message) {
	throw new Error(message);
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
		json: false,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--json") {
			options.json = true;
			continue;
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
	return options;
}

function resolveCommandOptions(options, { env = process.env } = {}) {
	const activeRunDir = readActiveRunDir({ env });
	const resolved = {
		...options,
		input: options.input ? resolve(options.input) : null,
		output: options.output ? resolve(options.output) : null,
	};
	if (!resolved.input && activeRunDir) {
		resolved.input = join(activeRunDir, "optimize-search-input.json");
	}
	if (!resolved.input) {
		fail("--input is required");
	}
	if (!resolved.output && activeRunDir) {
		resolved.output = join(activeRunDir, "optimize-search-result.json");
	}
	return resolved;
}

function readJsonFile(path, label) {
	const resolved = resolve(path);
	if (!existsSync(resolved)) {
		fail(`${label} not found: ${resolved}`);
	}
	try {
		const packet = JSON.parse(readFileSync(resolved, "utf-8"));
		if (!packet || typeof packet !== "object" || Array.isArray(packet)) {
			fail(`${label} must be a JSON object`);
		}
		return { path: resolved, packet };
	} catch (error) {
		fail(`Failed to read JSON from ${resolved}: ${error.message}`);
	}
}

function parseInputFile(path) {
	const parsed = readJsonFile(path, "search input");
	if (parsed.packet.schemaVersion !== OPTIMIZE_SEARCH_INPUTS_SCHEMA) {
		fail(`search input must use schemaVersion ${OPTIMIZE_SEARCH_INPUTS_SCHEMA}`);
	}
	return parsed;
}

function inferScenarioScore(result) {
	if (typeof result?.overallScore === "number") {
		return result.overallScore;
	}
	if (typeof result?.passRate === "number") {
		return result.passRate * 100;
	}
	if (typeof result?.status === "string") {
		return result.status === "passed" ? 100 : 0;
	}
	return null;
}

function toHeldOutEntry(result, mode) {
	return {
		mode,
		scenarioId: result.scenarioId,
		score: inferScenarioScore(result),
		status: result.status || null,
		telemetry: result.telemetry || {},
	};
}

function collectDirectHeldOutEntries(packet) {
	const results = Array.isArray(packet?.heldOutResults?.results) ? packet.heldOutResults.results : [];
	return results
		.filter((result) => typeof result?.scenarioId === "string" && result.scenarioId.length > 0)
		.map((result) => toHeldOutEntry(result, packet.heldOutResults?.mode || "held_out"));
}

function listSearchModeRuns(packet) {
	const modeRuns = packet?.optimizeInput?.report?.modeRuns;
	return Array.isArray(modeRuns) ? modeRuns : [];
}

function collectModeRunEntries(modeRun) {
	if (!["held_out", "full_gate"].includes(modeRun?.mode)) {
		return [];
	}
	const results = Array.isArray(modeRun?.scenarioResults?.results) ? modeRun.scenarioResults.results : [];
	return results
		.filter((result) => typeof result?.scenarioId === "string" && result.scenarioId.length > 0)
		.map((result) => toHeldOutEntry(result, modeRun.mode));
}

function collectHeldOutEntries(packet) {
	const directEntries = collectDirectHeldOutEntries(packet);
	if (directEntries.length > 0) {
		return directEntries;
	}
	return listSearchModeRuns(packet).flatMap((modeRun) => collectModeRunEntries(modeRun));
}

function collectCompareSignals(modeRuns) {
	const signals = [];
	for (const modeRun of modeRuns) {
		const compareArtifact = modeRun?.scenarioResults?.compareArtifact;
		if (typeof compareArtifact?.summary === "string" && compareArtifact.summary.length > 0) {
			signals.push(compareArtifact.summary);
		}
		signals.push(...collectFindingMessages(compareArtifact?.regressed, "reason"));
		signals.push(...collectFindingMessages(compareArtifact?.noisy, "reason"));
	}
	return signals;
}

function collectFindingMessages(items, field = "message") {
	const source = Array.isArray(items) ? items : [];
	return source
		.map((item) => item?.[field])
		.filter((value) => typeof value === "string" && value.length > 0);
}

function collectReviewSignals(input) {
	const reportFindings = collectFindingMessages(input.optimizeInput?.report?.humanReviewFindings);
	const variantFindings = (Array.isArray(input.optimizeInput?.reviewSummary?.variants)
		? input.optimizeInput.reviewSummary.variants
		: []).flatMap((variant) => collectFindingMessages(variant?.output?.findings));
	return [...reportFindings, ...variantFindings];
}

function collectHistorySignals(input) {
	const signals = [];
	for (const [scenarioId, stats] of Object.entries(input.optimizeInput?.scenarioHistory?.scenarioStats || {})) {
		const latest = Array.isArray(stats?.recentTrainResults) ? stats.recentTrainResults[0] : null;
		if (!latest) {
			continue;
		}
		if (latest.status !== "passed" || latest.overallScore !== 100 || latest.passRate !== 1) {
			signals.push(`${scenarioId} remains unstable in recent train history`);
		}
	}
	return signals;
}

function collectFeedbackSignals(input) {
	const modeRuns = listSearchModeRuns(input);
	return [
		...collectCompareSignals(modeRuns),
		...collectReviewSignals(input),
		...collectHistorySignals(input),
	];
}

function buildBlockedResult(input, inputFile, reasons, missingEvidence, now = new Date()) {
	return {
		schemaVersion: OPTIMIZE_SEARCH_RESULT_SCHEMA,
		generatedAt: now.toISOString(),
		status: "blocked",
		inputFile,
		repoRoot: input.repoRoot,
		optimizeInputFile: input.optimizeInputFile,
		searchConfig: input.searchConfig,
		candidateRegistry: [],
		generationSummaries: [],
		heldOutEvaluationMatrix: [],
		pareto: {
			frontierCandidateIds: [],
			perScenarioBestCandidateIds: [],
		},
		checkpointOutcomes: {
			review: [],
			fullGate: [],
		},
		searchTelemetry: {
			candidateCount: 0,
			generationCount: 0,
			mutationInvocationCount: 0,
			heldOutEvaluationCount: 0,
			reviewCheckpointCount: 0,
			stopReason: "blocked",
		},
		proposalBridge: {
			optimizeInputFile: input.optimizeInputFile,
		},
		reasonCodes: reasons,
		missingEvidence,
		suggestedNextSteps: [
			"run held_out evaluation with scenario results enabled",
			"build a report packet with compare artifacts",
			"collect at least one review summary for the target behavior",
		],
	};
}

function summarizeCandidateTelemetry(entries) {
	let totalCostUsd = 0;
	let totalDurationMs = 0;
	let sawCost = false;
	let sawDuration = false;
	for (const entry of entries) {
		if (typeof entry.telemetry?.cost_usd === "number") {
			sawCost = true;
			totalCostUsd += entry.telemetry.cost_usd;
		}
		if (typeof entry.telemetry?.duration_ms === "number") {
			sawDuration = true;
			totalDurationMs += entry.telemetry.duration_ms;
		}
		if (typeof entry.telemetry?.durationMs === "number") {
			sawDuration = true;
			totalDurationMs += entry.telemetry.durationMs;
		}
	}
	return {
		...(sawCost ? { totalCostUsd } : {}),
		...(sawDuration ? { totalDurationMs } : {}),
	};
}

function buildCompletedResult(input, inputFile, now = new Date()) {
	const heldOutEntries = collectHeldOutEntries(input);
	const candidateTelemetry = summarizeCandidateTelemetry(heldOutEntries);
	return {
		schemaVersion: OPTIMIZE_SEARCH_RESULT_SCHEMA,
		generatedAt: now.toISOString(),
		status: "completed",
		inputFile,
		repoRoot: input.repoRoot,
		optimizeInputFile: input.optimizeInputFile,
		searchConfig: input.searchConfig,
		selectedCandidateId: "seed",
		candidateRegistry: [
			{
				id: "seed",
				generationIndex: 0,
				parentCandidateIds: [],
				origin: "seed",
				targetFile: input.targetFile,
				targetSnapshot: input.seedCandidate?.targetSnapshot || null,
				mutationRationale: "Use the current target prompt file as the seed candidate.",
				telemetry: candidateTelemetry,
			},
		],
		generationSummaries: [],
		heldOutEvaluationMatrix: heldOutEntries.map((entry) => ({
			candidateId: "seed",
			scenarioId: entry.scenarioId,
			mode: entry.mode,
			score: entry.score,
			status: entry.status,
			telemetry: entry.telemetry,
		})),
		pareto: {
			frontierCandidateIds: ["seed"],
			perScenarioBestCandidateIds: heldOutEntries.map((entry) => ({
				scenarioId: entry.scenarioId,
				candidateIds: ["seed"],
			})),
		},
		checkpointOutcomes: {
			review: [],
			fullGate: [],
		},
		searchTelemetry: {
			candidateCount: 1,
			generationCount: 0,
			mutationInvocationCount: 0,
			heldOutEvaluationCount: heldOutEntries.length > 0 ? 1 : 0,
			reviewCheckpointCount: 0,
			stopReason: "seed_only",
		},
		proposalBridge: {
			optimizeInputFile: input.optimizeInputFile,
			selectedCandidateId: "seed",
			selectedTargetFile: input.targetFile,
		},
	};
}

export function runOptimizeSearch(packet, { inputFile = null, now = new Date() } = {}) {
	const heldOutEntries = collectHeldOutEntries(packet);
	const reasons = [];
	const missingEvidence = [];
	if (heldOutEntries.length === 0) {
		reasons.push("missing_held_out_scenarios");
		missingEvidence.push("held_out scenario ids");
	}
	if (!heldOutEntries.some((entry) => typeof entry.score === "number")) {
		reasons.push("missing_per_scenario_scores");
		missingEvidence.push("per-scenario score or pass/fail records");
	}
	if (collectFeedbackSignals(packet).length === 0) {
		reasons.push("missing_textual_feedback");
		missingEvidence.push("compareArtifact reasons or humanReviewFindings");
	}
	if (reasons.length > 0) {
		return buildBlockedResult(packet, inputFile, reasons, missingEvidence, now);
	}
	return buildCompletedResult(packet, inputFile, now);
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = resolveCommandOptions(parseArgs(argv), { env: process.env });
		const input = parseInputFile(options.input);
		const result = runOptimizeSearch(input.packet, {
			inputFile: input.path,
			now: new Date(),
		});
		if (options.output) {
			writeFileSync(options.output, `${JSON.stringify(result, null, 2)}\n`, "utf-8");
		}
		if (options.json || !options.output || result.status === "completed") {
			process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		}
		if (result.status === "blocked") {
			if (!options.json) {
				process.stderr.write(`search blocked: ${result.reasonCodes.join(", ")}\n`);
			}
			process.exit(1);
		}
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
