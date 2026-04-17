/* eslint-disable max-lines */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
	BEHAVIOR_DIMENSIONS,
	BEHAVIOR_SURFACES,
	buildBehaviorIntentProfile,
} from "./behavior-intent.mjs";
import {
	SKILL_EVALUATION_INPUTS_SCHEMA,
	SKILL_EVALUATION_SUMMARY_SCHEMA,
} from "./contract-versions.mjs";

export { SKILL_EVALUATION_INPUTS_SCHEMA, SKILL_EVALUATION_SUMMARY_SCHEMA } from "./contract-versions.mjs";

const TARGET_KINDS = new Set(["public_skill", "profile", "integration"]);
const EVALUATION_KINDS = new Set(["trigger", "execution"]);
const EXECUTION_STATUSES = new Set(["passed", "failed", "degraded", "blocked"]);
const TRIGGER_EXPECTATIONS = new Set(["must_invoke", "must_not_invoke"]);
const STATUS_ORDER = new Map([
	["failed", 0],
	["blocked", 1],
	["degraded", 2],
	["passed", 3],
]);
function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/evaluate-skill.mjs --input <file> [--output <file>]",
		"",
		"Input packet:",
		`  schemaVersion: ${SKILL_EVALUATION_INPUTS_SCHEMA}`,
		"  skillId: <string>",
		"  evaluations: [...]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}
function parseArgs(argv) {
	let inputPath = "";
	let outputPath = "";
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--input") {
			inputPath = argv[index + 1] || "";
			index += 1;
			continue;
		}
		if (arg === "--output") {
			outputPath = argv[index + 1] || "";
			index += 1;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	if (!inputPath) {
		throw new Error("--input is required");
	}
	return { inputPath, outputPath };
}
function parseJsonFile(path) {
	try {
		return JSON.parse(readFileSync(path, "utf-8"));
	} catch (error) {
		throw new Error(`Failed to read JSON from ${path}: ${error.message}`);
	}
}
function normalizeNonEmptyString(value, field) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`${field} must be a non-empty string`);
	}
	return value.trim();
}
function normalizeOptionalString(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	return normalizeNonEmptyString(value, field);
}
function normalizeNullableString(value, field) {
	if (value === undefined) {
		return undefined;
	}
	if (value === null) {
		return null;
	}
	return normalizeNonEmptyString(value, field);
}
function normalizeOptionalIsoTime(value, field) {
	const text = normalizeOptionalString(value, field);
	if (!text) {
		return null;
	}
	if (!Number.isFinite(Date.parse(text))) {
		throw new Error(`${field} must be a valid ISO timestamp`);
	}
	return text;
}
function normalizeBoolean(value, field) {
	if (typeof value !== "boolean") {
		throw new Error(`${field} must be a boolean`);
	}
	return value;
}
function normalizeNonNegativeNumber(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
		throw new Error(`${field} must be a non-negative number`);
	}
	return value;
}
function normalizeOptionalMetrics(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	const metrics = {};
	const totalTokens = normalizeNonNegativeNumber(value.total_tokens, `${field}.total_tokens`);
	const durationMs = normalizeNonNegativeNumber(value.duration_ms, `${field}.duration_ms`);
	const costUsd = normalizeNonNegativeNumber(value.cost_usd, `${field}.cost_usd`);
	if (totalTokens !== null) {
		metrics.total_tokens = totalTokens;
	}
	if (durationMs !== null) {
		metrics.duration_ms = durationMs;
	}
	if (costUsd !== null) {
		metrics.cost_usd = costUsd;
	}
	return Object.keys(metrics).length > 0 ? metrics : null;
}
function normalizeOptionalTelemetry(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	const telemetry = {};
	for (const key of ["provider", "model"]) {
		const normalized = normalizeOptionalString(value[key], `${field}.${key}`);
		if (normalized !== null) {
			telemetry[key] = normalized;
		}
	}
	for (const key of ["prompt_tokens", "completion_tokens", "total_tokens", "cost_usd"]) {
		const normalized = normalizeNonNegativeNumber(value[key], `${field}.${key}`);
		if (normalized !== null) {
			telemetry[key] = normalized;
		}
	}
	return Object.keys(telemetry).length > 0 ? telemetry : null;
}
function normalizeOptionalThresholds(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	const thresholds = {};
	const maxTokens = normalizeNonNegativeNumber(value.max_total_tokens, `${field}.max_total_tokens`);
	const maxDuration = normalizeNonNegativeNumber(value.max_duration_ms, `${field}.max_duration_ms`);
	const maxCost = normalizeNonNegativeNumber(value.max_cost_usd, `${field}.max_cost_usd`);
	if (maxTokens !== null) {
		thresholds.max_total_tokens = maxTokens;
	}
	if (maxDuration !== null) {
		thresholds.max_duration_ms = maxDuration;
	}
	if (maxCost !== null) {
		thresholds.max_cost_usd = maxCost;
	}
	return Object.keys(thresholds).length > 0 ? thresholds : null;
}
function assertObjectRecord(value, field) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
}
function normalizeSamplingCounts(value, field, sampling) {
	for (const key of ["consensusCount", "matchingCount", "invokedCount"]) {
		const count = normalizeNonNegativeNumber(value[key], `${field}.${key}`);
		if (count === null) {
			continue;
		}
		if (!Number.isInteger(count)) {
			throw new Error(`${field}.${key} must be an integer`);
		}
		sampling[key] = count;
	}
}
function normalizeSamplingStatusCounts(value, field) {
	if (value.statusCounts === undefined || value.statusCounts === null) {
		return null;
	}
	assertObjectRecord(value.statusCounts, `${field}.statusCounts`);
	const statusCounts = {};
	for (const status of EXECUTION_STATUSES) {
		const count = normalizeNonNegativeNumber(value.statusCounts[status], `${field}.statusCounts.${status}`);
		if (count === null) {
			continue;
		}
		if (!Number.isInteger(count)) {
			throw new Error(`${field}.statusCounts.${status} must be an integer`);
		}
		statusCounts[status] = count;
	}
	return Object.keys(statusCounts).length > 0 ? statusCounts : null;
}
function normalizeOptionalSampling(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	assertObjectRecord(value, field);
	const sampleCount = normalizeNonNegativeNumber(value.sampleCount, `${field}.sampleCount`);
	if (sampleCount === null || !Number.isInteger(sampleCount) || sampleCount < 1) {
		throw new Error(`${field}.sampleCount must be a positive integer`);
	}
	const sampling = { sampleCount };
	normalizeSamplingCounts(value, field, sampling);
	if (value.stable !== undefined && value.stable !== null) {
		sampling.stable = normalizeBoolean(value.stable, `${field}.stable`);
	}
	const statusCounts = normalizeSamplingStatusCounts(value, field);
	if (statusCounts) {
		sampling.statusCounts = statusCounts;
	}
	return sampling;
}
function normalizeOptionalBaseline(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	return {
		invoked: normalizeBoolean(value.invoked, `${field}.invoked`),
		summary: normalizeOptionalString(value.summary, `${field}.summary`),
		outcome: normalizeOptionalString(value.outcome, `${field}.outcome`),
		metrics: normalizeOptionalMetrics(value.metrics, `${field}.metrics`),
	};
}
function normalizeArtifactRefs(value, field) {
	if (value === undefined || value === null) {
		return [];
	}
	if (!Array.isArray(value)) {
		throw new Error(`${field} must be an array`);
	}
	return value.map((entry, index) => {
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
			throw new Error(`${field}[${index}] must be an object`);
		}
		const kind = normalizeNonEmptyString(entry.kind, `${field}[${index}].kind`);
		const path = normalizeNonEmptyString(entry.path, `${field}[${index}].path`);
		return { kind, path };
	});
}
function normalizeRoutingDecision(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	return {
		selectedSkill: normalizeNullableString(value.selectedSkill, `${field}.selectedSkill`) ?? null,
		selectedSupport: normalizeNullableString(value.selectedSupport, `${field}.selectedSupport`) ?? null,
		firstToolCall: normalizeNullableString(value.firstToolCall, `${field}.firstToolCall`) ?? null,
		reasonSummary: normalizeNullableString(value.reasonSummary, `${field}.reasonSummary`) ?? null,
	};
}
function normalizeExpectedRouting(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	const expectedRouting = {};
	if ("selectedSkill" in value) {
		expectedRouting.selectedSkill = normalizeNullableString(value.selectedSkill, `${field}.selectedSkill`);
	}
	if ("selectedSupport" in value) {
		expectedRouting.selectedSupport = normalizeNullableString(value.selectedSupport, `${field}.selectedSupport`);
	}
	if ("firstToolCallPattern" in value) {
		expectedRouting.firstToolCallPattern = normalizeOptionalString(value.firstToolCallPattern, `${field}.firstToolCallPattern`);
	}
	if (Object.keys(expectedRouting).length === 0) {
		throw new Error(`${field} must declare at least one expectation field`);
	}
	return expectedRouting;
}
function normalizeInstructionSurface(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	const surfaceLabel = normalizeNonEmptyString(value.surfaceLabel, `${field}.surfaceLabel`);
	if (!Array.isArray(value.files)) {
		throw new Error(`${field}.files must be an array`);
	}
	return {
		surfaceLabel,
		files: value.files.map((entry, index) => {
			if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
				throw new Error(`${field}.files[${index}] must be an object`);
			}
			const fileRecord = {
				path: normalizeNonEmptyString(entry.path, `${field}.files[${index}].path`),
				sourceKind: normalizeOptionalString(entry.sourceKind, `${field}.files[${index}].sourceKind`) ?? "workspace_default",
			};
			const sourceFile = normalizeOptionalString(entry.sourceFile, `${field}.files[${index}].sourceFile`);
			if (sourceFile) {
				fileRecord.sourceFile = sourceFile;
			}
			const artifactPath = normalizeOptionalString(entry.artifactPath, `${field}.files[${index}].artifactPath`);
			if (artifactPath) {
				fileRecord.artifactPath = artifactPath;
			}
			return fileRecord;
		}),
	};
}
function hasRoutingSignal(decision) {
	return Boolean(decision && [
		decision.selectedSkill,
		decision.selectedSupport,
		decision.firstToolCall,
		decision.reasonSummary,
	].some((value) => typeof value === "string" && value.trim()));
}
function thresholdFindings(metrics, thresholds) {
	if (!metrics || !thresholds) {
		return [];
	}
	const findings = [];
	for (const [metricKey, thresholdKey] of [
		["total_tokens", "max_total_tokens"],
		["duration_ms", "max_duration_ms"],
		["cost_usd", "max_cost_usd"],
	]) {
		if (metrics[metricKey] === undefined || thresholds[thresholdKey] === undefined) {
			continue;
		}
		if (metrics[metricKey] > thresholds[thresholdKey]) {
			findings.push({
				metric: metricKey,
				actual: metrics[metricKey],
				limit: thresholds[thresholdKey],
			});
		}
	}
	return findings;
}
function ratio(numerator, denominator) {
	if (typeof numerator !== "number" || typeof denominator !== "number" || denominator <= 0) {
		return null;
	}
	return Number((numerator / denominator).toFixed(4));
}
function statusRank(status) {
	return STATUS_ORDER.get(status) ?? -1;
}
function samplingPassCount(run, consensusCount) {
	if (run.evaluationKind === "trigger") {
		return run.sampling.matchingCount ?? consensusCount;
	}
	return run.sampling.statusCounts?.passed ?? null;
}
function samplingRateFields(sampleCount, consensusCount, invokedCount, passCount) {
	const rateFields = {};
	const passRate = ratio(passCount, sampleCount);
	const invocationRate = ratio(invokedCount, sampleCount);
	const consensusRate = ratio(consensusCount, sampleCount);
	if (passRate !== null) {
		rateFields.passRate = passRate;
	}
	if (invocationRate !== null) {
		rateFields.invocationRate = invocationRate;
	}
	if (consensusRate !== null) {
		rateFields.consensusRate = consensusRate;
	}
	return rateFields;
}
function buildSamplingInsights(run, status) {
	if (!run.sampling) {
		return null;
	}
	const sampleCount = run.sampling.sampleCount;
	const consensusCount = run.sampling.consensusCount ?? null;
	const invokedCount = run.sampling.invokedCount ?? null;
	const passCount = samplingPassCount(run, consensusCount);
	return {
		sampleCount,
		...(consensusCount !== null ? { consensusCount } : {}),
		...(invokedCount !== null ? { invokedCount } : {}),
		...(passCount !== null ? { passCount } : {}),
		...(run.sampling.stable !== undefined ? { stable: run.sampling.stable } : {}),
		...samplingRateFields(sampleCount, consensusCount, invokedCount, passCount),
		unstable: run.sampling.stable === false,
		...(run.sampling.statusCounts ? { statusCounts: run.sampling.statusCounts } : {}),
		derivedStatus: status,
	};
}
function evaluateBaseline(run) {
	if (!run.baseline) {
		return null;
	}
	const baselineRun = {
		...run,
		invoked: run.baseline.invoked,
		summary: run.baseline.summary || "Baseline comparison run.",
		metrics: run.baseline.metrics,
		outcome: run.baseline.outcome,
	};
	return run.evaluationKind === "trigger"
		? evaluateTriggerRun(baselineRun)
		: evaluateExecutionRun(baselineRun);
}
function buildBaselineComparison(run, evaluatedStatus) {
	const baselineEvaluation = evaluateBaseline(run);
	if (!baselineEvaluation) {
		return null;
	}
	const currentRank = statusRank(evaluatedStatus);
	const baselineRank = statusRank(baselineEvaluation.status);
	let relativeStatus = "same";
	if (currentRank > baselineRank) {
		relativeStatus = "better";
	} else if (currentRank < baselineRank) {
		relativeStatus = "worse";
	}
	const metricDeltas = {};
	for (const metric of ["duration_ms", "total_tokens", "cost_usd"]) {
		if (typeof run.metrics?.[metric] !== "number" || typeof run.baseline.metrics?.[metric] !== "number") {
			continue;
		}
		metricDeltas[metric] = Number((run.metrics[metric] - run.baseline.metrics[metric]).toFixed(4));
	}
	return {
		baselineStatus: baselineEvaluation.status,
		relativeStatus,
		baselineInvoked: run.baseline.invoked,
		...(run.baseline.outcome ? { baselineOutcome: run.baseline.outcome } : {}),
		...(Object.keys(metricDeltas).length > 0 ? { metricDeltas } : {}),
	};
}
function buildTriggerIntentProfile(run) {
	return buildBehaviorIntentProfile({
		intent: `${run.displayName} should trigger only when the prompt truly needs the skill.`,
		intentProfile: run.intentProfile,
		fallbackBehaviorSurface: BEHAVIOR_SURFACES.SKILL_TRIGGER_SELECTION,
		defaultSuccessDimensions: [BEHAVIOR_DIMENSIONS.SKILL_TRIGGER_ACCURACY],
	});
}
function buildExecutionIntentProfile(run) {
	const defaultSuccessDimensions = [BEHAVIOR_DIMENSIONS.SKILL_TASK_FIDELITY];
	if (run.thresholds) {
		defaultSuccessDimensions.push(BEHAVIOR_DIMENSIONS.RUNTIME_BUDGET_RESPECT);
	}
	return buildBehaviorIntentProfile({
		intent: `${run.displayName} should complete the intended task cleanly once the skill is invoked.`,
		intentProfile: run.intentProfile,
		fallbackBehaviorSurface: BEHAVIOR_SURFACES.SKILL_EXECUTION_QUALITY,
		defaultSuccessDimensions,
	});
}
function evaluateTriggerRun(run) {
	const expectedTrigger = normalizeNonEmptyString(run.expectedTrigger, "evaluations[].expectedTrigger");
	if (!TRIGGER_EXPECTATIONS.has(expectedTrigger)) {
		throw new Error("evaluations[].expectedTrigger must be one of: must_invoke, must_not_invoke");
	}
	const passed =
		(expectedTrigger === "must_invoke" && run.invoked) ||
		(expectedTrigger === "must_not_invoke" && !run.invoked);
	const displayName = run.displayName;
	const summary = passed
		? run.summary
		: expectedTrigger === "must_invoke"
			? `${run.summary} The prompt should have triggered ${displayName}, but no invocation was observed.`
			: `${run.summary} The prompt should have stayed outside ${displayName}, but an invocation was observed.`;
	return {
		surface: "trigger_selection",
		status: passed ? "passed" : "failed",
		summary,
		expectedTrigger,
		thresholdFindings: [],
		intentProfile: buildTriggerIntentProfile(run),
	};
}
function evaluateExecutionRun(run) {
	const outcome = normalizeNonEmptyString(run.outcome, "evaluations[].outcome");
	if (!EXECUTION_STATUSES.has(outcome)) {
		throw new Error("evaluations[].outcome must be one of: passed, failed, degraded, blocked");
	}
	if (!run.invoked) {
		return {
			surface: "execution_quality",
			status: "failed",
			summary: `${run.summary} The execution case never invoked the skill, so the task could not complete on the intended surface.`,
			expectedTrigger: null,
			thresholdFindings: [],
			intentProfile: buildExecutionIntentProfile(run),
		};
	}
	const findings = thresholdFindings(run.metrics, run.thresholds);
	const degradedByThreshold = outcome === "passed" && findings.length > 0;
	const summary =
		degradedByThreshold
			? `${run.summary} Runtime budgets were exceeded for ${findings
				.map((entry) => `${entry.metric}=${entry.actual} > ${entry.limit}`)
				.join(", ")}.`
			: run.summary;
	return {
		surface: "execution_quality",
		status: degradedByThreshold ? "degraded" : outcome,
		summary,
		expectedTrigger: null,
		thresholdFindings: findings,
		intentProfile: buildExecutionIntentProfile(run),
	};
}
function buildRoutingEvaluation(run) {
	if (!run.expectedRouting) {
		return null;
	}
	const routingDecision = run.routingDecision ?? {
		selectedSkill: null,
		selectedSupport: null,
		firstToolCall: null,
		reasonSummary: null,
	};
	const matchedFields = [];
	const mismatchedFields = [];
	const compareNullableField = (field, actual) => {
		if (!(field in run.expectedRouting)) {
			return;
		}
		if ((run.expectedRouting[field] ?? null) === (actual ?? null)) {
			matchedFields.push(field);
			return;
		}
		mismatchedFields.push(field);
	};
	compareNullableField("selectedSkill", routingDecision.selectedSkill);
	compareNullableField("selectedSupport", routingDecision.selectedSupport);
	if (run.expectedRouting.firstToolCallPattern) {
		((routingDecision.firstToolCall ?? "").includes(run.expectedRouting.firstToolCallPattern)
			? matchedFields
			: mismatchedFields).push("firstToolCall");
	}
	return {
		status: mismatchedFields.length === 0 ? "matched" : "mismatched",
		matchedFields,
		mismatchedFields,
	};
}
function routingMismatchSummary(run, routingEvaluation) {
	const parts = routingEvaluation.mismatchedFields.map((field) => {
		if (field === "selectedSkill") {
			return `selectedSkill expected ${JSON.stringify(run.expectedRouting.selectedSkill ?? null)} but got ${JSON.stringify(run.routingDecision?.selectedSkill ?? null)}`;
		}
		if (field === "selectedSupport") {
			return `selectedSupport expected ${JSON.stringify(run.expectedRouting.selectedSupport ?? null)} but got ${JSON.stringify(run.routingDecision?.selectedSupport ?? null)}`;
		}
		return `firstToolCall did not match pattern ${JSON.stringify(run.expectedRouting.firstToolCallPattern)}`;
	});
	return `First routing decision mismatched the expected route: ${parts.join(", ")}.`;
}
function normalizeRun(run, index) {
	if (!run || typeof run !== "object" || Array.isArray(run)) {
		throw new Error(`evaluations[${index}] must be an object`);
	}
	const targetKind = normalizeNonEmptyString(run.targetKind, `evaluations[${index}].targetKind`);
	if (!TARGET_KINDS.has(targetKind)) {
		throw new Error(`evaluations[${index}].targetKind must be one of: ${[...TARGET_KINDS].join(", ")}`);
	}
	const evaluationKind = normalizeNonEmptyString(run.evaluationKind, `evaluations[${index}].evaluationKind`);
	if (!EVALUATION_KINDS.has(evaluationKind)) {
		throw new Error("evaluations[].evaluationKind must be one of: trigger, execution");
	}
	return {
		evaluationId: normalizeNonEmptyString(run.evaluationId, `evaluations[${index}].evaluationId`),
		targetKind,
		targetId: normalizeNonEmptyString(run.targetId, `evaluations[${index}].targetId`),
		displayName:
			normalizeOptionalString(run.displayName, `evaluations[${index}].displayName`) ||
			normalizeNonEmptyString(run.targetId, `evaluations[${index}].targetId`),
		evaluationKind,
		prompt: normalizeNonEmptyString(run.prompt, `evaluations[${index}].prompt`),
		startedAt: normalizeOptionalIsoTime(run.startedAt, `evaluations[${index}].startedAt`) || new Date().toISOString(),
		summary: normalizeNonEmptyString(run.summary, `evaluations[${index}].summary`),
		invoked: normalizeBoolean(run.invoked, `evaluations[${index}].invoked`),
		expectedTrigger: run.expectedTrigger,
		expectedRouting: normalizeExpectedRouting(run.expectedRouting, `evaluations[${index}].expectedRouting`),
		outcome: run.outcome,
		blockerKind: normalizeOptionalString(run.blockerKind, `evaluations[${index}].blockerKind`),
		routingDecision: normalizeRoutingDecision(run.routingDecision, `evaluations[${index}].routingDecision`),
		instructionSurface: normalizeInstructionSurface(run.instructionSurface, `evaluations[${index}].instructionSurface`),
		artifactRefs: normalizeArtifactRefs(run.artifactRefs, `evaluations[${index}].artifactRefs`),
		metrics: normalizeOptionalMetrics(run.metrics, `evaluations[${index}].metrics`),
		telemetry: normalizeOptionalTelemetry(run.telemetry, `evaluations[${index}].telemetry`),
		sampling: normalizeOptionalSampling(run.sampling, `evaluations[${index}].sampling`),
		baseline: normalizeOptionalBaseline(run.baseline, `evaluations[${index}].baseline`),
		thresholds: normalizeOptionalThresholds(run.thresholds, `evaluations[${index}].thresholds`),
		intentProfile: run.intentProfile,
	};
}
function evaluateNormalizedRun(normalized) {
	const outcome =
		normalized.evaluationKind === "trigger" ? evaluateTriggerRun(normalized) : evaluateExecutionRun(normalized);
	const routingEvaluation = buildRoutingEvaluation(normalized);
	let status = outcome.status;
	let summary = outcome.summary;
	if (routingEvaluation?.status === "mismatched") {
		summary = `${summary} ${routingMismatchSummary(normalized, routingEvaluation)}`;
		if (normalized.evaluationKind === "trigger") {
			status = "failed";
		} else if (status === "passed") {
			status = "degraded";
		}
	}
	return {
		...normalized,
		...outcome,
		status,
		summary,
		routingEvaluation,
		sampling: buildSamplingInsights(normalized, status),
		baselineComparison: buildBaselineComparison(normalized, status),
	};
}
function buildEvaluationCounts(evaluations) {
	return {
		total: evaluations.length,
		passed: evaluations.filter((entry) => entry.status === "passed").length,
		failed: evaluations.filter((entry) => entry.status === "failed").length,
		degraded: evaluations.filter((entry) => entry.status === "degraded").length,
		blocked: evaluations.filter((entry) => entry.status === "blocked").length,
		trigger: evaluations.filter((entry) => entry.evaluationKind === "trigger").length,
		execution: evaluations.filter((entry) => entry.evaluationKind === "execution").length,
		unstable: evaluations.filter((entry) => entry.sampling?.unstable).length,
	};
}
function buildComparisonSummary(evaluations) {
	return {
		evaluationsWithBaseline: evaluations.filter((entry) => entry.baselineComparison).length,
		betterThanBaseline: evaluations.filter((entry) => entry.baselineComparison?.relativeStatus === "better").length,
		sameAsBaseline: evaluations.filter((entry) => entry.baselineComparison?.relativeStatus === "same").length,
		worseThanBaseline: evaluations.filter((entry) => entry.baselineComparison?.relativeStatus === "worse").length,
	};
}
function buildSamplingSummary(evaluations, counts) {
	const samplingSummary = {
		evaluationsWithSampling: evaluations.filter((entry) => entry.sampling).length,
		unstableEvaluations: counts.unstable,
		totalSamples: evaluations.reduce((sum, entry) => sum + (entry.sampling?.sampleCount ?? 0), 0),
		totalConsensusSamples: evaluations.reduce((sum, entry) => sum + (entry.sampling?.consensusCount ?? 0), 0),
		totalInvocations: evaluations.reduce((sum, entry) => sum + (entry.sampling?.invokedCount ?? 0), 0),
		totalPassingSamples: evaluations.reduce((sum, entry) => sum + (entry.sampling?.passCount ?? 0), 0),
	};
	const overallPassRate = ratio(samplingSummary.totalPassingSamples, samplingSummary.totalSamples);
	const overallInvocationRate = ratio(samplingSummary.totalInvocations, samplingSummary.totalSamples);
	const overallConsensusRate = ratio(samplingSummary.totalConsensusSamples, samplingSummary.totalSamples);
	if (overallPassRate !== null) {
		samplingSummary.overallPassRate = overallPassRate;
	}
	if (overallInvocationRate !== null) {
		samplingSummary.overallInvocationRate = overallInvocationRate;
	}
	if (overallConsensusRate !== null) {
		samplingSummary.overallConsensusRate = overallConsensusRate;
	}
	return samplingSummary;
}
function buildRoutingSummary(evaluations) {
	const routingSummary = {
		evaluationsWithRoutingDecision: 0,
		evaluationsWithExpectedRoute: 0,
		matchedExpectedRoute: 0,
		mismatchedExpectedRoute: 0,
		selectedSkillCounts: {},
	};
	for (const evaluation of evaluations) {
		if (hasRoutingSignal(evaluation.routingDecision)) {
			routingSummary.evaluationsWithRoutingDecision += 1;
		}
		const selectedSkillKey = evaluation.routingDecision?.selectedSkill ?? "__none__";
		routingSummary.selectedSkillCounts[selectedSkillKey] = (routingSummary.selectedSkillCounts[selectedSkillKey] ?? 0) + 1;
		if (!evaluation.expectedRouting) {
			continue;
		}
		routingSummary.evaluationsWithExpectedRoute += 1;
		if (evaluation.routingEvaluation?.status === "matched") {
			routingSummary.matchedExpectedRoute += 1;
		}
		if (evaluation.routingEvaluation?.status === "mismatched") {
			routingSummary.mismatchedExpectedRoute += 1;
		}
	}
	return routingSummary;
}
function recommendationFromCounts(counts, comparisonSummary) {
	if (counts.failed > 0) {
		return "reject";
	}
	if (counts.degraded > 0 || counts.blocked > 0 || counts.unstable > 0 || comparisonSummary.worseThanBaseline > 0) {
		return "defer";
	}
	return "accept-now";
}
function withOptionalFields(base, fields) {
	for (const [key, value] of Object.entries(fields)) {
		if (value === undefined || value === null) {
			continue;
		}
		if (Array.isArray(value) && value.length === 0) {
			continue;
		}
		base[key] = value;
	}
	return base;
}
function serializeEvaluation(entry) {
	return withOptionalFields({
		evaluationId: entry.evaluationId,
		targetKind: entry.targetKind,
		targetId: entry.targetId,
		displayName: entry.displayName,
		evaluationKind: entry.evaluationKind,
		surface: entry.surface,
		status: entry.status,
		startedAt: entry.startedAt,
		prompt: entry.prompt,
		summary: entry.summary,
		invoked: entry.invoked,
		intentProfile: entry.intentProfile,
	}, {
		expectedTrigger: entry.expectedTrigger,
		expectedRouting: entry.expectedRouting,
		routingDecision: entry.routingDecision,
		routingEvaluation: entry.routingEvaluation,
		instructionSurface: entry.instructionSurface,
		blockerKind: entry.blockerKind,
		metrics: entry.metrics,
		telemetry: entry.telemetry,
		sampling: entry.sampling,
		baselineComparison: entry.baselineComparison,
		thresholds: entry.thresholds,
		thresholdFindings: entry.thresholdFindings,
		artifactRefs: entry.artifactRefs,
	});
}
function serializeEvaluationRun(entry) {
	return withOptionalFields({
		targetKind: entry.targetKind,
		targetId: entry.targetId,
		displayName: entry.displayName,
		evaluationKind: entry.evaluationKind,
		surface: entry.surface,
		startedAt: entry.startedAt,
		status: entry.status,
		summary: entry.summary,
		intentProfile: entry.intentProfile,
	}, {
		expectedRouting: entry.expectedRouting,
		routingDecision: entry.routingDecision,
		routingEvaluation: entry.routingEvaluation,
		instructionSurface: entry.instructionSurface,
		blockerKind: entry.blockerKind,
		metrics: entry.metrics,
		telemetry: entry.telemetry,
		sampling: entry.sampling,
		baselineComparison: entry.baselineComparison,
		artifactRefs: entry.artifactRefs,
	});
}
export function buildSkillEvaluationSummary(input, now = new Date().toISOString()) {
	if (input.schemaVersion !== SKILL_EVALUATION_INPUTS_SCHEMA) {
		throw new Error(`schemaVersion must be ${SKILL_EVALUATION_INPUTS_SCHEMA}`);
	}
	const skillId = normalizeNonEmptyString(input.skillId, "skillId");
	const skillDisplayName = normalizeOptionalString(input.skillDisplayName, "skillDisplayName") || skillId;
	if (!Array.isArray(input.evaluations) || input.evaluations.length === 0) {
		throw new Error("evaluations must be a non-empty array");
	}

	const evaluations = input.evaluations.map((run, index) => evaluateNormalizedRun(normalizeRun(run, index)));
	const counts = buildEvaluationCounts(evaluations);
	const comparisonSummary = buildComparisonSummary(evaluations);
	const samplingSummary = buildSamplingSummary(evaluations, counts);
	const routingSummary = buildRoutingSummary(evaluations);
	const recommendation = recommendationFromCounts(counts, comparisonSummary);

	return {
		schemaVersion: SKILL_EVALUATION_SUMMARY_SCHEMA,
		skillId,
		skillDisplayName,
		evaluatedAt: now,
		recommendation,
		evaluationCounts: counts,
		samplingSummary,
		comparisonSummary,
		routingSummary,
		evaluations: evaluations.map((entry) => serializeEvaluation(entry)),
		evaluationRuns: evaluations.map((entry) => serializeEvaluationRun(entry)),
	};
}
export function main(argv = process.argv.slice(2)) {
	try {
		const { inputPath, outputPath } = parseArgs(argv);
		const input = parseJsonFile(inputPath);
		const summary = buildSkillEvaluationSummary(input);
		const text = `${JSON.stringify(summary, null, 2)}\n`;
		if (outputPath) {
			writeFileSync(outputPath, text, "utf-8");
			return;
		}
		process.stdout.write(text);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
