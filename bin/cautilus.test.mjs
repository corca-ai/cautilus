import assert from "node:assert/strict";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const BIN_PATH = join(process.cwd(), "bin", "cautilus");

test("node shim forwards --version to the Go CLI entry", () => {
	const result = spawnSync("node", [BIN_PATH, "--version"], {
		cwd: process.cwd(),
		encoding: "utf-8",
	});
	assert.equal(result.status, 0, result.stderr);
	const packageJSON = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));
	assert.equal(result.stdout.trim(), packageJSON.version);
});

test("node shim preserves caller cwd while resolving doctor against a consumer repo", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-node-shim-doctor-"));
	try {
		const adapterDir = join(root, ".agents");
		mkdirSync(adapterDir, { recursive: true });
		writeFileSync(
			join(adapterDir, "cautilus-adapter.yaml"),
			[
				"version: 1",
				"repo: temp",
				"evaluation_surfaces:",
				"  - smoke",
				"baseline_options:",
				"  - baseline git ref via {baseline_ref}",
				"iterate_command_templates:",
				"  - npm run check",
				"",
			].join("\n"),
			"utf-8",
		);

		const result = spawnSync("node", [BIN_PATH, "doctor", "--repo-root", "."], {
			cwd: root,
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.ready, true);
		assert.equal(payload.repo_root, root);
		assert.equal(payload.adapter_path, join(root, ".agents", "cautilus-adapter.yaml"));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("node shim keeps bundled skills install working from a consumer repo", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-node-shim-skill-install-"));
	try {
		const install = spawnSync("node", [BIN_PATH, "skills", "install"], {
			cwd: root,
			encoding: "utf-8",
		});
		assert.equal(install.status, 0, install.stderr);
		assert.match(install.stdout, /Installed .*\.agents\/skills\/cautilus/);

		const skillPath = join(root, ".agents", "skills", "cautilus", "SKILL.md");
		assert.equal(existsSync(skillPath), true);
		assert.doesNotMatch(readFileSync(skillPath, "utf-8"), /node \.\/bin\/cautilus/);

		const claudeSkills = join(root, ".claude", "skills");
		assert.equal(lstatSync(claudeSkills).isSymbolicLink(), true);
		assert.equal(readlinkSync(claudeSkills), "../.agents/skills");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
