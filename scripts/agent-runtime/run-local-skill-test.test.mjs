import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	buildObservedSkillEvaluationInput,
	codexArgs,
	normalizeObservedResult,
	normalizeSkillTestCaseSuite,
} from "./run-local-skill-test.mjs";

test("buildObservedSkillEvaluationInput materializes a normalized packet from fixture-backed skill test results", () => {
	const artifactDir = mkdtempSync(join(tmpdir(), "cautilus-skill-test-"));
	const packet = buildObservedSkillEvaluationInput({
		repoRoot: process.cwd(),
		workspace: process.cwd(),
		casesFile: join(process.cwd(), "fixtures", "skill-test", "cases.json"),
		artifactDir,
		backend: "fixture",
		fixtureResultsFile: join(process.cwd(), "fixtures", "skill-test", "fixture-results.json"),
	});
	assert.equal(packet.schemaVersion, "cautilus.skill_evaluation_inputs.v1");
	assert.equal(packet.skillId, "cautilus");
	assert.equal(packet.evaluations.length, 2);
	assert.equal(packet.evaluations[0].expectedTrigger, "must_invoke");
	assert.equal(packet.evaluations[0].expectedRouting.selectedSkill, "cautilus");
	assert.equal(packet.evaluations[0].invoked, true);
	assert.equal(packet.evaluations[0].metrics.duration_ms, 1850);
	assert.ok(packet.evaluations[0].summary.includes("2/2"));
	assert.equal(packet.evaluations[0].routingDecision.selectedSkill, "cautilus");
	assert.equal(packet.evaluations[0].instructionSurface.surfaceLabel, "workspace_checked_in_agents");
	assert.equal(packet.evaluations[1].outcome, "passed");
	assert.equal(packet.evaluations[1].thresholds.max_duration_ms, 120000);
	assert.ok(Array.isArray(packet.evaluations[1].artifactRefs));
	assert.equal(packet.evaluations[1].metrics.duration_ms, 2600);
	assert.ok(packet.evaluations[0].artifactRefs.some((ref) => ref.kind === "aggregate"));
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

test("buildObservedSkillEvaluationInput applies instruction-surface overrides and restores workspace files", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-instruction-surface-"));
	const workspace = join(root, "workspace");
	const casesFile = join(root, "cases.json");
	const fixtureResultsFile = join(root, "fixture-results.json");
	mkdirSync(workspace, { recursive: true });
	writeFileSync(join(workspace, "AGENTS.md"), "Original workspace routing.\n", "utf-8");
	writeFileSync(join(root, "compact-agents.md"), "Use find-skills before guessing.\n", "utf-8");
	writeFileSync(casesFile, `${JSON.stringify({
		schemaVersion: "cautilus.skill_test_cases.v1",
		skillId: "demo",
		instructionSurface: {
			surfaceLabel: "compact-find-skills",
			files: [
				{
					path: "AGENTS.md",
					sourceFile: "./compact-agents.md",
				},
			],
		},
		cases: [
			{
				caseId: "trigger-demo",
				evaluationKind: "trigger",
				prompt: "Use the right shared skill for this ambiguous request.",
				expectedTrigger: "must_invoke",
				expectedRouting: {
					selectedSkill: "find-skills",
					firstToolCallPattern: "list_capabilities.py",
				},
			},
		],
	}, null, 2)}\n`);
	writeFileSync(fixtureResultsFile, `${JSON.stringify({
		"trigger-demo": {
			invoked: true,
			summary: "The prompt routed through find-skills first.",
			routingDecision: {
				selectedSkill: "find-skills",
				selectedSupport: null,
				firstToolCall: "python3 skills/public/find-skills/scripts/list_capabilities.py --repo-root .",
				reasonSummary: "The prompt was ambiguous, so the compact AGENTS surface said to use find-skills first.",
			},
			duration_ms: 900,
		},
	}, null, 2)}\n`);
	const packet = buildObservedSkillEvaluationInput({
		repoRoot: root,
		workspace,
		casesFile,
		artifactDir: join(root, "artifacts"),
		backend: "fixture",
		fixtureResultsFile,
	});
	assert.equal(packet.evaluations[0].instructionSurface.surfaceLabel, "compact-find-skills");
	assert.equal(packet.evaluations[0].instructionSurface.files[0].sourceKind, "source_file");
	assert.equal(packet.evaluations[0].routingDecision.selectedSkill, "find-skills");
	assert.ok(packet.evaluations[0].artifactRefs.some((ref) => ref.kind === "instruction_surface"));
	assert.equal(readFileSync(join(workspace, "AGENTS.md"), "utf-8"), "Original workspace routing.\n");
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
		prompt_tokens: 900,
		completion_tokens: 334,
		total_tokens: 1234,
		cost_usd: 0.01234,
	});
});
