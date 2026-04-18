function completenessStatus(total, present) {
	if (total === 0 || present === 0) {
		return "absent";
	}
	if (present === total) {
		return "complete";
	}
	return "partial";
}

function countPresent(items, predicate) {
	return items.reduce((count, item) => count + (predicate(item) ? 1 : 0), 0);
}

export function telemetryCompleteness(matrix, candidates) {
	const candidateTelemetry = candidates.map((candidate) => candidate.telemetry || {});
	return {
		heldOutDurationMs: completenessStatus(
			matrix.length,
			countPresent(matrix, (entry) => typeof entry?.telemetry?.durationMs === "number" || typeof entry?.telemetry?.duration_ms === "number"),
		),
		heldOutTotalTokens: completenessStatus(
			matrix.length,
			countPresent(matrix, (entry) => typeof entry?.telemetry?.total_tokens === "number"),
		),
		heldOutCostUsd: completenessStatus(
			matrix.length,
			countPresent(matrix, (entry) => typeof entry?.telemetry?.cost_usd === "number"),
		),
		candidateAggregateDurationMs: completenessStatus(
			candidateTelemetry.length,
			countPresent(candidateTelemetry, (telemetry) => typeof telemetry?.totalDurationMs === "number"),
		),
		candidateAggregateTotalTokens: completenessStatus(
			candidateTelemetry.length,
			countPresent(candidateTelemetry, (telemetry) => typeof telemetry?.totalTokens === "number"),
		),
		candidateAggregateCostUsd: completenessStatus(
			candidateTelemetry.length,
			countPresent(candidateTelemetry, (telemetry) => typeof telemetry?.totalCostUsd === "number"),
		),
	};
}

function mutationBackendContext(packet) {
	return Array.isArray(packet.mutationConfig?.backends)
		? packet.mutationConfig.backends.map((backend) => ({
			id: backend?.id || null,
			backend: backend?.backend || null,
		}))
		: [];
}

function orNull(value) {
	return value || null;
}

function evaluationContextSummary(packet) {
	const evaluationContext = packet.evaluationContext || {};
	return {
		mode: orNull(evaluationContext.mode),
		intent: orNull(evaluationContext.intent),
		baselineRef: orNull(evaluationContext.baselineRef),
		adapter: orNull(evaluationContext.adapter),
		adapterName: orNull(evaluationContext.adapterName),
		adapterPath: orNull(packet.searchConfigSources?.adapterPath),
		profile: orNull(evaluationContext.profile),
		split: orNull(evaluationContext.split),
		targetFile: packet.targetFile || {},
		searchBudget: orNull(packet.searchConfig?.budget),
	};
}

export function experimentContext(packet) {
	return {
		...evaluationContextSummary(packet),
		mutationBackends: mutationBackendContext(packet),
	};
}
