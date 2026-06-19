// Deterministic replay for the app/prompt backend probe.
//
// Scope: this asserts the checked-in 2026-06-19 probe over the app/prompt Cautilus tagline
// fixture. It does not run live model backends; the live commands are recorded in the capture.
// The point is to keep the proof boundary honest: fixture and Codex passed, Claude exposed the
// current string-fragment matcher boundary, and all runs still report productProofReady=false.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const capture = JSON.parse(readFileSync(fileURLToPath(new URL("../../fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json", import.meta.url)), "utf-8"));

function runByRuntime(runtime) {
	const run = capture.runs.find((entry) => entry.runtime === runtime);
	assert.ok(run, `missing ${runtime} run`);
	return run;
}

function assertAppPromptProofBoundary(run) {
	assert.equal(run.schemaVersion, "cautilus.app_prompt_evaluation_summary.v1");
	assert.equal(run.proof.targetSurface, "app/prompt");
	assert.equal(run.proof.productProofReady, false);
	assert.equal(run.proof.requiresProductRunnerProof, true);
	assert.equal(run.proof.runnerAssessmentState, "missing-assessment");
	assert.equal(run.evaluation.observedFinalText.length > 0, true);
}

test("app/prompt backend probe captures the checked-in tagline fixture boundary", () => {
	assert.equal(capture.schemaVersion, "cautilus.app_prompt_backend_probe.v1");
	assert.equal(capture.sourceFixture, "fixtures/eval/app/prompt/cautilus-tagline.fixture.json");
	assert.equal(capture.caseId, "one-line-behavior-eval");
	assert.equal(capture.input, "Describe Cautilus in one short sentence.");
	assert.equal(capture.expectedFinalTextFragment, "behavior");
	assert.equal(capture.runs.length, 3);
});

test("fixture runtime proves only the fixture-smoke app/prompt seam", () => {
	const fixtureRun = runByRuntime("fixture");
	assertAppPromptProofBoundary(fixtureRun);
	assert.equal(fixtureRun.recommendation, "accept-now");
	assert.equal(fixtureRun.proof.proofClass, "fixture-smoke");
	assert.equal(fixtureRun.evaluation.status, "passed");
	assert.equal(fixtureRun.evaluation.match, true);
	assert.match(fixtureRun.evaluation.observedFinalText, /behavior/);
});

test("live Codex backend passes the app/prompt fixture but remains declared-runner proof", () => {
	const codexRun = runByRuntime("codex");
	assertAppPromptProofBoundary(codexRun);
	assert.equal(codexRun.recommendation, "accept-now");
	assert.equal(codexRun.proof.proofClass, "declared-eval-runner");
	assert.equal(codexRun.evaluation.harness, "codex_exec");
	assert.equal(codexRun.evaluation.provider, "openai");
	assert.equal(codexRun.evaluation.status, "passed");
	assert.equal(codexRun.evaluation.match, true);
	assert.match(codexRun.evaluation.observedFinalText, /intentful behavior|behavior/i);
});

test("live Claude backend exposes the app/prompt string-fragment matcher boundary", () => {
	const claudeRun = runByRuntime("claude");
	assertAppPromptProofBoundary(claudeRun);
	assert.equal(claudeRun.recommendation, "reject");
	assert.equal(claudeRun.proof.proofClass, "declared-eval-runner");
	assert.equal(claudeRun.evaluation.harness, "claude_code");
	assert.equal(claudeRun.evaluation.provider, "anthropic");
	assert.equal(claudeRun.evaluation.status, "failed");
	assert.equal(claudeRun.evaluation.match, false);
	assert.match(claudeRun.evaluation.observedFinalText, /Cautilus.*evaluations.*behave/i);
	assert.doesNotMatch(claudeRun.evaluation.observedFinalText, /behavior/);
	assert.match(claudeRun.evaluation.matcherBoundary, /string-fragment matcher rejects/);
});
