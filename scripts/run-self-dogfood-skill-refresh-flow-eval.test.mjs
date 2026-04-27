import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("run-self-dogfood-skill-refresh-flow-eval materializes a disposable candidate workspace", () => {
	const outputDir = mkdtempSync(join(tmpdir(), "cautilus-refresh-flow-eval-"));
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
					{ input: "$cautilus", injectSkill: true },
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
		assert.equal(existsSync(join(candidateRepo, ".agents", "skills", "cautilus", "SKILL.md")), true);
		const packet = JSON.parse(readFileSync(outputFile, "utf-8"));
		assert.equal(packet.schemaVersion, "cautilus.skill_evaluation_inputs.v1");
		assert.equal(packet.evaluations.length, 1);
		assert.equal(packet.evaluations[0].evaluationId, "episode-cautilus-refresh-flow");
		assert.equal(packet.evaluations[0].outcome, "passed");
		assert.equal(existsSync(join(process.cwd(), ".agents", "skills", "cautilus", "SKILL.md")), true);
	} finally {
		try {
			execFileSync("git", ["-C", process.cwd(), "worktree", "remove", "--force", candidateRepo], {
				encoding: "utf-8",
			});
		} catch {
			// Best-effort cleanup for detached worktrees created in the test.
		}
		rmSync(outputDir, { recursive: true, force: true });
	}
});
