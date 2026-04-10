import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { renderArchiveUrl } from "./fetch-github-archive-sha256.mjs";
import { renderHomebrewFormula } from "./render-homebrew-formula.mjs";

const REPO_ROOT = process.cwd();

test("cautilus --version matches package.json", () => {
	const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf-8"));
	const result = spawnSync("node", [join(REPO_ROOT, "bin", "cautilus"), "--version"], {
		cwd: REPO_ROOT,
		encoding: "utf-8",
	});
	assert.equal(result.status, 0, result.stderr);
	assert.equal(result.stdout.trim(), pkg.version);
});

test("install.sh remains syntactically valid shell", () => {
	const result = spawnSync("bash", ["-n", join(REPO_ROOT, "install.sh")], {
		cwd: REPO_ROOT,
		encoding: "utf-8",
	});
	assert.equal(result.status, 0, result.stderr);
});

test("homebrew formula renderer produces a stable formula body", () => {
	const formula = renderHomebrewFormula({
		version: "v0.1.0",
		repo: "corca-ai/cautilus",
		sha256: "abc123",
	});
	assert.match(formula, /class Cautilus < Formula/);
	assert.match(formula, /https:\/\/github.com\/corca-ai\/cautilus\/archive\/refs\/tags\/v0.1.0.tar.gz/);
	assert.match(formula, /sha256 "abc123"/);
	assert.match(formula, /cautilus --version/);
});

test("github archive URL renderer targets tagged source archives", () => {
	assert.equal(
		renderArchiveUrl({ repo: "corca-ai/cautilus", version: "v0.1.0" }),
		"https://github.com/corca-ai/cautilus/archive/refs/tags/v0.1.0.tar.gz",
	);
});
