import { ratio } from "./skill-evaluation-runs.mjs";

export function buildEvaluationCounts(evaluations) {
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

export function buildComparisonSummary(evaluations) {
	return {
		evaluationsWithBaseline: evaluations.filter((entry) => entry.baselineComparison).length,
		betterThanBaseline: evaluations.filter((entry) => entry.baselineComparison?.relativeStatus === "better").length,
		sameAsBaseline: evaluations.filter((entry) => entry.baselineComparison?.relativeStatus === "same").length,
		worseThanBaseline: evaluations.filter((entry) => entry.baselineComparison?.relativeStatus === "worse").length,
	};
}

export function buildSamplingSummary(evaluations, counts) {
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

export function recommendationFromCounts(counts, comparisonSummary) {
	if (counts.failed > 0) {
		return "reject";
	}
	if (counts.degraded > 0 || counts.blocked > 0 || counts.unstable > 0 || comparisonSummary.worseThanBaseline > 0) {
		return "defer";
	}
	return "accept-now";
}

export function serializeEvaluation(entry) {
	return {
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
		...(entry.telemetry ? { telemetry: entry.telemetry } : {}),
		...(entry.sampling ? { sampling: entry.sampling } : {}),
		...(entry.baselineComparison ? { baselineComparison: entry.baselineComparison } : {}),
		...(entry.thresholds ? { thresholds: entry.thresholds } : {}),
		...(entry.thresholdFindings.length > 0 ? { thresholdFindings: entry.thresholdFindings } : {}),
		...(entry.artifactRefs.length > 0 ? { artifactRefs: entry.artifactRefs } : {}),
		intentProfile: entry.intentProfile,
	};
}

export function serializeEvaluationRun(entry) {
	return {
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
		...(entry.telemetry ? { telemetry: entry.telemetry } : {}),
		...(entry.sampling ? { sampling: entry.sampling } : {}),
		...(entry.baselineComparison ? { baselineComparison: entry.baselineComparison } : {}),
		...(entry.artifactRefs.length > 0 ? { artifactRefs: entry.artifactRefs } : {}),
		intentProfile: entry.intentProfile,
	};
}
