function heldOutScoreForCandidate(candidate, scenarioId) {
	const entries = Array.isArray(candidate?.heldOutEntries) ? candidate.heldOutEntries : [];
	const match = entries.find((entry) => entry.scenarioId === scenarioId);
	return typeof match?.score === "number" ? match.score : null;
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

function frontierBestScores(frontierCandidates, scenarioIds) {
	const scores = new Map();
	for (const scenarioId of scenarioIds) {
		scores.set(
			scenarioId,
			frontierCandidates.reduce((score, candidate) => (
				Math.max(score, heldOutScoreForCandidate(candidate, scenarioId) ?? Number.NEGATIVE_INFINITY)
			), Number.NEGATIVE_INFINITY),
		);
	}
	return scores;
}

function scopedFeedbackEntries(candidate) {
	return (Array.isArray(candidate?.checkpointFeedback) ? candidate.checkpointFeedback : [])
		.filter((entry) => Array.isArray(entry?.scenarioIds) && entry.scenarioIds.length > 0);
}

function feedbackEntryBonus(entry) {
	return Math.max(1, Array.isArray(entry?.feedbackMessages) ? entry.feedbackMessages.length : 0) * 100;
}

function rejectionReasonPriority(reason) {
	if (typeof reason !== "string" || reason.length === 0) {
		return 1;
	}
	if (reason.startsWith("full_gate:")) {
		return 3;
	}
	if (reason.endsWith(":blocker")) {
		return 3;
	}
	if (reason.endsWith(":concern")) {
		return 2;
	}
	return 1;
}

function accumulateFeedbackBonus(bonuses, selectedScenarioIds, entry) {
	const bonus = feedbackEntryBonus(entry);
	for (const scenarioId of entry.scenarioIds) {
		if (!selectedScenarioIds.has(scenarioId)) {
			continue;
		}
		bonuses.set(scenarioId, (bonuses.get(scenarioId) || 0) + bonus);
	}
}

function checkpointFeedbackBonuses(feedbackCandidates, scenarioIds) {
	const selectedScenarioIds = new Set(
		(Array.isArray(scenarioIds) ? scenarioIds : [])
			.filter((scenarioId) => typeof scenarioId === "string" && scenarioId.length > 0),
	);
	const bonuses = new Map([...selectedScenarioIds].map((scenarioId) => [scenarioId, 0]));
	for (const candidate of Array.isArray(feedbackCandidates) ? feedbackCandidates : []) {
		for (const entry of scopedFeedbackEntries(candidate)) {
			accumulateFeedbackBonus(bonuses, selectedScenarioIds, entry);
		}
	}
	return bonuses;
}

function checkpointRepairWeights(feedbackCandidates, scenarioIds) {
	const selectedScenarioIds = selectedScenarioIdSet(scenarioIds);
	const weights = new Map([...selectedScenarioIds].map((scenarioId) => [scenarioId, 0]));
	for (const candidate of Array.isArray(feedbackCandidates) ? feedbackCandidates : []) {
		for (const entry of scopedFeedbackEntries(candidate)) {
			accumulateCheckpointRepairWeight(weights, selectedScenarioIds, entry);
		}
	}
	return weights;
}

function selectedScenarioIdSet(scenarioIds) {
	return new Set(
		(Array.isArray(scenarioIds) ? scenarioIds : [])
			.filter((scenarioId) => typeof scenarioId === "string" && scenarioId.length > 0),
	);
}

function checkpointEntrySeverity(entry) {
	const rejectionReasons = normalizedList(entry?.rejectionReasons);
	return rejectionReasons.length > 0
		? Math.max(...rejectionReasons.map(rejectionReasonPriority))
		: 1;
}

function accumulateCheckpointRepairWeight(weights, selectedScenarioIds, entry) {
	const severity = checkpointEntrySeverity(entry);
	for (const scenarioId of entry.scenarioIds) {
		if (!selectedScenarioIds.has(scenarioId)) {
			continue;
		}
		weights.set(scenarioId, (weights.get(scenarioId) || 0) + severity);
	}
}

function scenarioPriorityWeights(frontierCandidates, scenarioIds, feedbackCandidates = []) {
	const feedbackBonuses = checkpointFeedbackBonuses(feedbackCandidates, scenarioIds);
	const weights = new Map();
	for (const scenarioId of scenarioIds) {
		const scores = frontierCandidates
			.map((candidate) => heldOutScoreForCandidate(candidate, scenarioId))
			.filter((score) => typeof score === "number");
		if (scores.length === 0) {
			weights.set(scenarioId, 1 + (feedbackBonuses.get(scenarioId) || 0));
			continue;
		}
		const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
		weights.set(scenarioId, Math.max(1, 100 - averageScore) + (feedbackBonuses.get(scenarioId) || 0));
	}
	return weights;
}

function groupScenarioStats(candidates, scenarioIds, bestFrontierScores) {
	let coverage = 0;
	let average = 0;
	let weakestScore = Number.POSITIVE_INFINITY;
	for (const scenarioId of scenarioIds) {
		const bestScore = candidates.reduce((score, candidate) => (
			Math.max(score, heldOutScoreForCandidate(candidate, scenarioId) ?? Number.NEGATIVE_INFINITY)
		), Number.NEGATIVE_INFINITY);
		if (bestScore > Number.NEGATIVE_INFINITY && bestScore === (bestFrontierScores.get(scenarioId) ?? Number.NEGATIVE_INFINITY)) {
			coverage += 1;
			weakestScore = Math.min(weakestScore, bestScore);
		}
		average += bestScore;
	}
	return {
		coverage,
		average,
		weakestScore: weakestScore === Number.POSITIVE_INFINITY ? Number.NEGATIVE_INFINITY : weakestScore,
	};
}

function groupCandidateMetrics(candidates, scenarioIds, scenarioWeights, checkpointRepairPriority, bestFrontierScores) {
	const scenarioStats = groupScenarioStats(candidates, scenarioIds, bestFrontierScores);
	const expectedImprovements = candidates.flatMap((candidate) => normalizedList(candidate.expectedImprovements));
	const preservedStrengths = candidates.flatMap((candidate) => normalizedList(candidate.preservedStrengths));
	const riskNotes = candidates.flatMap((candidate) => normalizedList(candidate.riskNotes));
	const checkpointRepairScenarioIds = [...checkpointRepairPriority.entries()]
		.filter(([, weight]) => weight > 0)
		.map(([scenarioId]) => scenarioId);
	return {
		coverage: scenarioStats.coverage,
		weakestScore: scenarioStats.weakestScore,
		checkpointRepairWeight: weightedScenarioMentions(expectedImprovements, scenarioIds, checkpointRepairPriority),
		checkpointRepairCoverage: countScenarioMentions(expectedImprovements, checkpointRepairScenarioIds),
		priorityImprovementWeight: weightedScenarioMentions(expectedImprovements, scenarioIds, scenarioWeights),
		improvementCoverage: countScenarioMentions(expectedImprovements, scenarioIds),
		improvementDiversity: uniqueCount(expectedImprovements),
		strengthCount: uniqueCount(preservedStrengths),
		parentCount: candidates.length,
		priorityRiskPenalty: weightedScenarioMentions(riskNotes, scenarioIds, scenarioWeights),
		riskPenalty: riskNotes.length,
		average: scenarioStats.average,
		totalCostUsd: candidates.reduce((total, candidate) => total + numericTelemetryValue(candidate, "totalCostUsd"), 0),
		totalDurationMs: candidates.reduce((total, candidate) => total + numericTelemetryValue(candidate, "totalDurationMs"), 0),
	};
}

function comparePairMetrics(left, right) {
	for (const [field, direction] of [
		["coverage", "desc"],
		["weakestScore", "desc"],
		["average", "desc"],
		["checkpointRepairWeight", "desc"],
		["checkpointRepairCoverage", "desc"],
		["parentCount", "asc"],
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

function combinationGroups(items, size, startIndex = 0, prefix = [], groups = []) {
	if (prefix.length === size) {
		groups.push(prefix);
		return groups;
	}
	for (let index = startIndex; index <= items.length - (size - prefix.length); index += 1) {
		combinationGroups(items, size, index + 1, [...prefix, items[index]], groups);
	}
	return groups;
}

function compareBestGroup(left, right) {
	if (!left) {
		return right;
	}
	if (!right) {
		return left;
	}
	return comparePairMetrics(left.metrics, right.metrics) >= 0 ? left : right;
}

function bestGroupOfSize(frontierCandidates, size, scenarioIds, scenarioWeights, checkpointRepairPriority, bestFrontierScores) {
	if (frontierCandidates.length < size) {
		return null;
	}
	let best = null;
	for (const group of combinationGroups(frontierCandidates, size)) {
		const metrics = groupCandidateMetrics(group, scenarioIds, scenarioWeights, checkpointRepairPriority, bestFrontierScores);
		best = compareBestGroup(best, { group, metrics });
	}
	return best;
}

function canConsiderThreeParentMerge(boundedMaxParents, threeParentPolicy) {
	return boundedMaxParents >= 3 && threeParentPolicy !== "disabled";
}

function preferredMergeGroup(bestPair, bestTriple, threeParentPolicy) {
	if (!bestPair) {
		return null;
	}
	if (!bestTriple) {
		return bestPair.group;
	}
	if (threeParentPolicy === "coverage_expansion" && bestTriple.metrics.coverage <= bestPair.metrics.coverage) {
		return bestPair.group;
	}
	return comparePairMetrics(bestTriple.metrics, bestPair.metrics) > 0 ? bestTriple.group : bestPair.group;
}

export function selectMergeParents(
	frontierCandidates,
	scenarioIds,
	{ maxParents = 3, threeParentPolicy = "coverage_expansion", feedbackCandidates = [] } = {},
) {
	if (frontierCandidates.length < 2) {
		return null;
	}
	const scenarioWeights = scenarioPriorityWeights(frontierCandidates, scenarioIds, feedbackCandidates);
	const checkpointRepairPriority = checkpointRepairWeights(feedbackCandidates, scenarioIds);
	const bestFrontierScores = frontierBestScores(frontierCandidates, scenarioIds);
	const boundedMaxParents = Math.max(2, Math.min(maxParents, 3, frontierCandidates.length));
	const bestPair = bestGroupOfSize(
		frontierCandidates,
		2,
		scenarioIds,
		scenarioWeights,
		checkpointRepairPriority,
		bestFrontierScores,
	);
	if (!canConsiderThreeParentMerge(boundedMaxParents, threeParentPolicy)) {
		return bestPair?.group || null;
	}
	const bestTriple = bestGroupOfSize(
		frontierCandidates,
		3,
		scenarioIds,
		scenarioWeights,
		checkpointRepairPriority,
		bestFrontierScores,
	);
	return preferredMergeGroup(bestPair, bestTriple, threeParentPolicy);
}
