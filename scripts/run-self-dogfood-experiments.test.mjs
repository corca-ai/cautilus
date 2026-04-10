import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT_PATH = join(process.cwd(), "scripts", "run-self-dogfood-experiments.mjs");

function writeExecutable(root, relativePath, body) {
	const filePath = join(root, relativePath);
	mkdirSync(join(filePath, ".."), { recursive: true });
	writeFileSync(filePath, body, "utf-8");
	chmodSync(filePath, 0o755);
	return filePath;
}

function writeFile(root, relativePath, content) {
	const filePath = join(root, relativePath);
	mkdirSync(join(filePath, ".."), { recursive: true });
	writeFileSync(filePath, content, "utf-8");
}

function createDogfoodRepo() {
	const root = mkdtempSync(join(tmpdir(), "cautilus-self-dogfood-experiments-"));
	writeFile(root, "README.md", "# temp\n");
	writeFile(root, "docs/specs/self-dogfood.spec.md", "# self-dogfood\n");
	writeFile(root, "skills/cautilus/SKILL.md", "# skill\n");
	writeFile(root, "plugins/cautilus/skills/cautilus/SKILL.md", "# packaged skill\n");
	writeFile(root, "schema.json", '{"type":"object"}\n');
	writeExecutable(
		root,
		"variant.sh",
		`#!/usr/bin/env sh
set -eu
output_file="$1"
prompt_file="$2"
schema_file="$3"
verdict="\${CAUTILUS_TEST_VARIANT_VERDICT:-pass}"
summary="\${CAUTILUS_TEST_VARIANT_SUMMARY:-experiment ok}"
if [ -n "\${CAUTILUS_TEST_SLEEP_MS:-}" ]; then
  python3 - "$CAUTILUS_TEST_SLEEP_MS" <<'PY'
import sys
import time
time.sleep(int(sys.argv[1]) / 1000)
PY
fi
node - "$output_file" "$prompt_file" "$schema_file" "$verdict" "$summary" <<'EOF'
const [outputFile, promptFile, schemaFile, verdict, summary] = process.argv.slice(2);
const { readFileSync, writeFileSync } = await import("node:fs");
const promptText = readFileSync(promptFile, "utf-8");
writeFileSync(
	outputFile,
	JSON.stringify({
		verdict,
		summary: summary + ": " + promptText.split("\\n")[0],
		findings: [{ severity: verdict, message: schemaFile, path: "self-dogfood/mock" }],
	}) + "\\n",
	"utf-8",
);
EOF
`,
	);
	writeFile(
		root,
		".agents/cautilus-adapter.yaml",
		[
			"version: 1",
			"repo: temp",
			"evaluation_surfaces:",
			"  - self dogfood full gate",
			"baseline_options:",
			"  - baseline git ref via {baseline_ref}",
			"full_gate_command_templates:",
			"  - node -e \"console.log('full gate ok')\"",
			"",
		].join("\n"),
	);
	writeFile(
		root,
		".agents/cautilus-adapters/exp-pass.yaml",
		[
			"version: 1",
			"repo: temp",
			"evaluation_surfaces:",
			"  - experiment pass",
			"baseline_options:",
			"  - baseline git ref via {baseline_ref}",
			"executor_variants:",
			"  - id: pass-review",
			"    tool: command",
			"    command_template: CAUTILUS_TEST_VARIANT_VERDICT=pass CAUTILUS_TEST_VARIANT_SUMMARY='pass ok' sh {candidate_repo}/variant.sh {output_file} {prompt_file} {schema_file}",
			"default_schema_file: schema.json",
			"",
		].join("\n"),
	);
	writeFile(
		root,
		".agents/cautilus-adapters/exp-concern.yaml",
		[
			"version: 1",
			"repo: temp",
			"evaluation_surfaces:",
			"  - experiment concern",
			"baseline_options:",
			"  - baseline git ref via {baseline_ref}",
			"executor_variants:",
			"  - id: concern-review",
			"    tool: command",
			"    command_template: CAUTILUS_TEST_VARIANT_VERDICT=concern CAUTILUS_TEST_VARIANT_SUMMARY='needs tuning' sh {candidate_repo}/variant.sh {output_file} {prompt_file} {schema_file}",
			"default_schema_file: schema.json",
			"",
		].join("\n"),
	);
	writeFile(
		root,
		".agents/cautilus-adapters/exp-timeout.yaml",
		[
			"version: 1",
			"repo: temp",
			"evaluation_surfaces:",
			"  - experiment timeout",
			"baseline_options:",
			"  - baseline git ref via {baseline_ref}",
			"review_timeout_ms: 10",
			"executor_variants:",
			"  - id: timeout-review",
			"    tool: command",
			"    command_template: CAUTILUS_TEST_SLEEP_MS=100 sh {candidate_repo}/variant.sh {output_file} {prompt_file} {schema_file}",
			"default_schema_file: schema.json",
			"",
		].join("\n"),
	);
	return root;
}

test("run-self-dogfood-experiments writes latest artifacts and summarizes selected adapters", () => {
	const root = createDogfoodRepo();
	try {
		const artifactRoot = join(root, "artifacts");
		const result = spawnSync(
			"node",
			[
				SCRIPT_PATH,
				"--repo-root",
				root,
				"--artifact-root",
				artifactRoot,
				"--run-id",
				"exp-run",
				"--experiment-adapter-name",
				"exp-pass",
				"--experiment-adapter-name",
				"exp-concern",
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(result.status, 1);
		const summary = JSON.parse(readFileSync(result.stdout.trim(), "utf-8"));
		assert.equal(summary.runId, "exp-run");
		assert.equal(summary.experiments.length, 2);
		assert.equal(summary.experiments[0].adapterName, "exp-pass");
		assert.equal(summary.experiments[1].adapterName, "exp-concern");
		assert.equal(summary.overallStatus, "concern");
		assert.equal(summary.reportRecommendation, "defer");
		assert.equal(summary.gateRecommendation, "accept-now");
		assert.ok(existsSync(join(artifactRoot, "latest", "latest.md")));
		assert.deepEqual(readdirSync(join(artifactRoot, "runs")), ["exp-run"]);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-self-dogfood-experiments records timeout blockers without aborting the bundle", () => {
	const root = createDogfoodRepo();
	try {
		const artifactRoot = join(root, "artifacts");
		const result = spawnSync(
			"node",
			[
				SCRIPT_PATH,
				"--repo-root",
				root,
				"--artifact-root",
				artifactRoot,
				"--run-id",
				"timeout-run",
				"--experiment-adapter-name",
				"exp-timeout",
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(result.status, 1);
		const summary = JSON.parse(readFileSync(result.stdout.trim(), "utf-8"));
		assert.equal(summary.overallStatus, "blocker");
		assert.equal(summary.reportRecommendation, "reject");
		assert.equal(summary.gateRecommendation, "accept-now");
		assert.equal(summary.experiments[0].adapterName, "exp-timeout");
		assert.equal(summary.experiments[0].executionStatus, "failed");
		assert.match(readFileSync(join(artifactRoot, "latest", "latest.md"), "utf-8"), /timed out/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
