import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { ACTIVE_RUN_ENV_VAR, DEFAULT_RUNS_ROOT } from "./active-run.mjs";

const SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "run-workbench-executor-variants.mjs");

function writeExecutable(root, name, body) {
	const filePath = join(root, name);
	writeFileSync(filePath, body, "utf-8");
	chmodSync(filePath, 0o755);
	return filePath;
}

function createAdapterRepo({ failVariantId = "" } = {}) {
	const root = mkdtempSync(join(tmpdir(), "cautilus-workbench-runner-"));
	const workspace = join(root, "workspace");
	mkdirSync(workspace, { recursive: true });
	writeExecutable(
			workspace,
			"variant.sh",
			`#!/bin/sh
variant_id="$1"
output_file="$2"
prompt_file="$3"
schema_file="$4"
if [ -n "$CAUTILUS_TEST_SLEEP_MS" ]; then
  python3 - "$CAUTILUS_TEST_SLEEP_MS" <<'PY'
import sys
import time
time.sleep(int(sys.argv[1]) / 1000)
PY
fi
if [ "$variant_id" = "${failVariantId}" ]; then
  echo "repo-local variant failure for $variant_id" >&2
  exit 1
fi
node - "$variant_id" "$output_file" "$prompt_file" "$schema_file" <<'EOF'
const [variantId, outputFile, promptFile, schemaFile] = process.argv.slice(2);
const { readFileSync, writeFileSync } = await import("node:fs");
const promptText = readFileSync(promptFile, "utf-8").trimEnd();
writeFileSync(
	outputFile,
	JSON.stringify({
		verdict: "pass",
		summary: \`\${variantId}: \${promptText}\`,
		telemetry: {
			provider: "mock",
			model: \`mock-\${variantId}\`,
			total_tokens: 42,
			cost_usd: 0.01,
		},
		findings: [{ severity: "pass", message: schemaFile, path: \`variant/\${variantId}\` }],
	}) + "\\n",
	"utf-8",
);
EOF
`,
	);
	const adapterPath = join(root, "adapter.yaml");
	writeFileSync(
		adapterPath,
		[
			"version: 1",
			"repo: temp",
			"evaluation_surfaces:",
			"  - smoke",
			"baseline_options:",
			"  - baseline git ref via {baseline_ref}",
			"executor_variants:",
			"  - id: alpha",
			"    tool: command",
			"    command_template: sh {candidate_repo}/variant.sh alpha {output_file} {prompt_file} {schema_file}",
			"  - id: beta",
			"    tool: command",
			"    command_template: sh {candidate_repo}/variant.sh beta {output_file} {prompt_file} {schema_file}",
			"human_review_prompts:",
			"  - id: operator",
			"    prompt: smoke",
			"",
		].join("\n"),
		"utf-8",
	);
	const promptFile = join(root, "prompt.md");
	const schemaFile = join(root, "schema.json");
	const reportFile = join(root, "report.json");
	writeFileSync(promptFile, "smoke prompt", "utf-8");
	writeFileSync(schemaFile, '{"type":"object"}\n', "utf-8");
	writeFileSync(
		reportFile,
		`${JSON.stringify(
			{
				schemaVersion: "cautilus.report_packet.v1",
				generatedAt: "2026-04-11T00:02:00.000Z",
				candidate: "feature/cli",
				baseline: "origin/main",
				intent: "The CLI should explain missing adapter setup without operator guesswork.",
				commands: [],
				commandObservations: [],
				modesRun: ["held_out"],
				modeSummaries: [
					{
						mode: "held_out",
						status: "passed",
						summary: "held_out completed across 1 command.",
						compareArtifact: {
							schemaVersion: "cautilus.compare_artifact.v1",
							summary: "Held-out doctor messaging improved.",
							verdict: "improved",
							improved: ["doctor-missing-adapter"],
						},
					},
				],
				telemetry: { modeCount: 1 },
				improved: ["doctor-missing-adapter"],
				regressed: [],
				unchanged: [],
				noisy: [],
				humanReviewFindings: [],
				recommendation: "defer",
			},
			null,
			2,
		)}\n`,
		"utf-8",
	);
	return { root, workspace, adapterPath, promptFile, schemaFile, reportFile };
}

function runReviewVariants(args, { cwd = process.cwd(), env = process.env } = {}) {
	return spawnSync("node", [SCRIPT_PATH, ...args], {
		cwd,
		encoding: "utf-8",
		env,
	});
}

test("run-workbench-executor-variants executes every adapter-defined variant and writes a summary", () => {
	const { root, workspace, adapterPath, promptFile, schemaFile } = createAdapterRepo();
	try {
		const outputDir = join(root, "outputs");
		const result = runReviewVariants(
			[
				"--repo-root",
				root,
				"--adapter",
				adapterPath,
				"--workspace",
				workspace,
				"--prompt-file",
				promptFile,
				"--schema-file",
				schemaFile,
				"--output-dir",
				outputDir,
			],
		);
		assert.equal(result.status, 0, result.stderr);
		const summaryPath = result.stdout.trim();
		const summary = JSON.parse(readFileSync(summaryPath, "utf-8"));
		assert.equal(summary.variants.length, 2);
		assert.equal(summary.variants[0].status, "passed");
		assert.equal(summary.variants[1].status, "passed");
		assert.equal(summary.telemetry.variantCount, 2);
		assert.equal(summary.telemetry.passedVariantCount, 2);
		assert.ok(summary.telemetry.durationMs >= 0);
		assert.equal(summary.telemetry.total_tokens, 84);
			assert.equal(summary.telemetry.cost_usd, 0.02);
			assert.deepEqual(summary.telemetry.providers, ["mock"]);
			assert.ok(summary.variants[0].durationMs >= 0);
			assert.equal(summary.variants[0].telemetry.provider, "mock");
			assert.match(summary.variants[0].output.summary, /^alpha:/);
			assert.match(summary.variants[1].output.summary, /^beta:/);
			assert.match(result.stderr, /review variants start: repo=/);
			assert.match(result.stderr, /variant alpha start:/);
			assert.match(result.stderr, /variant beta passed in /);
			assert.match(result.stderr, /review variants complete: status=passed summary=/);
			assert.ok(summary.variants[0].stdoutFile.endsWith(".stdout"));
			assert.ok(existsSync(summary.variants[0].stdoutFile));
			assert.ok(existsSync(summary.variants[0].stderrFile));
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
});

test("run-workbench-executor-variants falls back to adapter default prompt and schema files", () => {
	const { root, workspace, adapterPath, promptFile, schemaFile } = createAdapterRepo();
	try {
		const adapterWithDefaults = join(root, "adapter-with-defaults.yaml");
		writeFileSync(
			adapterWithDefaults,
			readFileSync(adapterPath, "utf-8") +
				`default_prompt_file: ${promptFile}\n` +
				`default_schema_file: ${schemaFile}\n`,
			"utf-8",
		);
		const outputDir = join(root, "default-outputs");
		const result = runReviewVariants(
			[
				"--repo-root",
				root,
				"--adapter",
				adapterWithDefaults,
				"--workspace",
				workspace,
				"--output-dir",
				outputDir,
			],
		);
		assert.equal(result.status, 0, result.stderr);
		const summary = JSON.parse(readFileSync(result.stdout.trim(), "utf-8"));
			assert.equal(summary.promptFile, promptFile);
			assert.equal(summary.schemaFile, schemaFile);
			assert.equal(summary.variants.length, 2);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-workbench-executor-variants can render a prompt from a report file when no prompt file is provided", () => {
	const { root, workspace, adapterPath, schemaFile, reportFile } = createAdapterRepo();
	try {
		const adapterWithSchema = join(root, "adapter-with-schema.yaml");
		writeFileSync(
			adapterWithSchema,
			readFileSync(adapterPath, "utf-8") + `default_schema_file: ${schemaFile}\n`,
			"utf-8",
		);
		const outputDir = join(root, "report-driven-outputs");
		const result = runReviewVariants(
			[
				"--repo-root",
				root,
				"--adapter",
				adapterWithSchema,
				"--workspace",
				workspace,
				"--report-file",
				reportFile,
				"--output-dir",
				outputDir,
			],
		);
		assert.equal(result.status, 0, result.stderr);
		const summary = JSON.parse(readFileSync(result.stdout.trim(), "utf-8"));
			assert.equal(summary.variants.length, 2);
			assert.match(readFileSync(summary.promptFile, "utf-8"), /Held-out doctor messaging improved\./);
			assert.ok(summary.reviewPacketFile.endsWith("review-packet.json"));
			assert.ok(summary.reviewPromptInputFile.endsWith("review-prompt-input.json"));
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});

test("run-workbench-executor-variants suppresses progress logs with --quiet", () => {
	const { root, workspace, adapterPath, promptFile, schemaFile } = createAdapterRepo();
	try {
		const outputDir = join(root, "quiet-outputs");
		const result = runReviewVariants(
			[
				"--repo-root",
				root,
				"--adapter",
				adapterPath,
				"--workspace",
				workspace,
				"--prompt-file",
				promptFile,
				"--schema-file",
				schemaFile,
				"--output-dir",
				outputDir,
				"--quiet",
			],
		);
		assert.equal(result.status, 0, result.stderr);
		assert.equal(result.stderr, "");
		assert.equal(result.stdout.trim(), join(outputDir, "summary.json"));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-workbench-executor-variants emits heartbeat and ownership hints for failed variants", () => {
	const { root, workspace, adapterPath, promptFile, schemaFile } = createAdapterRepo({ failVariantId: "beta" });
	try {
		const outputDir = join(root, "failing-outputs");
		const result = runReviewVariants(
			[
				"--repo-root",
				root,
				"--adapter",
				adapterPath,
				"--workspace",
				workspace,
				"--prompt-file",
				promptFile,
				"--schema-file",
				schemaFile,
				"--output-dir",
				outputDir,
			],
			{
				env: {
					...process.env,
					CAUTILUS_PROGRESS_HEARTBEAT_MS: "20",
					CAUTILUS_TEST_SLEEP_MS: "80",
				},
			},
		);
		assert.equal(result.status, 1, result.stderr);
		const summary = JSON.parse(readFileSync(result.stdout.trim(), "utf-8"));
		assert.equal(summary.variants[1].status, "failed");
		assert.match(result.stderr, /variant beta still running after /);
		assert.match(result.stderr, /variant beta artifacts: stdout=.*stderr=.*/);
		assert.match(result.stderr, /variant beta failure signal: repo-local variant failure for beta/);
		assert.match(result.stderr, /variant beta ownership hint: Repo-local adapter, artifact, or policy failures are usually consumer-owned/);
		assert.match(result.stderr, /review variants complete: status=failed summary=/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-workbench-executor-variants honors CAUTILUS_RUN_DIR when --output-dir is omitted", () => {
	const { root, workspace, adapterPath, promptFile, schemaFile } = createAdapterRepo();
	try {
		const activeRunDir = join(root, "active-run");
		mkdirSync(activeRunDir, { recursive: true });
		const result = runReviewVariants(
			[
				"--repo-root",
				root,
				"--adapter",
				adapterPath,
				"--workspace",
				workspace,
				"--prompt-file",
				promptFile,
				"--schema-file",
				schemaFile,
			],
			{
				env: { ...process.env, [ACTIVE_RUN_ENV_VAR]: activeRunDir },
			},
		);
		assert.equal(result.status, 0, result.stderr);
		assert.equal(result.stdout.trim(), join(activeRunDir, "summary.json"));
		assert.doesNotMatch(result.stderr, /Active run:/);
		const summary = JSON.parse(readFileSync(result.stdout.trim(), "utf-8"));
		assert.equal(summary.outputDir, activeRunDir);
		assert.equal(existsSync(join(activeRunDir, "alpha.json")), true);
		assert.equal(existsSync(join(activeRunDir, "beta.json")), true);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-workbench-executor-variants auto-materializes a fresh runDir under the default root and logs Active run", () => {
	const { root, workspace, adapterPath, promptFile, schemaFile } = createAdapterRepo();
	try {
		const result = runReviewVariants(
			[
				"--repo-root",
				root,
				"--adapter",
				adapterPath,
				"--workspace",
				workspace,
				"--prompt-file",
				promptFile,
				"--schema-file",
				schemaFile,
			],
			{
				cwd: root,
				env: { ...process.env, [ACTIVE_RUN_ENV_VAR]: "" },
			},
		);
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stderr, /Active run: /);
		const summaryPath = result.stdout.trim();
		assert.match(summaryPath, new RegExp(`^${resolve(root, DEFAULT_RUNS_ROOT).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.+/summary\\.json$`));
		const summary = JSON.parse(readFileSync(summaryPath, "utf-8"));
		assert.equal(summary.outputDir, resolve(summary.outputDir));
		assert.equal(existsSync(join(summary.outputDir, "run.json")), true);
		assert.equal(existsSync(join(summary.outputDir, "alpha.json")), true);
		assert.equal(existsSync(join(summary.outputDir, "beta.json")), true);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-workbench-executor-variants explicit --output-dir overrides an inherited CAUTILUS_RUN_DIR", () => {
	const { root, workspace, adapterPath, promptFile, schemaFile } = createAdapterRepo();
	try {
		const activeRunDir = join(root, "active-run");
		mkdirSync(activeRunDir, { recursive: true });
		const explicitOutputDir = join(root, "explicit-output");
		const result = runReviewVariants(
			[
				"--repo-root",
				root,
				"--adapter",
				adapterPath,
				"--workspace",
				workspace,
				"--prompt-file",
				promptFile,
				"--schema-file",
				schemaFile,
				"--output-dir",
				explicitOutputDir,
			],
			{
				env: { ...process.env, [ACTIVE_RUN_ENV_VAR]: activeRunDir },
			},
		);
		assert.equal(result.status, 0, result.stderr);
		assert.equal(result.stdout.trim(), join(explicitOutputDir, "summary.json"));
		assert.equal(existsSync(join(explicitOutputDir, "alpha.json")), true);
		assert.equal(existsSync(join(activeRunDir, "alpha.json")), false);
		assert.doesNotMatch(result.stderr, /Active run:/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
