// End-to-end proof that the reasoning-soundness JUDGE TIER grades the REAL cautilus-agent skill
// surface: `cautilus evaluate fixture --adapter-name self-dogfood-skill-judge-eval` runs the skill
// runner (run-local-skill-test.mjs over the checked-in no-input orientation fixture-results) and then
// the enricher, so a skill case passes only when the deterministic surface matchers AND the judge both
// hold. The baseline grades the skill runner's GENUINE captured orientation reasoning (provenance
// full-runner-capture-replay), and a surface-clean-wrong-reason control fails solely via the judge.
// The skill payload is FLAT (no expectationResults), so reasoningSoundness is asserted directly on the
// evaluation. Heavy (shells out to the Go binary), so it lives in the on-demand suite.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const CAUTILUS_BIN = join(REPO_ROOT, "bin", "cautilus");
const FIXTURE_DIR = join(REPO_ROOT, "fixtures", "eval", "dev", "skill");
const BASELINE_ID = "execution-cautilus-no-input-claim-discovery-status";
const CONTROL_ID = "skill-orientation-reason-control";

function readFixture(name) {
	return JSON.parse(readFileSync(join(FIXTURE_DIR, name), "utf-8"));
}

// AC4: the graded baseline reasoning must be byte-identical to the genuine skill capture checked in over
// the hand-authored stand-in, so the gate cannot silently drift back to a synthetic summary and still
// claim full-runner provenance.
test("the graded baseline reasoning is byte-identical to the genuine skill capture (provenance is honest)", () => {
	const calibration = readFixture("reasoning-soundness-calibration.dev-skill-no-input-orientation.json");
	const capture = readFixture("internal-runner-fixture-results.json");
	const baseline = calibration.cases.find((c) => c.id === BASELINE_ID);
	assert.ok(baseline, "the calibration must carry the no-input orientation baseline case");
	assert.equal(
		baseline.summary,
		capture[BASELINE_ID].summary,
		"baseline summary must equal internal-runner-fixture-results.json[no-input].summary (the genuine capture)",
	);
});

// The judge grades the calibration's summary, but the packet DISPLAYS the fixture-results summary; they
// are joined only by caseId. Pin displayed === graded for every case so the packet can never show one
// reasoning while the verdict was computed for a different (stale) one.
test("every case's displayed reasoning (fixture-results) is byte-identical to the graded reasoning (calibration)", () => {
	const calibration = readFixture("reasoning-soundness-calibration.dev-skill-no-input-orientation.json");
	const fixtureResults = readFixture("skill-judge-eval-fixture-results.json");
	for (const c of calibration.cases) {
		const displayed = fixtureResults[c.id]?.summary;
		assert.ok(displayed, `fixture-results must carry an observed summary for ${c.id}`);
		assert.equal(
			displayed,
			c.summary,
			`${c.id}: the displayed (fixture-results) reasoning must equal the graded (calibration) reasoning, or the verdict is for a different reasoning than the packet shows`,
		);
	}
});

test("cautilus evaluate grades the real skill orientation reasoning and ANDs the judge tier with the surface matchers", () => {
	const outputDir = mkdtempSync(join(tmpdir(), "skill-judge-dogfood-"));
	try {
		const result = spawnSync(
			CAUTILUS_BIN,
			["evaluate", "fixture", "--repo-root", ".", "--adapter-name", "self-dogfood-skill-judge-eval", "--output-dir", outputDir],
			{ cwd: REPO_ROOT, encoding: "utf-8", env: process.env },
		);
		assert.equal(result.status, 0, `cautilus evaluate failed: ${result.stderr || result.stdout}`);

		const summary = JSON.parse(readFileSync(join(outputDir, "eval-summary.json"), "utf-8"));
		// One real case passes, one constructed control fails -> reject.
		assert.equal(summary.recommendation, "reject", "the eval must reject when the control regresses");
		assert.equal(summary.evaluationCounts.passed, 1, "only the genuine baseline should pass");
		assert.equal(summary.evaluationCounts.failed, 1, "the surface-clean-wrong-reason control should fail");

		// The judge tier is actually exercised on both skill cases (FLAT skill payload -> top-level judgeSummary).
		assert.equal(summary.judgeSummary.evaluationsWithReasoningJudge, 2);
		assert.equal(summary.judgeSummary.reasoningSound, 1);
		assert.equal(summary.judgeSummary.reasoningUnsound, 1);

		const byId = new Map(summary.evaluations.map((e) => [e.evaluationId, e]));

		// Baseline: the GENUINE captured orientation reasoning. The case status is passed — which already
		// requires the surface part to pass AND the judge to be sound (an unsound judge would override the
		// status to failed) — with full-runner provenance: the judge grades the real skill target.
		const baseline = byId.get(BASELINE_ID);
		assert.equal(baseline.status, "passed");
		assert.ok(!baseline.summary.includes("Expectation failure"), "the baseline's surface matchers pass (no expectation-failure appended)");
		assert.equal(baseline.reasoningSoundness.status, "passed");
		assert.equal(baseline.reasoningSoundness.verdict, "sound");
		assert.equal(baseline.reasoningSoundness.provenance, "full-runner-capture-replay");
		assert.equal(baseline.reasoningSoundness.codeFacets.held_no_input_orientation, true);

		// Control: surface-clean, fabricated rule. The deterministic surface matchers PASS (the runner
		// appends an "Expectation failure" note only when a matcher fails, and the control's summary carries
		// none) and the code facet PASSES (the orientation is held); the case fails ONLY because the judge
		// tier flagged the fabricated "status auto-refreshes claim state" reason — the regression a
		// fragment/outcome check misses, now caught on the real skill surface inside `cautilus evaluate`.
		const control = byId.get(CONTROL_ID);
		assert.equal(control.status, "failed");
		assert.ok(!control.summary.includes("Expectation failure"), "the control's surface matchers pass; only the judge fails it");
		assert.equal(control.reasoningSoundness.status, "failed", "the judge tier is the sole gate on the control");
		assert.equal(control.reasoningSoundness.verdict, "unsound");
		assert.equal(control.reasoningSoundness.provenance, "full-runner-capture-replay");
		assert.equal(control.reasoningSoundness.codeFacets.held_no_input_orientation, true, "the control's orientation is held; code alone would pass it");
	} finally {
		rmSync(outputDir, { recursive: true, force: true });
	}
});
