import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "prepare-compare-worktrees.mjs");

function git(root, args) {
	const result = spawnSync("git", ["-C", root, ...args], {
		encoding: "utf-8",
	});
	assert.equal(result.status, 0, result.stderr);
	return result.stdout.trim();
}

function createRepo() {
	const root = mkdtempSync(join(tmpdir(), "cautilus-compare-worktrees-"));
	git(root, ["init"]);
	git(root, ["config", "user.name", "Cautilus Test"]);
	git(root, ["config", "user.email", "test@example.com"]);
	writeFileSync(join(root, "sample.txt"), "baseline\n", "utf-8");
	git(root, ["add", "sample.txt"]);
	git(root, ["commit", "-m", "baseline"]);
	const baselineCommit = git(root, ["rev-parse", "HEAD"]);
	writeFileSync(join(root, "sample.txt"), "candidate\n", "utf-8");
	git(root, ["commit", "-am", "candidate"]);
	const candidateCommit = git(root, ["rev-parse", "HEAD"]);
	return { root, baselineCommit, candidateCommit };
}

test("prepare-compare-worktrees creates detached baseline and candidate worktrees", () => {
	const { root, baselineCommit, candidateCommit } = createRepo();
	try {
		const outputDir = join(root, "compare");
		const result = spawnSync(
			"node",
			[
				SCRIPT_PATH,
				"--repo-root",
				root,
				"--baseline-ref",
				baselineCommit,
				"--candidate-ref",
				candidateCommit,
				"--output-dir",
				outputDir,
			],
			{
				encoding: "utf-8",
			},
		);
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.baseline.commit, baselineCommit);
		assert.equal(payload.candidate.commit, candidateCommit);
		assert.equal(readFileSync(join(payload.baseline.path, "sample.txt"), "utf-8"), "baseline\n");
		assert.equal(readFileSync(join(payload.candidate.path, "sample.txt"), "utf-8"), "candidate\n");
		assert.equal(payload.usage.modeEvaluate.includes("--baseline-repo"), true);
		assert.equal(payload.usage.reviewVariants.includes(payload.candidate.path), true);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("prepare-compare-worktrees can point candidate at the live checkout", () => {
	const { root, baselineCommit } = createRepo();
	try {
		const outputDir = join(root, "compare-live");
		mkdirSync(outputDir, { recursive: true });
		writeFileSync(join(root, "dirty.txt"), "dirty\n", "utf-8");
		const result = spawnSync(
			"node",
			[
				SCRIPT_PATH,
				"--repo-root",
				root,
				"--baseline-ref",
				baselineCommit,
				"--use-current-candidate",
				"--output-dir",
				outputDir,
			],
			{
				encoding: "utf-8",
			},
		);
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.candidate.type, "live_checkout");
		assert.equal(payload.candidate.path, root);
		assert.equal(payload.warnings.length, 1);
		assert.match(payload.warnings[0], /uncommitted changes/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
