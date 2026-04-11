import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const RESOLVE_SCRIPT = join(process.cwd(), "scripts", "resolve_adapter.mjs");
const INIT_SCRIPT = join(process.cwd(), "scripts", "init_adapter.mjs");

function runNode(args, workdir = process.cwd()) {
	const result = spawnSync("node", args, {
		cwd: workdir,
		encoding: "utf-8",
	});
	assert.equal(result.status, 0, result.stderr);
	return result.stdout;
}

test("resolve_adapter loads a named cautilus adapter from the repo", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-workbench-adapter-load-"));
	try {
		const adapterDir = join(root, ".agents", "cautilus-adapters");
		mkdirSync(adapterDir, { recursive: true });
		writeFileSync(
			join(adapterDir, "code-quality.yaml"),
			[
				"version: 1",
				"repo: temp",
				"evaluation_surfaces:",
				"  - code quality",
				"baseline_options:",
				"  - baseline git ref via {baseline_ref}",
				"profile_default: code-quality",
				"",
			].join("\n"),
			"utf-8",
		);
		const stdout = runNode([RESOLVE_SCRIPT, "--repo-root", root, "--adapter-name", "code-quality"]);
		const payload = JSON.parse(stdout);
		assert.equal(payload.valid, true);
		assert.match(payload.path, /\.agents\/cautilus-adapters\/code-quality\.yaml$/);
		assert.equal(payload.data.profile_default, "code-quality");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("resolve_adapter can load an explicit adapter path", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-workbench-adapter-override-"));
	try {
		const adapterPath = join(root, "custom-workbench.yaml");
		writeFileSync(
			adapterPath,
			[
				"version: 1",
				"repo: temp-repo",
				"evaluation_surfaces:",
				"  - meta eval",
				"baseline_options:",
				"  - baseline git ref via {baseline_ref}",
				"",
			].join("\n"),
			"utf-8",
		);
		const stdout = runNode([RESOLVE_SCRIPT, "--repo-root", root, "--adapter", adapterPath]);
		const payload = JSON.parse(stdout);
		assert.equal(payload.valid, true);
		assert.equal(payload.path, adapterPath);
		assert.deepEqual(payload.data.evaluation_surfaces, ["meta eval"]);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("init_adapter scaffolds a named adapter into the named adapter directory", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-workbench-adapter-init-"));
	try {
		writeFileSync(
			join(root, "package.json"),
			JSON.stringify({ name: "temp", scripts: { check: "echo ok" } }, null, 2),
			"utf-8",
		);
		runNode([INIT_SCRIPT, "--repo-root", root, "--adapter-name", "skill-smoke"]);
		const outputPath = join(root, ".agents", "cautilus-adapters", "skill-smoke.yaml");
		assert.equal(existsSync(outputPath), true);
		const created = readFileSync(outputPath, "utf-8");
		assert.match(created, new RegExp(`repo: ${root.split("/").at(-1)}`));
		assert.match(created, /evaluation_surfaces:/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
