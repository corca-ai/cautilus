import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("run-self-dogfood-instruction-surface materializes a disposable candidate workspace", () => {
	const outputDir = mkdtempSync(join(tmpdir(), "cautilus-instruction-surface-self-dogfood-"));
	const candidateRepo = join(outputDir, "candidate");
	const outputFile = join(outputDir, "instruction-surface-input.json");
	try {
		execFileSync("node", [
			"./scripts/run-self-dogfood-instruction-surface.mjs",
			"--repo-root",
			process.cwd(),
			"--output-dir",
			outputDir,
			"--cases-file",
			join(process.cwd(), "fixtures", "instruction-surface", "cases.json"),
			"--output-file",
			outputFile,
			"--backend",
			"fixture",
			"--fixture-results-file",
			join(process.cwd(), "fixtures", "instruction-surface", "fixture-results.json"),
		], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(existsSync(join(candidateRepo, ".agents", "skills", "cautilus", "SKILL.md")), true);
		const packet = JSON.parse(readFileSync(outputFile, "utf-8"));
		assert.equal(packet.schemaVersion, "cautilus.instruction_surface_inputs.v1");
		assert.equal(packet.evaluations.length, 5);
		assert.equal(packet.evaluations[0].entryFile, "AGENTS.md");
		assert.equal(packet.evaluations[3].loadedInstructionFiles[0], "docs/internal/routing-note.md");
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
