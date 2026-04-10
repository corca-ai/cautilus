import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "run-workbench-executor-variants.mjs");

function writeExecutable(root, name, body) {
	const filePath = join(root, name);
	writeFileSync(filePath, body, "utf-8");
	chmodSync(filePath, 0o755);
	return filePath;
}

function createAdapterRepo() {
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

test("run-workbench-executor-variants executes every adapter-defined variant and writes a summary", () => {
	const { root, workspace, adapterPath, promptFile, schemaFile } = createAdapterRepo();
	try {
		const outputDir = join(root, "outputs");
		const result = spawnSync(
			"node",
			[
				SCRIPT_PATH,
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
				cwd: process.cwd(),
				encoding: "utf-8",
			},
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
		const result = spawnSync(
			"node",
			[
				SCRIPT_PATH,
				"--repo-root",
				root,
				"--adapter",
				adapterWithDefaults,
				"--workspace",
				workspace,
				"--output-dir",
				outputDir,
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
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
		const result = spawnSync(
			"node",
			[
				SCRIPT_PATH,
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
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
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
