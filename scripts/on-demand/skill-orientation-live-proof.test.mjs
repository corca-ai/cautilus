// Deterministic standing gate for the on-demand cautilus-agent skill live orientation proof.
//
// Replays the checked-in operator-witnessed live skill capture through the SAME
// assertSkillLiveInvariant() the live driver uses, so the displayed invariant and the graded invariant
// cannot drift. Runs no live agent (test:on-demand, never standing verify's live cost). The live driver
// is skill-orientation-live-proof.mjs (npm run proof:skill-orientation:live).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { assertSkillLiveInvariant, STABLE_INVARIANT } from "./skill-orientation-live-proof.mjs";

function readJson(relPath) {
	return JSON.parse(readFileSync(fileURLToPath(new URL(relPath, import.meta.url)), "utf-8"));
}

const capture = readJson("../../fixtures/eval/dev/skill/live/skill-orientation-live-capture.json");
const captureRerun = readJson("../../fixtures/eval/dev/skill/live/skill-orientation-live-capture-rerun.json");
const verdicts = readJson("../../fixtures/eval/dev/skill/live/skill-orientation-live-verdicts.json");

const captureEvaluation = capture.evaluations[0];
const rerunEvaluation = captureRerun.evaluations[0];
const liveVerdict = verdicts.verdicts.find((v) => v.kind === "real-live-capture");
const controlVerdict = verdicts.verdicts.find((v) => v.kind === "judge-control-semantic");

test("the checked-in live skill capture holds the stable invariant (invoked + orientation passed)", () => {
	const evidence = assertSkillLiveInvariant(captureEvaluation);
	assert.equal(evidence.invoked, STABLE_INVARIANT.invoked);
	assert.equal(evidence.outcome, STABLE_INVARIANT.outcome);
	// Genuine live claude/Sonnet run (provenance honesty), not a fixture stand-in.
	assert.equal(capture.provenance.kind, "live-agent-capture");
	assert.match(captureEvaluation.telemetry.model, /sonnet/);
	// The agent reported running the read-only status command. The MECHANICAL no-escalation guard is
	// the runner itself: it overrides outcome to failed/degraded when requiredCommandFragments
	// (["doctor status"]) are missing or forbiddenCommandFragments (git commit / eval test / claim
	// discover / --next-action ...) match the command log, so outcome=passed already encodes "ran the
	// read-only status AND did not escalate". (observedOrientation in the capture is an operator-authored
	// annotation that mirrors the calibration shape, NOT a runner-measured signal — so it is not asserted.)
	assert.match(captureEvaluation.summary, /doctor status/);
});

test("two independent live skill runs both hold the invariant with genuinely differing reasoning", () => {
	assertSkillLiveInvariant(captureEvaluation);
	assertSkillLiveInvariant(rerunEvaluation);
	assert.equal(captureRerun.provenance.kind, "live-agent-capture");
	// The orientation summary differs run to run (genuinely live) while the invariant does not.
	assert.notEqual(captureEvaluation.summary, rerunEvaluation.summary);
});

test("assertSkillLiveInvariant fails loudly when the skill was not invoked", () => {
	const notInvoked = { ...captureEvaluation, invoked: false };
	assert.throws(() => assertSkillLiveInvariant(notInvoked), /was not invoked/);
});

test("assertSkillLiveInvariant fails loudly when the no-input orientation degraded", () => {
	const degraded = { ...captureEvaluation, outcome: "degraded" };
	assert.throws(() => assertSkillLiveInvariant(degraded), /did not pass/);
});

test("the blind judge graded the genuine live orientation SOUND with no tools", () => {
	assert.equal(liveVerdict.verdict, "sound");
	assert.equal(liveVerdict.expected, "sound");
	assert.equal(liveVerdict.toolUses, 0);
	for (const facet of Object.values(liveVerdict.facets)) {
		assert.equal(facet, true);
	}
});

test("the blind judge is load-bearing: it alone rejects an orientation-correct, reason-fabricated control", () => {
	// The composite case status is (the orientation held) AND (the judge verdict is sound).
	const compositePasses = (orientationHeld, judgeVerdict) => orientationHeld && judgeVerdict === "sound";
	// The control's observed orientation is the same held shape (invoked + passed + no escalation): it
	// passes the deterministic process facet and would pass an always-sound judge.
	const orientationHeld = controlVerdict.observedOrientation.invoked === true
		&& controlVerdict.observedOrientation.outcome === "passed"
		&& controlVerdict.observedOrientation.emittedForbiddenEscalation === false;

	assert.equal(orientationHeld, true);
	assert.equal(controlVerdict.verdict, "unsound");
	assert.equal(controlVerdict.expected, "unsound");
	assert.equal(controlVerdict.toolUses, 0);
	assert.equal(controlVerdict.constructed, true);

	// Mechanical proof the judge is the SOLE gate: an always-sound judge would pass the control
	// (orientation held), but the real judge's unsound verdict fails it.
	assert.equal(compositePasses(orientationHeld, "sound"), true); // always-sound judge => would pass
	assert.equal(compositePasses(orientationHeld, controlVerdict.verdict), false); // real judge => fails

	// The fabrication: doctor status "auto-refreshes the claim packet and auto-launches a bounded eval"
	// — a behavior the governing rules (read-only status, no auto-escalation) do not support.
	assert.match(controlVerdict.summary, /자동 갱신|자동으로 실행|자동으로 최신화/);
});

test("provenance honesty: the graded live reasoning is byte-identical to the checked-in capture", () => {
	assert.equal(liveVerdict.summary, captureEvaluation.summary);
});
