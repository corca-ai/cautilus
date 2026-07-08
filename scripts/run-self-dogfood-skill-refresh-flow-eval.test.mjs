import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createFakeCautilusBin } from "./test-support/cautilus-bin.mjs";
import { createRepresentativeDogfoodRepo, removeWorktree } from "./test-support/git-repo.mjs";

test("run-self-dogfood-skill-refresh-flow-eval materializes a disposable candidate workspace", () => {
	const outputDir = mkdtempSync(join(tmpdir(), "cautilus-refresh-flow-eval-"));
	const sourceRepo = createRepresentativeDogfoodRepo(join(outputDir, "source"));
	const fakeCautilusBin = createFakeCautilusBin(outputDir);
	const candidateRepo = join(outputDir, "candidate");
	const outputFile = join(outputDir, "eval-observed.json");
	const casesFile = join(outputDir, "eval-cases.json");
	const fixtureResultsFile = join(outputDir, "fixture-results.json");
	writeFileSync(casesFile, JSON.stringify({
		schemaVersion: "cautilus.skill_test_cases.v1",
		skillId: "cautilus",
		cases: [
			{
				caseId: "episode-cautilus-refresh-flow",
				evaluationKind: "execution",
				turns: [
					{ input: "$cautilus-agent", injectSkill: true },
					{ input: "1" },
				],
				auditKind: "cautilus_refresh_flow",
			},
		],
	}));
	writeFileSync(fixtureResultsFile, JSON.stringify({
		"episode-cautilus-refresh-flow": {
			invoked: true,
			summary: "Audit passed for the refresh-flow episode.",
			outcome: "passed",
			duration_ms: 1000,
		},
	}));
	try {
		execFileSync("node", [
			"./scripts/run-self-dogfood-skill-refresh-flow-eval.mjs",
			"--repo-root",
			sourceRepo,
			"--cautilus-bin",
			fakeCautilusBin,
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
		assert.equal(existsSync(join(candidateRepo, "docs", "committed.md")), true);
		assert.equal(existsSync(join(candidateRepo, "docs", "untracked-note.md")), true);
		assert.equal(existsSync(join(candidateRepo, "deleted-source.txt")), false);
		assert.equal(existsSync(join(candidateRepo, ".agents", "skills", "local", "SKILL.md")), false);
		assert.equal(existsSync(join(candidateRepo, ".cautilus", "runs", "local.json")), false);
		assert.equal(existsSync(join(candidateRepo, ".claude", "settings.local.json")), false);
		const packet = JSON.parse(readFileSync(outputFile, "utf-8"));
		assert.equal(packet.schemaVersion, "cautilus.skill_evaluation_inputs.v1");
		assert.equal(packet.evaluations.length, 1);
		assert.equal(packet.evaluations[0].evaluationId, "episode-cautilus-refresh-flow");
		assert.equal(packet.evaluations[0].outcome, "passed");
		assert.equal(existsSync(join(sourceRepo, ".agents", "skills", "cautilus-agent", "SKILL.md")), false);
	} finally {
		removeWorktree(sourceRepo, candidateRepo);
		rmSync(outputDir, { recursive: true, force: true });
	}
});
