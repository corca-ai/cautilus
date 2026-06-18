// End-to-end proof that the reasoning-soundness JUDGE TIER is wired into the product CLI:
// `cautilus evaluate fixture --adapter-name self-dogfood-routing-regression-eval` runs the
// judge tier and flags the regressed routing variant as worse than the baseline. Heavy (it
// shells out to the Go binary), so it lives in the on-demand suite.

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

test("cautilus evaluate runs the judge tier and flags the regressed routing variant as worse", () => {
	const outputDir = mkdtempSync(join(tmpdir(), "judge-tier-dogfood-"));
	try {
		const result = spawnSync(
			CAUTILUS_BIN,
			["evaluate", "fixture", "--repo-root", ".", "--adapter-name", "self-dogfood-routing-regression-eval", "--output-dir", outputDir],
			{ cwd: REPO_ROOT, encoding: "utf-8", env: process.env },
		);
		assert.equal(result.status, 0, `cautilus evaluate failed: ${result.stderr || result.stdout}`);

		const summary = JSON.parse(readFileSync(join(outputDir, "eval-summary.json"), "utf-8"));
		// The eval flags the regression: failures present -> reject.
		assert.equal(summary.recommendation, "reject", "the eval must reject when a regression is present");
		assert.equal(summary.evaluationCounts.passed, 1, "only the baseline should pass");
		assert.equal(summary.evaluationCounts.failed, 3, "both regressed-skip cases and the control should fail");

		// The judge tier is actually exercised by the product CLI.
		assert.equal(summary.judgeSummary.evaluationsWithReasoningJudge, 4);
		assert.equal(summary.judgeSummary.reasoningSound, 1);
		assert.equal(summary.judgeSummary.reasoningUnsound, 3);

		const byId = new Map(summary.evaluations.map((e) => [e.evaluationId, e]));
		assert.equal(byId.get("baseline").status, "passed");

		// The dropped-bootstrap regressions fail (the deterministic routing matcher AND the judge both catch them).
		for (const id of ["regressed-skip-haiku", "regressed-skip-sonnet"]) {
			assert.equal(byId.get(id).status, "failed", `${id} must be flagged worse`);
		}

		// The right-route-wrong-reason control: the deterministic routing matcher PASSES, and the case
		// fails ONLY because the judge tier flagged it. This is the regression a token/route check misses
		// and the proof that the judge is load-bearing inside `cautilus evaluate`, not just the harness.
		const control = byId.get("regressed-reason-control");
		assert.equal(control.status, "failed");
		assert.equal(control.expectationResults.routing.status, "passed", "the control's route is correct; deterministic matchers pass it");
		assert.equal(control.expectationResults.reasoningSoundness.status, "failed", "the judge tier is the sole gate on the control");
		assert.equal(control.expectationResults.reasoningSoundness.verdict, "unsound");
	} finally {
		rmSync(outputDir, { recursive: true, force: true });
	}
});
