// Deterministic standing gate for the on-demand Bounded Improvement live proof.
//
// This replays the checked-in live improve-search result through the SAME assertImproveLiveInvariant()
// the live driver uses, so the displayed invariant and the graded invariant cannot drift. It runs no
// live agent (it belongs to test:on-demand, never to standing verify's live cost). The live driver
// itself is improve-live-proof.mjs (npm run proof:improve:live).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { assertImproveLiveInvariant, STABLE_INVARIANT, HELD_OUT_SCENARIO_ID } from "./improve-live-proof.mjs";

function readJson(relPath) {
	return JSON.parse(readFileSync(fileURLToPath(new URL(relPath, import.meta.url)), "utf-8"));
}

const searchResult = readJson("../../fixtures/eval/dev/skill/improve/live/improve-live-search-result.json");
const seedEvalSummary = readJson("../../fixtures/eval/dev/skill/improve/live/improve-live-seed-eval-summary.json");

test("the checked-in live improve search holds the stable invariant (held-out recovery)", () => {
	const evidence = assertImproveLiveInvariant(searchResult);
	assert.equal(evidence.heldOutScenarioId, STABLE_INVARIANT.heldOutScenarioId);
	// The seed (constructed degraded control) genuinely failed the held-out scenario...
	assert.ok(evidence.seedHeldOutScore < 100, "seed should fail held-out");
	// ...and a mutated candidate the search was never tuned on recovered it.
	assert.ok(evidence.winningCandidateHeldOutScore >= 100, "winning candidate should pass held-out");
	assert.ok(evidence.winningCandidateHeldOutScore > evidence.seedHeldOutScore, "candidate beats seed");
	assert.ok(evidence.mutationInvocationCount >= 1, "a live mutation backend ran");
});

test("provenance honesty: the live search actually mutated and worktree-evaluated a candidate", () => {
	// Not a hand-written bundle: the search status is a real run, a mutation backend was invoked,
	// and the winning candidate carries live held-out evaluation artifacts from a worktree run.
	assert.notEqual(searchResult.status, "blocked");
	assert.ok(Number(searchResult.searchTelemetry?.mutationInvocationCount) >= 1);
	assert.ok(Number(searchResult.searchTelemetry?.heldOutEvaluationCount) >= 1);
	const registry = Array.isArray(searchResult.candidateRegistry) ? searchResult.candidateRegistry : [];
	const mutated = registry.find((c) => c && c.origin === "mutation");
	assert.ok(mutated, "a mutation-origin candidate exists in the registry");
});

test("the seed control's held-out failure is a real live capture, not asserted", () => {
	// The seed eval-summary is the live degraded-control run that justifies seedHeldOutScore < 100.
	const evaluations = Array.isArray(seedEvalSummary.evaluations) ? seedEvalSummary.evaluations : [];
	const orientation = evaluations.find((e) => (e.caseId || e.displayName) === HELD_OUT_SCENARIO_ID) || evaluations[0];
	assert.ok(orientation, "seed eval summary has the orientation evaluation");
	assert.notEqual(orientation.status, "passed", "the degraded seed control must fail the held-out scenario");
});

test("assertImproveLiveInvariant fails loudly when the search was blocked", () => {
	const blocked = { ...searchResult, status: "blocked", reasonCodes: ["missing_held_out_scenarios"] };
	assert.throws(() => assertImproveLiveInvariant(blocked), /blocked instead of running/);
});

test("assertImproveLiveInvariant fails loudly when no mutation backend ran", () => {
	const noMutation = { ...searchResult, searchTelemetry: { ...searchResult.searchTelemetry, mutationInvocationCount: 0 } };
	assert.throws(() => assertImproveLiveInvariant(noMutation), /did not invoke a mutation backend/);
});

test("assertImproveLiveInvariant fails loudly when the seed control did not actually fail", () => {
	// If the seed already passes held-out, there is nothing honest to improve.
	const seedPasses = {
		...searchResult,
		heldOutEvaluationMatrix: searchResult.heldOutEvaluationMatrix.map((entry) =>
			entry.candidateId === "seed" && entry.scenarioId === HELD_OUT_SCENARIO_ID
				? { ...entry, score: 100 }
				: entry,
		),
	};
	assert.throws(() => assertImproveLiveInvariant(seedPasses), /seed control did not fail/);
});

test("assertImproveLiveInvariant fails loudly when no mutated candidate recovers held-out", () => {
	// Drop every non-seed held-out score to a failing value: the loop produced no real win.
	const noWin = {
		...searchResult,
		heldOutEvaluationMatrix: searchResult.heldOutEvaluationMatrix.map((entry) =>
			entry.candidateId !== "seed" && entry.scenarioId === HELD_OUT_SCENARIO_ID
				? { ...entry, score: 0 }
				: entry,
		),
	};
	assert.throws(() => assertImproveLiveInvariant(noWin), /no mutated candidate recovered the held-out scenario/);
});
