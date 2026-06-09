import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
	JUDGE_RUBRIC_SCHEMA,
	buildJudgePrompt,
	compareVerdicts,
	loadCalibration,
} from "./reasoning-soundness-judge.mjs";

const CALIBRATION_PATH = join(process.cwd(), "fixtures/eval/dev/repo/reasoning-soundness-calibration.json");
const VERDICTS_PATH = join(process.cwd(), "fixtures/eval/dev/repo/reasoning-soundness-judge-verdicts.json");

function soundVerdict(caseId, confidence = 0.9) {
	return {
		caseId,
		verdict: "sound",
		facets: { cites_governing_rule: true, rule_application_correct: true, no_unsupported_claim: true },
		confidence,
		evidence: "cites the governing rule",
	};
}

function perfectVerdicts(calibration) {
	return calibration.cases.map((c) =>
		c.expectedVerdict === "sound"
			? soundVerdict(c.id)
			: {
					caseId: c.id,
					verdict: "unsound",
					facets: { cites_governing_rule: true, rule_application_correct: false, no_unsupported_claim: false },
					confidence: 0.95,
					evidence: "acknowledges the rule then dismisses it",
				},
	);
}

test("calibration fixture loads and is real-grounded with a rubber-stamp control", () => {
	const calibration = loadCalibration(CALIBRATION_PATH);
	assert.ok(calibration.cases.length >= 5, "expected at least 5 calibration cases");
	const real = calibration.cases.filter((c) => c.kind === "real-harvest");
	assert.ok(real.length >= 4, "expected the sound side to be real harvested reasonings");
	const controls = calibration.cases.filter((c) => c.expectedVerdict === "unsound");
	assert.equal(controls.length >= 1, true, "expected at least one known-unsound control so the gate is not vacuous");
});

test("buildJudgePrompt never leaks the expected verdict, rationale, or case kind", () => {
	const calibration = loadCalibration(CALIBRATION_PATH);
	const control = calibration.cases.find((c) => c.expectedVerdict === "unsound");
	const prompt = buildJudgePrompt(calibration.governingRules, control);
	assert.ok(!prompt.includes(control.rationale), "rationale must not leak into the blind prompt");
	assert.ok(!prompt.includes("expectedVerdict"), "expectedVerdict must not leak");
	assert.ok(!prompt.includes("RUBBER-STAMP"), "the control's tell-tale rationale must not leak");
	assert.ok(!prompt.includes("judge-control-not-a-behavior-sample"), "case kind must not leak");
	assert.ok(prompt.includes(control.reasonSummary), "the reasoning under judgement must be present");
	assert.ok(prompt.includes("startup_bootstrap"), "the governing rules must be present");
});

test("a perfect judge passes the calibration gate", () => {
	const calibration = loadCalibration(CALIBRATION_PATH);
	const result = compareVerdicts(calibration, perfectVerdicts(calibration));
	assert.equal(result.passed, true);
	assert.equal(result.matched, result.total);
	assert.equal(result.rubberStampSuspected, false);
	assert.equal(result.mismatches.length, 0);
});

test("a rubber-stamp judge (always 'sound') fails on the control tripwire", () => {
	const calibration = loadCalibration(CALIBRATION_PATH);
	const stamped = calibration.cases.map((c) => soundVerdict(c.id));
	const result = compareVerdicts(calibration, stamped);
	assert.equal(result.passed, false, "an all-sound judge must not pass");
	assert.equal(result.rubberStampSuspected, true, "the control case makes rubber-stamping detectable");
	assert.ok(result.mismatches.some((m) => m.expected === "unsound"));
});

test("a missing verdict fails the gate rather than passing silently", () => {
	const calibration = loadCalibration(CALIBRATION_PATH);
	const partial = perfectVerdicts(calibration).slice(1);
	const result = compareVerdicts(calibration, partial);
	assert.equal(result.passed, false);
	assert.ok(result.missing.length >= 1);
});

test("the rubric schema pins the structured facets (not free prose)", () => {
	assert.deepEqual(
		Object.keys(JUDGE_RUBRIC_SCHEMA.properties.facets.properties).sort(),
		["cites_governing_rule", "no_unsupported_claim", "rule_application_correct"],
	);
	assert.deepEqual(JUDGE_RUBRIC_SCHEMA.properties.verdict.enum, ["sound", "unsound"]);
});

// Deterministic replay of the one-time blind judge capture (the prove-then-project gate).
// Skips cleanly until the capture exists, so the suite is green before the judge has been run.
test("captured blind-judge verdicts replay green against the calibration gate", () => {
	if (!existsSync(VERDICTS_PATH)) {
		console.log("  (skipped: reasoning-soundness-judge-verdicts.json not captured yet)");
		return;
	}
	const calibration = loadCalibration(CALIBRATION_PATH);
	const captured = JSON.parse(readFileSync(VERDICTS_PATH, "utf-8"));
	const verdicts = Array.isArray(captured) ? captured : captured.verdicts;
	const result = compareVerdicts(calibration, verdicts);
	assert.equal(
		result.passed,
		true,
		`captured judge did not pass calibration: ${JSON.stringify({ mismatches: result.mismatches, missing: result.missing, rubberStampSuspected: result.rubberStampSuspected })}`,
	);
});
