import { BEHAVIOR_SURFACES, buildBehaviorIntentProfile } from "./behavior-intent.mjs";

function normalizeText(text) {
	return String(text || "").trim().toLowerCase();
}

function slugify(value) {
	return normalizeText(value)
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
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

function toArray(value) {
	return Array.isArray(value) ? value.filter((entry) => typeof entry === "string" && entry.trim()) : [];
}

function displayName(run) {
	return String(run.displayName || run.commandId || run.surfaceId || "").trim();
}

function buildCliEvaluationEvidence(run, title) {
	return {
		sourceKind: "cli_evaluation",
		title,
		surfaceId: run.surfaceId,
		commandId: run.commandId,
		status: run.status,
		observedAt: run.startedAt,
		intent: run.intent,
		summary: run.summary,
		...(run.commandPreview ? { commandPreview: run.commandPreview } : {}),
		...(toArray(run.failureKinds).length > 0 ? { failureKinds: toArray(run.failureKinds) } : {}),
		...(toArray(run.expectationFailures).length > 0 ? { expectationFailures: toArray(run.expectationFailures) } : {}),
		...(Array.isArray(run.artifactRefs) ? { artifactRefs: run.artifactRefs } : {}),
		...(run.telemetry && typeof run.telemetry === "object" ? { telemetry: run.telemetry } : {}),
	};
}

function buildCliIntentProfile(run) {
	return buildBehaviorIntentProfile({
		intent: run.intent,
		intentProfile: run.intentProfile,
		fallbackBehaviorSurface: BEHAVIOR_SURFACES.OPERATOR_CLI,
	});
}

function hasFailureKind(run, patterns) {
	return toArray(run.failureKinds).some((entry) => patterns.includes(entry));
}

function isGuidanceRegression(run) {
	return ["failed", "degraded", "blocked"].includes(run.status) && hasFailureKind(run, [
		"stdout_missing_expected_guidance",
		"stderr_missing_expected_guidance",
		"missing_operator_guidance",
		"ambiguous_next_step",
	]);
}

function isBehaviorContractRegression(run) {
	return ["failed", "degraded", "blocked"].includes(run.status) && hasFailureKind(run, [
		"missing_side_effect",
		"unexpected_side_effect",
		"exit_code_regression",
		"wrong_output_contract",
	]);
}

function buildGuidanceCandidate(run) {
	if (!isGuidanceRegression(run)) {
		return null;
	}
	const name = displayName(run);
	return {
		proposalKey: `cli-${slugify(run.surfaceId)}-${slugify(run.commandId)}-operator-guidance`,
		title: `Refresh ${name} operator guidance scenario`,
		family: "fast_regression",
		intentProfile: buildCliIntentProfile(run),
		name: `${name} Operator Guidance`,
		description: `${name} should explain the next operator action clearly when the command hits the same intent boundary.`,
		brief: `Recent CLI evaluations show operator guidance drift for ${name}. Latest summary: "${run.summary}".`,
		tags: ["cli", "operator-guidance", slugify(run.surfaceId)],
		maxTurns: 1,
		simulatorTurns: [
			`Run ${name} and verify the operator-facing guidance still matches this intent: ${run.intent}`,
		],
		evidence: [buildCliEvaluationEvidence(run, "operator guidance regression")],
	};
}

function buildBehaviorContractCandidate(run) {
	if (!isBehaviorContractRegression(run)) {
		return null;
	}
	const name = displayName(run);
	return {
		proposalKey: `cli-${slugify(run.surfaceId)}-${slugify(run.commandId)}-behavior-contract`,
		title: `Refresh ${name} behavior contract scenario`,
		family: "fast_regression",
		intentProfile: buildCliIntentProfile(run),
		name: `${name} Behavior Contract`,
		description: `${name} should preserve its operator-visible exit, output, and side-effect contract for the same intent.`,
		brief: `Recent CLI evaluations show a behavior-contract regression for ${name}. Latest summary: "${run.summary}".`,
		tags: ["cli", "behavior-contract", slugify(run.surfaceId)],
		maxTurns: 1,
		simulatorTurns: [
			`Run ${name} and verify the output contract and side effects still satisfy this intent: ${run.intent}`,
		],
		evidence: [buildCliEvaluationEvidence(run, "behavior contract regression")],
	};
}

function validateCliRun(run, index) {
	if (!run || typeof run !== "object") {
		throw new Error(`cliRuns[${index}] must be an object`);
	}
	for (const field of ["surfaceId", "commandId", "startedAt", "status", "intent", "summary"]) {
		if (typeof run[field] !== "string" || !run[field].trim()) {
			throw new Error(`cliRuns[${index}].${field} must be a non-empty string`);
		}
	}
}

export function normalizeCliProposalCandidates({ cliRuns = [] }) {
	if (!Array.isArray(cliRuns)) {
		throw new Error("cliRuns must be an array");
	}
	const candidates = [];
	for (const [index, run] of cliRuns.entries()) {
		validateCliRun(run, index);
		candidates.push(buildGuidanceCandidate(run));
		candidates.push(buildBehaviorContractCandidate(run));
	}
	return mergeByProposalKey(candidates);
}
