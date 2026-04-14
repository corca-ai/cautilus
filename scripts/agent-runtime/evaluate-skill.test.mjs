import assert from "node:assert/strict";
import test from "node:test";

import { BEHAVIOR_DIMENSIONS } from "./behavior-intent.mjs";
import { buildSkillEvaluationSummary } from "./evaluate-skill.mjs";
import { buildSkillProposalCandidates } from "./normalize-skill-proposals.mjs";

test("buildSkillEvaluationSummary rejects trigger mismatches and emits normalized evaluation runs", () => {
	const summary = buildSkillEvaluationSummary(
		{
			schemaVersion: "cautilus.skill_evaluation_inputs.v1",
			skillId: "impl",
			evaluations: [
				{
					evaluationId: "trigger-1",
					targetKind: "public_skill",
					targetId: "impl",
					displayName: "impl",
					evaluationKind: "trigger",
					prompt: "Please implement a bounded repo-local quality slice.",
					startedAt: "2026-04-14T00:00:00.000Z",
					expectedTrigger: "must_invoke",
					invoked: false,
					summary: "The prompt clearly matched the impl skill surface.",
				},
			],
		},
		"2026-04-14T01:00:00.000Z",
	);
	assert.equal(summary.recommendation, "reject");
	assert.equal(summary.evaluationCounts.failed, 1);
	assert.equal(summary.evaluationCounts.unstable, 0);
	assert.equal(summary.evaluationRuns[0].surface, "trigger_selection");
	assert.equal(summary.evaluationRuns[0].intentProfile.behaviorSurface, "skill_trigger_selection");
	assert.equal(
		summary.evaluationRuns[0].intentProfile.successDimensions[0].id,
		BEHAVIOR_DIMENSIONS.SKILL_TRIGGER_ACCURACY,
	);
});

test("buildSkillEvaluationSummary degrades execution runs that exceed declared runtime budgets", () => {
	const summary = buildSkillEvaluationSummary(
		{
			schemaVersion: "cautilus.skill_evaluation_inputs.v1",
			skillId: "impl",
			evaluations: [
				{
					evaluationId: "exec-1",
					targetKind: "public_skill",
					targetId: "impl",
					displayName: "impl",
					evaluationKind: "execution",
					prompt: "Apply one bounded implementation slice and verify it.",
					startedAt: "2026-04-14T00:00:00.000Z",
					invoked: true,
					outcome: "passed",
					summary: "The skill completed the task, but the run was noticeably slower than expected.",
					metrics: {
						total_tokens: 1400,
						duration_ms: 4200,
					},
					thresholds: {
						max_total_tokens: 1000,
						max_duration_ms: 3000,
					},
				},
			],
		},
		"2026-04-14T01:00:00.000Z",
	);
	assert.equal(summary.recommendation, "defer");
	assert.equal(summary.evaluationCounts.degraded, 1);
	assert.equal(summary.evaluationCounts.unstable, 0);
	assert.equal(summary.evaluations[0].surface, "execution_quality");
	assert.equal(summary.evaluations[0].thresholdFindings.length, 2);
	assert.equal(summary.evaluationRuns[0].intentProfile.behaviorSurface, "skill_execution_quality");
	assert.deepEqual(
		summary.evaluationRuns[0].intentProfile.successDimensions.map((entry) => entry.id),
		[BEHAVIOR_DIMENSIONS.SKILL_TASK_FIDELITY, BEHAVIOR_DIMENSIONS.RUNTIME_BUDGET_RESPECT],
	);
});

test("skill evaluation summary chains directly into skill proposal normalization", () => {
	const summary = buildSkillEvaluationSummary(
		{
			schemaVersion: "cautilus.skill_evaluation_inputs.v1",
			skillId: "impl",
			evaluations: [
				{
					evaluationId: "trigger-1",
					targetKind: "public_skill",
					targetId: "impl",
					displayName: "impl",
					evaluationKind: "trigger",
					prompt: "Please implement a bounded repo-local quality slice.",
					startedAt: "2026-04-14T00:00:00.000Z",
					expectedTrigger: "must_invoke",
					invoked: false,
					summary: "The prompt clearly matched the impl skill surface.",
				},
				{
					evaluationId: "exec-1",
					targetKind: "public_skill",
					targetId: "impl",
					displayName: "impl",
					evaluationKind: "execution",
					prompt: "Apply the bounded change and verify it.",
					startedAt: "2026-04-14T00:05:00.000Z",
					invoked: true,
					outcome: "failed",
					summary: "The skill produced an incomplete implementation plan.",
				},
			],
		},
		"2026-04-14T01:00:00.000Z",
	);
	const candidates = buildSkillProposalCandidates(summary);
	assert.equal(candidates.length, 2);
	assert.deepEqual(
		candidates.map((entry) => entry.proposalKey).sort(),
		["public-skill-impl-execution-quality-regression", "public-skill-impl-trigger-selection-regression"],
	);
});

test("buildSkillEvaluationSummary surfaces sampling stability and baseline comparisons", () => {
	const summary = buildSkillEvaluationSummary(
		{
			schemaVersion: "cautilus.skill_evaluation_inputs.v1",
			skillId: "impl",
			evaluations: [
				{
					evaluationId: "trigger-sampled",
					targetKind: "public_skill",
					targetId: "impl",
					displayName: "impl",
					evaluationKind: "trigger",
					prompt: "Please implement a bounded repo-local quality slice.",
					startedAt: "2026-04-14T00:00:00.000Z",
					expectedTrigger: "must_invoke",
					invoked: true,
					summary: "Trigger consensus matched must_invoke in 2/3 runs.",
					sampling: {
						sampleCount: 3,
						consensusCount: 2,
						matchingCount: 2,
						invokedCount: 2,
						stable: false,
					},
					baseline: {
						invoked: true,
					},
				},
			],
		},
		"2026-04-14T01:00:00.000Z",
	);
	assert.equal(summary.recommendation, "defer");
	assert.equal(summary.evaluationCounts.unstable, 1);
	assert.equal(summary.samplingSummary.totalSamples, 3);
	assert.equal(summary.samplingSummary.overallConsensusRate, 0.6667);
	assert.equal(summary.evaluations[0].sampling.passRate, 0.6667);
	assert.equal(summary.evaluations[0].sampling.unstable, true);
	assert.equal(summary.comparisonSummary.sameAsBaseline, 1);
	assert.equal(summary.evaluations[0].baselineComparison.relativeStatus, "same");
});
