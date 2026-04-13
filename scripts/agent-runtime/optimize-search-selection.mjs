function normalizedConstraintCaps(packet) {
	const caps = packet.searchConfig?.selectionPolicy?.constraintCaps;
	if (!caps || typeof caps !== "object" || Array.isArray(caps)) {
		return {};
	}
	return Object.fromEntries(
		Object.entries(caps).filter(([, value]) => typeof value === "number" && Number.isFinite(value) && value >= 0),
	);
}

export function candidateConstraintRejectionReasons(packet, candidate) {
	const caps = normalizedConstraintCaps(packet);
	const reasons = [];
	if (typeof caps.maxCostUsd === "number" && typeof candidate?.telemetry?.totalCostUsd === "number" && candidate.telemetry.totalCostUsd > caps.maxCostUsd) {
		reasons.push("selection_constraint_max_cost_exceeded");
	}
	if (typeof caps.maxDurationMs === "number" && typeof candidate?.telemetry?.totalDurationMs === "number" && candidate.telemetry.totalDurationMs > caps.maxDurationMs) {
		reasons.push("selection_constraint_max_duration_exceeded");
	}
	return reasons;
}
