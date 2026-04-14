import assert from "node:assert/strict";
import test from "node:test";

import { BEHAVIOR_DIMENSIONS } from "./behavior-intent.mjs";
import { normalizeWorkflowProposalCandidates } from "./workflow-proposal-candidates.mjs";

test("normalizeWorkflowProposalCandidates emits an operator-recovery candidate for blocked workflow runs", () => {
	const candidates = normalizeWorkflowProposalCandidates({
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
	assert.ok(candidates[0].tags.includes("operator-recovery"));
});

test("normalizeWorkflowProposalCandidates rejects non-cli_workflow inputs", () => {
	assert.throws(
		() =>
			normalizeWorkflowProposalCandidates({
				evaluationRuns: [
					{
						targetKind: "public_skill",
						targetId: "impl",
						displayName: "impl",
						surface: "smoke_scenario",
						startedAt: "2026-04-11T00:00:00.000Z",
						status: "failed",
						summary: "The impl smoke scenario stopped producing a bounded execution plan.",
					},
				],
			}),
		/workflow archetype/,
	);
});

test("normalizeWorkflowProposalCandidates falls back to metrics.blocked_steps when blockedSteps is absent", () => {
	const candidates = normalizeWorkflowProposalCandidates({
		evaluationRuns: [
			{
				targetKind: "cli_workflow",
				targetId: "scan-settings-seed",
				displayName: "Scan Settings Seed",
				surface: "replay_seed",
				startedAt: "2026-04-11T00:00:00.000Z",
				status: "degraded",
				summary: "Replay seed degraded without explicit blockedSteps.",
				metrics: { blocked_steps: 3 },
			},
		],
	});
	assert.equal(candidates.length, 1);
	assert.match(candidates[0].brief, /3 blocked step\(s\)/);
});
