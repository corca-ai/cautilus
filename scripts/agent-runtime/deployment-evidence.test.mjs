import assert from "node:assert/strict";
import test from "node:test";

import {
	buildDeploymentEvidence,
	prepareDeploymentEvidenceInput,
} from "./deployment-evidence.mjs";

test("prepareDeploymentEvidenceInput extracts repeated skill rows from skill summaries", () => {
	const packet = prepareDeploymentEvidenceInput({
		surface: "skill",
		runtime: "claude",
		sourceKind: "skill_evaluation_summary",
		sourcePath: "/tmp/skill-summary.json",
		packet: {
			schemaVersion: "cautilus.skill_evaluation_summary.v1",
			evaluations: [
				{
					evaluationId: "trigger-demo",
					targetId: "demo",
					displayName: "demo",
					status: "passed",
					metrics: {
						duration_ms: 3000,
						total_tokens: 1000,
						cost_usd: 0.02,
					},
					telemetry: {
						provider: "anthropic",
						model: "claude-sonnet-4-6",
					},
					sampling: {
						sampleCount: 3,
						passCount: 2,
					},
				},
			],
		},
	});
	assert.deepEqual(packet.rows, [
		{
			surface: "skill",
			scenarioId: "trigger-demo",
			scenarioLabel: "demo",
			runtime: "claude",
			sourceKind: "skill_evaluation_summary",
			status: "passed",
			sampleCount: 3,
			successCount: 2,
			successRate: 0.6667,
			sourcePath: "/tmp/skill-summary.json",
			provider: "anthropic",
			model: "claude-sonnet-4-6",
			duration_ms: 3000,
			total_tokens: 1000,
			cost_usd: 0.02,
		},
	]);
});

test("prepareDeploymentEvidenceInput extracts scenario rows with configurable pass statuses", () => {
	const packet = prepareDeploymentEvidenceInput({
		surface: "workflow",
		runtime: "codex",
		sourceKind: "scenario_results",
		packet: {
			schemaVersion: "cautilus.scenario_results.v1",
			results: [
				{
					scenarioId: "workflow-recovery",
					status: "unchanged",
					durationMs: 1200,
					telemetry: {
						provider: "openai",
						model: "gpt-5.4-mini",
						total_tokens: 200,
						cost_usd: 0.01,
					},
				},
			],
		},
		passStatuses: ["passed", "unchanged"],
	});
	assert.equal(packet.rows[0].successCount, 1);
	assert.equal(packet.rows[0].total_tokens, 200);
	assert.equal(packet.rows[0].cost_usd, 0.01);
});

test("buildDeploymentEvidence aggregates rows by surface/runtime/model", () => {
	const evidence = buildDeploymentEvidence({
		schemaVersion: "cautilus.deployment_evidence_inputs.v1",
		rows: [
			{
				surface: "skill",
				scenarioId: "trigger-a",
				runtime: "claude",
				sourceKind: "skill_evaluation_summary",
				status: "passed",
				sampleCount: 2,
				successCount: 2,
				model: "claude-opus-4-7[1m]",
				provider: "anthropic",
				duration_ms: 10000,
				total_tokens: 100000,
				cost_usd: 0.10,
			},
			{
				surface: "skill",
				scenarioId: "execution-a",
				runtime: "claude",
				sourceKind: "skill_evaluation_summary",
				status: "passed",
				sampleCount: 1,
				successCount: 1,
				model: "claude-opus-4-7[1m]",
				provider: "anthropic",
				duration_ms: 20000,
				total_tokens: 50000,
				cost_usd: 0.20,
			},
			{
				surface: "workflow",
				scenarioId: "recovery-a",
				runtime: "codex",
				sourceKind: "scenario_results",
				status: "failed",
				sampleCount: 1,
				successCount: 0,
				model: "gpt-5.4-mini",
				provider: "openai",
				duration_ms: 3000,
			},
		],
	}, { now: new Date("2026-04-17T12:00:00.000Z") });
	assert.equal(evidence.schemaVersion, "cautilus.deployment_evidence.v1");
	assert.equal(evidence.overall.rowCount, 3);
	assert.equal(evidence.overall.totalSamples, 4);
	assert.equal(evidence.overall.successfulSamples, 3);
	assert.equal(evidence.overall.successRate, 0.75);
	assert.deepEqual(evidence.overall.runtimes, ["claude", "codex"]);
	assert.equal(evidence.summaries.length, 2);
	assert.deepEqual(evidence.summaries[0], {
		surface: "skill",
		runtime: "claude",
		provider: "anthropic",
		model: "claude-opus-4-7[1m]",
		rowCount: 2,
		scenarioCount: 2,
		totalSamples: 3,
		successfulSamples: 3,
		successRate: 1,
		statusCounts: {
			passed: 2,
		},
		sourceKinds: ["skill_evaluation_summary"],
		p50_duration_ms: 15000,
		p90_duration_ms: 19000,
		p50_total_tokens: 75000,
		p90_total_tokens: 95000,
		p50_cost_usd: 0.15,
		p90_cost_usd: 0.19,
	});
});
