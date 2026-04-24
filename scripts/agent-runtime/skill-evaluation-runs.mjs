import {
	BEHAVIOR_DIMENSIONS,
	BEHAVIOR_SURFACES,
	buildBehaviorIntentProfile,
} from "./behavior-intent.mjs";
import {
	EXECUTION_STATUSES,
	normalizeArtifactRefs,
	normalizeBoolean,
	normalizeNonEmptyString,
	normalizeOptionalBaseline,
	normalizeOptionalIsoTime,
	normalizeOptionalMetrics,
	normalizeOptionalSampling,
	normalizeOptionalString,
	normalizeOptionalTelemetry,
	normalizeOptionalThresholds,
} from "./skill-evaluation-normalizers.mjs";

const TARGET_KINDS = new Set(["public_skill", "profile", "integration"]);
const EVALUATION_KINDS = new Set(["trigger", "execution"]);
const TRIGGER_EXPECTATIONS = new Set(["must_invoke", "must_not_invoke"]);
const STATUS_ORDER = new Map([
	["failed", 0],
	["blocked", 1],
	["degraded", 2],
	["passed", 3],
]);

export function ratio(numerator, denominator) {
	if (typeof numerator !== "number" || typeof denominator !== "number" || denominator <= 0) {
		return null;
	}
	return Number((numerator / denominator).toFixed(4));
}

function statusRank(status) {
	return STATUS_ORDER.get(status) ?? -1;
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

export function normalizeRun(run, index) {
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
		telemetry: normalizeOptionalTelemetry(run.telemetry, `evaluations[${index}].telemetry`),
		sampling: normalizeOptionalSampling(run.sampling, `evaluations[${index}].sampling`),
		baseline: normalizeOptionalBaseline(run.baseline, `evaluations[${index}].baseline`),
		thresholds: normalizeOptionalThresholds(run.thresholds, `evaluations[${index}].thresholds`),
		intentProfile: run.intentProfile,
	};
}

export function evaluateNormalizedRun(normalized) {
	const outcome =
		normalized.evaluationKind === "trigger" ? evaluateTriggerRun(normalized) : evaluateExecutionRun(normalized);
	return {
		...normalized,
		...outcome,
		sampling: buildSamplingInsights(normalized, outcome.status),
		baselineComparison: buildBaselineComparison(normalized, outcome.status),
	};
}
