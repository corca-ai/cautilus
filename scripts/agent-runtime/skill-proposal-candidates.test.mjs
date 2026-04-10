import assert from "node:assert/strict";
import test from "node:test";

import { BEHAVIOR_DIMENSIONS } from "./behavior-intent.mjs";
import { normalizeSkillProposalCandidates } from "./skill-proposal-candidates.mjs";

test("normalizeSkillProposalCandidates emits a deterministic regression candidate for failed public-skill smoke runs", () => {
	const candidates = normalizeSkillProposalCandidates({
		evaluationRuns: [
			{
				targetKind: "public_skill",
				targetId: "impl",
				displayName: "impl",
				surface: "smoke_scenario",
				startedAt: "2026-04-11T00:00:00.000Z",
				status: "failed",
				summary: "The impl smoke scenario stopped producing a bounded execution plan.",
				artifactRefs: [{ kind: "eval_fixture", path: "evals/fixtures/impl-smoke.json" }],
			},
		],
	});
	assert.equal(candidates.length, 1);
	assert.equal(candidates[0].proposalKey, "public-skill-impl-smoke-scenario-regression");
	assert.equal(candidates[0].family, "fast_regression");
	assert.equal(candidates[0].intentProfile.behaviorSurface, "skill_validation");
	assert.equal(candidates[0].intentProfile.successDimensions[0].id, BEHAVIOR_DIMENSIONS.VALIDATION_INTEGRITY);
	assert.equal(candidates[0].evidence[0].sourceKind, "skill_evaluation");
});

test("normalizeSkillProposalCandidates emits an operator-recovery candidate for blocked workflow runs", () => {
	const candidates = normalizeSkillProposalCandidates({
		evaluationRuns: [
			{
				targetKind: "cli_workflow",
				targetId: "scan-settings-seed",
				displayName: "Scan Settings Seed",
				surface: "replay_seed",
				startedAt: "2026-04-11T00:00:00.000Z",
				status: "blocked",
				summary: "Replay seed stalled on the same settings screen after two retries.",
				blockerKind: "repeated_screen_no_progress",
				blockedSteps: ["open_settings", "open_settings"],
				metrics: { blocked_steps: 2, unique_states_discovered: 4 },
			},
		],
	});
	assert.equal(candidates.length, 1);
	assert.equal(candidates[0].proposalKey, "cli-workflow-scan-settings-seed-replay-seed-repeated-screen-no-progress");
	assert.equal(candidates[0].intentProfile.behaviorSurface, "operator_workflow_recovery");
	assert.deepEqual(
		candidates[0].intentProfile.successDimensions.map((entry) => entry.id),
		[BEHAVIOR_DIMENSIONS.WORKFLOW_RECOVERY, BEHAVIOR_DIMENSIONS.RECOVERY_NEXT_STEP],
	);
	assert.match(candidates[0].brief, /2 blocked step\(s\)/);
	assert.equal(candidates[0].evidence[0].sourceKind, "workflow_run");
});

test("normalizeSkillProposalCandidates merges duplicate proposal keys and keeps newest evidence first", () => {
	const candidates = normalizeSkillProposalCandidates({
		evaluationRuns: [
			{
				targetKind: "public_skill",
				targetId: "impl",
				displayName: "impl",
				surface: "smoke_scenario",
				startedAt: "2026-04-10T00:00:00.000Z",
				status: "failed",
				summary: "Older failure.",
			},
			{
				targetKind: "public_skill",
				targetId: "impl",
				displayName: "impl",
				surface: "smoke_scenario",
				startedAt: "2026-04-11T00:00:00.000Z",
				status: "failed",
				summary: "Newer failure.",
			},
		],
	});
	assert.equal(candidates.length, 1);
	assert.equal(candidates[0].evidence.length, 2);
	assert.equal(candidates[0].intentProfile.behaviorSurface, "skill_validation");
	assert.equal(candidates[0].evidence[0].summary, "Newer failure.");
});
