import assert from "node:assert/strict";
import test from "node:test";

import { COMPARE_ARTIFACT_SCHEMA, SCENARIO_RESULTS_SCHEMA } from "./contract-versions.mjs";
import { REPORT_INPUTS_SCHEMA, REPORT_PACKET_SCHEMA, buildReportPacket } from "./build-report-packet.mjs";

test("buildReportPacket aggregates mode telemetry and scenario summaries", () => {
	const report = buildReportPacket(
		{
			schemaVersion: REPORT_INPUTS_SCHEMA,
			candidate: "feature/intentful-cli",
			baseline: "origin/main",
			intent: "The CLI should explain missing adapter setup without operator guesswork.",
			intentProfile: {
				schemaVersion: "cautilus.behavior_intent.v1",
				intentId: "intent-missing-adapter-guidance",
				summary: "The CLI should explain missing adapter setup without operator guesswork.",
				behaviorSurface: "operator_cli",
				successDimensions: [
					{
						id: "missing-adapter-clarity",
						summary: "Explain what adapter is missing.",
					},
				],
				guardrailDimensions: [
					{
						id: "no-false-success",
						summary: "Do not imply that the repo is already configured.",
					},
				],
			},
			commands: [
				{
					mode: "held_out",
					command: "node ./bin/cautilus doctor --repo-root /tmp/repo",
				},
				{
					mode: "full_gate",
					command: "node ./bin/cautilus review variants --repo-root /tmp/repo --workspace /tmp/repo --output-dir /tmp/out",
				},
			],
			modeRuns: [
				{
					mode: "held_out",
					status: "passed",
					startedAt: "2026-04-11T00:00:00.000Z",
					completedAt: "2026-04-11T00:00:10.000Z",
					durationMs: 10000,
					scenarioResults: {
						schemaVersion: SCENARIO_RESULTS_SCHEMA,
						mode: "held_out",
						results: [
							{
								scenarioId: "doctor-missing-adapter",
								status: "passed",
								durationMs: 1200,
								telemetry: {
									provider: "openai",
									model: "gpt-5.4",
									total_tokens: 200,
									cost_usd: 0.02,
								},
							},
						],
						compareArtifact: {
							schemaVersion: COMPARE_ARTIFACT_SCHEMA,
							summary: "Held-out missing-adapter messaging improved.",
							verdict: "improved",
							improved: ["doctor-missing-adapter"],
						},
					},
				},
				{
					mode: "full_gate",
					status: "failed",
					startedAt: "2026-04-11T00:01:00.000Z",
					completedAt: "2026-04-11T00:01:25.000Z",
					durationMs: 25000,
					telemetry: {
						provider: "anthropic",
						model: "claude-3.7",
						total_tokens: 500,
						cost_usd: 0.04,
					},
					scenarioResults: {
						schemaVersion: SCENARIO_RESULTS_SCHEMA,
						mode: "full_gate",
						results: [
							{
								scenarioId: "review-variant-safety",
								status: "failed",
								durationMs: 1500,
							},
						],
					},
				},
			],
			improved: ["doctor-missing-adapter"],
			regressed: [{ scenarioId: "review-variant-safety", reason: "full gate failed" }],
			unchanged: [],
			noisy: [],
			humanReviewFindings: [
				{
					severity: "concern",
					message: "The CLI output is still terse for first-time operators.",
					path: "bin/cautilus",
				},
			],
			recommendation: "defer",
		},
		{ now: new Date("2026-04-11T00:02:00.000Z") },
	);
	assert.equal(report.schemaVersion, REPORT_PACKET_SCHEMA);
	assert.equal(report.intentProfile.intentId, "intent-missing-adapter-guidance");
	assert.equal(report.intentProfile.behaviorSurface, "operator_cli");
	assert.equal(report.modesRun.length, 2);
	assert.equal(report.modeSummaries[0].scenarioTelemetrySummary.overall.total_tokens, 200);
	assert.equal(report.modeSummaries[0].compareArtifact.verdict, "improved");
	assert.equal(report.modeSummaries[1].telemetry.total_tokens, 500);
	assert.equal(report.telemetry.total_tokens, 700);
	assert.equal(report.telemetry.cost_usd, 0.06);
	assert.equal(report.telemetry.durationMs, 35000);
	assert.deepEqual(report.telemetry.providers.sort(), ["anthropic", "openai"]);
	assert.equal(report.recommendation, "defer");
});
