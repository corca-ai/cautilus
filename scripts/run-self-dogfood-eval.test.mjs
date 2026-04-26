import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

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
		assert.equal(existsSync(join(candidateRepo, ".agents", "skills", "cautilus", "SKILL.md")), true);
		const packet = JSON.parse(readFileSync(outputFile, "utf-8"));
		assert.equal(packet.schemaVersion, "cautilus.evaluation_observed.v1");
		assert.equal(packet.evaluations.length, 1);
		assert.equal(packet.evaluations[0].evaluationId, "checked-in-agents-routing");
		assert.equal(packet.evaluations[0].entryFile, "AGENTS.md");
		assert.equal(packet.evaluations[0].loadedInstructionFiles[0], "AGENTS.md");
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
