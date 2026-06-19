// Deterministic standing gate for the on-demand Behavior Evaluation live proof.
//
// This replays the checked-in operator-witnessed live capture through the SAME assertLiveInvariant()
// the live driver uses, so the displayed invariant and the graded invariant cannot drift. It runs no
// live agent (it belongs to test:on-demand, never to standing verify's live cost). The live driver
// itself is behavior-eval-live-proof.mjs (npm run proof:behavior-eval:live).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { assertLiveInvariant, STABLE_INVARIANT } from "./behavior-eval-live-proof.mjs";

function readJson(relPath) {
	return JSON.parse(readFileSync(fileURLToPath(new URL(relPath, import.meta.url)), "utf-8"));
}

const capture = readJson("../../fixtures/eval/dev/repo/live/behavior-eval-live-capture.json");
const verdicts = readJson("../../fixtures/eval/dev/repo/live/behavior-eval-live-verdicts.json");

const captureEvaluation = capture.evaluations[0];
const liveVerdict = verdicts.verdicts.find((v) => v.kind === "real-live-capture");
const controlVerdict = verdicts.verdicts.find((v) => v.kind === "judge-control-semantic");

test("the checked-in live capture holds the stable invariant (AGENTS.md -> find-skills bootstrap)", () => {
	const evidence = assertLiveInvariant(captureEvaluation);
	assert.equal(evidence.entryFile, STABLE_INVARIANT.entryFile);
	assert.equal(evidence.bootstrapHelper, STABLE_INVARIANT.bootstrapHelper);
	// The capture is a genuine live claude/Sonnet run (provenance honesty), not a fixture stand-in.
	assert.equal(capture.provenance.kind, "live-agent-capture");
	assert.equal(captureEvaluation.telemetry.runtime, "claude_code");
	assert.match(captureEvaluation.telemetry.model, /sonnet/);
});

test("assertLiveInvariant fails loudly when the agent drops the find-skills bootstrap", () => {
	const regressed = {
		...captureEvaluation,
		routingDecision: { ...captureEvaluation.routingDecision, bootstrapHelper: "charness:impl" },
	};
	assert.throws(() => assertLiveInvariant(regressed), /dropped the find-skills startup bootstrap/);
});

test("assertLiveInvariant fails loudly when the agent does not orient on AGENTS.md", () => {
	const regressed = { ...captureEvaluation, entryFile: "README.md" };
	assert.throws(() => assertLiveInvariant(regressed), /did not orient on AGENTS\.md/);
});

test("assertLiveInvariant fails loudly when the live run produced no observation", () => {
	const blocked = { ...captureEvaluation, observationStatus: "blocked", blockerKind: "runner_execution_failed" };
	assert.throws(() => assertLiveInvariant(blocked), /did not produce an observation/);
});

test("the blind judge graded the genuine live reasoning SOUND with no tools", () => {
	assert.equal(liveVerdict.verdict, "sound");
	assert.equal(liveVerdict.expected, "sound");
	assert.equal(liveVerdict.toolUses, 0);
	for (const facet of Object.values(liveVerdict.facets)) {
		assert.equal(facet, true);
	}
});

test("the blind judge is load-bearing: it rejects a route-correct, reason-fabricated control", () => {
	// The control passes the deterministic route (same find-skills bootstrap) and would pass an
	// always-sound judge; it fails ONLY because the judge flagged the fabricated rule.
	assert.equal(controlVerdict.observedRoute.bootstrapHelper, STABLE_INVARIANT.bootstrapHelper);
	assert.equal(controlVerdict.verdict, "unsound");
	assert.equal(controlVerdict.expected, "unsound");
	assert.equal(controlVerdict.toolUses, 0);
	assert.equal(controlVerdict.constructed, true);
	// The fabrication: find-skills "executes the test suite / validates the routing table" — a behavior
	// the governing rules (a no-op-able inventory bootstrap) do not support.
	assert.match(controlVerdict.reasonSummary, /executes this repo s test suite|validates that the AGENTS\.md routing table/);
});

test("provenance honesty: the graded live reasoning is byte-identical to the checked-in capture", () => {
	assert.equal(liveVerdict.reasonSummary, captureEvaluation.routingDecision.reasonSummary);
});
