import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
	buildDeploymentEvidence,
	prepareDeploymentEvidenceInput,
} from "./deployment-evidence.mjs";

const BUILD_SCRIPT_PATH = fileURLToPath(new URL("./build-deployment-evidence.mjs", import.meta.url));
const EXAMPLE_INPUT_PATH = fileURLToPath(
	new URL("../../fixtures/deployment-evidence/example-input.json", import.meta.url),
);

function snapshotFiles(path) {
	return Object.fromEntries(
		readdirSync(path).map((name) => [name, readFileSync(join(path, name), "utf-8")]),
	);
}

test("build deployment evidence CLI accepts valid input and output paths", () => {
	const sandboxCwd = mkdtempSync(join(tmpdir(), "cautilus-deployment-evidence-valid-"));
	try {
		const outputPath = join(sandboxCwd, "evidence.json");
		const result = spawnSync(
			process.execPath,
			[BUILD_SCRIPT_PATH, "--input", EXAMPLE_INPUT_PATH, "--output", outputPath],
			{ cwd: sandboxCwd, encoding: "utf-8" },
		);
		assert.equal(result.status, 0, result.stderr);
		assert.equal(result.stderr, "");
		assert.equal(existsSync(outputPath), true);
		const packet = JSON.parse(readFileSync(outputPath, "utf-8"));
		assert.equal(packet.schemaVersion, "cautilus.deployment_evidence.v1");
		assert.equal(packet.overall.rowCount, 2);
	} finally {
		rmSync(sandboxCwd, { recursive: true, force: true });
	}
});

test("build deployment evidence CLI rejects malformed required values before filesystem access", () => {
	const cases = [
		{ option: "--input", value: "--help", prefix: [], seedInput: true },
		{ option: "--input", value: " \t\n", prefix: [], seedInput: true },
		{ option: "--output", value: "--help", prefix: ["--input", EXAMPLE_INPUT_PATH] },
		{ option: "--output", value: " \t\n", prefix: ["--input", EXAMPLE_INPUT_PATH] },
	];

	for (const testCase of cases) {
		const sandboxCwd = mkdtempSync(join(tmpdir(), "cautilus-deployment-evidence-invalid-"));
		try {
			if (testCase.seedInput) {
				writeFileSync(
					join(sandboxCwd, testCase.value),
					readFileSync(EXAMPLE_INPUT_PATH, "utf-8"),
					"utf-8",
				);
			}
			const before = snapshotFiles(sandboxCwd);
			const result = spawnSync(
				process.execPath,
				[BUILD_SCRIPT_PATH, ...testCase.prefix, testCase.option, testCase.value],
				{ cwd: sandboxCwd, encoding: "utf-8" },
			);
			assert.notEqual(result.status, 0, `${testCase.option} accepted ${JSON.stringify(testCase.value)}`);
			assert.match(result.stderr, new RegExp(`Missing value for ${testCase.option}`));
			assert.deepEqual(snapshotFiles(sandboxCwd), before);
		} finally {
			rmSync(sandboxCwd, { recursive: true, force: true });
		}
	}
});

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
						request_kind: "app_chat",
						source_flow: "release_smoke",
						cache_policy: "cacheable_system_prompt",
						static_context_id: "cautilus-agent-v1",
						cost_truth: "derived_pricing",
						pricing_source: "openai_pricing",
						pricing_version: "2026-05-17",
						uncached_input_tokens: 400,
						cache_creation_input_tokens: 100,
						cache_read_input_tokens: 300,
						prompt_tokens: 800,
						output_tokens: 200,
						completion_tokens: 200,
						retry_count: 1,
						tool_call_count: 2,
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
			request_kind: "app_chat",
			source_flow: "release_smoke",
			cache_policy: "cacheable_system_prompt",
			static_context_id: "cautilus-agent-v1",
			cost_truth: "derived_pricing",
			pricing_source: "openai_pricing",
			pricing_version: "2026-05-17",
			duration_ms: 3000,
			uncached_input_tokens: 400,
			cache_creation_input_tokens: 100,
			cache_read_input_tokens: 300,
			prompt_tokens: 800,
			output_tokens: 200,
			completion_tokens: 200,
			total_tokens: 1000,
			cost_usd: 0.02,
			retry_count: 1,
			tool_call_count: 2,
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
				request_kind: "skill_execution",
				source_flow: "release_smoke",
				cache_policy: "cacheable_system_prompt",
				static_context_id: "shared-skill-context",
				cost_truth: "derived_pricing",
				pricing_source: "anthropic_pricing",
				pricing_version: "2026-05-17",
				duration_ms: 10000,
				cache_creation_input_tokens: 1000,
				cache_read_input_tokens: 9000,
				total_tokens: 100000,
				cost_usd: 0.10,
				retry_count: 0,
				tool_call_count: 3,
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
				request_kind: "skill_execution",
				source_flow: "release_smoke",
				cache_policy: "cacheable_system_prompt",
				static_context_id: "shared-skill-context",
				cost_truth: "derived_pricing",
				pricing_source: "anthropic_pricing",
				pricing_version: "2026-05-17",
				duration_ms: 20000,
				cache_creation_input_tokens: 3000,
				cache_read_input_tokens: 7000,
				total_tokens: 50000,
				cost_usd: 0.20,
				retry_count: 2,
				tool_call_count: 5,
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
		requestKinds: ["skill_execution"],
		sourceFlows: ["release_smoke"],
		cachePolicies: ["cacheable_system_prompt"],
		staticContextIds: ["shared-skill-context"],
		costTruths: ["derived_pricing"],
		pricingSources: ["anthropic_pricing"],
		pricingVersions: ["2026-05-17"],
		p50_duration_ms: 15000,
		p90_duration_ms: 19000,
		p50_cache_creation_input_tokens: 2000,
		p90_cache_creation_input_tokens: 2800,
		p50_cache_read_input_tokens: 8000,
		p90_cache_read_input_tokens: 8800,
		p50_total_tokens: 75000,
		p90_total_tokens: 95000,
		p50_cost_usd: 0.15,
		p90_cost_usd: 0.19,
		p50_retry_count: 1,
		p90_retry_count: 2,
		p50_tool_call_count: 4,
		p90_tool_call_count: 5,
	});
});
