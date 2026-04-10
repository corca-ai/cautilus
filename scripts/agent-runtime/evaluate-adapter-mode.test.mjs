import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { COMPARE_ARTIFACT_SCHEMA } from "./contract-versions.mjs";

const SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "evaluate-adapter-mode.mjs");

function writeExecutable(root, name, body) {
	const filePath = join(root, name);
	writeFileSync(filePath, body, "utf-8");
	chmodSync(filePath, 0o755);
	return filePath;
}

function createRepo() {
	const root = mkdtempSync(join(tmpdir(), "cautilus-mode-eval-"));
	const adapterDir = join(root, ".agents");
	const workspace = join(root, "workspace");
	mkdirSync(adapterDir, { recursive: true });
	mkdirSync(workspace, { recursive: true });
	writeExecutable(
		workspace,
		"bench.sh",
		`#!/bin/sh
mode="$1"
scenario_results_file="$2"
cat > "$scenario_results_file" <<JSON
{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "$mode",
  "results": [
    {
      "scenarioId": "doctor-missing-adapter",
      "status": "passed",
      "durationMs": 110,
      "telemetry": {
        "total_tokens": 42,
        "cost_usd": 0.01
      }
    }
  ],
  "compareArtifact": {
    "schemaVersion": "cautilus.compare_artifact.v1",
    "summary": "Held-out doctor messaging improved.",
    "verdict": "improved",
    "improved": [
      "doctor-missing-adapter"
    ]
  }
}
JSON
echo "$mode ok"
`,
	);
	writeExecutable(
		workspace,
		"preflight.sh",
		`#!/bin/sh
echo preflight-ok
`,
	);
	writeFileSync(
		join(adapterDir, "cautilus-adapter.yaml"),
		[
			"version: 1",
			"repo: temp",
			"evaluation_surfaces:",
			"  - cli behavior",
			"baseline_options:",
			"  - baseline git ref via {baseline_ref}",
			"preflight_commands:",
			"  - sh {candidate_repo}/preflight.sh",
			"held_out_command_templates:",
			"  - sh {candidate_repo}/bench.sh held_out {scenario_results_file}",
			"full_gate_command_templates:",
			"  - sh {candidate_repo}/bench.sh full_gate {scenario_results_file}",
			"held_out_samples_default: 2",
			"full_gate_samples_default: 2",
			"",
		].join("\n"),
		"utf-8",
	);
	return { root, workspace };
}

test("evaluate-adapter-mode executes held_out commands and emits a report packet", () => {
	const { root, workspace } = createRepo();
	try {
		const outputDir = join(root, "outputs");
		const result = spawnSync(
			"node",
			[
				SCRIPT_PATH,
				"--repo-root",
				root,
				"--candidate-repo",
				workspace,
				"--mode",
				"held_out",
				"--intent",
				"CLI recovery behavior should stay legible.",
				"--baseline-ref",
				"origin/main",
				"--output-dir",
				outputDir,
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(result.status, 0, result.stderr);
		const report = JSON.parse(readFileSync(result.stdout.trim(), "utf-8"));
		assert.equal(report.schemaVersion, "cautilus.report_packet.v1");
		assert.equal(report.recommendation, "defer");
		assert.equal(report.commandObservations.length, 2);
		assert.equal(report.modeSummaries[0].scenarioTelemetrySummary.overall.total_tokens, 42);
		assert.equal(report.modeSummaries[0].scenarioTelemetrySummary.overall.cost_usd, 0.01);
		assert.equal(report.modeSummaries[0].compareArtifact.schemaVersion, COMPARE_ARTIFACT_SCHEMA);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("evaluate-adapter-mode promotes a passing full_gate run to accept-now", () => {
	const { root, workspace } = createRepo();
	try {
		const outputDir = join(root, "full-gate-outputs");
		const result = spawnSync(
			"node",
			[
				SCRIPT_PATH,
				"--repo-root",
				root,
				"--candidate-repo",
				workspace,
				"--mode",
				"full_gate",
				"--intent",
				"CLI full gate should still pass.",
				"--baseline-ref",
				"origin/main",
				"--output-dir",
				outputDir,
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(result.status, 0, result.stderr);
		const report = JSON.parse(readFileSync(result.stdout.trim(), "utf-8"));
		assert.equal(report.recommendation, "accept-now");
		assert.equal(report.modesRun[0], "full_gate");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
