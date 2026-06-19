// End-to-end proof that the reasoning-soundness JUDGE TIER grades the REAL dogfood surface:
// `cautilus evaluate fixture --adapter-name self-dogfood-realsurface-judge-eval` runs the full
// real-surface dogfood path (run-self-dogfood-eval.mjs over the checked-in AGENTS.md) and then the
// judge tier, so a case passes only when the deterministic surface matchers AND the judge both hold.
// The baseline grades the dogfood runner's GENUINE captured reasoning (provenance
// full-runner-capture-replay), and a right-route-wrong-reason control fails solely via the judge.
// Heavy (it sets up a worktree and shells out to the Go binary), so it lives in the on-demand suite.

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
const FIXTURE_DIR = join(REPO_ROOT, "fixtures", "eval", "dev", "repo");

// AC3: the graded baseline reasoning must be byte-identical to the real full-runner capture, so the
// gate cannot silently drift back to a synthetic paraphrase and still claim full-runner provenance.
test("the graded baseline reasoning is byte-identical to the real full-runner capture (provenance is honest)", () => {
	const calibration = JSON.parse(
		readFileSync(join(FIXTURE_DIR, "reasoning-soundness-calibration.dev-repo-realsurface-routing.json"), "utf-8"),
	);
	const realCapture = JSON.parse(readFileSync(join(FIXTURE_DIR, "internal-runner-fixture-results.json"), "utf-8"));
	const baseline = calibration.cases.find((c) => c.id === "checked-in-agents-routing");
	assert.ok(baseline, "the calibration must carry the checked-in-agents-routing baseline case");
	assert.equal(
		baseline.reasonSummary,
		realCapture["checked-in-agents-routing"].routingDecision.reasonSummary,
		"baseline reasonSummary must equal internal-runner-fixture-results.json[\"checked-in-agents-routing\"].routingDecision.reasonSummary",
	);
});

// The judge grades the calibration's reasonSummary, but the packet DISPLAYS the fixture-results
// reasonSummary; they are joined only by caseId. Pin displayed === graded for every case so the
// packet can never show one reasoning while the verdict was computed for a different (stale) one.
test("every case's displayed reasoning (fixture-results) is byte-identical to the graded reasoning (calibration)", () => {
	const calibration = JSON.parse(
		readFileSync(join(FIXTURE_DIR, "reasoning-soundness-calibration.dev-repo-realsurface-routing.json"), "utf-8"),
	);
	const fixtureResults = JSON.parse(readFileSync(join(FIXTURE_DIR, "realsurface-judge-eval-fixture-results.json"), "utf-8"));
	for (const c of calibration.cases) {
		const displayed = fixtureResults[c.id]?.routingDecision?.reasonSummary;
		assert.ok(displayed, `fixture-results must carry an observed reasonSummary for ${c.id}`);
		assert.equal(
			displayed,
			c.reasonSummary,
			`${c.id}: the displayed (fixture-results) reasoning must equal the graded (calibration) reasoning, or the verdict is for a different reasoning than the packet shows`,
		);
	}
});

test("cautilus evaluate grades the real dogfood reasoning and ANDs the judge tier with the surface matchers", () => {
	const outputDir = mkdtempSync(join(tmpdir(), "realsurface-judge-dogfood-"));
	try {
		const result = spawnSync(
			CAUTILUS_BIN,
			["evaluate", "fixture", "--repo-root", ".", "--adapter-name", "self-dogfood-realsurface-judge-eval", "--output-dir", outputDir],
			{ cwd: REPO_ROOT, encoding: "utf-8", env: process.env },
		);
		assert.equal(result.status, 0, `cautilus evaluate failed: ${result.stderr || result.stdout}`);

		const summary = JSON.parse(readFileSync(join(outputDir, "eval-summary.json"), "utf-8"));
		// One real case passes, one constructed control fails -> reject.
		assert.equal(summary.recommendation, "reject", "the eval must reject when the control regresses");
		assert.equal(summary.evaluationCounts.passed, 1, "only the real baseline should pass");
		assert.equal(summary.evaluationCounts.failed, 1, "the right-route-wrong-reason control should fail");

		// The judge tier is actually exercised on both real-surface cases.
		assert.equal(summary.judgeSummary.evaluationsWithReasoningJudge, 2);
		assert.equal(summary.judgeSummary.reasoningSound, 1);
		assert.equal(summary.judgeSummary.reasoningUnsound, 1);

		const byId = new Map(summary.evaluations.map((e) => [e.evaluationId, e]));

		// Baseline: the GENUINE captured reasoning. Deterministic surface matchers pass AND the judge is
		// sound, with full-runner provenance — this is the convergence: the judge grades the real target.
		const baseline = byId.get("checked-in-agents-routing");
		assert.equal(baseline.status, "passed");
		assert.equal(baseline.expectationResults.entryFile.status, "passed");
		assert.equal(baseline.expectationResults.routing.status, "passed");
		assert.equal(baseline.expectationResults.reasoningSoundness.status, "passed");
		assert.equal(baseline.expectationResults.reasoningSoundness.verdict, "sound");
		assert.equal(baseline.expectationResults.reasoningSoundness.provenance, "full-runner-capture-replay");

		// Control: right route, fabricated reason. The deterministic surface matchers PASS, and the case
		// fails ONLY because the judge tier flagged the reasoning — the regression a token/route check
		// misses, now caught on the real dogfood surface inside `cautilus evaluate`.
		const control = byId.get("realsurface-reason-control");
		assert.equal(control.status, "failed");
		assert.equal(control.expectationResults.entryFile.status, "passed", "the control's entry file is correct; surface matchers pass it");
		assert.equal(control.expectationResults.routing.status, "passed", "the control's route is correct; deterministic matchers pass it");
		assert.equal(control.expectationResults.reasoningSoundness.status, "failed", "the judge tier is the sole gate on the control");
		assert.equal(control.expectationResults.reasoningSoundness.verdict, "unsound");
		assert.equal(control.expectationResults.reasoningSoundness.provenance, "full-runner-capture-replay");
	} finally {
		rmSync(outputDir, { recursive: true, force: true });
	}
});
