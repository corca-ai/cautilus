import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const RUN_SCRIPT = join(process.cwd(), "scripts", "agent-runtime", "run-live-instance-scenario.mjs");

function writeExecutableFile(path, contents) {
	writeFileSync(path, contents, "utf-8");
	chmodSync(path, 0o755);
}

function runLiveInvocation(args, cwd = process.cwd()) {
	return spawnSync("node", [RUN_SCRIPT, ...args], {
		cwd,
		encoding: "utf-8",
	});
}

function writeRequestFile(root, instanceId = "ceal") {
	const requestFile = join(root, "request.json");
	writeFileSync(
		requestFile,
		`${JSON.stringify(
			{
				schemaVersion: "cautilus.live_run_invocation_request.v1",
				requestId: "live-run-review-after-retro-001",
				instanceId,
				timeoutMs: 45000,
				captureTranscript: true,
				scenario: {
					scenarioId: "review-after-retro",
					name: "Review After Retro",
					description: "The operator pivots back to review in one thread.",
					maxTurns: 2,
					sideEffectsMode: "read_only",
					simulatorTurns: ["retro 먼저 해주세요", "이제 review로 돌아가죠"],
				},
			},
			null,
			2,
		)}\n`,
		"utf-8",
	);
	return requestFile;
}

test("run-live-instance-scenario executes the consumer command and accepts a completed packet", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-live-run-completed-"));
	try {
		const adapterDir = join(root, ".agents");
		const consumerDir = join(root, "scripts", "consumer");
		mkdirSync(adapterDir, { recursive: true });
		mkdirSync(consumerDir, { recursive: true });
		writeExecutableFile(
			join(consumerDir, "run-live-instance-scenario.mjs"),
			[
				"#!/usr/bin/env node",
				"import { readFileSync, writeFileSync } from 'node:fs';",
				"const args = process.argv.slice(2);",
				"const take = (flag) => args[args.indexOf(flag) + 1];",
				"const request = JSON.parse(readFileSync(take('--request-file'), 'utf-8'));",
				"writeFileSync(take('--output-file'), JSON.stringify({",
				"  schemaVersion: 'cautilus.live_run_invocation_result.v1',",
				"  requestId: request.requestId,",
				"  instanceId: take('--instance-id'),",
				"  executionStatus: 'completed',",
				"  summary: 'completed by synthetic consumer',",
				"  scenarioResult: {",
				"    scenarioId: request.scenario.scenarioId,",
				"    status: 'pass',",
				"    summary: 'synthetic pass'",
				"  }",
				"}, null, 2) + '\\n', 'utf-8');",
				"",
			].join("\n"),
		);
		writeFileSync(
			join(adapterDir, "cautilus-adapter.yaml"),
			[
				"version: 1",
				"repo: temp",
				"evaluation_surfaces:",
				"  - workflow behavior",
				"baseline_options:",
				"  - baseline git ref via {baseline_ref}",
				"live_run_invocation:",
				"  command_template: node scripts/agent-runtime/run-live-instance-scenario.mjs --repo-root {repo_root} --adapter-path {adapter_path} --instance-id {instance_id} --request-file {request_file} --output-file {output_file}",
				"  consumer_command_template: node scripts/consumer/run-live-instance-scenario.mjs --repo-root {repo_root} --adapter-path {adapter_path} --instance-id {instance_id} --request-file {request_file} --output-file {output_file}",
				"",
			].join("\n"),
			"utf-8",
		);
		const requestFile = writeRequestFile(root);
		const outputFile = join(root, "artifacts", "result.json");
		const result = runLiveInvocation(
			["--repo-root", root, "--instance-id", "ceal", "--request-file", requestFile, "--output-file", outputFile],
			root,
		);
		assert.equal(result.status, 0, result.stderr);
		const output = JSON.parse(readFileSync(outputFile, "utf-8"));
		assert.equal(output.executionStatus, "completed");
		assert.equal(output.scenarioResult.status, "pass");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-live-instance-scenario accepts a blocked packet with diagnostics", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-live-run-blocked-"));
	try {
		const adapterDir = join(root, ".agents");
		const consumerDir = join(root, "scripts", "consumer");
		mkdirSync(adapterDir, { recursive: true });
		mkdirSync(consumerDir, { recursive: true });
		writeExecutableFile(
			join(consumerDir, "run-live-instance-scenario.mjs"),
			[
				"#!/usr/bin/env node",
				"import { readFileSync, writeFileSync } from 'node:fs';",
				"const args = process.argv.slice(2);",
				"const take = (flag) => args[args.indexOf(flag) + 1];",
				"const request = JSON.parse(readFileSync(take('--request-file'), 'utf-8'));",
				"writeFileSync(take('--output-file'), JSON.stringify({",
				"  schemaVersion: 'cautilus.live_run_invocation_result.v1',",
				"  requestId: request.requestId,",
				"  instanceId: take('--instance-id'),",
				"  executionStatus: 'blocked',",
				"  summary: 'instance is in maintenance mode',",
				"  diagnostics: [{",
				"    code: 'instance_maintenance_mode',",
				"    severity: 'error',",
				"    message: 'ceal is draining background jobs'",
				"  }]",
				"}, null, 2) + '\\n', 'utf-8');",
				"",
			].join("\n"),
		);
		writeFileSync(
			join(adapterDir, "cautilus-adapter.yaml"),
			[
				"version: 1",
				"repo: temp",
				"evaluation_surfaces:",
				"  - workflow behavior",
				"baseline_options:",
				"  - baseline git ref via {baseline_ref}",
				"live_run_invocation:",
				"  command_template: node scripts/agent-runtime/run-live-instance-scenario.mjs --repo-root {repo_root} --adapter-path {adapter_path} --instance-id {instance_id} --request-file {request_file} --output-file {output_file}",
				"  consumer_command_template: node scripts/consumer/run-live-instance-scenario.mjs --repo-root {repo_root} --adapter-path {adapter_path} --instance-id {instance_id} --request-file {request_file} --output-file {output_file}",
				"",
			].join("\n"),
			"utf-8",
		);
		const requestFile = writeRequestFile(root);
		const outputFile = join(root, "artifacts", "blocked.json");
		const result = runLiveInvocation(
			["--repo-root", root, "--instance-id", "ceal", "--request-file", requestFile, "--output-file", outputFile],
			root,
		);
		assert.equal(result.status, 0, result.stderr);
		const output = JSON.parse(readFileSync(outputFile, "utf-8"));
		assert.equal(output.executionStatus, "blocked");
		assert.equal(output.diagnostics[0].code, "instance_maintenance_mode");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-live-instance-scenario rejects recursive helper configuration without consumer_command_template", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-live-run-recursive-"));
	try {
		const adapterDir = join(root, ".agents");
		mkdirSync(adapterDir, { recursive: true });
		writeFileSync(
			join(adapterDir, "cautilus-adapter.yaml"),
			[
				"version: 1",
				"repo: temp",
				"evaluation_surfaces:",
				"  - workflow behavior",
				"baseline_options:",
				"  - baseline git ref via {baseline_ref}",
				"live_run_invocation:",
				"  command_template: node scripts/agent-runtime/run-live-instance-scenario.mjs --repo-root {repo_root} --adapter-path {adapter_path} --instance-id {instance_id} --request-file {request_file} --output-file {output_file}",
				"",
			].join("\n"),
			"utf-8",
		);
		const requestFile = writeRequestFile(root);
		const outputFile = join(root, "artifacts", "result.json");
		const result = runLiveInvocation(
			["--repo-root", root, "--instance-id", "ceal", "--request-file", requestFile, "--output-file", outputFile],
			root,
		);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /consumer_command_template/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
