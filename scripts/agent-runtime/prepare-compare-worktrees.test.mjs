import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { ACTIVE_RUN_ENV_VAR, DEFAULT_RUNS_ROOT } from "./active-run.mjs";

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

test("prepare-compare-worktrees honors CAUTILUS_RUN_DIR when --output-dir is omitted", () => {
	const { root, baselineCommit, candidateCommit } = createRepo();
	try {
		const activeRun = join(root, "active-from-env");
		mkdirSync(activeRun, { recursive: true });
		const env = { ...process.env };
		delete env[ACTIVE_RUN_ENV_VAR];
		env[ACTIVE_RUN_ENV_VAR] = activeRun;
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
			],
			{
				encoding: "utf-8",
				env,
			},
		);
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.outputDir, activeRun);
		assert.equal(payload.baseline.path, join(activeRun, "baseline"));
		assert.equal(payload.candidate.path, join(activeRun, "candidate"));
		assert.equal(readFileSync(join(payload.baseline.path, "sample.txt"), "utf-8"), "baseline\n");
		assert.equal(readFileSync(join(payload.candidate.path, "sample.txt"), "utf-8"), "candidate\n");
		// env var path is quiet — no "Active run:" banner
		assert.doesNotMatch(result.stderr, /Active run:/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("prepare-compare-worktrees auto-materializes a fresh runDir under the default root and logs Active run", () => {
	const { root, baselineCommit, candidateCommit } = createRepo();
	const sandboxCwd = mkdtempSync(join(tmpdir(), "cautilus-compare-auto-"));
	try {
		const env = { ...process.env };
		delete env[ACTIVE_RUN_ENV_VAR];
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
			],
			{
				cwd: sandboxCwd,
				encoding: "utf-8",
				env,
			},
		);
		assert.equal(result.status, 0, result.stderr);
		const defaultRoot = join(sandboxCwd, DEFAULT_RUNS_ROOT);
		assert.equal(existsSync(defaultRoot), true);
		const runDirs = readdirSync(defaultRoot);
		assert.equal(runDirs.length, 1, `expected exactly one auto runDir, saw ${runDirs.join(", ")}`);
		const runDir = join(defaultRoot, runDirs[0]);
		assert.equal(existsSync(join(runDir, "run.json")), true);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.outputDir, runDir);
		assert.equal(payload.baseline.path, join(runDir, "baseline"));
		assert.equal(payload.candidate.path, join(runDir, "candidate"));
		assert.match(result.stderr, new RegExp(`Active run: ${runDir.replace(/[\\^$*+?.()|[\]{}]/g, "\\$&")}`));
	} finally {
		rmSync(sandboxCwd, { recursive: true, force: true });
		rmSync(root, { recursive: true, force: true });
	}
});

test("prepare-compare-worktrees rewires worktrees on retry inside the same active runDir", () => {
	const { root, baselineCommit, candidateCommit } = createRepo();
	try {
		const activeRun = join(root, "retry-run");
		mkdirSync(activeRun, { recursive: true });
		const env = { ...process.env };
		delete env[ACTIVE_RUN_ENV_VAR];
		env[ACTIVE_RUN_ENV_VAR] = activeRun;
		const runOnce = () =>
			spawnSync(
				"node",
				[
					SCRIPT_PATH,
					"--repo-root",
					root,
					"--baseline-ref",
					baselineCommit,
					"--candidate-ref",
					candidateCommit,
				],
				{
					encoding: "utf-8",
					env,
				},
			);
		const first = runOnce();
		assert.equal(first.status, 0, first.stderr);
		const firstPayload = JSON.parse(first.stdout);
		const second = runOnce();
		assert.equal(second.status, 0, second.stderr);
		const secondPayload = JSON.parse(second.stdout);
		assert.equal(secondPayload.outputDir, firstPayload.outputDir);
		assert.equal(secondPayload.baseline.path, firstPayload.baseline.path);
		assert.equal(secondPayload.candidate.path, firstPayload.candidate.path);
		assert.equal(secondPayload.baseline.commit, baselineCommit);
		assert.equal(secondPayload.candidate.commit, candidateCommit);
		assert.equal(readFileSync(join(secondPayload.baseline.path, "sample.txt"), "utf-8"), "baseline\n");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("prepare-compare-worktrees explicit --output-dir overrides an inherited CAUTILUS_RUN_DIR", () => {
	const { root, baselineCommit, candidateCommit } = createRepo();
	try {
		const inheritedRun = join(root, "inherited-run");
		mkdirSync(inheritedRun, { recursive: true });
		const explicitOutputDir = join(root, "explicit-out");
		const env = { ...process.env };
		delete env[ACTIVE_RUN_ENV_VAR];
		env[ACTIVE_RUN_ENV_VAR] = inheritedRun;
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
				explicitOutputDir,
			],
			{
				encoding: "utf-8",
				env,
			},
		);
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.outputDir, explicitOutputDir);
		assert.equal(payload.baseline.path, join(explicitOutputDir, "baseline"));
		assert.equal(existsSync(join(inheritedRun, "baseline")), false);
		assert.equal(existsSync(join(inheritedRun, "candidate")), false);
		// explicit path is quiet — no "Active run:" banner
		assert.doesNotMatch(result.stderr, /Active run:/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
