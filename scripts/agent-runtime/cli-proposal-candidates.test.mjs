import assert from "node:assert/strict";
import test from "node:test";

import { BEHAVIOR_DIMENSIONS } from "./behavior-intent.mjs";
import { normalizeCliProposalCandidates } from "./cli-proposal-candidates.mjs";

test("normalizeCliProposalCandidates emits an operator-guidance candidate for repeated CLI guidance drift", () => {
	const candidates = normalizeCliProposalCandidates({
		cliRuns: [
			{
				surfaceId: "doctor_missing_adapter",
				commandId: "doctor-no-adapter",
				displayName: "cautilus doctor",
				startedAt: "2026-04-11T00:00:00.000Z",
				status: "failed",
				intent: "Explain how to add the official adapter when none is present.",
				summary: "The command no longer mentioned adapter init or the official adapter path.",
				failureKinds: ["stdout_missing_expected_guidance", "ambiguous_next_step"],
				expectationFailures: ["stdoutContains: adapter init"],
			},
		],
	});
	assert.equal(candidates.length, 1);
	assert.equal(candidates[0].proposalKey, "cli-doctor-missing-adapter-doctor-no-adapter-operator-guidance");
	assert.equal(candidates[0].family, "fast_regression");
	assert.equal(candidates[0].intentProfile.intentId, "intent-explain-how-to-add-the-official-adapter-when-none-is-present");
	assert.equal(candidates[0].intentProfile.behaviorSurface, "operator_cli");
	assert.deepEqual(
		candidates[0].intentProfile.successDimensions.map((entry) => entry.id),
		[BEHAVIOR_DIMENSIONS.OPERATOR_GUIDANCE_CLARITY, BEHAVIOR_DIMENSIONS.RECOVERY_NEXT_STEP],
	);
	assert.equal(candidates[0].evidence[0].sourceKind, "cli_evaluation");
});

test("normalizeCliProposalCandidates emits a behavior-contract candidate for missing side effects", () => {
	const candidates = normalizeCliProposalCandidates({
		cliRuns: [
			{
				surfaceId: "adapter_init_scaffold",
				commandId: "adapter-init-default",
				displayName: "cautilus adapter init",
				startedAt: "2026-04-11T01:00:00.000Z",
				status: "failed",
				intent: "Scaffold the official adapter in the default .agents location.",
				summary: "The command exited 0 but did not create .agents/cautilus-adapter.yaml.",
				failureKinds: ["missing_side_effect"],
				expectationFailures: ["filesExist: .agents/cautilus-adapter.yaml"],
			},
		],
	});
	assert.equal(candidates.length, 1);
	assert.equal(candidates[0].proposalKey, "cli-adapter-init-scaffold-adapter-init-default-behavior-contract");
	assert.equal(candidates[0].intentProfile.intentId, "intent-scaffold-the-official-adapter-in-the-default-agents-location");
	assert.deepEqual(candidates[0].intentProfile.successDimensions.map((entry) => entry.id), [
		BEHAVIOR_DIMENSIONS.CONTRACT_INTEGRITY,
	]);
	assert.ok(candidates[0].tags.includes("behavior-contract"));
});

test("normalizeCliProposalCandidates merges duplicate proposal keys and keeps newest evidence first", () => {
	const candidates = normalizeCliProposalCandidates({
		cliRuns: [
			{
				surfaceId: "doctor_missing_adapter",
				commandId: "doctor-no-adapter",
				displayName: "cautilus doctor",
				startedAt: "2026-04-10T00:00:00.000Z",
				status: "failed",
				intent: "Explain how to add the official adapter when none is present.",
				summary: "Older guidance drift.",
				failureKinds: ["missing_operator_guidance"],
			},
			{
				surfaceId: "doctor_missing_adapter",
				commandId: "doctor-no-adapter",
				displayName: "cautilus doctor",
				startedAt: "2026-04-11T00:00:00.000Z",
				status: "failed",
				intent: "Explain how to add the official adapter when none is present.",
				summary: "Newer guidance drift.",
				failureKinds: ["stdout_missing_expected_guidance"],
			},
		],
	});
	assert.equal(candidates.length, 1);
	assert.equal(candidates[0].evidence.length, 2);
	assert.equal(candidates[0].intentProfile.intentId, "intent-explain-how-to-add-the-official-adapter-when-none-is-present");
	assert.equal(candidates[0].evidence[0].summary, "Newer guidance drift.");
});
