import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const CHECK_SCRIPT = join(process.cwd(), "scripts", "check-git-hooks.mjs");
const INSTALL_SCRIPT = join(process.cwd(), "scripts", "install-git-hooks.mjs");

function git(root, args) {
	const result = spawnSync("git", ["-C", root, ...args], {
		encoding: "utf-8",
	});
	assert.equal(result.status, 0, result.stderr);
	return result.stdout.trim();
}

function initRepo(root) {
	git(root, ["init"]);
	git(root, ["config", "user.name", "Cautilus Test"]);
	git(root, ["config", "user.email", "test@example.com"]);
}

function writePrePush(root, executable = true) {
	const hookPath = join(root, ".githooks", "pre-push");
	mkdirSync(join(root, ".githooks"), { recursive: true });
	writeFileSync(hookPath, "#!/usr/bin/env sh\nset -eu\nnpm run verify\n", "utf-8");
	chmodSync(hookPath, executable ? 0o755 : 0o644);
	return hookPath;
}

test("check-git-hooks fails when core.hooksPath is not configured", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-hooks-missing-"));
	try {
		initRepo(root);
		writePrePush(root);
		const result = spawnSync("node", [CHECK_SCRIPT, "--repo-root", root], {
			encoding: "utf-8",
		});
		assert.equal(result.status, 1);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.ready, false);
		assert.equal(payload.configuredHooksPath, null);
		assert.match(result.stdout, /npm run hooks:install/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("install-git-hooks configures core.hooksPath and check-git-hooks passes", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-hooks-ready-"));
	try {
		initRepo(root);
		writePrePush(root, false);
		const install = spawnSync("node", [INSTALL_SCRIPT, "--repo-root", root], {
			encoding: "utf-8",
		});
		assert.equal(install.status, 0, install.stderr);
		const installPayload = JSON.parse(install.stdout);
		assert.equal(installPayload.status, "installed");
		assert.equal(git(root, ["config", "--get", "core.hooksPath"]), ".githooks");

		const result = spawnSync("node", [CHECK_SCRIPT, "--repo-root", root], {
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.ready, true);
		assert.equal(payload.configuredHooksPath, ".githooks");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
