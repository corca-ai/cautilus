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
prompt_text="$(cat "$prompt_file")"
printf '{"verdict":"pass","summary":"%s: %s","findings":[{"severity":"pass","message":"%s","path":"variant/%s"}]}\\n' "$variant_id" "$prompt_text" "$schema_file" "$variant_id" > "$output_file"
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
	writeFileSync(promptFile, "smoke prompt", "utf-8");
	writeFileSync(schemaFile, '{"type":"object"}\n', "utf-8");
	return { root, workspace, adapterPath, promptFile, schemaFile };
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
