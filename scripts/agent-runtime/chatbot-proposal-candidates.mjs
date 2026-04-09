function normalizeText(text) {
	return String(text || "").trim().toLowerCase();
}

function includesAny(text, patterns) {
	const normalized = normalizeText(text);
	return patterns.some((pattern) => pattern.test(normalized));
}

function parseIsoTime(value) {
	const millis = Date.parse(String(value || ""));
	return Number.isFinite(millis) ? millis : 0;
}

function sortEvidenceNewestFirst(evidence) {
	return [...evidence].sort((left, right) => parseIsoTime(right.observedAt) - parseIsoTime(left.observedAt));
}

function mergeByProposalKey(candidates) {
	const merged = new Map();
	for (const candidate of candidates) {
		if (!candidate) {
			continue;
		}
		const current = merged.get(candidate.proposalKey);
		merged.set(
			candidate.proposalKey,
			current
				? {
						...current,
						evidence: sortEvidenceNewestFirst([...(current.evidence || []), ...(candidate.evidence || [])]),
					}
				: {
						...candidate,
						evidence: sortEvidenceNewestFirst(candidate.evidence || []),
					},
		);
	}
	return [...merged.values()];
}

function getUserMessageTexts(conversation) {
	return (conversation.records || [])
		.filter((record) => record?.actorKind === "user" && typeof record?.text === "string")
		.map((record) => record.text.trim())
		.filter(Boolean);
}

function isEventTriggered(conversation) {
	return (conversation.records || []).some((record) => record?.eventType === "app_mention");
}

function buildHumanEvidence(conversation, title, matchedTurns) {
	return {
		sourceKind: "human_conversation",
		title,
		threadKey: conversation.threadKey,
		observedAt: conversation.lastObservedAt,
		messages: matchedTurns,
	};
}

function buildRunEvidence(summary, title) {
	return {
		sourceKind: "agent_run",
		title,
		runId: summary.runId,
		threadKey: summary.threadKey,
		observedAt: summary.startedAt,
		textPreview: summary.textPreview || "",
		blockedReason: summary.blockedReason || null,
	};
}

function buildReviewClarificationCandidate(conversation, userMessages) {
	if (userMessages.length < 2) {
		return null;
	}
	if (!includesAny(userMessages[0], [/\breview\b/, /리뷰/, /저장소/, /\brepo\b/])) {
		return null;
	}
	if (!includesAny(userMessages[1], [/checkout/, /현재/, /기준/, /ceal/, /저장소/, /\brepo\b/])) {
		return null;
	}
	return {
		proposalKey: "repo-review-needs-target-clarification",
		title: "Refresh repo review clarification scenario from recent operator logs",
		family: "fast_regression",
		name: "Repo Review Needs Target Clarification",
		description: "A broad review request is followed by one concrete repo-target clarification.",
		brief: `Recent operator logs show a broad review ask followed by a repo-target clarification: first "${userMessages[0]}", then "${userMessages[1]}".`,
		tags: ["operational-log", "clarification", "review"],
		maxTurns: 3,
		simulatorTurns: userMessages.slice(0, 2),
		evidence: [buildHumanEvidence(conversation, "review clarification", userMessages.slice(0, 2))],
	};
}

function buildEventTriggeredFollowupCandidate(conversation, userMessages) {
	if (!isEventTriggered(conversation) || userMessages.length < 2) {
		return null;
	}
	if (!includesAny(userMessages[1], [/계속/, /follow/, /이어/, /진행/, /다음/, /go ahead/, /continue/])) {
		return null;
	}
	return {
		proposalKey: "event-triggered-followup",
		title: "Refresh event-triggered follow-up scenario from recent operator logs",
		family: "fast_regression",
		name: "Event Triggered Follow-Up",
		description: "An app mention wakes the assistant and the user continues with a plain follow-up in the same active thread.",
		brief: `Recent operator logs show an app-mention wake-up followed by a plain thread follow-up: "${userMessages[0]}" then "${userMessages[1]}".`,
		tags: ["operational-log", "event-triggered", "followup"],
		maxTurns: 3,
		simulatorTurns: [{ text: userMessages[0], eventType: "app_mention" }, { text: userMessages[1] }],
		evidence: [buildHumanEvidence(conversation, "event-triggered follow-up", userMessages.slice(0, 2))],
	};
}

function buildAmbiguousConfirmationCandidate(summary) {
	if (summary.blockedReason !== "ambiguous_confirmation_without_thread_context") {
		return null;
	}
	const preview = summary.textPreview || "좋아요, 진행해주세요.";
	return {
		proposalKey: "ambiguous-confirmation-needs-context",
		title: "Add ambiguous confirmation without thread context scenario",
		family: "fast_regression",
		name: "Ambiguous Confirmation Needs Context",
		description: "A bare confirmation without thread context should trigger one clarification instead of blind execution.",
		brief: `Recent agent runs were blocked by ambiguous confirmations without thread context. One example message was "${preview}".`,
		tags: ["operational-log", "blocked", "clarification"],
		maxTurns: 2,
		simulatorTurns: [preview],
		evidence: [buildRunEvidence(summary, "ambiguous confirmation blocked run")],
	};
}

function validateConversation(conversation, index) {
	if (!conversation || typeof conversation !== "object") {
		throw new Error(`conversationSummaries[${index}] must be an object`);
	}
	if (typeof conversation.threadKey !== "string" || !conversation.threadKey.trim()) {
		throw new Error(`conversationSummaries[${index}].threadKey must be a non-empty string`);
	}
	if (!Array.isArray(conversation.records)) {
		throw new Error(`conversationSummaries[${index}].records must be an array`);
	}
}

function validateRunSummary(summary, index) {
	if (!summary || typeof summary !== "object") {
		throw new Error(`runSummaries[${index}] must be an object`);
	}
	if (typeof summary.runId !== "string" || !summary.runId.trim()) {
		throw new Error(`runSummaries[${index}].runId must be a non-empty string`);
	}
	if (typeof summary.threadKey !== "string" || !summary.threadKey.trim()) {
		throw new Error(`runSummaries[${index}].threadKey must be a non-empty string`);
	}
}

export function normalizeChatbotProposalCandidates({ conversationSummaries = [], runSummaries = [] }) {
	if (!Array.isArray(conversationSummaries)) {
		throw new Error("conversationSummaries must be an array");
	}
	if (!Array.isArray(runSummaries)) {
		throw new Error("runSummaries must be an array");
	}
	const candidates = [];
	for (const [index, conversation] of conversationSummaries.entries()) {
		validateConversation(conversation, index);
		const userMessages = getUserMessageTexts(conversation);
		candidates.push(buildReviewClarificationCandidate(conversation, userMessages));
		candidates.push(buildEventTriggeredFollowupCandidate(conversation, userMessages));
	}
	for (const [index, summary] of runSummaries.entries()) {
		validateRunSummary(summary, index);
		candidates.push(buildAmbiguousConfirmationCandidate(summary));
	}
	return mergeByProposalKey(candidates);
}
