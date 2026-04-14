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
		outcome: run.outcome,
		blockerKind: normalizeOptionalString(run.blockerKind, `evaluations[${index}].blockerKind`),
		artifactRefs: normalizeArtifactRefs(run.artifactRefs, `evaluations[${index}].artifactRefs`),
		metrics: normalizeOptionalMetrics(run.metrics, `evaluations[${index}].metrics`),
		thresholds: normalizeOptionalThresholds(run.thresholds, `evaluations[${index}].thresholds`),
		intentProfile: run.intentProfile,
	};
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

	const evaluations = input.evaluations.map((run, index) => {
		const normalized = normalizeRun(run, index);
		const outcome =
			normalized.evaluationKind === "trigger" ? evaluateTriggerRun(normalized) : evaluateExecutionRun(normalized);
		return {
			...normalized,
			...outcome,
		};
	});

	const counts = {
		total: evaluations.length,
		passed: evaluations.filter((entry) => entry.status === "passed").length,
		failed: evaluations.filter((entry) => entry.status === "failed").length,
		degraded: evaluations.filter((entry) => entry.status === "degraded").length,
		blocked: evaluations.filter((entry) => entry.status === "blocked").length,
		trigger: evaluations.filter((entry) => entry.evaluationKind === "trigger").length,
		execution: evaluations.filter((entry) => entry.evaluationKind === "execution").length,
	};
	const recommendation =
		counts.failed > 0 ? "reject" : counts.degraded > 0 || counts.blocked > 0 ? "defer" : "accept-now";

	return {
		schemaVersion: SKILL_EVALUATION_SUMMARY_SCHEMA,
		skillId,
		skillDisplayName,
		evaluatedAt: now,
		recommendation,
		evaluationCounts: counts,
		evaluations: evaluations.map((entry) => ({
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
			...(entry.expectedTrigger ? { expectedTrigger: entry.expectedTrigger } : {}),
			...(entry.blockerKind ? { blockerKind: entry.blockerKind } : {}),
			...(entry.metrics ? { metrics: entry.metrics } : {}),
			...(entry.thresholds ? { thresholds: entry.thresholds } : {}),
			...(entry.thresholdFindings.length > 0 ? { thresholdFindings: entry.thresholdFindings } : {}),
			...(entry.artifactRefs.length > 0 ? { artifactRefs: entry.artifactRefs } : {}),
			intentProfile: entry.intentProfile,
		})),
		evaluationRuns: evaluations.map((entry) => ({
			targetKind: entry.targetKind,
			targetId: entry.targetId,
			displayName: entry.displayName,
			evaluationKind: entry.evaluationKind,
			surface: entry.surface,
			startedAt: entry.startedAt,
			status: entry.status,
			summary: entry.summary,
			...(entry.blockerKind ? { blockerKind: entry.blockerKind } : {}),
			...(entry.metrics ? { metrics: entry.metrics } : {}),
			...(entry.artifactRefs.length > 0 ? { artifactRefs: entry.artifactRefs } : {}),
			intentProfile: entry.intentProfile,
		})),
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
