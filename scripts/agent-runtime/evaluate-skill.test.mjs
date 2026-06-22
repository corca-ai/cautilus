import assert from "node:assert/strict";
import test from "node:test";

import { BEHAVIOR_DIMENSIONS } from "./behavior-intent.mjs";
import { buildSkillEvaluationSummary } from "./evaluate-skill.mjs";

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

test("buildSkillEvaluationSummary supports cache-excluded token thresholds", () => {
	const summary = buildSkillEvaluationSummary(
		{
			schemaVersion: "cautilus.skill_evaluation_inputs.v1",
			skillId: "impl",
			evaluations: [
				{
					evaluationId: "exec-cache-heavy",
					targetKind: "public_skill",
					targetId: "impl",
					displayName: "impl",
					evaluationKind: "execution",
					prompt: "Apply one bounded implementation slice and verify it.",
					startedAt: "2026-06-22T00:00:00.000Z",
					invoked: true,
					outcome: "passed",
					summary: "The skill completed the task.",
					metrics: {
						total_tokens: 9000,
						median_run_uncached_tokens: 300,
						peak_run_uncached_tokens: 1200,
						duration_ms: 1200,
					},
					telemetry: {
						cache_read_input_tokens: 8500,
					},
					thresholds: {
						max_uncached_tokens: 400,
						max_median_run_uncached_tokens: 200,
						max_peak_run_uncached_tokens: 1000,
					},
				},
			],
		},
		"2026-06-22T00:30:00.000Z",
	);
	assert.equal(summary.recommendation, "defer");
	assert.equal(summary.evaluationCounts.degraded, 1);
	assert.deepEqual(summary.evaluations[0].thresholdFindings, [
		{
			metric: "uncached_tokens",
			actual: 500,
			limit: 400,
		},
		{
			metric: "median_run_uncached_tokens",
			actual: 300,
			limit: 200,
		},
		{
			metric: "peak_run_uncached_tokens",
			actual: 1200,
			limit: 1000,
		},
	]);
});

test("buildSkillEvaluationSummary does not reuse candidate telemetry for baseline thresholds", () => {
	const summary = buildSkillEvaluationSummary(
		{
			schemaVersion: "cautilus.skill_evaluation_inputs.v1",
			skillId: "impl",
			evaluations: [
				{
					evaluationId: "exec-baseline-cache-heavy",
					targetKind: "public_skill",
					targetId: "impl",
					displayName: "impl",
					evaluationKind: "execution",
					prompt: "Apply one bounded implementation slice and verify it.",
					startedAt: "2026-06-22T00:00:00.000Z",
					invoked: true,
					outcome: "passed",
					summary: "The skill completed the task.",
					metrics: {
						total_tokens: 9000,
					},
					telemetry: {
						cache_read_input_tokens: 8600,
					},
					thresholds: {
						max_uncached_tokens: 500,
					},
					baseline: {
						invoked: true,
						outcome: "passed",
						metrics: {
							total_tokens: 9000,
						},
					},
				},
			],
		},
		"2026-06-22T00:30:00.000Z",
	);
	assert.equal(summary.evaluations[0].status, "passed");
	assert.equal(summary.evaluations[0].baselineComparison.baselineStatus, "degraded");
	assert.equal(summary.evaluations[0].baselineComparison.relativeStatus, "better");
});

test("buildSkillEvaluationSummary preserves explicit baseline uncached metrics", () => {
	const summary = buildSkillEvaluationSummary(
		{
			schemaVersion: "cautilus.skill_evaluation_inputs.v1",
			skillId: "impl",
			evaluations: [
				{
					evaluationId: "exec-baseline-explicit-uncached",
					targetKind: "public_skill",
					targetId: "impl",
					displayName: "impl",
					evaluationKind: "execution",
					prompt: "Apply one bounded implementation slice and verify it.",
					startedAt: "2026-06-22T00:00:00.000Z",
					invoked: true,
					outcome: "passed",
					summary: "The skill completed the task.",
					metrics: {
						total_tokens: 1000,
						uncached_tokens: 100,
						median_run_uncached_tokens: 100,
						peak_run_uncached_tokens: 100,
					},
					thresholds: {
						max_uncached_tokens: 950,
						max_median_run_uncached_tokens: 950,
						max_peak_run_uncached_tokens: 950,
					},
					baseline: {
						invoked: true,
						outcome: "passed",
						metrics: {
							total_tokens: 1000,
							uncached_tokens: 900,
							median_run_uncached_tokens: 900,
							peak_run_uncached_tokens: 900,
						},
					},
				},
			],
		},
		"2026-06-22T00:30:00.000Z",
	);
	assert.equal(summary.evaluations[0].status, "passed");
	assert.equal(summary.evaluations[0].baselineComparison.baselineStatus, "passed");
	assert.deepEqual(summary.evaluations[0].baselineComparison.metricDeltas, {
		total_tokens: 0,
		uncached_tokens: -800,
		median_run_uncached_tokens: -800,
		peak_run_uncached_tokens: -800,
	});
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

test("buildSkillEvaluationSummary preserves telemetry metadata for downstream reporting", () => {
	const summary = buildSkillEvaluationSummary(
		{
			schemaVersion: "cautilus.skill_evaluation_inputs.v1",
			skillId: "impl",
			evaluations: [
				{
					evaluationId: "exec-telemetry",
					targetKind: "public_skill",
					targetId: "impl",
					displayName: "impl",
					evaluationKind: "execution",
					prompt: "Apply one bounded implementation slice and verify it.",
					startedAt: "2026-04-14T00:00:00.000Z",
					invoked: true,
					outcome: "passed",
					summary: "The skill completed the task.",
					metrics: {
						total_tokens: 700,
						duration_ms: 1800,
						cost_usd: 0.01,
					},
					telemetry: {
						provider: "anthropic",
						model: "claude-sonnet-4-6",
						session_mode: "persistent",
						uncached_input_tokens: 300,
						cache_creation_input_tokens: 100,
						cache_read_input_tokens: 100,
						prompt_tokens: 500,
						output_tokens: 200,
						completion_tokens: 200,
						total_tokens: 700,
						cost_usd: 0.01,
					},
				},
			],
		},
		"2026-04-14T01:00:00.000Z",
	);
	assert.deepEqual(summary.evaluations[0].telemetry, {
		provider: "anthropic",
		model: "claude-sonnet-4-6",
		session_mode: "persistent",
		uncached_input_tokens: 300,
		cache_creation_input_tokens: 100,
		cache_read_input_tokens: 100,
		prompt_tokens: 500,
		output_tokens: 200,
		completion_tokens: 200,
		total_tokens: 700,
		cost_usd: 0.01,
	});
	assert.deepEqual(summary.evaluationRuns[0].telemetry, {
		provider: "anthropic",
		model: "claude-sonnet-4-6",
		session_mode: "persistent",
		uncached_input_tokens: 300,
		cache_creation_input_tokens: 100,
		cache_read_input_tokens: 100,
		prompt_tokens: 500,
		output_tokens: 200,
		completion_tokens: 200,
		total_tokens: 700,
		cost_usd: 0.01,
	});
});
