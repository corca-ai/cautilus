import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
	FORMAT_FACET_CHECKERS,
	JUDGE_RUBRIC_SCHEMA,
	buildJudgePrompt,
	compareVerdicts,
	computeCodeFacets,
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

// --- Facet decomposition (the code+intelligence harmony) -------------------------------------
// A claim that declares `codeFacets` routes its deterministic format facets to CODE and leaves only
// the semantic verdict to the judge; the composite verdict ANDs them. These tests pin that logic on
// synthetic data so they do not depend on any captured judge run.

const DECOMPOSED_CALIBRATION = {
	schemaVersion: "cautilus.reasoning_soundness_calibration.v1",
	claimId: "synthetic-decomposed",
	codeFacets: ["language_korean", "no_bullet_or_numbered_lists", "has_요약_line", "answer_body_is_one_paragraph", "within_stated_char_limit"],
	cases: [
		{
			id: "ok",
			userTurn: "한국어로, 목록 없이 한 문단으로, 마지막에 '요약:' 한 줄, 전체 200자 이내로. 질문: 차이가 뭐야?",
			assistantResponse: "회귀 테스트와 스모크 테스트는 목적이 다릅니다.\n\n요약: 둘은 목적이 다릅니다.",
			expectedVerdict: "sound",
		},
		{
			id: "too-long",
			userTurn: "한국어로, 목록 없이 한 문단으로, 마지막에 '요약:' 한 줄, 전체 30자 이내로. 질문: 차이가 뭐야?",
			assistantResponse: "회귀 테스트와 스모크 테스트는 목적이 서로 다른 품질 보증 활동입니다.\n\n요약: 둘은 목적이 다릅니다.",
			expectedVerdict: "unsound",
		},
	],
};

test("computeCodeFacets runs the deterministic format checkers a claim opts into", () => {
	const facetsOk = computeCodeFacets(DECOMPOSED_CALIBRATION, DECOMPOSED_CALIBRATION.cases[0]);
	assert.deepEqual(Object.keys(facetsOk).sort(), [...DECOMPOSED_CALIBRATION.codeFacets].sort());
	assert.equal(Object.values(facetsOk).every(Boolean), true, "the compliant case passes every code facet");

	const facetsLong = computeCodeFacets(DECOMPOSED_CALIBRATION, DECOMPOSED_CALIBRATION.cases[1]);
	assert.equal(facetsLong.within_stated_char_limit, false, "the over-length case fails only the length facet");
	assert.equal(facetsLong.language_korean, true);
	assert.equal(facetsLong.answer_body_is_one_paragraph, true, "the 요약 line is exempt from the one-paragraph count");
});

test("the answer-paragraph-plus-요약 structure counts as one paragraph (the sc4 disambiguation)", () => {
	// The exact structure the judge inconsistently rejected: one answer paragraph, a blank line, a 요약 line.
	const c = { assistantResponse: "이것은 한 문단짜리 답변입니다.\n\n요약: 짧은 요약." };
	assert.equal(FORMAT_FACET_CHECKERS.answer_body_is_one_paragraph(c), true);
	// Two real body paragraphs (before 요약) must fail.
	const two = { assistantResponse: "첫 문단.\n\n둘째 문단.\n\n요약: 요약." };
	assert.equal(FORMAT_FACET_CHECKERS.answer_body_is_one_paragraph(two), false);
});

test("composite verdict ANDs code facets with the judge's semantic verdict", () => {
	// Judge says both cases are semantically sound; code alone supplies the over-length negative.
	const judge = [
		{ caseId: "ok", verdict: "sound", confidence: 0.9 },
		{ caseId: "too-long", verdict: "sound", confidence: 0.9 },
	];
	const result = compareVerdicts(DECOMPOSED_CALIBRATION, judge);
	assert.equal(result.passed, true, "code catches the length negative even though the judge said sound");
	assert.equal(result.matched, 2);
	assert.equal(result.rubberStampSuspected, false, "the gate is non-vacuous: a code facet produced the negative");
	const long = result.byCase.find((b) => b.caseId === "too-long");
	assert.equal(long.got, "unsound");
	assert.equal(long.judgeVerdict, "sound");
	assert.equal(long.codeFacets.within_stated_char_limit, false);
});

test("composite verdict goes unsound when the JUDGE finds a semantic problem even if code passes", () => {
	const judge = [
		{ caseId: "ok", verdict: "unsound", confidence: 0.9 },
		{ caseId: "too-long", verdict: "sound", confidence: 0.9 },
	];
	const result = compareVerdicts(DECOMPOSED_CALIBRATION, judge);
	// "ok" expects sound but the judge flagged a semantic problem -> composite unsound -> mismatch.
	assert.equal(result.passed, false);
	assert.ok(result.mismatches.some((m) => m.caseId === "ok" && m.got === "unsound"));
});

test("computeCodeFacets rejects an unregistered code facet rather than passing silently", () => {
	assert.throws(() => computeCodeFacets({ codeFacets: ["no_such_checker"] }, { assistantResponse: "x" }), /unknown code facet/);
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
