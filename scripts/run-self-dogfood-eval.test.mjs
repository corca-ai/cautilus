import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const REALSURFACE_CALIBRATION = "fixtures/eval/dev/repo/reasoning-soundness-calibration.dev-repo-realsurface-routing.json";
const REALSURFACE_VERDICTS = "fixtures/eval/dev/repo/reasoning-soundness-judge-verdicts.dev-repo-realsurface-routing.json";

function writeDogfoodInputs(outputDir) {
	const casesFile = join(outputDir, "eval-cases.json");
	const fixtureResultsFile = join(outputDir, "fixture-results.json");
	const cases = {
		schemaVersion: "cautilus.evaluation_cases.v1",
		suiteId: "self-dogfood-eval-test",
		evaluations: [
			{
				evaluationId: "checked-in-agents-routing",
				prompt: "User request: continue from docs/internal/handoff.md and implement the next slice. Read the repo instructions first, then identify both the startup bootstrap helper and the durable work skill you would use for this implementation task.",
				expectedEntryFile: "AGENTS.md",
				requiredInstructionFiles: ["AGENTS.md"],
				expectedRouting: { bootstrapHelper: "find-skills", workSkill: "impl" },
			},
		],
	};
	const fixtureResults = {
		"checked-in-agents-routing": {
			observationStatus: "observed",
			summary: "Started from AGENTS.md and kept routing narrow.",
			entryFile: "AGENTS.md",
			loadedInstructionFiles: ["AGENTS.md"],
			loadedSupportingFiles: [],
			routingDecision: { selectedSkill: "impl", bootstrapHelper: "find-skills", workSkill: "impl" },
		},
	};
	writeFileSync(casesFile, JSON.stringify(cases));
	writeFileSync(fixtureResultsFile, JSON.stringify(fixtureResults));
	return { casesFile, fixtureResultsFile };
}

function removeWorktree(candidateRepo) {
	try {
		execFileSync("git", ["-C", process.cwd(), "worktree", "remove", "--force", candidateRepo], { encoding: "utf-8" });
	} catch {
		// Best-effort cleanup for detached worktrees created in the test.
	}
}

test("run-self-dogfood-eval materializes a disposable candidate workspace", () => {
	const outputDir = mkdtempSync(join(tmpdir(), "cautilus-eval-self-dogfood-"));
	const candidateRepo = join(outputDir, "candidate");
	const outputFile = join(outputDir, "eval-observed.json");
	const casesFile = join(outputDir, "eval-cases.json");
	const fixtureResultsFile = join(outputDir, "fixture-results.json");
	const cases = {
		schemaVersion: "cautilus.evaluation_cases.v1",
		suiteId: "self-dogfood-eval-test",
		evaluations: [
			{
				evaluationId: "checked-in-agents-routing",
				prompt: "User request: continue from docs/internal/handoff.md and implement the next slice. Read the repo instructions first, then identify both the startup bootstrap helper and the durable work skill you would use for this implementation task.",
				expectedEntryFile: "AGENTS.md",
				requiredInstructionFiles: ["AGENTS.md"],
				expectedRouting: { bootstrapHelper: "find-skills", workSkill: "impl" },
			},
		],
	};
	const fixtureResults = {
		"checked-in-agents-routing": {
			observationStatus: "observed",
			summary: "Started from AGENTS.md and kept routing narrow.",
			entryFile: "AGENTS.md",
			loadedInstructionFiles: ["AGENTS.md"],
			loadedSupportingFiles: [],
			routingDecision: { selectedSkill: "impl", bootstrapHelper: "find-skills", workSkill: "impl" },
		},
	};
	writeFileSync(casesFile, JSON.stringify(cases));
	writeFileSync(fixtureResultsFile, JSON.stringify(fixtureResults));
	try {
		execFileSync("node", [
			"./scripts/run-self-dogfood-eval.mjs",
			"--repo-root",
			process.cwd(),
			"--output-dir",
			outputDir,
			"--cases-file",
			casesFile,
			"--output-file",
			outputFile,
			"--backend",
			"fixture",
			"--fixture-results-file",
			fixtureResultsFile,
		], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(existsSync(join(candidateRepo, ".agents", "skills", "cautilus-agent", "SKILL.md")), true);
		const packet = JSON.parse(readFileSync(outputFile, "utf-8"));
		assert.equal(packet.schemaVersion, "cautilus.evaluation_observed.v1");
		assert.equal(packet.evaluations.length, 1);
		assert.equal(packet.evaluations[0].evaluationId, "checked-in-agents-routing");
		assert.equal(packet.evaluations[0].entryFile, "AGENTS.md");
		assert.equal(packet.evaluations[0].loadedInstructionFiles[0], "AGENTS.md");
	} finally {
		removeWorktree(candidateRepo);
		rmSync(outputDir, { recursive: true, force: true });
	}
});

test("run-self-dogfood-eval rejects a reasoning calibration without its verdicts (paired flags)", () => {
	const result = spawnSync("node", [
		"./scripts/run-self-dogfood-eval.mjs",
		"--repo-root", process.cwd(),
		"--output-dir", "/tmp/unused-self-dogfood",
		"--cases-file", "/tmp/unused-cases.json",
		"--output-file", "/tmp/unused-observed.json",
		"--reasoning-calibration", REALSURFACE_CALIBRATION,
	], { cwd: process.cwd(), encoding: "utf-8" });
	assert.notEqual(result.status, 0, "a lone --reasoning-calibration must fail fast");
	assert.match(result.stderr, /must be provided together/);
});

test("run-self-dogfood-eval attaches the reasoning-soundness judge tier when calibration + verdicts are supplied", () => {
	const outputDir = mkdtempSync(join(tmpdir(), "cautilus-eval-self-dogfood-judge-"));
	const candidateRepo = join(outputDir, "candidate");
	const outputFile = join(outputDir, "eval-observed.json");
	const { casesFile, fixtureResultsFile } = writeDogfoodInputs(outputDir);
	try {
		execFileSync("node", [
			"./scripts/run-self-dogfood-eval.mjs",
			"--repo-root", process.cwd(),
			"--output-dir", outputDir,
			"--cases-file", casesFile,
			"--output-file", outputFile,
			"--backend", "fixture",
			"--fixture-results-file", fixtureResultsFile,
			"--reasoning-calibration", REALSURFACE_CALIBRATION,
			"--reasoning-verdicts", REALSURFACE_VERDICTS,
			"--reasoning-provenance", "full-runner-capture-replay",
		], { cwd: process.cwd(), encoding: "utf-8" });
		const packet = JSON.parse(readFileSync(outputFile, "utf-8"));
		const baseline = packet.evaluations.find((e) => e.evaluationId === "checked-in-agents-routing");
		assert.ok(baseline.reasoningSoundness, "the enricher must attach a reasoningSoundness verdict to the real-surface packet");
		assert.equal(baseline.reasoningSoundness.verdict, "sound");
		assert.equal(baseline.reasoningSoundness.provenance, "full-runner-capture-replay");
		assert.equal(baseline.reasoningSoundness.claimId, "dev-repo-realsurface-routing");
	} finally {
		removeWorktree(candidateRepo);
		rmSync(outputDir, { recursive: true, force: true });
	}
});
