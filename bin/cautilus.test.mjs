import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const BIN_PATH = join(process.cwd(), "bin", "cautilus");

function writeExecutable(root, name, body) {
	const filePath = join(root, name);
	writeFileSync(filePath, body, "utf-8");
	chmodSync(filePath, 0o755);
	return filePath;
}

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

test("standalone temp repo can adopt cautilus without Ceal-owned paths", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-standalone-smoke-"));
	try {
		writeFileSync(
			join(root, "package.json"),
			JSON.stringify(
				{
					name: "standalone-smoke",
					private: true,
					scripts: {
						check: "echo ok",
					},
				},
				null,
				2,
			),
			"utf-8",
		);
		mkdirSync(join(root, "fixtures"), { recursive: true });
		writeFileSync(join(root, "fixtures", "review.prompt.md"), "standalone smoke prompt\n", "utf-8");
		writeFileSync(join(root, "fixtures", "review.schema.json"), '{"type":"object"}\n', "utf-8");
		writeExecutable(
			root,
			"variant.sh",
			`#!/bin/sh
output_file="$1"
printf '{"verdict":"pass","summary":"standalone smoke","findings":[{"severity":"pass","message":"standalone","path":"variant/sh"}]}\\n' > "$output_file"
`,
		);

		const init = spawnSync("node", [BIN_PATH, "adapter", "init", "--repo-root", root], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(init.status, 0, init.stderr);
		const adapterPath = join(root, ".agents", "workbench-adapter.yaml");
		const adapterText =
			readFileSync(adapterPath, "utf-8") +
			[
				"default_prompt_file: fixtures/review.prompt.md",
				"default_schema_file: fixtures/review.schema.json",
				"executor_variants:",
				"  - id: standalone",
				"    tool: command",
				"    purpose: standalone smoke variant",
				"    command_template: sh {candidate_repo}/variant.sh {output_file}",
				"",
			].join("\n");
		writeFileSync(adapterPath, adapterText, "utf-8");

		const doctor = spawnSync("node", [BIN_PATH, "doctor", "--repo-root", root], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(doctor.status, 0, doctor.stderr);
		const doctorPayload = JSON.parse(doctor.stdout);
		assert.equal(doctorPayload.ready, true);
		assert.equal(doctorPayload.status, "ready");

		const outputDir = join(root, "outputs");
		const review = spawnSync(
			"node",
			[BIN_PATH, "review", "variants", "--repo-root", root, "--workspace", root, "--output-dir", outputDir],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(review.status, 0, review.stderr);
		const summary = JSON.parse(readFileSync(review.stdout.trim(), "utf-8"));
		assert.equal(summary.repoRoot, root);
		assert.equal(summary.variants.length, 1);
		assert.equal(summary.variants[0].status, "passed");
		assert.equal(summary.variants[0].output.summary, "standalone smoke");
		assert.doesNotMatch(JSON.stringify(summary), /\/home\/ubuntu\/ceal\//);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
