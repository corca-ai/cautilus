import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { detectReleaseSurfaceDrift, publishPreparedRelease, readReleaseSurfaceVersions } from "./publish-release.mjs";

function writeFile(root, relativePath, content) {
	const filePath = join(root, relativePath);
	mkdirSync(join(filePath, ".."), { recursive: true });
	writeFileSync(filePath, content, "utf-8");
}

function git(root, args) {
	return execFileSync("git", ["-C", root, ...args], { encoding: "utf-8" }).trim();
}

function seedReleaseRepo(root, version = "0.5.1") {
	writeFile(root, "package.json", `{\n  "version": "${version}"\n}\n`);
	writeFile(root, "package-lock.json", `{\n  "version": "${version}",\n  "packages": {\n    "": {\n      "version": "${version}"\n    }\n  }\n}\n`);
	writeFile(
		root,
		".claude-plugin/marketplace.json",
		`{\n  "metadata": {\n    "version": "${version}"\n  },\n  "plugins": [\n    {\n      "name": "cautilus",\n      "version": "${version}"\n    }\n  ]\n}\n`,
	);
	writeFile(root, "plugins/cautilus/.claude-plugin/plugin.json", `{\n  "version": "${version}"\n}\n`);
	writeFile(root, "plugins/cautilus/.codex-plugin/plugin.json", `{\n  "version": "${version}"\n}\n`);
	writeFile(root, "install.md", `CAUTILUS_VERSION=v${version}\n`);
}

function initGitRepo(root) {
	git(root, ["init", "-b", "main"]);
	git(root, ["config", "user.name", "Cautilus Test"]);
	git(root, ["config", "user.email", "test@example.com"]);
}

test("detectReleaseSurfaceDrift reports mismatched surfaces", () => {
	const drift = detectReleaseSurfaceDrift(
		{
			packageJson: "0.5.1",
			packageLock: "0.5.0",
			packagedCodexPlugin: "0.5.1",
		},
		"0.5.1",
	);
	assert.deepEqual(drift, ["packageLock=0.5.0 != expected=0.5.1"]);
});

test("readReleaseSurfaceVersions reads the checked-in release surface", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-release-surface-"));
	try {
		seedReleaseRepo(root, "0.5.1");
		assert.deepEqual(readReleaseSurfaceVersions(root), {
			packageJson: "0.5.1",
			packageLock: "0.5.1",
			packageLockRootPackage: "0.5.1",
			claudeMarketplaceMetadata: "0.5.1",
			claudeMarketplacePlugin: "0.5.1",
			packagedClaudePlugin: "0.5.1",
			packagedCodexPlugin: "0.5.1",
			installGuide: "0.5.1",
		});
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("publishPreparedRelease rejects a dirty worktree", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-release-dirty-"));
	try {
		seedReleaseRepo(root, "0.5.1");
		initGitRepo(root);
		git(root, ["add", "."]);
		git(root, ["commit", "-m", "initial"]);
		writeFileSync(join(root, "README.md"), "dirty\n", "utf-8");
		assert.throws(
			() => publishPreparedRelease({ repoRoot: root, version: "0.5.1", dryRun: true }),
			/clean worktree before tagging/,
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("publishPreparedRelease pushes branch and tag in order", () => {
	const tempRoot = mkdtempSync(join(tmpdir(), "cautilus-release-publish-"));
	const remoteRoot = join(tempRoot, "remote.git");
	const workRoot = join(tempRoot, "work");
	mkdirSync(workRoot, { recursive: true });
	try {
		git(tempRoot, ["init", "--bare", remoteRoot]);
		seedReleaseRepo(workRoot, "0.5.1");
		initGitRepo(workRoot);
		git(workRoot, ["remote", "add", "origin", remoteRoot]);
		git(workRoot, ["add", "."]);
		git(workRoot, ["commit", "-m", "release-ready"]);
		const expectedHead = git(workRoot, ["rev-parse", "HEAD"]);

		const result = publishPreparedRelease({ repoRoot: workRoot, version: "0.5.1", remote: "origin" });
		assert.equal(result.headSha, expectedHead);
		assert.equal(git(workRoot, ["rev-parse", "refs/tags/v0.5.1"]), expectedHead);
		assert.equal(git(remoteRoot, ["rev-parse", "refs/tags/v0.5.1"]), expectedHead);
		assert.equal(git(remoteRoot, ["rev-parse", "refs/heads/main"]), expectedHead);
	} finally {
		rmSync(tempRoot, { recursive: true, force: true });
	}
});
