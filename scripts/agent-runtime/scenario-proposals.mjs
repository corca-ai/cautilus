import { DRAFT_SCENARIO_SCHEMA, SCENARIO_PROPOSALS_SCHEMA } from "./contract-versions.mjs";

export { DRAFT_SCENARIO_SCHEMA, SCENARIO_PROPOSALS_SCHEMA } from "./contract-versions.mjs";

const EVIDENCE_SOURCE_KINDS = new Set(["human_conversation", "agent_run", "skill_evaluation", "workflow_run"]);
const EVIDENCE_ORIGINS = new Set(["real", "synthetic", "replayed", "operator_authored"]);
const EVIDENCE_SPLITS = new Set(["proposal", "train", "review"]);
const ACTIVITY_PROVENANCE_FIELDS = new Set(["activityId", "taskKey", "recurrenceKey", "replayId", "split", "score"]);
const ACTIVITY_PROVENANCE_STRING_FIELDS = ["activityId", "taskKey", "recurrenceKey", "replayId"];

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
	return family === "terminal_realism" ? "persona_prompt" : "scripted";
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
			kind: "persona_prompt",
			instructions:
				"You are acting like a real user talking to the candidate runtime. Be concise, goal-oriented, and stop when a real user would wait.",
		};
	}
	return {
		kind: "scripted",
		turns: (candidate.simulatorTurns || []).map((turn) => normalizeTurn(turn, candidate.eventType)),
	};
}

function validateNonEmptyString(value, field) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`${field} must be a non-empty string`);
	}
	return value.trim();
}

function validateEnumValue(value, allowed, field) {
	if (!allowed.has(value)) {
		throw new Error(`${field} must be one of ${[...allowed].join(", ")}`);
	}
}

function validateOptionalEnumValue(value, allowed, field) {
	validateNonEmptyString(value, field);
	validateEnumValue(value, allowed, field);
	return value;
}

function validateActivityProvenanceObject(provenance, field) {
	if (!provenance || typeof provenance !== "object" || Array.isArray(provenance)) {
		throw new Error(`${field} must be an object`);
	}
}

function validateActivityProvenanceFields(provenance, field) {
	for (const key of Object.keys(provenance)) {
		if (!ACTIVITY_PROVENANCE_FIELDS.has(key)) {
			throw new Error(`${field}.${key} is not supported`);
		}
	}
}

function validateActivityProvenanceScore(score, field) {
	if (typeof score !== "number" || !Number.isFinite(score)) {
		throw new Error(`${field}.score must be a number`);
	}
	if (score < 0 || score > 1) {
		throw new Error(`${field}.score must be between 0 and 1`);
	}
}

function validateActivityProvenance(provenance, field) {
	validateActivityProvenanceObject(provenance, field);
	validateActivityProvenanceFields(provenance, field);
	for (const key of ACTIVITY_PROVENANCE_STRING_FIELDS) {
		if (provenance[key] !== undefined) {
			validateNonEmptyString(provenance[key], `${field}.${key}`);
		}
	}
	if (provenance.split !== undefined) {
		validateOptionalEnumValue(provenance.split, EVIDENCE_SPLITS, `${field}.split`);
	}
	if (provenance.score !== undefined) {
		validateActivityProvenanceScore(provenance.score, field);
	}
}

function validateReplayIdentity(origin, replayId, field) {
	if (origin === "replayed" && !replayId) {
		throw new Error(`${field}.activityProvenance.replayId is required when origin is replayed`);
	}
	if (replayId && origin !== "replayed") {
		throw new Error(`${field}.origin must be replayed when activityProvenance.replayId is present`);
	}
}

function validateEvidenceItem(evidence, field) {
	if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
		throw new Error(`${field} must be an object`);
	}
	for (const key of ["sourceKind", "title", "observedAt"]) {
		validateNonEmptyString(evidence[key], `${field}.${key}`);
	}
	validateEnumValue(evidence.sourceKind, EVIDENCE_SOURCE_KINDS, `${field}.sourceKind`);
	let origin;
	if (evidence.origin !== undefined) {
		origin = validateOptionalEnumValue(evidence.origin, EVIDENCE_ORIGINS, `${field}.origin`);
	}
	if (evidence.activityProvenance !== undefined) {
		validateActivityProvenance(evidence.activityProvenance, `${field}.activityProvenance`);
	}
	validateReplayIdentity(origin, evidence.activityProvenance?.replayId, field);
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
	if (candidate.evidence.length === 0) {
		throw new Error(`proposalCandidates[${index}].evidence must contain at least one item`);
	}
	for (const [evidenceIndex, evidence] of candidate.evidence.entries()) {
		validateEvidenceItem(evidence, `proposalCandidates[${index}].evidence[${evidenceIndex}]`);
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
			? { conversation: { userId: "U_AUDIT_REVIEW", channelId: "D_AUDIT_REVIEW", eventType: candidate.eventType } }
			: {}),
	};
}

export function buildScenarioProposal(candidate, existingScenarioKeys, recentCoverage) {
	const scenarioKeyExists = existingScenarioKeys.has(candidate.proposalKey);
	const evidence = sortEvidenceNewestFirst(candidate.evidence);
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
		evidence: evidence.slice(0, 3),
		provenanceSummary: buildProvenanceSummary(evidence),
		draftScenario: buildDraftScenario(candidate, existingScenarioKeys),
	};
}

function incrementCount(counts, key) {
	if (!key) {
		return;
	}
	counts[key] = (counts[key] || 0) + 1;
}

function buildProvenanceSummary(evidence) {
	const originCounts = {};
	const splitCounts = {};
	let replayEvidenceCount = 0;
	let scoredEvidenceCount = 0;
	let maxScore = Number.NEGATIVE_INFINITY;
	for (const item of evidence) {
		incrementCount(originCounts, item.origin);
		const provenance = item.activityProvenance || {};
		incrementCount(splitCounts, provenance.split);
		if (provenance.replayId) {
			replayEvidenceCount += 1;
		}
		if (typeof provenance.score === "number" && Number.isFinite(provenance.score)) {
			scoredEvidenceCount += 1;
			maxScore = Math.max(maxScore, provenance.score);
		}
	}
	return {
		originCounts,
		splitCounts,
		replayEvidenceCount,
		scoredEvidenceCount,
		...(scoredEvidenceCount > 0 ? { maxScore } : {}),
	};
}

function buildProposalTelemetry(mergedCandidates, proposals) {
	return {
		mergedCandidateCount: mergedCandidates.length,
		returnedProposalCount: proposals.length,
	};
}

function buildAttentionReasons(proposal) {
	const reasons = [];
	if (proposal.action === "add_new_scenario") {
		reasons.push("new_scenario");
	}
	if ((proposal.evidence || []).length >= 2) {
		reasons.push("repeated_signal");
	}
	if ((proposal.existingCoverage?.recentResultCount ?? 0) <= 2) {
		reasons.push("low_recent_coverage");
	}
	return reasons;
}

function buildAttentionView(proposals) {
	const reasonCodesByProposalKey = {};
	let matchedRuleCount = 0;
	let proposalKeys = proposals.flatMap((proposal) => {
		const reasons = buildAttentionReasons(proposal);
		if (reasons.length === 0) {
			return [];
		}
		matchedRuleCount += 1;
		reasonCodesByProposalKey[proposal.proposalKey] = reasons;
		return [proposal.proposalKey];
	});
	let fallbackUsed = false;
	if (proposalKeys.length === 0) {
		fallbackUsed = true;
		proposalKeys = proposals.slice(0, 3).map((proposal) => {
			reasonCodesByProposalKey[proposal.proposalKey] = ["top_ranked_fallback"];
			return proposal.proposalKey;
		});
	}
	const truncated = proposalKeys.length > 5;
	return {
		ruleVersion: "v1",
		proposalKeys: proposalKeys.slice(0, 5),
		reasonCodesByProposalKey,
		matchedRuleCount,
		selectedCount: Math.min(proposalKeys.length, 5),
		fallbackUsed,
		truncated,
	};
}

export function generateScenarioProposals({
	proposalCandidates,
	existingScenarioKeys = [],
	recentCoverage = new Map(),
	families = [],
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
	const mergedCandidates = [...merged.values()];
	const proposals = mergedCandidates
		.sort(
			(left, right) =>
				right.evidence.length - left.evidence.length ||
				parseIsoTime(right.evidence[0]?.observedAt) - parseIsoTime(left.evidence[0]?.observedAt),
		)
		.map((candidate) => buildScenarioProposal(candidate, scenarioKeys, coverageMap));
	return {
		schemaVersion: SCENARIO_PROPOSALS_SCHEMA,
		generatedAt: now.toISOString(),
		windowDays,
		families: [...familyFilter],
		proposalTelemetry: buildProposalTelemetry(mergedCandidates, proposals),
		attentionView: buildAttentionView(proposals),
		proposals,
	};
}
