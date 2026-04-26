import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	buildObservedSkillEvaluationInput,
	codexArgs,
	extractCodexCommandText,
	normalizeObservedResult,
	normalizeSkillTestCaseSuite,
} from "./run-local-skill-test.mjs";
import { extractCodexTelemetry } from "./skill-test-telemetry.mjs";

test("buildObservedSkillEvaluationInput materializes a normalized packet from fixture-backed skill test results", () => {
	const artifactDir = mkdtempSync(join(tmpdir(), "cautilus-skill-test-"));
	const packet = buildObservedSkillEvaluationInput({
		repoRoot: process.cwd(),
		workspace: process.cwd(),
		casesFile: join(process.cwd(), "fixtures", "eval", "skill", "internal-runner-cases.json"),
		artifactDir,
		backend: "fixture",
		fixtureResultsFile: join(process.cwd(), "fixtures", "eval", "skill", "internal-runner-fixture-results.json"),
	});
	assert.equal(packet.schemaVersion, "cautilus.skill_evaluation_inputs.v1");
	assert.equal(packet.skillId, "cautilus");
	assert.equal(packet.evaluations.length, 3);
	assert.equal(packet.evaluations[0].expectedTrigger, "must_invoke");
	assert.equal(packet.evaluations[0].invoked, true);
	assert.equal(packet.evaluations[0].metrics.duration_ms, 1850);
	assert.ok(packet.evaluations[0].summary.includes("2/2"));
	assert.equal(packet.evaluations[1].outcome, "passed");
	assert.equal(packet.evaluations[1].thresholds.max_duration_ms, 120000);
	assert.ok(Array.isArray(packet.evaluations[1].artifactRefs));
	assert.equal(packet.evaluations[1].metrics.duration_ms, 2600);
	assert.equal(packet.evaluations[2].evaluationId, "execution-cautilus-no-input-claim-discovery-status");
	assert.equal(packet.evaluations[2].outcome, "passed");
	assert.equal(packet.evaluations[2].thresholds.max_duration_ms, 180000);
	assert.equal(packet.evaluations[2].metrics.duration_ms, 3200);
	assert.ok(packet.evaluations[0].artifactRefs.some((ref) => ref.kind === "aggregate"));
});

test("fixture-backed execution cases fail when summary expectations are violated", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-skill-test-expectations-"));
	const casesFile = join(root, "cases.json");
	const fixtureResultsFile = join(root, "fixture-results.json");
	writeFileSync(casesFile, `${JSON.stringify({
		schemaVersion: "cautilus.skill_test_cases.v1",
		skillId: "demo",
		cases: [
			{
				caseId: "execution-demo",
				evaluationKind: "execution",
				prompt: "Use $demo.",
				requiredSummaryFragments: ["adapter"],
				forbiddenSummaryFragments: ["commit"],
			},
		],
	}, null, 2)}\n`);
	writeFileSync(fixtureResultsFile, `${JSON.stringify({
		"execution-demo": {
			invoked: true,
			summary: "The agent made a commit without checking the requested status.",
			outcome: "passed",
			duration_ms: 1000,
		},
	}, null, 2)}\n`);
	const packet = buildObservedSkillEvaluationInput({
		repoRoot: process.cwd(),
		workspace: process.cwd(),
		casesFile,
		artifactDir: join(root, "artifacts"),
		backend: "fixture",
		fixtureResultsFile,
	});
	assert.equal(packet.evaluations[0].outcome, "failed");
	assert.match(packet.evaluations[0].summary, /missing required fragment: adapter/);
	assert.match(packet.evaluations[0].summary, /included forbidden fragment: commit/);
});

test("extractCodexCommandText finds commands from codex jsonl events", () => {
	const stdout = [
		JSON.stringify({ payload: { type: "function_call", arguments: JSON.stringify({ cmd: "./bin/cautilus doctor --repo-root ." }) } }),
		JSON.stringify({ payload: { command: ["/usr/bin/zsh", "-lc", "git status --short"] } }),
	].join("\n");
	assert.match(extractCodexCommandText(stdout), /cautilus doctor/);
	assert.match(extractCodexCommandText(stdout), /git status --short/);
});

test("normalizeSkillTestCaseSuite applies repeat defaults and validates consensus bounds", () => {
	assert.deepEqual(
		normalizeSkillTestCaseSuite({
			schemaVersion: "cautilus.skill_test_cases.v1",
			skillId: "demo",
			repeatCount: 3,
			minConsensusCount: 2,
			cases: [
				{
					caseId: "trigger-demo",
					evaluationKind: "trigger",
					prompt: "Use $demo here.",
					expectedTrigger: "must_invoke",
				},
			],
		}).cases[0].repeatCount,
		3,
	);
	assert.throws(
		() => normalizeSkillTestCaseSuite({
			schemaVersion: "cautilus.skill_test_cases.v1",
			skillId: "demo",
			cases: [
				{
					caseId: "trigger-demo",
					evaluationKind: "trigger",
					prompt: "Use $demo here.",
					expectedTrigger: "must_invoke",
					repeatCount: 2,
					minConsensusCount: 3,
				},
			],
		}),
		/minConsensusCount must be less than or equal to repeatCount/,
	);
});

test("fixture-backed repeated execution cases degrade when no outcome consensus is reached", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-skill-test-repeat-"));
	const casesFile = join(root, "cases.json");
	const fixtureResultsFile = join(root, "fixture-results.json");
	writeFileSync(casesFile, `${JSON.stringify({
		schemaVersion: "cautilus.skill_test_cases.v1",
		skillId: "demo",
		cases: [
			{
				caseId: "execution-demo",
				evaluationKind: "execution",
				prompt: "Use $demo.",
				repeatCount: 3,
				minConsensusCount: 2,
			},
		],
	}, null, 2)}\n`);
	writeFileSync(fixtureResultsFile, `${JSON.stringify({
		"execution-demo": [
			{ invoked: true, summary: "Run one passed.", outcome: "passed", duration_ms: 1000 },
			{ invoked: true, summary: "Run two degraded.", outcome: "degraded", duration_ms: 2000 },
			{ invoked: true, summary: "Run three blocked.", outcome: "blocked", duration_ms: 3000 },
		],
	}, null, 2)}\n`);
	const packet = buildObservedSkillEvaluationInput({
		repoRoot: process.cwd(),
		workspace: process.cwd(),
		casesFile,
		artifactDir: join(root, "artifacts"),
		backend: "fixture",
		fixtureResultsFile,
	});
	assert.equal(packet.evaluations[0].outcome, "degraded");
	assert.ok(packet.evaluations[0].summary.includes("unstable"));
	assert.equal(packet.evaluations[0].metrics.duration_ms, 2000);
});

test("fixture-backed repeated trigger cases aggregate telemetry medians", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-skill-test-telemetry-"));
	const casesFile = join(root, "cases.json");
	const fixtureResultsFile = join(root, "fixture-results.json");
	writeFileSync(casesFile, `${JSON.stringify({
		schemaVersion: "cautilus.skill_test_cases.v1",
		skillId: "demo",
		cases: [
			{
				caseId: "trigger-demo",
				evaluationKind: "trigger",
				prompt: "Use $demo.",
				expectedTrigger: "must_invoke",
				repeatCount: 2,
				minConsensusCount: 2,
			},
		],
	}, null, 2)}\n`);
	writeFileSync(fixtureResultsFile, `${JSON.stringify({
		"trigger-demo": [
			{
				invoked: true,
				summary: "Run one passed.",
				duration_ms: 1000,
				metrics: { total_tokens: 100, cost_usd: 0.01 },
				telemetry: { provider: "anthropic", model: "claude-sonnet-4-6", prompt_tokens: 80, completion_tokens: 20, total_tokens: 100, cost_usd: 0.01 },
			},
			{
				invoked: true,
				summary: "Run two passed.",
				duration_ms: 3000,
				metrics: { total_tokens: 300, cost_usd: 0.03 },
				telemetry: { provider: "anthropic", model: "claude-sonnet-4-6", prompt_tokens: 240, completion_tokens: 60, total_tokens: 300, cost_usd: 0.03 },
			},
		],
	}, null, 2)}\n`);
	const packet = buildObservedSkillEvaluationInput({
		repoRoot: process.cwd(),
		workspace: process.cwd(),
		casesFile,
		artifactDir: join(root, "artifacts"),
		backend: "fixture",
		fixtureResultsFile,
	});
	assert.deepEqual(packet.evaluations[0].telemetry, {
		provider: "anthropic",
		model: "claude-sonnet-4-6",
		prompt_tokens: 160,
		completion_tokens: 40,
		total_tokens: 200,
		cost_usd: 0.02,
	});
	assert.deepEqual(packet.evaluations[0].metrics, {
		duration_ms: 2000,
		total_tokens: 200,
		cost_usd: 0.02,
	});
});

test("codexArgs applies runtime-specific model, effort, and config overrides", () => {
	assert.deepEqual(
		codexArgs({
			workspace: "/repo",
			sandbox: "workspace-write",
			model: "gpt-5.4",
			reasoningEffort: "high",
			codexModel: "gpt-5.4-mini",
			codexReasoningEffort: "low",
			codexSessionMode: "ephemeral",
			codexConfigOverrides: [
				"project_doc_max_bytes=0",
				"include_apps_instructions=false",
			],
		}, "/tmp/schema.json", "/tmp/result.json"),
		[
			"exec",
			"-C",
			"/repo",
			"--sandbox",
			"workspace-write",
			"--ephemeral",
			"--json",
			"--output-schema",
			"/tmp/schema.json",
			"-o",
			"/tmp/result.json",
			"--model",
			"gpt-5.4-mini",
			"-c",
			"model_reasoning_effort=\"low\"",
			"-c",
			"project_doc_max_bytes=0",
			"-c",
			"include_apps_instructions=false",
			"-",
		],
	);
});

test("codexArgs omits --ephemeral when session mode is persistent", () => {
	assert.deepEqual(
		codexArgs({
			workspace: "/repo",
			sandbox: "read-only",
			codexSessionMode: "persistent",
			codexConfigOverrides: [],
		}, "/tmp/schema.json", "/tmp/result.json"),
		[
			"exec",
			"-C",
			"/repo",
			"--sandbox",
			"read-only",
			"--json",
			"--output-schema",
			"/tmp/schema.json",
			"-o",
			"/tmp/result.json",
			"-",
		],
	);
});

test("extractCodexTelemetry preserves provider, model, and token totals from jsonl events", () => {
	const telemetry = extractCodexTelemetry([
		{
			type: "session_meta",
			payload: {
				source: "exec",
				model_provider: "openai",
				model_info: { slug: "gpt-5.4-mini" },
			},
		},
		{
			type: "event_msg",
			payload: {
				type: "token_count",
				info: {
					total_token_usage: {
						input_tokens: 1200,
						output_tokens: 300,
						cached_input_tokens: 200,
						reasoning_output_tokens: 50,
					},
				},
			},
		},
	]);
	assert.deepEqual(telemetry, {
		provider: "openai",
		model: "gpt-5.4-mini",
		session_mode: "ephemeral",
		prompt_tokens: 1400,
		completion_tokens: 350,
		total_tokens: 1750,
		cost_usd: 0.00249,
		cost_truth: "derived_pricing",
		pricing_source: "openai_api_pricing",
		pricing_version: "2026-04-19",
	});
});

test("normalizeObservedResult preserves backend telemetry and numeric metrics", () => {
	const observed = normalizeObservedResult(
		{
			evaluationKind: "execution",
			caseId: "execution-demo",
		},
		{
			invoked: true,
			summary: "Completed.",
			outcome: "passed",
			metrics: {
				total_tokens: 1234,
				cost_usd: 0.01234,
			},
			telemetry: {
				provider: "anthropic",
				model: "claude-sonnet-4-6",
				session_mode: "persistent",
				prompt_tokens: 900,
				completion_tokens: 334,
				total_tokens: 1234,
				cost_usd: 0.01234,
			},
		},
		2500,
		[],
	);
	assert.deepEqual(observed.metrics, {
		duration_ms: 2500,
		total_tokens: 1234,
		cost_usd: 0.01234,
	});
	assert.deepEqual(observed.telemetry, {
		provider: "anthropic",
		model: "claude-sonnet-4-6",
		session_mode: "persistent",
		prompt_tokens: 900,
		completion_tokens: 334,
		total_tokens: 1234,
		cost_usd: 0.01234,
	});
});

test("normalizeObservedResult falls back to telemetry totals when observed metrics omit codex cost", () => {
	const observed = normalizeObservedResult(
		{
			evaluationKind: "execution",
			caseId: "execution-demo",
		},
		{
			invoked: true,
			summary: "Completed.",
			outcome: "passed",
			telemetry: {
				provider: "openai",
				model: "gpt-5.4-mini",
				session_mode: "persistent",
				prompt_tokens: 1400,
				completion_tokens: 350,
				total_tokens: 1750,
				cost_usd: 0.002625,
				cost_truth: "derived_pricing",
				pricing_source: "openai_api_pricing",
				pricing_version: "2026-04-19",
			},
		},
		2500,
		[],
	);
	assert.deepEqual(observed.metrics, {
		duration_ms: 2500,
		total_tokens: 1750,
		cost_usd: 0.002625,
	});
	assert.deepEqual(observed.telemetry, {
		provider: "openai",
		model: "gpt-5.4-mini",
		session_mode: "persistent",
		prompt_tokens: 1400,
		completion_tokens: 350,
		total_tokens: 1750,
		cost_usd: 0.002625,
		cost_truth: "derived_pricing",
		pricing_source: "openai_api_pricing",
		pricing_version: "2026-04-19",
	});
});
