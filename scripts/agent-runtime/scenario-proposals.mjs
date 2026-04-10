import { DRAFT_SCENARIO_SCHEMA, SCENARIO_PROPOSALS_SCHEMA } from "./contract-versions.mjs";

export { DRAFT_SCENARIO_SCHEMA, SCENARIO_PROPOSALS_SCHEMA } from "./contract-versions.mjs";

function parseIsoTime(value) {
	const millis = Date.parse(String(value || ""));
	return Number.isFinite(millis) ? millis : 0;
}

function sortEvidenceNewestFirst(evidence) {
	return [...evidence].sort((left, right) => parseIsoTime(right.observedAt) - parseIsoTime(left.observedAt));
}

function includeFamily(families, family) {
	return families.size === 0 || families.has(family);
}

function recommendedBackends(family) {
	return family === "terminal_realism" ? ["codex_exec", "claude_p"] : ["scripted"];
}

function draftScenarioBackend(family) {
	return family === "terminal_realism" ? "codex_exec" : "scripted";
}

function normalizeTurn(turn, fallbackEventType) {
	if (typeof turn === "string") {
		return {
			text: turn,
			...(fallbackEventType ? { eventType: fallbackEventType } : {}),
		};
	}
	return {
		text: String(turn?.text || "").trim(),
		...(typeof turn?.eventType === "string" ? { eventType: turn.eventType } : {}),
	};
}

function buildSimulator(candidate) {
	if (candidate.family === "terminal_realism") {
		return {
			kind: "codex_exec",
			instructions:
				"You are acting like a real user talking to the candidate runtime. Be concise, goal-oriented, and stop when a real user would wait.",
		};
	}
	return {
		kind: "scripted",
		turns: (candidate.simulatorTurns || []).map((turn) => normalizeTurn(turn, candidate.eventType)),
	};
}

function validateCandidate(candidate, index = 0) {
	if (!candidate || typeof candidate !== "object") {
		throw new Error(`proposalCandidates[${index}] must be an object`);
	}
	for (const field of ["proposalKey", "title", "family", "name", "description", "brief"]) {
		if (typeof candidate[field] !== "string" || !candidate[field].trim()) {
			throw new Error(`proposalCandidates[${index}].${field} must be a non-empty string`);
		}
	}
	if (!Array.isArray(candidate.evidence)) {
		throw new Error(`proposalCandidates[${index}].evidence must be an array`);
	}
}

export function mergeProposalRecord(current, candidate) {
	if (!current) {
		return {
			...candidate,
			evidence: sortEvidenceNewestFirst(candidate.evidence || []),
		};
	}
	return {
		...current,
		evidence: sortEvidenceNewestFirst([...(current.evidence || []), ...(candidate.evidence || [])]),
	};
}

export function buildDraftScenario(candidate, existingScenarioKeys = new Set()) {
	const scenarioId = existingScenarioKeys.has(candidate.proposalKey)
		? `${candidate.proposalKey}--ops-log-refresh`
		: candidate.proposalKey;
	return {
		schemaVersion: DRAFT_SCENARIO_SCHEMA,
		scenarioId,
		name: candidate.name,
		description: candidate.description,
		brief: candidate.brief,
		benchmark: {
			family: candidate.family,
			scenarioKey: candidate.proposalKey,
			backend: draftScenarioBackend(candidate.family),
			tags: candidate.tags || [],
		},
		maxTurns: candidate.maxTurns ?? 3,
		runner: { mode: "live" },
		sideEffectsMode: "shadow",
		simulator: buildSimulator(candidate),
		...(candidate.intentProfile ? { intentProfile: candidate.intentProfile } : {}),
		...(candidate.conversationAuditScenario ? { conversationAuditScenario: candidate.conversationAuditScenario } : {}),
		...(candidate.eventType
			? { conversation: { userId: "U_AUDIT_WORKBENCH", channelId: "D_AUDIT_WORKBENCH", eventType: candidate.eventType } }
			: {}),
	};
}

export function buildScenarioProposal(candidate, existingScenarioKeys, recentCoverage) {
	const scenarioKeyExists = existingScenarioKeys.has(candidate.proposalKey);
	return {
		proposalKey: candidate.proposalKey,
		title: candidate.title,
		action: scenarioKeyExists ? "refresh_existing_scenario" : "add_new_scenario",
		family: candidate.family,
		...(candidate.intentProfile ? { intentProfile: candidate.intentProfile } : {}),
		recommendedBackends: recommendedBackends(candidate.family),
		existingCoverage: {
			scenarioKeyExists,
			recentResultCount: recentCoverage.get(candidate.proposalKey) || 0,
		},
		rationale: `${candidate.evidence.length} recent log match(es) suggested this pattern.`,
		evidence: sortEvidenceNewestFirst(candidate.evidence).slice(0, 3),
		draftScenario: buildDraftScenario(candidate, existingScenarioKeys),
	};
}

export function generateScenarioProposals({
	proposalCandidates,
	existingScenarioKeys = [],
	recentCoverage = new Map(),
	families = [],
	limit = 5,
	windowDays = 14,
	now = new Date(),
}) {
	const familyFilter = families instanceof Set ? families : new Set(families);
	const scenarioKeys = existingScenarioKeys instanceof Set ? existingScenarioKeys : new Set(existingScenarioKeys);
	const coverageMap = recentCoverage instanceof Map ? recentCoverage : new Map(Object.entries(recentCoverage));
	const merged = new Map();
	for (const [index, candidate] of proposalCandidates.entries()) {
		validateCandidate(candidate, index);
		if (!includeFamily(familyFilter, candidate.family)) {
			continue;
		}
		merged.set(candidate.proposalKey, mergeProposalRecord(merged.get(candidate.proposalKey), candidate));
	}
	const proposals = [...merged.values()]
		.sort(
			(left, right) =>
				right.evidence.length - left.evidence.length ||
				parseIsoTime(right.evidence[0]?.observedAt) - parseIsoTime(left.evidence[0]?.observedAt),
		)
		.slice(0, limit)
		.map((candidate) => buildScenarioProposal(candidate, scenarioKeys, coverageMap));
	return {
		schemaVersion: SCENARIO_PROPOSALS_SCHEMA,
		generatedAt: now.toISOString(),
		windowDays,
		families: [...familyFilter],
		proposals,
	};
}
