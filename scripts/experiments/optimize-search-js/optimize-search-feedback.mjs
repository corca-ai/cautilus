function severityRank(value) {
	return value === "blocker" ? 2 : value === "concern" ? 1 : 0;
}

function normalizeScenarioMatchText(value) {
	return String(value)
		.toLowerCase()
		.replace(/[^a-z0-9]+/giu, " ")
		.trim();
}

function checkpointScenarioIds(packet) {
	return [...new Set([
		...(Array.isArray(packet.scenarioSets?.trainScenarioSet) ? packet.scenarioSets.trainScenarioSet : []),
		...(Array.isArray(packet.scenarioSets?.heldOutScenarioSet) ? packet.scenarioSets.heldOutScenarioSet : []),
	])]
		.filter((scenarioId) => typeof scenarioId === "string" && scenarioId.length > 0);
}

function feedbackScenarioIds(message, scenarioIds) {
	if (typeof message !== "string" || message.length === 0) {
		return [];
	}
	const normalized = normalizeScenarioMatchText(message);
	return scenarioIds.filter((scenarioId) => normalized.includes(normalizeScenarioMatchText(scenarioId)));
}

function normalizeCheckpointFeedbackEntries(reviewOutcome) {
	const explicitEntries = Array.isArray(reviewOutcome?.feedbackEntries) ? reviewOutcome.feedbackEntries : [];
	if (explicitEntries.length > 0) {
		return explicitEntries;
	}
	const rejectionReasons = Array.isArray(reviewOutcome?.rejectionReasons) ? reviewOutcome.rejectionReasons : [];
	const fallbackSeverity = rejectionReasons.some((reason) => String(reason).endsWith(":blocker")) ? "blocker" : "concern";
	return (Array.isArray(reviewOutcome?.feedbackMessages) ? reviewOutcome.feedbackMessages : [])
		.filter((message) => typeof message === "string" && message.length > 0)
		.map((message) => ({ message, severity: fallbackSeverity, rejectionReason: rejectionReasons[0] || null }));
}

function collectCheckpointFeedbackBuckets(feedbackEntries, scenarioIds) {
	const feedbackByScenarioId = new Map();
	const genericEntries = [];
	for (const entry of feedbackEntries) {
		const message = entry?.message;
		const matchedScenarioIds = feedbackScenarioIds(message, scenarioIds);
		if (matchedScenarioIds.length === 0) {
			genericEntries.push(entry);
			continue;
		}
		for (const scenarioId of matchedScenarioIds) {
			const entries = feedbackByScenarioId.get(scenarioId) || [];
			entries.push(entry);
			feedbackByScenarioId.set(scenarioId, entries);
		}
	}
	return { feedbackByScenarioId, genericEntries };
}

function checkpointEntrySeverity(entries) {
	const normalized = entries
		.map((entry) => entry?.severity)
		.filter((severity) => typeof severity === "string" && severity.length > 0);
	return normalized.reduce((highest, severity) => (
		severityRank(severity) > severityRank(highest) ? severity : highest
	), "concern");
}

function checkpointEntryReasons(entries, rejectionReasons) {
	const reasons = [...new Set(entries
		.map((entry) => entry?.rejectionReason)
		.filter((reason) => typeof reason === "string" && reason.length > 0))];
	return reasons.length > 0 ? reasons : rejectionReasons;
}

function checkpointEntryMessages(entries) {
	return entries
		.map((entry) => entry?.message)
		.filter((message) => typeof message === "string" && message.length > 0);
}

function scenarioCheckpointEntries(scenarioIds, feedbackByScenarioId, rejectionReasons) {
	return scenarioIds.flatMap((scenarioId) => {
		const entries = feedbackByScenarioId.get(scenarioId) || [];
		if (entries.length === 0) {
			return [];
		}
		return [{
			source: "frontier_promotion_review",
			scope: "scenario",
			scenarioIds: [scenarioId],
			severity: checkpointEntrySeverity(entries),
			rejectionReasons: checkpointEntryReasons(entries, rejectionReasons),
			feedbackMessages: checkpointEntryMessages(entries),
		}];
	});
}

function genericCheckpointEntry(entries, genericEntries, feedbackEntries, rejectionReasons) {
	if (genericEntries.length === 0 && entries.length > 0) {
		return null;
	}
	const sourceEntries = genericEntries.length > 0 ? genericEntries : feedbackEntries;
	return {
		source: "frontier_promotion_review",
		scope: entries.length === 0 ? "candidate" : "generic",
		scenarioIds: [],
		severity: checkpointEntrySeverity(sourceEntries),
		rejectionReasons: checkpointEntryReasons(sourceEntries, rejectionReasons),
		feedbackMessages: checkpointEntryMessages(sourceEntries),
	};
}

export function buildCheckpointFeedback(packet, reviewOutcome) {
	const rejectionReasons = Array.isArray(reviewOutcome?.rejectionReasons) ? reviewOutcome.rejectionReasons : [];
	const feedbackEntries = normalizeCheckpointFeedbackEntries(reviewOutcome);
	const scenarioIds = checkpointScenarioIds(packet);
	const { feedbackByScenarioId, genericEntries } = collectCheckpointFeedbackBuckets(feedbackEntries, scenarioIds);
	const entries = scenarioCheckpointEntries(scenarioIds, feedbackByScenarioId, rejectionReasons);
	const genericEntry = genericCheckpointEntry(entries, genericEntries, feedbackEntries, rejectionReasons);
	if (genericEntry) {
		entries.push(genericEntry);
	}
	return entries;
}
