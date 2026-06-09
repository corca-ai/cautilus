import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
	JUDGE_RUBRIC_SCHEMA,
	buildJudgePrompt,
	compareVerdicts,
	listCalibrationFixtures,
	loadCalibration,
} from "./reasoning-soundness-judge.mjs";

const FIXTURE_DIR = join(process.cwd(), "fixtures/eval/dev/repo");
const CALIBRATION_PATH = join(FIXTURE_DIR, "reasoning-soundness-calibration.json");

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
	const prompt = buildJudgePrompt(calibration, control);
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

test("the harness generalizes: the registry holds more than one claim, each with a claimId", () => {
	const fixtures = listCalibrationFixtures(FIXTURE_DIR);
	assert.ok(fixtures.length >= 2, "expected the judge to be exercised on at least two claims");
	const claimIds = new Set();
	for (const f of fixtures) {
		const calibration = loadCalibration(f.calibrationPath);
		assert.ok(calibration.claimId, `${f.file} must carry a claimId`);
		claimIds.add(calibration.claimId);
	}
	assert.equal(claimIds.size, fixtures.length, "each claim fixture must have a distinct claimId");
});

// Deterministic replay of the one-time blind judge capture (the prove-then-project gate),
// across EVERY claim in the registry. Each claim's captured verdicts must pass its own gate.
// A claim with no capture yet is reported and skipped, so the suite stays green before a run.
test("captured blind-judge verdicts replay green for every claim in the registry", () => {
	const fixtures = listCalibrationFixtures(FIXTURE_DIR);
	let replayed = 0;
	for (const f of fixtures) {
		if (!existsSync(f.verdictsPath)) {
			console.log(`  (skipped ${f.file}: verdicts not captured yet)`);
			continue;
		}
		const calibration = loadCalibration(f.calibrationPath);
		const captured = JSON.parse(readFileSync(f.verdictsPath, "utf-8"));
		const verdicts = Array.isArray(captured) ? captured : captured.verdicts;
		const expectation = (!Array.isArray(captured) && captured.calibrationExpectation) || "pass";
		const result = compareVerdicts(calibration, verdicts);
		if (expectation === "pass") {
			assert.equal(
				result.passed,
				true,
				`${calibration.claimId}: captured judge did not pass calibration: ${JSON.stringify({ mismatches: result.mismatches, missing: result.missing, rubberStampSuspected: result.rubberStampSuspected })}`,
			);
		} else {
			// A claim whose judge is recorded as NOT yet passing (e.g. an ambiguous facet the judge
			// applies inconsistently). The gate documents the failure honestly; if a later fix makes
			// it pass, this assert trips so the claim gets promoted to a passing gate.
			assert.equal(
				result.passed,
				false,
				`${calibration.claimId}: marked '${expectation}' but the captured judge now PASSES — promote it to a passing gate and drop calibrationExpectation.`,
			);
			console.log(`  (${calibration.claimId}: judge calibration NOT passing, as recorded [${expectation}] — mismatches ${JSON.stringify(result.mismatches)})`);
		}
		replayed += 1;
	}
	assert.ok(replayed >= 1, "expected at least one claim to have a captured judge replay");
});
