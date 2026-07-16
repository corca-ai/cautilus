// Deterministic standing gate for the on-demand Behavior Evaluation live proof.
//
// This replays the checked-in operator-witnessed live capture through the SAME assertLiveInvariant()
// the live driver uses, so the displayed invariant and the graded invariant cannot drift. It runs no
// live agent (it belongs to test:on-demand, never to standing verify's live cost). The live driver
// itself is behavior-eval-live-proof.mjs (npm run proof:behavior-eval:live).
//
// The stable invariant is the durable floor that survived the 2026-07-16 find-skills retirement realign
// (docs/contracts/find-skills-retirement-realign.md): the agent oriented on AGENTS.md and routed to the
// correct durable WORK skill (charness:impl). find-skills was retired upstream 2026-07-13, so under the
// realigned AGENTS.md the live agent issues no mandatory startup bootstrap (PQ1 Branch B: bootstrapHelper
// =none); the bootstrap sub-assertion is dropped and the load-bearing discrimination is the blind judge.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { assertLiveInvariant, STABLE_INVARIANT } from "./behavior-eval-live-proof.mjs";

function readJson(relPath) {
	return JSON.parse(readFileSync(fileURLToPath(new URL(relPath, import.meta.url)), "utf-8"));
}

const capture = readJson("../../fixtures/eval/dev/repo/live/behavior-eval-live-capture.json");
const captureRerun = readJson("../../fixtures/eval/dev/repo/live/behavior-eval-live-capture-rerun.json");
const verdicts = readJson("../../fixtures/eval/dev/repo/live/behavior-eval-live-verdicts.json");

const captureEvaluation = capture.evaluations[0];
const rerunEvaluation = captureRerun.evaluations[0];
const liveVerdict = verdicts.verdicts.find((v) => v.kind === "real-live-capture");
const controlVerdict = verdicts.verdicts.find((v) => v.kind === "judge-control-semantic");

test("the checked-in live capture holds the stable invariant (AGENTS.md -> charness:impl work skill)", () => {
	const evidence = assertLiveInvariant(captureEvaluation);
	assert.equal(evidence.entryFile, STABLE_INVARIANT.entryFile);
	assert.equal(evidence.workSkill, STABLE_INVARIANT.workSkill);
	// The capture is a genuine live claude/Sonnet run (provenance honesty), not a fixture stand-in.
	assert.equal(capture.provenance.kind, "live-agent-capture");
	assert.equal(captureEvaluation.telemetry.runtime, "claude_code");
	assert.match(captureEvaluation.telemetry.model, /sonnet/);
});

test("two independent live runs both hold the invariant with genuinely differing reasoning", () => {
	// Both checked-in captures are separate live claude/Sonnet invocations this session.
	assertLiveInvariant(captureEvaluation);
	assertLiveInvariant(rerunEvaluation);
	assert.equal(captureRerun.provenance.kind, "live-agent-capture");
	assert.equal(rerunEvaluation.telemetry.runtime, "claude_code");
	// The reasoning text differs run to run (genuinely live, non-deterministic) while the routing
	// invariant does not — the proof is live, not a replayed fluke.
	assert.notEqual(
		captureEvaluation.routingDecision.reasonSummary,
		rerunEvaluation.routingDecision.reasonSummary,
	);
});

test("assertLiveInvariant fails loudly when the agent routes to the wrong work skill", () => {
	const regressed = {
		...captureEvaluation,
		routingDecision: { ...captureEvaluation.routingDecision, workSkill: "charness:debug" },
	};
	assert.throws(() => assertLiveInvariant(regressed), /did not route to the charness:impl work skill/);
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

test("the blind judge is load-bearing: it alone rejects a route-correct, reason-fabricated control", () => {
	// The composite case status is (the deterministic route passes) AND (the judge verdict is sound).
	// Modelled locally so the load-bearing property is asserted mechanically, not just narrated.
	// Branch B (find-skills retired): the pinned route dimension is the WORK skill, not a bootstrap.
	const compositePasses = (routePasses, judgeVerdict) => routePasses && judgeVerdict === "sound";
	const routePasses = controlVerdict.observedRoute.workSkill === STABLE_INVARIANT.workSkill;

	assert.equal(routePasses, true); // the control passes the deterministic route
	assert.equal(controlVerdict.verdict, "unsound");
	assert.equal(controlVerdict.expected, "unsound");
	assert.equal(controlVerdict.toolUses, 0);
	assert.equal(controlVerdict.constructed, true);

	// Mechanical proof the judge is the SOLE gate: an always-sound judge would pass the control
	// (route passes), but the real judge's unsound verdict fails it.
	assert.equal(compositePasses(routePasses, "sound"), true); // always-sound judge => would pass
	assert.equal(compositePasses(routePasses, controlVerdict.verdict), false); // real judge => fails

	// The fabrication: charness catalog list "executes the verify suite / regenerates the skill catalog"
	// as a mandatory startup gate — a behavior the governing rules (a read-only, conditional inventory)
	// do not support.
	assert.match(controlVerdict.reasonSummary, /regenerates the installed skill catalog|executes the repo.s full verify suite/);
});

test("provenance honesty: the graded live reasoning is byte-identical to the checked-in capture", () => {
	assert.equal(liveVerdict.reasonSummary, captureEvaluation.routingDecision.reasonSummary);
});
