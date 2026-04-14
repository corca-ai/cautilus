import { BEHAVIOR_DIMENSIONS, BEHAVIOR_SURFACES, buildBehaviorIntentProfile } from "./behavior-intent.mjs";
import {
	getDisplayName,
	humanizeSurface,
	mergeByProposalKey,
	slugify,
	titleCase,
	validateEvaluationRun,
} from "./shared/normalized-run.mjs";

const WORKFLOW_TARGET_KINDS = new Set(["cli_workflow"]);

function humanizeTargetKind(targetKind) {
	const labels = {
		cli_workflow: "CLI Workflow",
	};
	return labels[targetKind] || String(targetKind || "").replaceAll("_", " ");
}

function humanizeBlocker(blockerKind) {
	return blockerKind ? humanizeSurface(blockerKind) : "the repeated blocker";
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

function buildWorkflowIntentProfile(intent, intentProfile, fallbackBehaviorSurface, defaultSuccessDimensions) {
	return buildBehaviorIntentProfile({
		intent,
		intentProfile,
		fallbackBehaviorSurface,
		defaultSuccessDimensions,
	});
}

function isBlockedWorkflowRun(run) {
	return run.targetKind === "cli_workflow" && ["blocked", "degraded"].includes(run.status);
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
		intentProfile: buildWorkflowIntentProfile(
			`${displayName} should recover cleanly when the ${surfaceLabel} workflow hits the same blocker.`,
			run.intentProfile,
			BEHAVIOR_SURFACES.OPERATOR_WORKFLOW_RECOVERY,
			[BEHAVIOR_DIMENSIONS.WORKFLOW_RECOVERY, BEHAVIOR_DIMENSIONS.RECOVERY_NEXT_STEP],
		),
		name: `${displayName} ${titleCase(surfaceLabel)} Recovery`,
		description: `${humanizeTargetKind(run.targetKind)} ${displayName} should recover cleanly when the ${surfaceLabel} workflow hits the same operator-facing blocker.`,
		brief: `Recent ${surfaceLabel} runs for ${displayName} were ${run.status} with ${blockedCountText}. Latest summary: "${run.summary}".`,
		tags: ["workflow", "operator-recovery", slugify(run.surface), blockerSlug],
		maxTurns: 1,
		simulatorTurns: [
			`Re-run ${displayName} on the ${surfaceLabel} surface and verify the workflow can recover from ${humanizeBlocker(run.blockerKind)}.`,
		],
		evidence: [buildWorkflowEvidence(run, `${surfaceLabel} recovery regression`)],
	};
}

function assertWorkflowTargetKind(run, index) {
	if (!WORKFLOW_TARGET_KINDS.has(run.targetKind)) {
		throw new Error(
			`evaluationRuns[${index}].targetKind must be one of ${[...WORKFLOW_TARGET_KINDS].join(", ")} for the workflow archetype`,
		);
	}
}

export function normalizeWorkflowProposalCandidates({ evaluationRuns = [] }) {
	if (!Array.isArray(evaluationRuns)) {
		throw new Error("evaluationRuns must be an array");
	}
	const candidates = [];
	for (const [index, run] of evaluationRuns.entries()) {
		validateEvaluationRun(run, index);
		assertWorkflowTargetKind(run, index);
		candidates.push(buildWorkflowRecoveryCandidate(run));
	}
	return mergeByProposalKey(candidates);
}
