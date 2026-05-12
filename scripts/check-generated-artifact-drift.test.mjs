import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
	DEFAULT_GENERATED_ARTIFACTS,
	checkGeneratedArtifactDrift,
	parseArgs,
} from "./check-generated-artifact-drift.mjs";

const SCRIPT = join(process.cwd(), "scripts", "check-generated-artifact-drift.mjs");

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
	mkdirSync(join(root, ".cautilus", "claims"), { recursive: true });
	mkdirSync(join(root, "docs", "specs", "evidence"), { recursive: true });
	for (const path of DEFAULT_GENERATED_ARTIFACTS) {
		writeFileSync(join(root, path), `${path}: clean\n`, "utf-8");
	}
	writeFileSync(join(root, "README.md"), "clean\n", "utf-8");
	git(root, ["add", "."]);
	git(root, ["commit", "-m", "initial"]);
}

test("parseArgs defaults to checked-in generated artifact paths", () => {
	const parsed = parseArgs(["--repo-root", "."]);
	assert.equal(parsed.paths.length, DEFAULT_GENERATED_ARTIFACTS.length);
	assert.equal(parsed.json, false);
});

test("parseArgs accepts json and explicit path overrides", () => {
	const parsed = parseArgs(["--repo-root", ".", "--json", "--path", "README.md"]);
	assert.equal(parsed.json, true);
	assert.deepEqual(parsed.paths, ["README.md"]);
});

test("parseArgs rejects unknown flags and missing repo root", () => {
	assert.throws(() => parseArgs(["--nope"]), /Unknown argument: --nope/);
	assert.throws(() => parseArgs(["--repo-root", ""]), /--repo-root is required/);
});

test("generated artifact drift check passes when tracked generated artifacts are clean", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-generated-clean-"));
	try {
		initRepo(root);
		const payload = checkGeneratedArtifactDrift(root);
		assert.equal(payload.ready, true);
		assert.deepEqual(payload.changed, []);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("generated artifact drift check reports explicit path overrides", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-generated-explicit-"));
	try {
		initRepo(root);
		writeFileSync(join(root, "README.md"), "dirty\n", "utf-8");
		const payload = checkGeneratedArtifactDrift(root, ["README.md"]);
		assert.equal(payload.ready, false);
		assert.deepEqual(payload.changed, [{ status: " M", path: "README.md" }]);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("generated artifact drift check fails for modified tracked generated artifacts", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-generated-dirty-"));
	try {
		initRepo(root);
		writeFileSync(
			join(root, ".cautilus", "claims", "status-summary.json"),
			"dirty\n",
			"utf-8",
		);
		const result = spawnSync("node", [SCRIPT, "--repo-root", root, "--json"], {
			encoding: "utf-8",
		});
		assert.equal(result.status, 1);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.ready, false);
		assert.equal(payload.status, "generated_artifact_drift");
		assert.deepEqual(payload.changed, [
			{ status: " M", path: ".cautilus/claims/status-summary.json" },
		]);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("generated artifact drift check text CLI reports clean and dirty states", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-generated-text-"));
	try {
		initRepo(root);
		const clean = spawnSync("node", [SCRIPT, "--repo-root", root], {
			encoding: "utf-8",
		});
		assert.equal(clean.status, 0, clean.stderr);
		assert.match(clean.stdout, /generated artifact drift check: clean/);

		writeFileSync(
			join(root, "docs", "specs", "evidence", "claim-evidence-state.md"),
			"dirty\n",
			"utf-8",
		);
		const dirty = spawnSync("node", [SCRIPT, "--repo-root", root], {
			encoding: "utf-8",
		});
		assert.equal(dirty.status, 1);
		assert.match(dirty.stdout, /uncommitted generated artifacts detected/);
		assert.match(dirty.stdout, /docs\/specs\/evidence\/claim-evidence-state\.md/);
		assert.match(dirty.stdout, /Commit the generated artifact changes before pushing/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("generated artifact drift check reports git errors", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-generated-not-git-"));
	try {
		const result = spawnSync("node", [SCRIPT, "--repo-root", root], {
			encoding: "utf-8",
		});
		assert.equal(result.status, 1);
		assert.match(result.stderr, /not a git repository|failed/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("generated artifact drift check ignores unrelated dirty files", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-generated-unrelated-"));
	try {
		initRepo(root);
		writeFileSync(join(root, "README.md"), "dirty\n", "utf-8");
		const payload = checkGeneratedArtifactDrift(root);
		assert.equal(payload.ready, true);
		assert.deepEqual(payload.changed, []);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
