// Deterministic replay for the app/prompt intent-judge proof.
//
// This proves the intent-judge boundary over the checked-in app/prompt backend probe:
// Codex and Claude are both semantically sound, even though Claude failed the exact
// string-fragment matcher, and a constructed semantic control is rejected.
//
// Product-runner proof remains deferred; the backend probe still reports productProofReady=false.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
	assertIntentControlIsLoadBearing,
	assertIntentJudgePacket,
	assertIntentSoundVerdict,
	findVerdict,
} from "./app-prompt-intent-judge-proof.mjs";

function readJson(relPath) {
	return JSON.parse(readFileSync(fileURLToPath(new URL(relPath, import.meta.url)), "utf-8"));
}

const probe = readJson("../../fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json");
const verdicts = readJson("../../fixtures/eval/app/prompt/intent-judge/app-prompt-intent-judge-verdicts.json");

function runByRuntime(runtime) {
	const run = probe.runs.find((entry) => entry.runtime === runtime);
	assert.ok(run, `missing ${runtime} run`);
	return run;
}

test("app/prompt intent judge packet is tied to the backend probe", () => {
	assertIntentJudgePacket(verdicts);
	assert.equal(verdicts.judgeRuns.length, 2);
	assert.equal(verdicts.intent.successDimensions[0], "describes_cautilus_eval_behavior");
	assert.equal(verdicts.intent.guardrailDimensions[0], "no_unsupported_or_harmful_claim");
});

test("Codex app/prompt backend response is intent-sound", () => {
	const codexRun = runByRuntime("codex");
	const verdict = assertIntentSoundVerdict(findVerdict(verdicts, "codex-live"));
	assert.equal(verdict.observedFinalText, codexRun.evaluation.observedFinalText);
	assert.equal(codexRun.recommendation, "accept-now");
	assert.equal(codexRun.evaluation.match, true);
});

test("Claude app/prompt backend response is intent-sound despite string-fragment reject", () => {
	const claudeRun = runByRuntime("claude");
	const verdict = assertIntentSoundVerdict(findVerdict(verdicts, "claude-live"));
	assert.equal(verdict.observedFinalText, claudeRun.evaluation.observedFinalText);
	assert.equal(claudeRun.recommendation, "reject");
	assert.equal(claudeRun.evaluation.match, false);
	assert.match(claudeRun.evaluation.matcherBoundary, /string-fragment matcher rejects/);
});

test("the app/prompt intent judge is load-bearing through a semantic control", () => {
	const control = assertIntentControlIsLoadBearing(findVerdict(verdicts, "control-generic"));
	assert.match(control.observedFinalText, /stores every user secret/);
	assert.throws(
		() => assertIntentControlIsLoadBearing({ ...control, verdict: "sound" }),
		/load-bearing gate failed/,
	);
});

test("intent judge proof does not claim product-runner readiness", () => {
	for (const run of probe.runs) {
		assert.equal(run.proof.targetSurface, "app/prompt");
		assert.equal(run.proof.requiresProductRunnerProof, true);
		assert.equal(run.proof.productProofReady, false);
	}
	assert.match(verdicts.scopeHonesty.doesNotProve, /product-runner readiness/);
});
