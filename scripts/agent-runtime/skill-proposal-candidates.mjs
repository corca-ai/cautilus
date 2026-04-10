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

function getDisplayName(run) {
	return String(run.displayName || run.targetId || "").trim();
}

function humanizeTargetKind(targetKind) {
	const labels = {
		public_skill: "Public Skill",
		profile: "Profile",
		integration: "Integration",
		cli_workflow: "CLI Workflow",
	};
	return labels[targetKind] || targetKind.replaceAll("_", " ");
}

function humanizeSurface(surface) {
	return surface.replaceAll("_", " ");
}

function titleCase(text) {
	return String(text || "")
		.split(/\s+/)
		.filter(Boolean)
		.map((part) => `${part[0]?.toUpperCase() || ""}${part.slice(1)}`)
		.join(" ");
}

function humanizeBlocker(blockerKind) {
	return blockerKind ? humanizeSurface(blockerKind) : "the repeated blocker";
}

function buildSkillEvaluationEvidence(run, title) {
	return {
		sourceKind: "skill_evaluation",
		title,
		targetKind: run.targetKind,
		targetId: run.targetId,
		surface: run.surface,
		status: run.status,
		observedAt: run.startedAt,
		summary: run.summary,
		...(run.blockerKind ? { blockerKind: run.blockerKind } : {}),
		...(Array.isArray(run.artifactRefs) ? { artifactRefs: run.artifactRefs } : {}),
		...(run.metrics && typeof run.metrics === "object" ? { metrics: run.metrics } : {}),
	};
}

function buildWorkflowEvidence(run, title) {
	return {
		sourceKind: "workflow_run",
		title,
		targetKind: run.targetKind,
		targetId: run.targetId,
		surface: run.surface,
		status: run.status,
		observedAt: run.startedAt,
		summary: run.summary,
		...(run.blockerKind ? { blockerKind: run.blockerKind } : {}),
		...(Array.isArray(run.blockedSteps) ? { blockedSteps: run.blockedSteps } : {}),
		...(Array.isArray(run.artifactRefs) ? { artifactRefs: run.artifactRefs } : {}),
		...(run.metrics && typeof run.metrics === "object" ? { metrics: run.metrics } : {}),
	};
}

function buildSkillIntentProfile(intent, intentProfile, fallbackBehaviorSurface) {
	return buildBehaviorIntentProfile({
		intent,
		intentProfile,
		fallbackBehaviorSurface,
	});
}

function isSkillValidationRun(run) {
	return ["public_skill", "profile", "integration"].includes(run.targetKind) && ["failed", "degraded"].includes(run.status);
}

function isBlockedWorkflowRun(run) {
	return run.targetKind === "cli_workflow" && ["blocked", "degraded"].includes(run.status);
}

function blockedStepCount(run) {
	if (Array.isArray(run.blockedSteps) && run.blockedSteps.length > 0) {
		return run.blockedSteps.length;
	}
	if (Number.isFinite(run.metrics?.blockedSteps)) {
		return run.metrics.blockedSteps;
	}
	if (Number.isFinite(run.metrics?.blocked_steps)) {
		return run.metrics.blocked_steps;
	}
	return 0;
}

function buildSkillValidationCandidate(run) {
	if (!isSkillValidationRun(run)) {
		return null;
	}
	const displayName = getDisplayName(run);
	const targetLabel = humanizeTargetKind(run.targetKind);
	const surfaceLabel = humanizeSurface(run.surface);
	return {
		proposalKey: `${slugify(run.targetKind)}-${slugify(run.targetId)}-${slugify(run.surface)}-regression`,
		title: `Refresh ${displayName} ${surfaceLabel} validation coverage`,
		family: "fast_regression",
		intentProfile: buildSkillIntentProfile(
			`${displayName} should keep the ${surfaceLabel} validation surface passing.`,
			run.intentProfile,
			BEHAVIOR_SURFACES.SKILL_VALIDATION,
		),
		name: `${displayName} ${titleCase(surfaceLabel)} Regression`,
		description: `${targetLabel} ${displayName} regressed on the ${surfaceLabel} evaluation surface and should keep a durable passing scenario.`,
		brief: `Recent ${surfaceLabel} runs for ${displayName} are ${run.status}. Latest summary: "${run.summary}".`,
		tags: ["skill", "validation", slugify(run.targetKind), slugify(run.surface)],
		maxTurns: 1,
		simulatorTurns: [`Run ${displayName} on the ${surfaceLabel} surface and keep the expected validation bar green.`],
		evidence: [buildSkillEvaluationEvidence(run, `${surfaceLabel} regression`)],
	};
}

function buildWorkflowRecoveryCandidate(run) {
	if (!isBlockedWorkflowRun(run)) {
		return null;
	}
	const displayName = getDisplayName(run);
	const surfaceLabel = humanizeSurface(run.surface);
	const blockerSlug = slugify(run.blockerKind || "blocked-workflow");
	const blockedCount = blockedStepCount(run);
	const blockedCountText = blockedCount > 0 ? `${blockedCount} blocked step(s)` : "a repeated blocked workflow";
	return {
		proposalKey: `${slugify(run.targetKind)}-${slugify(run.targetId)}-${slugify(run.surface)}-${blockerSlug}`,
		title: `Refresh ${displayName} ${surfaceLabel} recovery scenario`,
		family: "fast_regression",
		intentProfile: buildSkillIntentProfile(
			`${displayName} should recover cleanly when the ${surfaceLabel} workflow hits the same blocker.`,
			run.intentProfile,
			BEHAVIOR_SURFACES.OPERATOR_WORKFLOW_RECOVERY,
		),
		name: `${displayName} ${titleCase(surfaceLabel)} Recovery`,
		description: `${displayName} should recover cleanly when the ${surfaceLabel} workflow hits the same operator-facing blocker.`,
		brief: `Recent ${surfaceLabel} runs for ${displayName} were ${run.status} with ${blockedCountText}. Latest summary: "${run.summary}".`,
		tags: ["skill", "workflow", "operator-recovery", slugify(run.surface), blockerSlug],
		maxTurns: 1,
		simulatorTurns: [
			`Re-run ${displayName} on the ${surfaceLabel} surface and verify the workflow can recover from ${humanizeBlocker(run.blockerKind)}.`,
		],
		evidence: [buildWorkflowEvidence(run, `${surfaceLabel} recovery regression`)],
	};
}

function validateEvaluationRun(run, index) {
	if (!run || typeof run !== "object") {
		throw new Error(`evaluationRuns[${index}] must be an object`);
	}
	for (const field of ["targetKind", "targetId", "surface", "startedAt", "status", "summary"]) {
		if (typeof run[field] !== "string" || !run[field].trim()) {
			throw new Error(`evaluationRuns[${index}].${field} must be a non-empty string`);
		}
	}
}

export function normalizeSkillProposalCandidates({ evaluationRuns = [] }) {
	if (!Array.isArray(evaluationRuns)) {
		throw new Error("evaluationRuns must be an array");
	}
	const candidates = [];
	for (const [index, run] of evaluationRuns.entries()) {
		validateEvaluationRun(run, index);
		candidates.push(buildSkillValidationCandidate(run));
		candidates.push(buildWorkflowRecoveryCandidate(run));
	}
	return mergeByProposalKey(candidates);
}
