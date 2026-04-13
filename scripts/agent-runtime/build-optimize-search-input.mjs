import { dirname, join, resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { readActiveRunDir } from "./active-run.mjs";
import {
	OPTIMIZE_INPUTS_SCHEMA,
	OPTIMIZE_SEARCH_INPUTS_SCHEMA,
} from "./contract-versions.mjs";

const SEARCH_BUDGETS = {
	light: {
		generationLimit: 1,
		populationLimit: 3,
		mutationBatchSize: 3,
	},
	medium: {
		generationLimit: 2,
		populationLimit: 5,
		mutationBatchSize: 4,
	},
	heavy: {
		generationLimit: 3,
		populationLimit: 8,
		mutationBatchSize: 5,
	},
};

const REVIEW_CHECKPOINT_POLICIES = new Set(["final_only", "frontier_promotions"]);

const ARG_FIELDS = {
	"--optimize-input": "optimizeInput",
	"--target-file": "targetFile",
	"--held-out-results-file": "heldOutResultsFile",
	"--adapter": "adapter",
	"--adapter-name": "adapterName",
	"--intent": "intent",
	"--baseline-ref": "baselineRef",
	"--profile": "profile",
	"--split": "split",
	"--budget": "budget",
	"--review-checkpoint-policy": "reviewCheckpointPolicy",
	"--output": "output",
};

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/build-optimize-search-input.mjs --optimize-input <file> [--target-file <file>] [--held-out-results-file <file>] [--budget <light|medium|heavy>] [--review-checkpoint-policy <final_only|frontier_promotions>] [--output <file>] [--json]",
		"  node ./scripts/agent-runtime/build-optimize-search-input.mjs --input-json '<json>' [--output <file>] [--json]",
		"",
		"Output packet:",
		`  schemaVersion: ${OPTIMIZE_SEARCH_INPUTS_SCHEMA}`,
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

function parseJsonObject(text, label) {
	try {
		const parsed = JSON.parse(text);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			fail(`${label} must be a JSON object`);
		}
		return parsed;
	} catch (error) {
		fail(`Failed to parse ${label}: ${error.message}`);
	}
}

function parseArgs(argv) {
	const options = {
		optimizeInput: null,
		inputJson: null,
		targetFile: null,
		heldOutResultsFile: null,
		adapter: null,
		adapterName: null,
		intent: null,
		baselineRef: null,
		profile: null,
		split: null,
		budget: "medium",
		reviewCheckpointPolicy: null,
		output: null,
		json: false,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		index += applyArg(options, argv, index, arg);
	}
	if (options.optimizeInput && options.inputJson) {
		fail("Use either --optimize-input or --input-json, not both");
	}
	if (options.adapter && options.adapterName) {
		fail("Use either --adapter or --adapter-name, not both");
	}
	if (!options.optimizeInput && !options.inputJson) {
		fail("Use one of --optimize-input or --input-json");
	}
	if (!Object.prototype.hasOwnProperty.call(SEARCH_BUDGETS, options.budget)) {
		fail(`--budget must be one of: ${Object.keys(SEARCH_BUDGETS).join(", ")}`);
	}
	if (options.reviewCheckpointPolicy && !REVIEW_CHECKPOINT_POLICIES.has(options.reviewCheckpointPolicy)) {
		fail(`--review-checkpoint-policy must be one of: ${[...REVIEW_CHECKPOINT_POLICIES].join(", ")}`);
	}
	return options;
}

function applyArg(options, argv, index, arg) {
	if (arg === "-h" || arg === "--help") {
		usage(0);
	}
	if (arg === "--json") {
		options.json = true;
		return 0;
	}
	if (arg === "--input-json") {
		options.inputJson = parseJsonObject(readRequiredValue(argv, index + 1, arg), "input JSON");
		return 1;
	}
	const field = ARG_FIELDS[arg];
	if (!field) {
		fail(`Unknown argument: ${arg}`);
	}
	options[field] = readRequiredValue(argv, index + 1, arg);
	return 1;
}

function parseJsonFile(path, label) {
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

function parseOptimizeInputFile(path) {
	const parsed = parseJsonFile(path, "optimize input");
	if (parsed.packet.schemaVersion !== OPTIMIZE_INPUTS_SCHEMA) {
		fail(`optimize input must use schemaVersion ${OPTIMIZE_INPUTS_SCHEMA}`);
	}
	return parsed;
}

function deriveHeldOutScenarioSet(report) {
	return [...new Set(
		listModeRuns(report)
			.filter((modeRun) => ["held_out", "full_gate"].includes(modeRun.mode))
			.flatMap((modeRun) => collectScenarioIds(modeRun.scenarioResults?.results)),
	)];
}

function deriveTrainScenarioSet(optimizeInput) {
	const reportIds = ["regressed", "noisy", "improved", "unchanged"]
		.flatMap((key) => collectScenarioIds(optimizeInput.report?.[key]));
	const historyIds = collectHistoryScenarioIds(optimizeInput.scenarioHistory?.scenarioStats);
	return [...new Set([...reportIds, ...historyIds])];
}

function listModeRuns(report) {
	return Array.isArray(report?.modeRuns) ? report.modeRuns.filter((modeRun) => modeRun && typeof modeRun === "object") : [];
}

function collectScenarioIds(items) {
	const source = Array.isArray(items) ? items : [];
	return source.flatMap((item) => {
		if (typeof item === "string" && item.length > 0) {
			return [item];
		}
		if (typeof item?.scenarioId === "string" && item.scenarioId.length > 0) {
			return [item.scenarioId];
		}
		return [];
	});
}

function collectHistoryScenarioIds(stats) {
	return stats && typeof stats === "object" ? Object.keys(stats) : [];
}

function deriveSelectionPolicy() {
	return {
		primaryObjective: "held_out_behavior",
		tieBreakers: ["lower_cost", "lower_latency"],
		constraintCaps: {},
	};
}

function buildSearchConfig(budget, reviewCheckpointPolicy) {
	return {
		algorithm: "reflective_pareto",
		budget,
		...SEARCH_BUDGETS[budget],
		candidateSelection: "pareto",
		reviewCheckpointPolicy,
		fullGateCheckpointPolicy: "final_only",
		selectionPolicy: deriveSelectionPolicy(),
		mergeEnabled: false,
	};
}

function defaultMutationBackends(budget) {
	if (budget === "light") {
		return [
			{
				id: "codex-mutate",
				backend: "codex_exec",
			},
		];
	}
	return [
		{
			id: "codex-mutate",
			backend: "codex_exec",
		},
		{
			id: "claude-mutate",
			backend: "claude_p",
		},
	];
}

function buildMutationConfig(budget, packet) {
	return {
		backends: defaultMutationBackends(budget),
		trainScenarioLimit: Math.max(1, packet.searchConfig.mutationBatchSize - 1),
		promptVariantLimit: packet.searchConfig.mutationBatchSize,
	};
}

function collectTargetSnapshot(targetPath) {
	if (!targetPath || !existsSync(targetPath)) {
		return null;
	}
	const content = readFileSync(targetPath, "utf-8");
	return {
		path: targetPath,
		exists: true,
		sizeBytes: Buffer.byteLength(content),
		lineCount: content === "" ? 0 : content.split("\n").length - 1,
	};
}

function ensurePromptSearchTarget(optimizeInput) {
	if (optimizeInput.optimizationTarget !== "prompt") {
		fail("optimize search currently supports prompt targets only");
	}
}

function resolveTargetPath(optimizeInput, targetFileOverride) {
	const targetRawPath = targetFileOverride || optimizeInput.targetFile?.path || "";
	if (!targetRawPath) {
		fail("search input requires a target prompt file");
	}
	return resolve(targetRawPath);
}

function defaultReviewCheckpointPolicy(budget) {
	return budget === "light" ? "final_only" : "frontier_promotions";
}

function buildTargetRef(targetPath) {
	return {
		path: targetPath,
		exists: existsSync(targetPath),
	};
}

function resolveEvaluationContext(optimizeInput, options) {
	const report = optimizeInput.report || {};
	return {
		mode: "held_out",
		adapter: options.adapter,
		adapterName: options.adapterName,
		intent: options.intent || report.intent || optimizeInput.intentProfile?.summary || "",
		baselineRef: options.baselineRef || report.baseline || "HEAD",
		profile: options.profile || null,
		split: options.split || null,
	};
}

function buildCanonicalPacket({
	optimizeInputFile,
	optimizeInput,
	targetFileOverride,
	budget,
	reviewCheckpointPolicy,
	evaluationOptions,
	now = new Date(),
}) {
	ensurePromptSearchTarget(optimizeInput);
	const targetPath = resolveTargetPath(optimizeInput, targetFileOverride);
	const targetFile = buildTargetRef(targetPath);
	const packet = {
		schemaVersion: OPTIMIZE_SEARCH_INPUTS_SCHEMA,
		generatedAt: now.toISOString(),
		repoRoot: optimizeInput.repoRoot,
		optimizeInputFile,
		optimizeInput,
		optimizationTarget: "prompt",
		targetFile,
		seedCandidate: {
			id: "seed",
			targetFile,
			targetSnapshot: collectTargetSnapshot(targetPath),
		},
		searchConfig: buildSearchConfig(budget, reviewCheckpointPolicy),
		mutationEvidencePolicy: {
			reportBuckets: ["regressed", "noisy"],
			reviewFindingLimit: optimizeInput.optimizer?.plan?.reviewVariantLimit ?? 1,
			includeScenarioHistory: Boolean(optimizeInput.scenarioHistory),
			includeCheckpointFeedback: reviewCheckpointPolicy === "frontier_promotions",
		},
		scenarioSets: {
			trainScenarioSet: deriveTrainScenarioSet(optimizeInput),
			heldOutScenarioSet: deriveHeldOutScenarioSet(optimizeInput.report),
		},
		evaluationFiles: {
			reportFile: optimizeInput.reportFile,
			reviewSummaryFile: optimizeInput.reviewSummaryFile || null,
			scenarioHistoryFile: optimizeInput.scenarioHistoryFile || null,
		},
		evaluationContext: resolveEvaluationContext(optimizeInput, evaluationOptions),
		objective: optimizeInput.objective,
	};
	packet.mutationConfig = buildMutationConfig(budget, packet);
	return packet;
}

function deriveRawInputPath(outputPath) {
	const resolved = resolve(outputPath);
	if (resolved.endsWith(".json")) {
		return resolved.slice(0, -5) + ".raw.json";
	}
	return `${resolved}.raw.json`;
}

function preferRawString(rawValue, fallback) {
	return typeof rawValue === "string" ? rawValue : fallback;
}

function resolveFromRawInput(rawInput, options) {
	const optimizeInputFile = preferRawString(rawInput.optimizeInputFile, options.optimizeInput);
	if (!optimizeInputFile) {
		fail("input JSON must include optimizeInputFile");
	}
	return {
		optimizeInputFile,
		targetFile: preferRawString(rawInput.targetFile, options.targetFile),
		heldOutResultsFile: preferRawString(rawInput.heldOutResultsFile, options.heldOutResultsFile),
		adapter: preferRawString(rawInput.adapter, options.adapter),
		adapterName: preferRawString(rawInput.adapterName, options.adapterName),
		intent: preferRawString(rawInput.intent, options.intent),
		baselineRef: preferRawString(rawInput.baselineRef, options.baselineRef),
		profile: preferRawString(rawInput.profile, options.profile),
		split: preferRawString(rawInput.split, options.split),
		budget: preferRawString(rawInput.budget, options.budget),
		reviewCheckpointPolicy: preferRawString(
			rawInput.reviewCheckpointPolicy,
			options.reviewCheckpointPolicy || defaultReviewCheckpointPolicy(preferRawString(rawInput.budget, options.budget)),
		),
	};
}

function resolveInputOverrides(options) {
	if (!options.inputJson) {
		return {
			rawInput: null,
			optimizeInputFile: options.optimizeInput,
			targetFile: options.targetFile,
			heldOutResultsFile: options.heldOutResultsFile,
			evaluationOptions: {
				adapter: options.adapter,
				adapterName: options.adapterName,
				intent: options.intent,
				baselineRef: options.baselineRef,
				profile: options.profile,
				split: options.split,
			},
			budget: options.budget,
			reviewCheckpointPolicy: options.reviewCheckpointPolicy || defaultReviewCheckpointPolicy(options.budget),
		};
	}
	const rawInput = options.inputJson;
	const resolved = resolveFromRawInput(rawInput, options);
	if (!Object.prototype.hasOwnProperty.call(SEARCH_BUDGETS, resolved.budget)) {
		fail(`budget must be one of: ${Object.keys(SEARCH_BUDGETS).join(", ")}`);
	}
	if (!REVIEW_CHECKPOINT_POLICIES.has(resolved.reviewCheckpointPolicy)) {
		fail(`reviewCheckpointPolicy must be one of: ${[...REVIEW_CHECKPOINT_POLICIES].join(", ")}`);
	}
	return {
		rawInput,
		optimizeInputFile: resolved.optimizeInputFile,
		targetFile: resolved.targetFile,
		heldOutResultsFile: resolved.heldOutResultsFile,
		evaluationOptions: {
			adapter: resolved.adapter,
			adapterName: resolved.adapterName,
			intent: resolved.intent,
			baselineRef: resolved.baselineRef,
			profile: resolved.profile,
			split: resolved.split,
		},
		budget: resolved.budget,
		reviewCheckpointPolicy: resolved.reviewCheckpointPolicy,
	};
}

function ensureParentDir(path) {
	mkdirSync(dirname(path), { recursive: true });
}

function writeJson(path, value) {
	ensureParentDir(path);
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function resolveCommandOptions(options, { env = process.env } = {}) {
	const activeRunDir = readActiveRunDir({ env });
	const resolved = {
		...options,
		output: options.output ? resolve(options.output) : null,
	};
	if (!resolved.output && activeRunDir) {
		resolved.output = join(activeRunDir, "optimize-search-input.json");
	}
	if (resolved.inputJson && !resolved.output) {
		fail("--input-json requires --output or CAUTILUS_RUN_DIR so the canonical input file can be materialized");
	}
	return resolved;
}

export function buildOptimizeSearchInput(argv, { now = new Date(), env = process.env } = {}) {
	const options = resolveCommandOptions(parseArgs(argv), { env });
	const {
		rawInput,
		optimizeInputFile,
		targetFile,
		heldOutResultsFile,
		evaluationOptions,
		budget,
		reviewCheckpointPolicy,
	} = resolveInputOverrides(options);
	const parsedOptimizeInput = parseOptimizeInputFile(optimizeInputFile);
	const packet = buildCanonicalPacket({
		optimizeInputFile: parsedOptimizeInput.path,
		optimizeInput: parsedOptimizeInput.packet,
		targetFileOverride: targetFile,
		budget,
		reviewCheckpointPolicy,
		evaluationOptions,
		now,
	});
	if (heldOutResultsFile) {
		const heldOutResults = parseJsonFile(heldOutResultsFile, "held-out scenario results");
		packet.evaluationFiles.heldOutResultsFile = heldOutResults.path;
		packet.heldOutResults = heldOutResults.packet;
		packet.scenarioSets.heldOutScenarioSet = Array.isArray(heldOutResults.packet.results)
			? [...new Set(heldOutResults.packet.results
				.filter((entry) => typeof entry?.scenarioId === "string" && entry.scenarioId.length > 0)
				.map((entry) => entry.scenarioId))]
			: [];
	}
	let rawInputFile = null;
	if (rawInput && options.output) {
		rawInputFile = deriveRawInputPath(options.output);
		writeJson(rawInputFile, rawInput);
	}
	if (options.output) {
		writeJson(options.output, packet);
	}
	return {
		packet,
		inputFile: options.output,
		rawInputFile,
		json: options.json,
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const result = buildOptimizeSearchInput(argv, { now: new Date(), env: process.env });
		if (result.json) {
			process.stdout.write(
				`${JSON.stringify({
					status: "ready",
					inputFile: result.inputFile,
					rawInputFile: result.rawInputFile,
				}, null, 2)}\n`,
			);
			return;
		}
		if (!result.inputFile) {
			process.stdout.write(`${JSON.stringify(result.packet, null, 2)}\n`);
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
