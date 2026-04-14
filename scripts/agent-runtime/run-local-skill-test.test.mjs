import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { buildObservedSkillEvaluationInput } from "./run-local-skill-test.mjs";

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
	assert.equal(packet.evaluations[1].outcome, "passed");
	assert.equal(packet.evaluations[1].thresholds.max_duration_ms, 120000);
	assert.ok(Array.isArray(packet.evaluations[1].artifactRefs));
	assert.equal(packet.evaluations[1].metrics.duration_ms, 2600);
});
