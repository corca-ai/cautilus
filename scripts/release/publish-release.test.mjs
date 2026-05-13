import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	auditReleaseNarrative,
	detectReleaseSurfaceDrift,
	publishPreparedRelease,
	readReleaseSurfaceVersions,
} from "./publish-release.mjs";

function writeFile(root, relativePath, content) {
	const filePath = join(root, relativePath);
	mkdirSync(join(filePath, ".."), { recursive: true });
	writeFileSync(filePath, content, "utf-8");
}

function git(root, args) {
	return execFileSync("git", ["-C", root, ...args], { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] }).trim();
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
	writeFile(
		root,
		"charness-artifacts/release/latest.md",
		[
			"# Release Record",
			"Date: 2026-05-13",
			"",
			"## Summary",
			"",
			`Released Cautilus \`v${version}\`.`,
			"",
			"## Release Scope",
			"",
			"Test release scope.",
			"",
			"## Verification",
			"",
			"- Test verification.",
			"",
		].join("\n"),
	);
	writeFile(
		root,
		".github/workflows/release-artifacts.yml",
		[
			"name: release-artifacts",
			"jobs:",
			"  release-artifacts:",
			"    steps:",
				"      - name: Build release artifacts",
				"        run: |",
				"          VERSION=\"${GITHUB_REF_NAME}\"",
				"          SHA256=\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\"",
				"          echo \"# Cautilus ${VERSION}\"",
				"          echo \"Public release surface for ${VERSION}.\"",
				"          echo \"- source archive checksum: `${SHA256}`\"",
				"          echo \"- binary artifacts:\"",
				"          echo \"- binary checksum manifest: `cautilus-${VERSION}-checksums.txt`\"",
				"",
			].join("\n"),
	);
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
		});
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("auditReleaseNarrative accepts target-specific release context", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-release-narrative-"));
	try {
		seedReleaseRepo(root, "0.5.1");
		assert.deepEqual(auditReleaseNarrative(root, "0.5.1"), {
			tagName: "v0.5.1",
			releaseRecordPath: "charness-artifacts/release/latest.md",
			workflowPath: ".github/workflows/release-artifacts.yml",
			releaseRecordMentionsTarget: true,
			releaseRecordDeclaresTarget: true,
			releaseRecordHasScope: true,
			releaseRecordHasVerification: true,
			publicNotesTemplateSelfContained: true,
			disallowedFragments: [],
		});
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("publishPreparedRelease rejects stale release narrative before tagging", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-release-stale-narrative-"));
	try {
		seedReleaseRepo(root, "0.5.1");
		writeFile(
			root,
			"charness-artifacts/release/latest.md",
			[
				"# Release Record",
				"Date: 2026-05-13",
				"",
				"## Summary",
				"",
				"Released Cautilus `v0.5.0`.",
				"",
				"## Release Scope",
				"",
				"Old release scope.",
				"",
				"## Verification",
				"",
				"- Old verification.",
				"",
			].join("\n"),
		);
		initGitRepo(root);
		git(root, ["add", "."]);
		git(root, ["commit", "-m", "release-ready"]);
		assert.throws(
			() => publishPreparedRelease({ repoRoot: root, version: "0.5.1", dryRun: true }),
			/release narrative audit failed:\ncharness-artifacts\/release\/latest\.md does not mention v0\.5\.1/,
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("publishPreparedRelease rejects incidental target mentions in stale release records", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-release-incidental-narrative-"));
	try {
		seedReleaseRepo(root, "0.5.1");
		writeFile(
			root,
			"charness-artifacts/release/latest.md",
			[
				"# Release Record",
				"Date: 2026-05-13",
				"",
				"## Summary",
				"",
				"Released Cautilus `v0.5.0`.",
				"",
				"## Release Scope",
				"",
				"Old release scope that happens to mention v0.5.1 as the next release.",
				"",
				"## Verification",
				"",
				"- Old verification.",
				"",
			].join("\n"),
		);
		initGitRepo(root);
		git(root, ["add", "."]);
		git(root, ["commit", "-m", "release-ready"]);
		assert.throws(
			() => publishPreparedRelease({ repoRoot: root, version: "0.5.1", dryRun: true }),
			/release narrative audit failed:[\s\S]*does not declare Released Cautilus `v0\.5\.1`/,
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("publishPreparedRelease rejects release notes that delegate to a source-tree pointer", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-release-pointer-narrative-"));
	try {
		seedReleaseRepo(root, "0.5.1");
		writeFile(
			root,
			".github/workflows/release-artifacts.yml",
			[
				"name: release-artifacts",
				"jobs:",
				"  release-artifacts:",
				"    steps:",
				"      - name: Build release artifacts",
				"        run: |",
				"          echo \"Operator-facing release scope and verification notes are recorded in `charness-artifacts/release/latest.md` at this tag.\"",
				"",
			].join("\n"),
		);
		initGitRepo(root);
		git(root, ["add", "."]);
		git(root, ["commit", "-m", "release-ready"]);
		assert.throws(
			() => publishPreparedRelease({ repoRoot: root, version: "0.5.1", dryRun: true }),
			/release narrative audit failed:[\s\S]*does not generate self-contained public release notes[\s\S]*unverifiable release-note pointer/,
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("publishPreparedRelease rejects alternate source-tree release record pointers", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-release-alt-pointer-narrative-"));
	try {
		seedReleaseRepo(root, "0.5.1");
		writeFile(
			root,
			".github/workflows/release-artifacts.yml",
			[
				"name: release-artifacts",
				"jobs:",
				"  release-artifacts:",
				"    steps:",
				"      - name: Build release artifacts",
				"        run: |",
				"          VERSION=\"${GITHUB_REF_NAME}\"",
				"          SHA256=\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\"",
				"          echo \"# Cautilus ${VERSION}\"",
				"          echo \"Public release surface for ${VERSION}.\"",
				"          echo \"- source archive checksum: `${SHA256}`\"",
				"          echo \"- binary artifacts:\"",
				"          echo \"See charness-artifacts/release/latest.md for release verification notes\"",
				"          cat charness-artifacts/release/latest.md >> \"dist/release-notes-${VERSION}.md\"",
				"          echo \"- binary checksum manifest: `cautilus-${VERSION}-checksums.txt`\"",
				"",
			].join("\n"),
		);
		initGitRepo(root);
		git(root, ["add", "."]);
		git(root, ["commit", "-m", "release-ready"]);
		assert.throws(
			() => publishPreparedRelease({ repoRoot: root, version: "0.5.1", dryRun: true }),
			/release narrative audit failed:[\s\S]*unverifiable release-note pointer: charness-artifacts\/release\/latest\.md/,
		);
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
		assert.equal(result.releaseState.localPrepared, "verified");
		assert.equal(result.releaseState.auditNarrativeCommitted, "verified");
		assert.equal(result.releaseState.branchPushed, "verified");
		assert.equal(result.releaseState.tagPushed, "verified");
		assert.equal(result.releaseState.workflowPublication, "pending-tag-workflow");
		assert.equal(result.releaseState.publicReleaseVerification, "pending-tag-workflow");
		assert.equal(git(workRoot, ["rev-parse", "refs/tags/v0.5.1"]), expectedHead);
		assert.equal(git(remoteRoot, ["rev-parse", "refs/tags/v0.5.1"]), expectedHead);
		assert.equal(git(remoteRoot, ["rev-parse", "refs/heads/main"]), expectedHead);
	} finally {
		rmSync(tempRoot, { recursive: true, force: true });
	}
});

test("publishPreparedRelease can push HEAD to an explicit target branch", () => {
	const tempRoot = mkdtempSync(join(tmpdir(), "cautilus-release-target-branch-"));
	const remoteRoot = join(tempRoot, "remote.git");
	const workRoot = join(tempRoot, "work");
	mkdirSync(workRoot, { recursive: true });
	try {
		git(tempRoot, ["init", "--bare", remoteRoot]);
		seedReleaseRepo(workRoot, "0.5.1");
		initGitRepo(workRoot);
		git(workRoot, ["remote", "add", "origin", remoteRoot]);
		git(workRoot, ["checkout", "-b", "release/v0.5.1"]);
		git(workRoot, ["add", "."]);
		git(workRoot, ["commit", "-m", "release-ready"]);
		const expectedHead = git(workRoot, ["rev-parse", "HEAD"]);

		const result = publishPreparedRelease({
			repoRoot: workRoot,
			version: "0.5.1",
			remote: "origin",
			targetBranch: "main",
		});
		assert.equal(result.branch, "release/v0.5.1");
		assert.equal(result.targetBranch, "main");
		assert.equal(result.branchRefspec, "HEAD:refs/heads/main");
		assert.equal(git(remoteRoot, ["rev-parse", "refs/heads/main"]), expectedHead);
		assert.equal(git(remoteRoot, ["rev-parse", "refs/tags/v0.5.1"]), expectedHead);
	} finally {
		rmSync(tempRoot, { recursive: true, force: true });
	}
});

test("publish CLI reports release state when tag push fails after branch push", () => {
	const tempRoot = mkdtempSync(join(tmpdir(), "cautilus-release-partial-failure-"));
	const remoteRoot = join(tempRoot, "remote.git");
	const workRoot = join(tempRoot, "work");
	mkdirSync(workRoot, { recursive: true });
	try {
		git(tempRoot, ["init", "--bare", remoteRoot]);
		writeFile(
			remoteRoot,
			"hooks/pre-receive",
			[
				"#!/bin/sh",
				"while read old new ref; do",
				"  case \"$ref\" in",
				"    refs/tags/*) echo \"tag rejected\" >&2; exit 1 ;;",
				"  esac",
				"done",
				"exit 0",
				"",
			].join("\n"),
		);
		chmodSync(join(remoteRoot, "hooks/pre-receive"), 0o755);
		seedReleaseRepo(workRoot, "0.5.1");
		initGitRepo(workRoot);
		git(workRoot, ["remote", "add", "origin", remoteRoot]);
		git(workRoot, ["add", "."]);
		git(workRoot, ["commit", "-m", "release-ready"]);
		const expectedHead = git(workRoot, ["rev-parse", "HEAD"]);

		const result = spawnSync(
			process.execPath,
			[
				join(process.cwd(), "scripts/release/publish-release.mjs"),
				"--repo-root",
				workRoot,
				"--version",
				"0.5.1",
				"--remote",
				"origin",
				"--json",
			],
			{ encoding: "utf-8" },
		);
		assert.equal(result.status, 1);
		const payload = JSON.parse(result.stderr);
		assert.equal(payload.ok, false);
		assert.match(payload.error, /tag rejected/);
		assert.equal(payload.releaseState.branchPushed, "verified");
		assert.equal(payload.releaseState.tagPushed, "failed");
		assert.equal(git(remoteRoot, ["rev-parse", "refs/heads/main"]), expectedHead);
		const missingTag = spawnSync("git", ["-C", remoteRoot, "rev-parse", "refs/tags/v0.5.1"], { encoding: "utf-8" });
		assert.notEqual(missingTag.status, 0);
	} finally {
		rmSync(tempRoot, { recursive: true, force: true });
	}
});
