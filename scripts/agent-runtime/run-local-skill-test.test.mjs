import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { buildObservedSkillEvaluationInput, normalizeSkillTestCaseSuite } from "./run-local-skill-test.mjs";

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
	assert.equal(packet.evaluations[0].invoked, true);
	assert.equal(packet.evaluations[0].metrics.duration_ms, 1850);
	assert.ok(packet.evaluations[0].summary.includes("2/2"));
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
