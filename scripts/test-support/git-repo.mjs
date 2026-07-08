import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function git(root, args) {
	return execFileSync("git", ["-C", root, ...args], { encoding: "utf-8" }).trim();
}

export function createMinimalGitRepo(root, files = { "AGENTS.md": "# Test Repo\n" }) {
	mkdirSync(root, { recursive: true });
	git(root, ["init"]);
	git(root, ["config", "user.email", "test@example.com"]);
	git(root, ["config", "user.name", "Cautilus Test"]);
	for (const [relativePath, contents] of Object.entries(files)) {
		const path = join(root, relativePath);
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, contents, "utf-8");
	}
	git(root, ["add", "."]);
	git(root, ["commit", "-m", "bootstrap"]);
	return root;
}

export function createRepresentativeDogfoodRepo(root) {
	createMinimalGitRepo(root, {
		"AGENTS.md": "# Test Repo\n",
		"docs/committed.md": "# Committed Doc\n",
		"deleted-source.txt": "removed after commit\n",
	});
	rmSync(join(root, "deleted-source.txt"));
	writeFileSync(join(root, "docs", "untracked-note.md"), "# Untracked Note\n", "utf-8");
	mkdirSync(join(root, ".agents", "skills", "local"), { recursive: true });
	writeFileSync(join(root, ".agents", "skills", "local", "SKILL.md"), "# Local Skill\n", "utf-8");
	mkdirSync(join(root, ".cautilus", "runs"), { recursive: true });
	writeFileSync(join(root, ".cautilus", "runs", "local.json"), "{}\n", "utf-8");
	mkdirSync(join(root, ".claude"), { recursive: true });
	writeFileSync(join(root, ".claude", "settings.local.json"), "{}\n", "utf-8");
	return root;
}

export function removeWorktree(repoRoot, worktreePath) {
	try {
		git(repoRoot, ["worktree", "remove", "--force", worktreePath]);
	} catch {
		// Best-effort cleanup for detached worktrees created in tests.
	}
}
