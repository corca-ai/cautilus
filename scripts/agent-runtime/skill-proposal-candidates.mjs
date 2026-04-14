import { BEHAVIOR_DIMENSIONS, BEHAVIOR_SURFACES, buildBehaviorIntentProfile } from "./behavior-intent.mjs";
import {
	getDisplayName,
	humanizeSurface,
	mergeByProposalKey,
	slugify,
	titleCase,
	validateEvaluationRun,
} from "./shared/normalized-run.mjs";

const SKILL_TARGET_KINDS = new Set(["public_skill", "profile", "integration"]);

function humanizeTargetKind(targetKind) {
	const labels = {
		public_skill: "Public Skill",
		profile: "Profile",
		integration: "Integration",
	};
	return labels[targetKind] || String(targetKind || "").replaceAll("_", " ");
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

function buildSkillIntentProfile(intent, intentProfile, fallbackBehaviorSurface, defaultSuccessDimensions) {
	return buildBehaviorIntentProfile({
		intent,
		intentProfile,
		fallbackBehaviorSurface,
		defaultSuccessDimensions,
	});
}

function isSkillValidationRun(run) {
	return SKILL_TARGET_KINDS.has(run.targetKind) && ["failed", "degraded"].includes(run.status);
}

function isSkillTriggerRun(run) {
	return isSkillValidationRun(run) && run.surface === "trigger_selection";
}

function isSkillExecutionRun(run) {
	return isSkillValidationRun(run) && run.surface === "execution_quality";
}

function buildSkillValidationCandidate(run) {
	if (!isSkillValidationRun(run) || isSkillTriggerRun(run) || isSkillExecutionRun(run)) {
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
			[BEHAVIOR_DIMENSIONS.VALIDATION_INTEGRITY],
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

function buildSkillTriggerCandidate(run) {
	if (!isSkillTriggerRun(run)) {
		return null;
	}
	const displayName = getDisplayName(run);
	const targetLabel = humanizeTargetKind(run.targetKind);
	return {
		proposalKey: `${slugify(run.targetKind)}-${slugify(run.targetId)}-trigger-selection-regression`,
		title: `Refresh ${displayName} trigger coverage`,
		family: "fast_regression",
		intentProfile: buildSkillIntentProfile(
			`${displayName} should trigger only when the prompt truly needs the skill.`,
			run.intentProfile,
			BEHAVIOR_SURFACES.SKILL_TRIGGER_SELECTION,
			[BEHAVIOR_DIMENSIONS.SKILL_TRIGGER_ACCURACY],
		),
		name: `${displayName} Trigger Regression`,
		description: `${targetLabel} ${displayName} regressed on skill trigger selection and should keep a durable trigger/no-trigger scenario pair.`,
		brief: `Recent trigger-selection runs for ${displayName} are ${run.status}. Latest summary: "${run.summary}".`,
		tags: ["skill", "trigger", slugify(run.targetKind), "trigger-selection"],
		maxTurns: 1,
		simulatorTurns: [`Run a prompt that should clearly require ${displayName} and verify the skill is selected only on the right prompts.`],
		evidence: [buildSkillEvaluationEvidence(run, "trigger-selection regression")],
	};
}

function buildSkillExecutionCandidate(run) {
	if (!isSkillExecutionRun(run)) {
		return null;
	}
	const displayName = getDisplayName(run);
	const targetLabel = humanizeTargetKind(run.targetKind);
	return {
		proposalKey: `${slugify(run.targetKind)}-${slugify(run.targetId)}-execution-quality-regression`,
		title: `Refresh ${displayName} execution coverage`,
		family: "fast_regression",
		intentProfile: buildSkillIntentProfile(
			`${displayName} should complete the intended task cleanly once the skill is invoked.`,
			run.intentProfile,
			BEHAVIOR_SURFACES.SKILL_EXECUTION_QUALITY,
			[BEHAVIOR_DIMENSIONS.SKILL_TASK_FIDELITY],
		),
		name: `${displayName} Execution Regression`,
		description: `${targetLabel} ${displayName} regressed on execution quality and should keep a durable passing execution scenario.`,
		brief: `Recent execution-quality runs for ${displayName} are ${run.status}. Latest summary: "${run.summary}".`,
		tags: ["skill", "execution", slugify(run.targetKind), "execution-quality"],
		maxTurns: 1,
		simulatorTurns: [`Invoke ${displayName} on one representative task and verify the skill completes the task cleanly within its intended quality bar.`],
		evidence: [buildSkillEvaluationEvidence(run, "execution-quality regression")],
	};
}

function assertSkillTargetKind(run, index) {
	if (!SKILL_TARGET_KINDS.has(run.targetKind)) {
		if (run.targetKind === "cli_workflow") {
			throw new Error(
				`evaluationRuns[${index}].targetKind is "cli_workflow"; this belongs to the workflow archetype. Use \`cautilus scenario normalize workflow\` with the cautilus.workflow_normalization_inputs.v1 schema.`,
			);
		}
		throw new Error(
			`evaluationRuns[${index}].targetKind must be one of ${[...SKILL_TARGET_KINDS].join(", ")} for the skill archetype`,
		);
	}
}

export function normalizeSkillProposalCandidates({ evaluationRuns = [] }) {
	if (!Array.isArray(evaluationRuns)) {
		throw new Error("evaluationRuns must be an array");
	}
	const candidates = [];
	for (const [index, run] of evaluationRuns.entries()) {
		validateEvaluationRun(run, index);
		assertSkillTargetKind(run, index);
		candidates.push(buildSkillTriggerCandidate(run));
		candidates.push(buildSkillExecutionCandidate(run));
		candidates.push(buildSkillValidationCandidate(run));
	}
	return mergeByProposalKey(candidates);
}
