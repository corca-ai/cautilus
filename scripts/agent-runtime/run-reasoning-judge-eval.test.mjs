import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const RUNNER = join(SCRIPT_DIR, "run-reasoning-judge-eval.mjs");
const CALIBRATION = join(REPO_ROOT, "fixtures/eval/dev/repo/reasoning-soundness-calibration.dev-repo-routing-regression.json");
const VERDICTS = join(REPO_ROOT, "fixtures/eval/dev/repo/reasoning-soundness-judge-verdicts.dev-repo-routing-regression.json");

function runRunner(casesPath, outputPath) {
	return spawnSync(
		"node",
		[RUNNER, "--cases-file", casesPath, "--output-file", outputPath, "--calibration", CALIBRATION, "--verdicts", VERDICTS, "--suite-id", "dev-repo-routing-regression"],
		{ cwd: REPO_ROOT, encoding: "utf-8" },
	);
}

function casesPacket() {
	return {
		schemaVersion: "cautilus.evaluation_cases.v1",
		suiteId: "dev-repo-routing-regression",
		evaluations: [
			{ evaluationId: "baseline", prompt: "p", expectedRouting: { bootstrapHelper: "charness:find-skills" } },
			{ evaluationId: "regressed-skip-haiku", prompt: "p", expectedRouting: { bootstrapHelper: "charness:find-skills" } },
			{ evaluationId: "regressed-skip-sonnet", prompt: "p", expectedRouting: { bootstrapHelper: "charness:find-skills" } },
			{ evaluationId: "regressed-reason-control", prompt: "p", expectedRouting: { bootstrapHelper: "charness:find-skills" } },
		],
	};
}

test("the judge-eval runner replays captured verdicts into an observed packet the engine can score", () => {
	const dir = mkdtempSync(join(tmpdir(), "judge-eval-"));
	try {
		const casesPath = join(dir, "cases.json");
		const outputPath = join(dir, "observed.json");
		writeFileSync(casesPath, JSON.stringify(casesPacket()));
		const result = runRunner(casesPath, outputPath);
		assert.equal(result.status, 0, `runner failed: ${result.stderr || result.stdout}`);

		const observed = JSON.parse(readFileSync(outputPath, "utf-8"));
		assert.equal(observed.schemaVersion, "cautilus.evaluation_observed.v1");
		const byId = new Map(observed.evaluations.map((e) => [e.evaluationId, e]));
		assert.equal(byId.size, 4);

		// Baseline: composite sound; the code process facet passed.
		const baseline = byId.get("baseline");
		assert.equal(baseline.reasoningSoundness.verdict, "sound");
		assert.equal(baseline.reasoningSoundness.codeFacets.emitted_find_skills_bootstrap, true);
		assert.equal(baseline.reasoningSoundness.claimId, "dev-repo-routing-regression");
		assert.ok(baseline.routingDecision && baseline.routingDecision.bootstrapHelper, "routingDecision carried from the harvested observedRoute");

		// Regressed-skip: composite unsound; the dropped bootstrap is the CODE negative.
		for (const id of ["regressed-skip-haiku", "regressed-skip-sonnet"]) {
			const row = byId.get(id);
			assert.equal(row.reasoningSoundness.verdict, "unsound", `${id} composite must be unsound`);
			assert.equal(row.reasoningSoundness.codeFacets.emitted_find_skills_bootstrap, false, `${id} dropped the bootstrap`);
		}

		// Control: composite unsound, but the code facet PASSES — only the judge carries it.
		const control = byId.get("regressed-reason-control");
		assert.equal(control.reasoningSoundness.verdict, "unsound");
		assert.equal(control.reasoningSoundness.codeFacets.emitted_find_skills_bootstrap, true, "the control's route is correct; code alone would pass it");
		assert.equal(control.reasoningSoundness.judgeVerdict, "unsound", "only the judge catches the fabricated reason");
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test("the judge-eval runner refuses to emit when the captured judge is rubber-stamp suspected", () => {
	const dir = mkdtempSync(join(tmpdir(), "judge-eval-stamp-"));
	try {
		// A DIRECT claim (no codeFacets) where the judge is the only source of negatives: an all-sound
		// captured verdict set over a calibration that has a known-unsound control is rubber-stamp
		// suspected, so the runner must fail closed rather than emit a vacuous green. (For a decomposed
		// claim like routing-regression, a code facet still carries the negative, so all-sound is not
		// rubber-stamp suspected — the guard only fires when the judge alone could fail the gate.)
		const calPath = join(dir, "synthetic-direct-calibration.json");
		writeFileSync(
			calPath,
			JSON.stringify({
				schemaVersion: "cautilus.reasoning_soundness_calibration.v1",
				claimId: "synthetic-direct",
				cases: [
					{ id: "ok", observedRoute: { bootstrapHelper: "charness:find-skills", workSkill: "none", firstToolCall: "Skill(find-skills)" }, reasonSummary: "sound reason", expectedVerdict: "sound" },
					{ id: "control", observedRoute: { bootstrapHelper: "charness:find-skills", workSkill: "none", firstToolCall: "Skill(find-skills)" }, reasonSummary: "fabricated reason", expectedVerdict: "unsound" },
				],
			}),
		);
		const stampedVerdicts = join(dir, "stamped-verdicts.json");
		writeFileSync(
			stampedVerdicts,
			JSON.stringify({ verdicts: [{ caseId: "ok", verdict: "sound", confidence: 0.5 }, { caseId: "control", verdict: "sound", confidence: 0.5 }] }),
		);
		const casesPath = join(dir, "cases.json");
		const outputPath = join(dir, "observed.json");
		writeFileSync(
			casesPath,
			JSON.stringify({ schemaVersion: "cautilus.evaluation_cases.v1", suiteId: "synthetic-direct", evaluations: [{ evaluationId: "ok", prompt: "p" }, { evaluationId: "control", prompt: "p" }] }),
		);
		const result = spawnSync(
			"node",
			[RUNNER, "--cases-file", casesPath, "--output-file", outputPath, "--calibration", calPath, "--verdicts", stampedVerdicts, "--suite-id", "synthetic-direct"],
			{ cwd: REPO_ROOT, encoding: "utf-8" },
		);
		assert.notEqual(result.status, 0, "runner must fail when the judge is rubber-stamp suspected");
		assert.match(result.stderr, /rubber-stamp/);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
