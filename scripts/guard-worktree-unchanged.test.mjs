import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const SCRIPT = join(process.cwd(), "scripts", "guard-worktree-unchanged.mjs");

function git(root, args) {
	return execFileSync("git", ["-C", root, ...args], { encoding: "utf-8" }).trim();
}

function initRepo(root) {
	git(root, ["init", "-b", "main"]);
	git(root, ["config", "user.name", "Cautilus Test"]);
	git(root, ["config", "user.email", "test@example.com"]);
	writeFileSync(join(root, "tracked.txt"), "initial\n", "utf-8");
	git(root, ["add", "tracked.txt"]);
	git(root, ["commit", "-m", "initial"]);
}

test("guard-worktree-unchanged passes through non-mutating commands", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-guard-clean-"));
	try {
		initRepo(root);
		const result = spawnSync("node", [SCRIPT, "--", "git", "status", "--short"], {
			cwd: root,
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("guard-worktree-unchanged requires a command", () => {
	const result = spawnSync("node", [SCRIPT, "--"], {
		encoding: "utf-8",
	});
	assert.equal(result.status, 1);
	assert.match(result.stderr, /command is required after --/);
});

test("guard-worktree-unchanged preserves the command exit code when the repo is unchanged", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-guard-exit-"));
	try {
		initRepo(root);
		const result = spawnSync("node", [SCRIPT, "--", "sh", "-c", "exit 7"], {
			cwd: root,
			encoding: "utf-8",
		});
		assert.equal(result.status, 7);
		assert.equal(result.stderr, "");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("guard-worktree-unchanged ignores untracked files", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-guard-untracked-"));
	try {
		initRepo(root);
		const result = spawnSync("node", [SCRIPT, "--", "sh", "-c", "printf scratch > scratch.txt"], {
			cwd: root,
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
		assert.equal(git(root, ["status", "--porcelain=v1", "--untracked-files=no"]), "");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("guard-worktree-unchanged fails when tracked files change", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-guard-tracked-"));
	try {
		initRepo(root);
		const result = spawnSync("node", [SCRIPT, "--", "sh", "-c", "printf changed > tracked.txt"], {
			cwd: root,
			encoding: "utf-8",
		});
		assert.equal(result.status, 1);
		assert.match(result.stderr, /tracked worktree or index changed/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("guard-worktree-unchanged fails when HEAD changes", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-guard-head-"));
	try {
		initRepo(root);
		const result = spawnSync(
			"node",
			[SCRIPT, "--", "sh", "-c", "printf second > tracked.txt && git add tracked.txt && git commit -m second"],
			{ cwd: root, encoding: "utf-8" },
		);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /HEAD changed/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
