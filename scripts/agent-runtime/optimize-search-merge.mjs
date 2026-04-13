function heldOutScoreForCandidate(candidate, scenarioId) {
	const entries = Array.isArray(candidate?.heldOutEntries) ? candidate.heldOutEntries : [];
	const match = entries.find((entry) => entry.scenarioId === scenarioId);
	return typeof match?.score === "number" ? match.score : null;
}

function candidateCoverageScore(candidate, scenarioIds) {
	return scenarioIds.reduce((count, scenarioId) => {
		const score = heldOutScoreForCandidate(candidate, scenarioId);
		return count + (typeof score === "number" && score >= 90 ? 1 : 0);
	}, 0);
}

function normalizedList(items) {
	return (Array.isArray(items) ? items : [])
		.filter((item) => typeof item === "string" && item.length > 0);
}

function countScenarioMentions(items, scenarioIds) {
	const normalizedItems = normalizedList(items).map((item) => item.toLowerCase());
	return scenarioIds.filter((scenarioId) => normalizedItems.some((item) => item.includes(scenarioId.toLowerCase()))).length;
}

function weightedScenarioMentions(items, scenarioIds, scenarioWeights) {
	const normalizedItems = normalizedList(items).map((item) => item.toLowerCase());
	return scenarioIds.reduce((total, scenarioId) => {
		if (!normalizedItems.some((item) => item.includes(scenarioId.toLowerCase()))) {
			return total;
		}
		return total + (scenarioWeights.get(scenarioId) || 1);
	}, 0);
}

function uniqueCount(values) {
	return new Set(values).size;
}

function numericTelemetryValue(candidate, field) {
	return typeof candidate?.telemetry?.[field] === "number" ? candidate.telemetry[field] : Number.POSITIVE_INFINITY;
}

function scenarioPriorityWeights(frontierCandidates, scenarioIds) {
	const weights = new Map();
	for (const scenarioId of scenarioIds) {
		const scores = frontierCandidates
			.map((candidate) => heldOutScoreForCandidate(candidate, scenarioId))
			.filter((score) => typeof score === "number");
		if (scores.length === 0) {
			weights.set(scenarioId, 1);
			continue;
		}
		const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
		weights.set(scenarioId, Math.max(1, 100 - averageScore));
	}
	return weights;
}

function pairScenarioStats(left, right, scenarioIds) {
	let coverage = 0;
	let average = 0;
	for (const scenarioId of scenarioIds) {
		const leftScore = heldOutScoreForCandidate(left, scenarioId) ?? Number.NEGATIVE_INFINITY;
		const rightScore = heldOutScoreForCandidate(right, scenarioId) ?? Number.NEGATIVE_INFINITY;
		const bestScore = Math.max(leftScore, rightScore);
		if (bestScore > Number.NEGATIVE_INFINITY) {
			coverage += 1;
		}
		average += bestScore;
	}
	return { coverage, average };
}

function pairCandidateMetrics(left, right, scenarioIds, scenarioWeights) {
	const scenarioStats = pairScenarioStats(left, right, scenarioIds);
	const expectedImprovements = [...normalizedList(left.expectedImprovements), ...normalizedList(right.expectedImprovements)];
	const preservedStrengths = [...normalizedList(left.preservedStrengths), ...normalizedList(right.preservedStrengths)];
	const riskNotes = [...normalizedList(left.riskNotes), ...normalizedList(right.riskNotes)];
	return {
		coverage: scenarioStats.coverage + candidateCoverageScore(left, scenarioIds) + candidateCoverageScore(right, scenarioIds),
		priorityImprovementWeight: weightedScenarioMentions(expectedImprovements, scenarioIds, scenarioWeights),
		improvementCoverage: countScenarioMentions(expectedImprovements, scenarioIds),
		improvementDiversity: uniqueCount(expectedImprovements),
		strengthCount: uniqueCount(preservedStrengths),
		priorityRiskPenalty: weightedScenarioMentions(riskNotes, scenarioIds, scenarioWeights),
		riskPenalty: riskNotes.length,
		average: scenarioStats.average,
		totalCostUsd: numericTelemetryValue(left, "totalCostUsd") + numericTelemetryValue(right, "totalCostUsd"),
		totalDurationMs: numericTelemetryValue(left, "totalDurationMs") + numericTelemetryValue(right, "totalDurationMs"),
	};
}

function comparePairMetrics(left, right) {
	for (const [field, direction] of [
		["coverage", "desc"],
		["average", "desc"],
		["priorityImprovementWeight", "desc"],
		["improvementCoverage", "desc"],
		["improvementDiversity", "desc"],
		["strengthCount", "desc"],
		["priorityRiskPenalty", "asc"],
		["riskPenalty", "asc"],
		["totalCostUsd", "asc"],
		["totalDurationMs", "asc"],
	]) {
		if (left[field] === right[field]) {
			continue;
		}
		if (direction === "desc") {
			return left[field] > right[field] ? 1 : -1;
		}
		return left[field] < right[field] ? 1 : -1;
	}
	return 0;
}

export function selectMergeParents(frontierCandidates, scenarioIds) {
	if (frontierCandidates.length < 2) {
		return null;
	}
	const scenarioWeights = scenarioPriorityWeights(frontierCandidates, scenarioIds);
	let best = null;
	for (let leftIndex = 0; leftIndex < frontierCandidates.length; leftIndex += 1) {
		for (let rightIndex = leftIndex + 1; rightIndex < frontierCandidates.length; rightIndex += 1) {
			const pair = [frontierCandidates[leftIndex], frontierCandidates[rightIndex]];
			const metrics = pairCandidateMetrics(pair[0], pair[1], scenarioIds, scenarioWeights);
			if (!best || comparePairMetrics(metrics, best.metrics) > 0) {
				best = { pair, metrics };
			}
		}
	}
	return best?.pair || null;
}
