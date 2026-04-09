import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const BIN_PATH = join(process.cwd(), "bin", "cautilus");

test("cautilus adapter resolve delegates to the bundled resolver", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-resolve-"));
	try {
		const adapterDir = join(root, ".agents");
		mkdirSync(adapterDir, { recursive: true });
		writeFileSync(
			join(adapterDir, "workbench-adapter.yaml"),
			[
				"version: 1",
				"repo: temp",
				"evaluation_surfaces:",
				"  - smoke",
				"baseline_options:",
				"  - baseline git ref via {baseline_ref}",
				"",
			].join("\n"),
			"utf-8",
		);
		const result = spawnSync("node", [BIN_PATH, "adapter", "resolve", "--repo-root", root], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.valid, true);
		assert.equal(payload.data.repo, "temp");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cautilus doctor reports ready when a valid adapter declares an execution surface", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-doctor-ready-"));
	try {
		const adapterDir = join(root, ".agents");
		mkdirSync(adapterDir, { recursive: true });
		writeFileSync(
			join(adapterDir, "workbench-adapter.yaml"),
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
		const result = spawnSync("node", [BIN_PATH, "doctor", "--repo-root", root], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.ready, true);
		assert.equal(payload.status, "ready");
		assert.equal(payload.adapter_path, join(root, ".agents", "workbench-adapter.yaml"));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cautilus doctor fails when the repo has no checked-in adapter", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-doctor-missing-"));
	try {
		const result = spawnSync("node", [BIN_PATH, "doctor", "--repo-root", root], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(result.status, 1, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.ready, false);
		assert.equal(payload.status, "missing_adapter");
		assert.match(payload.suggestions.join("\n"), /adapter init/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cautilus doctor fails when the adapter is invalid", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-doctor-invalid-"));
	try {
		const adapterDir = join(root, ".agents");
		mkdirSync(adapterDir, { recursive: true });
		writeFileSync(
			join(adapterDir, "workbench-adapter.yaml"),
			[
				"version: one",
				"repo: temp",
				"evaluation_surfaces: smoke",
				"",
			].join("\n"),
			"utf-8",
		);
		const result = spawnSync("node", [BIN_PATH, "doctor", "--repo-root", root], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(result.status, 1, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.ready, false);
		assert.equal(payload.status, "invalid_adapter");
		assert.ok(payload.errors.length > 0);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
