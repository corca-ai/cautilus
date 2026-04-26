import assert from "node:assert/strict";
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const BIN_PATH = join(process.cwd(), "bin", "cautilus");

test("repo shim forwards --version to the Go CLI entry", () => {
	const result = spawnSync(BIN_PATH, ["--version"], {
		cwd: process.cwd(),
		encoding: "utf-8",
	});
	assert.equal(result.status, 0, result.stderr);
	const packageJSON = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));
	assert.equal(result.stdout.trim(), packageJSON.version);
});

test("repo shim uses tmp-backed Go caches when caller does not provide them", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-repo-shim-go-cache-"));
	const readOnlyTmp = join(root, "caller-tmp");
	try {
		mkdirSync(readOnlyTmp);
		chmodSync(readOnlyTmp, 0o555);
		const result = spawnSync(BIN_PATH, ["--version"], {
			cwd: process.cwd(),
			encoding: "utf-8",
			env: {
				...process.env,
				CAUTILUS_GO_TMP_ROOT: root,
				TMPDIR: readOnlyTmp,
				GOCACHE: "",
				GOTMPDIR: "",
			},
		});
		assert.equal(result.status, 0, result.stderr);
		assert.equal(existsSync(join(root, "cautilus-go-build-cache")), true);
		assert.equal(existsSync(join(root, "cautilus-go-tmp")), true);
		assert.equal(existsSync(join(root, "cautilus-cgo-tmp")), true);
	} finally {
		if (existsSync(readOnlyTmp)) {
			chmodSync(readOnlyTmp, 0o755);
		}
		rmSync(root, { recursive: true, force: true });
	}
});

test("repo shim preserves caller cwd while resolving doctor against a consumer repo", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-repo-shim-doctor-"));
	try {
		spawnSync("git", ["init"], { cwd: root });
		spawnSync("git", ["-C", root, "config", "user.email", "test@test.com"]);
		spawnSync("git", ["-C", root, "config", "user.name", "test"]);
		writeFileSync(join(root, ".gitignore"), "", "utf-8");
		spawnSync("git", ["-C", root, "add", ".gitignore"]);
		spawnSync("git", ["-C", root, "commit", "-m", "bootstrap"]);
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
				"eval_test_command_templates:",
				"  - npm run check",
				"",
			].join("\n"),
			"utf-8",
		);

		const result = spawnSync(BIN_PATH, ["doctor", "--repo-root", "."], {
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

test("repo shim keeps lifecycle install working from a consumer repo", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-repo-shim-skill-install-"));
	try {
		const install = spawnSync(BIN_PATH, ["install", "--repo-root", "."], {
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
