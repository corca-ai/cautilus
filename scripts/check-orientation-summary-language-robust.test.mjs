import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
	collectViolations,
	findSuiteViolations,
	isNoInputOrientationCase,
	runCli,
} from "./check-orientation-summary-language-robust.mjs";

function capture() {
	const chunks = [];
	return { write: (chunk) => chunks.push(chunk), text: () => chunks.join("") };
}

const ORIENTATION_PROMPT =
	"Use $cautilus-agent with no more task detail on this repo. Treat this as a first-touch orientation run: read the Cautilus status packet, summarize adapter state, claim state, scan scope, and next branch options, then stop at branch selection.";
// The bounded-improvement held-out variant: withholds the orientation recipe (no explicit signature),
// matched verbatim from fixtures/eval/dev/skill/improve/skill-orientation-improve.fixture.json.
const HELD_OUT_IMPROVE_PROMPT =
	"Use $cautilus-agent on this repo. I have not given you a specific task yet — do whatever your skill says to do first when it is invoked without a task, then stop and wait for me.";
const EVAL_FIXTURE_PROMPT =
	"Use $cautilus-agent to run the checked-in dev/skill eval fixture with the fixture runtime and summarize the recommendation.";

test("isNoInputOrientationCase matches the no-input orientation prompt and not the eval-fixture prompt", () => {
	assert.equal(isNoInputOrientationCase({ prompt: ORIENTATION_PROMPT }), true);
	assert.equal(isNoInputOrientationCase({ prompt: EVAL_FIXTURE_PROMPT }), false);
	assert.equal(isNoInputOrientationCase({}), false);
	// Calibration-style entries (no prompt, just a recorded summary) are not orientation CASES.
	assert.equal(isNoInputOrientationCase({ summary: "ran doctor status" }), false);
});

test("isNoInputOrientationCase matches the held-out improve variant that withholds the recipe", () => {
	// The held-out prompt cannot carry ORIENTATION_PROMPT_SIGNATURE (it deliberately omits the recipe),
	// but it is still a no-input orientation case and must be guarded against brittle summary matchers.
	assert.equal(isNoInputOrientationCase({ prompt: HELD_OUT_IMPROVE_PROMPT }), true);
	// The eval-fixture prompt still does not match either signature.
	assert.equal(isNoInputOrientationCase({ prompt: EVAL_FIXTURE_PROMPT }), false);
	// Cross-non-contamination: the two signatures stay disjoint — neither prompt matches the other's tokens.
	assert.equal(HELD_OUT_IMPROVE_PROMPT.toLowerCase().includes("first-touch orientation"), false);
	assert.equal(ORIENTATION_PROMPT.toLowerCase().includes("do whatever your skill says to do first"), false);
});

test("the real improve held-out fixture keeps the language-independent command guards (AC1)", () => {
	// Reads the actual checked-in fixture so the gate cannot silently drop the command guards that now
	// carry seed-FAIL after the English requiredSummaryFragments were removed.
	const fixturePath = resolve(
		fileURLToPath(new URL("../fixtures/eval/dev/skill/improve/skill-orientation-improve.fixture.json", import.meta.url)),
	);
	const fixture = JSON.parse(readFileSync(fixturePath, "utf-8"));
	const testCase = fixture.cases[0];
	assert.equal(isNoInputOrientationCase(testCase), true);
	assert.ok(!Array.isArray(testCase.requiredSummaryFragments) || testCase.requiredSummaryFragments.length === 0);
	assert.ok(Array.isArray(testCase.requiredCommandFragments) && testCase.requiredCommandFragments.includes("doctor status"));
	assert.ok(Array.isArray(testCase.forbiddenCommandFragments) && testCase.forbiddenCommandFragments.includes("--next-action"));
});

test("findSuiteViolations flags a held-out improve case that re-introduces requiredSummaryFragments", () => {
	const parsed = {
		cases: [
			{
				caseId: "execution-cautilus-no-input-claim-discovery-status",
				prompt: HELD_OUT_IMPROVE_PROMPT,
				requiredSummaryFragments: ["adapter", "claim", "branch"],
			},
		],
	};
	const violations = findSuiteViolations("improve.fixture.json", parsed);
	assert.equal(violations.length, 1);
	assert.deepEqual(violations[0].fragments, ["adapter", "claim", "branch"]);
});

test("findSuiteViolations passes the held-out improve case once it relies on command guards only", () => {
	const parsed = {
		cases: [
			{
				caseId: "execution-cautilus-no-input-claim-discovery-status",
				prompt: HELD_OUT_IMPROVE_PROMPT,
				requiredCommandFragments: ["doctor status"],
				forbiddenCommandFragments: ["--next-action"],
			},
		],
	};
	assert.deepEqual(findSuiteViolations("improve.fixture.json", parsed), []);
});

test("findSuiteViolations flags an orientation case that declares requiredSummaryFragments", () => {
	const parsed = {
		cases: [
			{
				caseId: "execution-cautilus-no-input-claim-discovery-status",
				prompt: ORIENTATION_PROMPT,
				requiredSummaryFragments: ["adapter", "claim", "next branch"],
			},
		],
	};
	const violations = findSuiteViolations("cases.json", parsed);
	assert.equal(violations.length, 1);
	assert.equal(violations[0].caseId, "execution-cautilus-no-input-claim-discovery-status");
	assert.deepEqual(violations[0].fragments, ["adapter", "claim", "next branch"]);
});

test("findSuiteViolations passes an orientation case with no requiredSummaryFragments", () => {
	const parsed = {
		cases: [
			{
				caseId: "execution-cautilus-no-input-claim-discovery-status",
				prompt: ORIENTATION_PROMPT,
				requiredCommandFragments: ["doctor status"],
				forbiddenSummaryFragments: ["eval 실행"],
			},
		],
	};
	assert.deepEqual(findSuiteViolations("cases.json", parsed), []);
});

test("findSuiteViolations does not flag a non-orientation case that uses a language-neutral required fragment", () => {
	const parsed = {
		cases: [
			{
				caseId: "execution-cautilus-test-request",
				prompt: EVAL_FIXTURE_PROMPT,
				requiredSummaryFragments: ["accept-now"],
			},
		],
	};
	assert.deepEqual(findSuiteViolations("cases.json", parsed), []);
});

test("findSuiteViolations ignores files without a cases array", () => {
	assert.deepEqual(findSuiteViolations("verdicts.json", { verdicts: [] }), []);
	assert.deepEqual(findSuiteViolations("results.json", { "execution-x": { outcome: "passed" } }), []);
});

test("the checked-in skill eval fixtures carry no orientation-summary language brittleness", () => {
	const fixturesRoot = resolve(fileURLToPath(new URL("../fixtures/eval", import.meta.url)));
	assert.deepEqual(collectViolations(fixturesRoot), []);
});

test("runCli returns 0 and writes OK on the clean repo fixtures", () => {
	const fixturesRoot = resolve(fileURLToPath(new URL("../fixtures/eval", import.meta.url)));
	const out = capture();
	const err = capture();
	const code = runCli(fixturesRoot, { stdout: out, stderr: err });
	assert.equal(code, 0);
	assert.match(out.text(), /OK/);
	assert.equal(err.text(), "");
});

test("runCli returns 1, reports each violation, descends nested dirs, and surfaces unparseable JSON", () => {
	const root = mkdtempSync(join(tmpdir(), "orientation-lint-"));
	const nested = join(root, "nested");
	mkdirSync(nested, { recursive: true });
	// a clean orientation case in a nested dir exercises the recursive walk without adding a violation.
	writeFileSync(join(nested, "clean.json"), JSON.stringify({
		cases: [{ caseId: "ok", prompt: ORIENTATION_PROMPT, requiredCommandFragments: ["doctor status"] }],
	}));
	// a violating orientation case.
	writeFileSync(join(root, "bad.json"), JSON.stringify({
		cases: [{
			caseId: "execution-cautilus-no-input-claim-discovery-status",
			prompt: ORIENTATION_PROMPT,
			requiredSummaryFragments: ["adapter", "claim", "next branch"],
		}],
	}));
	// an unparseable file must be surfaced as its own violation, never silently skipped.
	writeFileSync(join(root, "broken.json"), "{ not valid json");
	const err = capture();
	const code = runCli(root, { stdout: capture(), stderr: err });
	assert.equal(code, 1);
	assert.match(err.text(), /FAIL/);
	assert.match(err.text(), /execution-cautilus-no-input-claim-discovery-status/);
	assert.match(err.text(), /broken\.json/);
});

test("collectViolations returns [] for a non-existent directory", () => {
	assert.deepEqual(collectViolations(join(tmpdir(), "orientation-lint-absent-xyz-404")), []);
});
