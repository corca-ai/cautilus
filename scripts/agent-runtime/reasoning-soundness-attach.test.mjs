import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { buildReasoningSoundness, loadCompositeContext } from "./reasoning-soundness-attach.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const ENRICHER = join(SCRIPT_DIR, "enrich-eval-with-reasoning-judge.mjs");
const CALIBRATION = join(REPO_ROOT, "fixtures/eval/dev/repo/reasoning-soundness-calibration.dev-repo-realsurface-routing.json");
const VERDICTS = join(REPO_ROOT, "fixtures/eval/dev/repo/reasoning-soundness-judge-verdicts.dev-repo-realsurface-routing.json");

test("buildReasoningSoundness carries the composite verdict and a parameterized provenance", () => {
	const composite = { got: "unsound", judgeVerdict: "unsound", codeFacets: { emitted_find_skills_bootstrap: true }, confidence: 0.9 };
	const verdict = buildReasoningSoundness("claim-x", composite, "because the reason is fabricated", "full-runner-capture-replay");
	assert.equal(verdict.verdict, "unsound");
	assert.equal(verdict.claimId, "claim-x");
	assert.equal(verdict.provenance, "full-runner-capture-replay");
	assert.equal(verdict.judgeVerdict, "unsound");
	assert.deepEqual(verdict.codeFacets, { emitted_find_skills_bootstrap: true });
	assert.equal(verdict.confidence, 0.9);
	assert.equal(verdict.evidence, "because the reason is fabricated");
});

test("buildReasoningSoundness omits optional fields and refuses an empty provenance label", () => {
	const verdict = buildReasoningSoundness("claim-x", { got: "sound" }, "", "blind-subagent-harvest-replay");
	assert.deepEqual(Object.keys(verdict).sort(), ["claimId", "provenance", "verdict"]);
	assert.throws(() => buildReasoningSoundness("claim-x", { got: "sound" }, "", ""), /non-empty provenance/);
});

test("loadCompositeContext computes the SOT composite per case for the real-surface claim", () => {
	const ctx = loadCompositeContext({ calibrationPath: CALIBRATION, verdictsPath: VERDICTS });
	assert.equal(ctx.claimId, "dev-repo-realsurface-routing");
	assert.equal(ctx.compositeById.get("checked-in-agents-routing").got, "sound");
	assert.equal(ctx.compositeById.get("realsurface-reason-control").got, "unsound");
	// The control's composite is judge-driven: the code process facet passes, only the judge fails it.
	assert.equal(ctx.compositeById.get("realsurface-reason-control").codeFacets.emitted_find_skills_bootstrap, true);
	assert.equal(ctx.compositeById.get("realsurface-reason-control").judgeVerdict, "unsound");
});

test("loadCompositeContext fails closed when the captured judge is rubber-stamp suspected", () => {
	const dir = mkdtempSync(join(tmpdir(), "rubber-stamp-"));
	try {
		// Same calibration (it has a known-unsound control) but an always-sound captured judge.
		const calibration = JSON.parse(readFileSync(CALIBRATION, "utf-8"));
		const stamped = { verdicts: calibration.cases.map((c) => ({ caseId: c.id, verdict: "sound", confidence: 0.5 })) };
		const vPath = join(dir, "stamped-verdicts.json");
		writeFileSync(vPath, JSON.stringify(stamped));
		assert.throws(() => loadCompositeContext({ calibrationPath: CALIBRATION, verdictsPath: vPath }), /rubber-stamp/);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test("the enricher attaches reasoningSoundness to matching packet evaluations only", () => {
	const dir = mkdtempSync(join(tmpdir(), "enrich-"));
	try {
		const packet = {
			schemaVersion: "cautilus.evaluation_observed.v1",
			suiteId: "dev-repo-realsurface-routing",
			evaluations: [
				{ evaluationId: "checked-in-agents-routing", routingDecision: { bootstrapHelper: "charness:find-skills" } },
				{ evaluationId: "realsurface-reason-control", routingDecision: { bootstrapHelper: "charness:find-skills" } },
				{ evaluationId: "not-in-calibration", routingDecision: { bootstrapHelper: "none" } },
			],
		};
		const observedFile = join(dir, "observed.json");
		const outputFile = join(dir, "enriched.json");
		writeFileSync(observedFile, JSON.stringify(packet));
		const result = spawnSync(
			"node",
			[ENRICHER, "--observed-file", observedFile, "--output-file", outputFile, "--calibration", CALIBRATION, "--verdicts", VERDICTS, "--provenance", "full-runner-capture-replay"],
			{ encoding: "utf-8" },
		);
		assert.equal(result.status, 0, result.stderr);
		const enriched = JSON.parse(readFileSync(outputFile, "utf-8"));
		const byId = new Map(enriched.evaluations.map((e) => [e.evaluationId, e]));
		assert.equal(byId.get("checked-in-agents-routing").reasoningSoundness.verdict, "sound");
		assert.equal(byId.get("checked-in-agents-routing").reasoningSoundness.provenance, "full-runner-capture-replay");
		assert.equal(byId.get("realsurface-reason-control").reasoningSoundness.verdict, "unsound");
		assert.equal(byId.get("not-in-calibration").reasoningSoundness, undefined, "an evaluation absent from the calibration is left untouched");
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test("the enricher rejects a --claim-id that disagrees with the calibration", () => {
	const dir = mkdtempSync(join(tmpdir(), "enrich-claim-"));
	try {
		const observedFile = join(dir, "observed.json");
		writeFileSync(observedFile, JSON.stringify({ evaluations: [{ evaluationId: "checked-in-agents-routing" }] }));
		const result = spawnSync(
			"node",
			[ENRICHER, "--observed-file", observedFile, "--calibration", CALIBRATION, "--verdicts", VERDICTS, "--claim-id", "wrong-claim"],
			{ encoding: "utf-8" },
		);
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /does not match the calibration claimId/);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
