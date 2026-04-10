import assert from "node:assert/strict";
import test from "node:test";

import {
	SCENARIO_TELEMETRY_SUMMARY_SCHEMA,
	summarizeScenarioTelemetryEntries,
	summarizeScenarioTelemetryFromHistory,
} from "./scenario-result-telemetry.mjs";

test("summarizeScenarioTelemetryEntries aggregates telemetry per scenario", () => {
	const summary = summarizeScenarioTelemetryEntries([
		{
			scenarioId: "alpha",
			timestamp: "2026-04-10T10:00:00.000Z",
			durationMs: 100,
			telemetry: {
				provider: "openai",
				model: "gpt-5.4",
				total_tokens: 100,
				cost_usd: 0.01,
			},
		},
		{
			scenarioId: "alpha",
			timestamp: "2026-04-10T10:05:00.000Z",
			durationMs: 120,
			telemetry: {
				provider: "openai",
				model: "gpt-5.4",
				total_tokens: 120,
				cost_usd: 0.012,
			},
		},
		{
			scenarioId: "beta",
			timestamp: "2026-04-10T10:10:00.000Z",
			durationMs: 80,
			telemetry: {
				provider: "anthropic",
				model: "claude-3.7",
				total_tokens: 90,
				cost_usd: 0.02,
			},
		},
	]);
	assert.equal(summary.schemaVersion, SCENARIO_TELEMETRY_SUMMARY_SCHEMA);
	assert.equal(summary.overall.scenarioCount, 2);
	assert.equal(summary.overall.runCount, 3);
	assert.equal(summary.overall.total_tokens, 310);
	assert.equal(summary.overall.cost_usd, 0.042);
	assert.equal(summary.scenarios[0].scenarioId, "alpha");
	assert.equal(summary.scenarios[0].cost_usd, 0.022);
	assert.equal(summary.scenarios[0].runCount, 2);
	assert.equal(summary.scenarios[0].total_tokens, 220);
	assert.equal(summary.scenarios[0].averageDurationMs, 110);
});

test("summarizeScenarioTelemetryFromHistory flattens recent train results", () => {
	const summary = summarizeScenarioTelemetryFromHistory({
		schemaVersion: "cautilus.scenario_history.v1",
		profileId: "default",
		trainRunCount: 2,
		scenarioStats: {
			alpha: {
				recentTrainResults: [
					{
						runIndex: 1,
						timestamp: "2026-04-10T10:00:00.000Z",
						status: "passed",
						durationMs: 90,
						telemetry: {
							total_tokens: 50,
							cost_usd: 0.005,
						},
					},
				],
			},
			beta: {
				recentTrainResults: [
					{
						runIndex: 2,
						timestamp: "2026-04-10T10:05:00.000Z",
						status: "failed",
						durationMs: 150,
						telemetry: {
							total_tokens: 75,
							cost_usd: 0.008,
						},
					},
				],
			},
		},
	});
	assert.equal(summary.source, "scenario_history");
	assert.equal(summary.overall.runCount, 2);
	assert.equal(summary.overall.total_tokens, 125);
	assert.equal(summary.scenarios.length, 2);
});
