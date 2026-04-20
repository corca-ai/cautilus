import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { COMPARE_ARTIFACT_SCHEMA } from "./contract-versions.mjs";
import { ACTIVE_RUN_ENV_VAR, DEFAULT_RUNS_ROOT } from "./active-run.mjs";

const SCRIPT_PATH = join(process.cwd(), "scripts", "agent-runtime", "evaluate-adapter-mode.mjs");

function writeExecutable(root, name, body) {
	const filePath = join(root, name);
	writeFileSync(filePath, body, "utf-8");
	chmodSync(filePath, 0o755);
	return filePath;
}

function git(root, args) {
	const result = spawnSync("git", ["-C", root, ...args], {
		encoding: "utf-8",
	});
	assert.equal(result.status, 0, result.stderr);
	return result.stdout.trim();
}

function createRepo({ failMode = "", rejectMode = "" } = {}) {
	const root = mkdtempSync(join(tmpdir(), "cautilus-mode-eval-"));
	const adapterDir = join(root, ".agents");
	const workspace = join(root, "workspace");
	const successResultsJson = `{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "$mode",
  "results": [
    {
      "scenarioId": "operator-guidance-smoke",
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
    "summary": "Held-out operator guidance improved.",
    "verdict": "improved",
    "improved": [
      "operator-guidance-smoke"
    ]
  }
}`;
	const rejectedResultsJson = `{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "$mode",
  "results": [
    {
      "scenarioId": "operator-guidance-smoke",
      "status": "failed",
      "durationMs": 110,
      "telemetry": {
        "total_tokens": 42,
        "cost_usd": 0.01
      }
    }
  ],
  "compareArtifact": {
    "schemaVersion": "cautilus.compare_artifact.v1",
    "summary": "Held-out operator guidance regressed.",
    "verdict": "regressed",
    "regressed": [
      "operator-guidance-smoke"
    ]
  }
}`;
	mkdirSync(adapterDir, { recursive: true });
	mkdirSync(workspace, { recursive: true });
	writeExecutable(
			workspace,
			"bench.sh",
			`#!/bin/sh
mode="$1"
scenario_results_file="$2"
if [ -n "$CAUTILUS_TEST_SLEEP_MS" ]; then
  node -e "setTimeout(() => {}, Number(process.argv[1]))" "$CAUTILUS_TEST_SLEEP_MS"
fi
	if [ "$mode" = "${failMode}" ]; then
	  echo "repo-local failure for $mode" >&2
	  exit 1
	fi
	if [ "$mode" = "${rejectMode}" ]; then
	  cat > "$scenario_results_file" <<JSON
${rejectedResultsJson}
JSON
	  echo "comparison rejected for $mode" >&2
	  exit 1
	fi
	cat > "$scenario_results_file" <<JSON
${successResultsJson}
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
			"  - operator workflow",
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
	mkdirSync(join(adapterDir, "cautilus-adapters"), { recursive: true });
	writeFileSync(
		join(adapterDir, "cautilus-adapters", "named-adapter.yaml"),
		[
			"version: 1",
			"repo: temp",
			"evaluation_surfaces:",
			"  - operator workflow",
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

function createScenarioHistoryRepo() {
	const root = mkdtempSync(join(tmpdir(), "cautilus-mode-history-"));
	const adapterDir = join(root, ".agents");
	const workspace = join(root, "workspace");
	const profilesDir = join(root, "profiles");
	mkdirSync(adapterDir, { recursive: true });
	mkdirSync(workspace, { recursive: true });
	mkdirSync(profilesDir, { recursive: true });
	writeExecutable(
		workspace,
		"bench-history.sh",
		`#!/bin/sh
mode="$1"
scenario_results_file="$2"
profile_file="$3"
selected_ids_file="$4"
selection_snapshot="$5"
node - "$profile_file" "$selected_ids_file" "$scenario_results_file" "$selection_snapshot" "$mode" <<'EOF'
const [profileFile, selectedIdsFile, scenarioResultsFile, selectionSnapshot, mode] = process.argv.slice(2);
const { readFileSync, writeFileSync } = await import("node:fs");
const profile = JSON.parse(readFileSync(profileFile, "utf-8"));
const selectedIds = JSON.parse(readFileSync(selectedIdsFile, "utf-8"));
const scenarioIds = profile.scenarios.map((entry) => entry.scenarioId);
writeFileSync(selectionSnapshot, scenarioIds.join(","), "utf-8");
const packet = {
  schemaVersion: "cautilus.scenario_results.v1",
  mode,
  results: scenarioIds.map((scenarioId) => ({
    scenarioId,
    status: "passed",
    overallScore: 100,
    passRate: 1,
  })),
};
writeFileSync(scenarioResultsFile, JSON.stringify(packet) + "\\n", "utf-8");
if (JSON.stringify(scenarioIds) !== JSON.stringify(selectedIds)) {
  throw new Error(
    "profile scenarios " + JSON.stringify(scenarioIds) + " did not match selected ids " + JSON.stringify(selectedIds),
  );
}
EOF
echo "$mode ok"
`,
	);
	writeFileSync(
		join(profilesDir, "default-train.json"),
		JSON.stringify(
			{
				schemaVersion: "cautilus.scenario_profile.v1",
				profileId: "default-train",
				historyPolicy: {
					maxGraduationInterval: 5,
					recentResultsLimit: 12,
				},
				scenarios: [
					{ scenarioId: "probe-a", split: "train", cadence: "graduated", cohort: "probe" },
					{ scenarioId: "control-a", split: "train", cadence: "always", cohort: "control" },
					{ scenarioId: "held-out-a", split: "test", cadence: "always", cohort: "held-out" },
				],
			},
			null,
			2,
		),
		"utf-8",
	);
	writeFileSync(
		join(adapterDir, "cautilus-adapter.yaml"),
		[
			"version: 1",
			"repo: temp",
			"evaluation_surfaces:",
			"  - prompt behavior",
			"baseline_options:",
			"  - baseline git ref via {baseline_ref}",
			"iterate_command_templates:",
			"  - sh {candidate_repo}/bench-history.sh iterate {scenario_results_file} {profile} {selected_scenario_ids_file} {output_dir}/selection.txt",
			"comparison_command_templates:",
			"  - sh {candidate_repo}/bench-history.sh comparison {scenario_results_file} {profile} {selected_scenario_ids_file} {output_dir}/selection.txt",
			"comparison_samples_default: 4",
			"profile_default: profiles/default-train.json",
			"history_file_hint: .cautilus/history.json",
			"",
		].join("\n"),
		"utf-8",
	);
	git(root, ["init"]);
	git(root, ["config", "user.name", "Cautilus Test"]);
	git(root, ["config", "user.email", "test@example.com"]);
	git(root, ["add", "."]);
	git(root, ["commit", "-m", "fixture"]);
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
				"Operator recovery behavior should stay legible.",
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
		assert.equal(report.schemaVersion, "cautilus.report_packet.v2");
		assert.equal(report.recommendation, "defer");
		assert.equal(report.commandObservations.length, 2);
		assert.equal(report.modeSummaries[0].scenarioTelemetrySummary.overall.total_tokens, 42);
		assert.equal(report.modeSummaries[0].scenarioTelemetrySummary.overall.cost_usd, 0.01);
		assert.equal(report.modeSummaries[0].compareArtifact.schemaVersion, COMPARE_ARTIFACT_SCHEMA);
		assert.match(result.stderr, /mode evaluate start: mode=held_out/);
		assert.match(result.stderr, /preflight 1\/1 start:/);
		assert.match(result.stderr, /held_out 1\/1 passed in /);
		assert.match(result.stderr, /mode evaluate complete: status=defer report=/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
	});

	test("evaluate-adapter-mode fails bounded stage commands that exceed the shell timeout", () => {
		const { root, workspace } = createRepo();
		try {
			const outputDir = join(root, "outputs-timeout");
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
					"Bound the held-out runner.",
					"--baseline-ref",
					"origin/main",
					"--output-dir",
					outputDir,
				],
				{
					cwd: process.cwd(),
					encoding: "utf-8",
					env: {
						...process.env,
						CAUTILUS_TEST_SLEEP_MS: "1000",
						CAUTILUS_SHELL_COMMAND_TIMEOUT_MS: "100",
					},
				},
			);
			assert.equal(result.status, 0, result.stderr);
			assert.match(result.stderr, /command timed out after 100ms/);
			const report = JSON.parse(readFileSync(join(outputDir, "report.json"), "utf-8"));
			const reportInput = JSON.parse(readFileSync(join(outputDir, "report-input.json"), "utf-8"));
			assert.equal(report.recommendation, "reject");
			assert.equal(reportInput.commandObservations[1].timedOut, true);
			assert.match(reportInput.commandObservations[1].error, /command timed out after 100ms/);
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
				"Operator full gate should still pass.",
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

test("evaluate-adapter-mode preserves adapter context for named adapters", () => {
	const { root, workspace } = createRepo();
	try {
		const outputDir = join(root, "named-adapter-outputs");
		const result = spawnSync(
			"node",
			[
				SCRIPT_PATH,
				"--repo-root",
				root,
				"--candidate-repo",
				workspace,
				"--adapter-name",
				"named-adapter",
				"--mode",
				"held_out",
				"--intent",
				"Named adapter context should survive the report bridge.",
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
		assert.equal(report.adapterContext.adapterName, "named-adapter");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("evaluate-adapter-mode keeps stdout machine-readable when progress logs are enabled", () => {
	const { root, workspace } = createRepo();
	try {
		const outputDir = join(root, "stdout-contract");
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
				"Full gate should keep stdout machine-readable.",
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
		assert.equal(result.stdout.trim(), join(outputDir, "report.json"));
		assert.match(result.stderr, /mode evaluate start: mode=full_gate/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("evaluate-adapter-mode suppresses progress logs with --quiet", () => {
	const { root, workspace } = createRepo();
	try {
		const outputDir = join(root, "quiet-outputs");
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
				"Quiet mode should suppress progress logs.",
				"--baseline-ref",
				"origin/main",
				"--output-dir",
				outputDir,
				"--quiet",
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(result.status, 0, result.stderr);
		assert.equal(result.stderr, "");
		assert.equal(result.stdout.trim(), join(outputDir, "report.json"));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("evaluate-adapter-mode emits heartbeat and ownership hints for failed commands", () => {
	const { root, workspace } = createRepo({ failMode: "full_gate" });
	try {
		const outputDir = join(root, "failed-outputs");
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
				"Full gate failures should surface early feedback.",
				"--baseline-ref",
				"origin/main",
				"--output-dir",
				outputDir,
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
				env: {
					...process.env,
					CAUTILUS_PROGRESS_HEARTBEAT_MS: "20",
					CAUTILUS_TEST_SLEEP_MS: "80",
				},
			},
		);
		assert.equal(result.status, 0, result.stderr);
		const report = JSON.parse(readFileSync(result.stdout.trim(), "utf-8"));
		assert.equal(report.recommendation, "reject");
		assert.match(result.stderr, /full_gate 1\/1 still running after /);
		assert.match(result.stderr, /full_gate 1\/1 artifacts: stdout=.*stderr=.*/);
		assert.match(result.stderr, /full_gate 1\/1 failure signal: repo-local failure for full_gate/);
		assert.match(result.stderr, /full_gate 1\/1 ownership hint: Repo-local adapter, artifact, or policy failures are usually consumer-owned/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("evaluate-adapter-mode marks comparison-backed rejection separately from execution failure", () => {
	const { root, workspace } = createRepo({ rejectMode: "held_out" });
	try {
		const outputDir = join(root, "comparison-rejected");
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
				"Comparison-backed regressions should stay legible.",
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
		assert.equal(report.recommendation, "reject");
		assert.equal(report.modeSummaries[0].status, "rejected");
		assert.match(report.modeSummaries[0].summary, /completed comparison and reported 1 regression/);
		assert.equal(report.regressed[0], "operator-guidance-smoke");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("evaluate-adapter-mode selects scenarios from a checked-in profile and updates history", () => {
	const { root, workspace } = createScenarioHistoryRepo();
	try {
		const firstOutputDir = join(root, "iterate-1");
		const secondOutputDir = join(root, "iterate-2");
		const first = spawnSync(
			"node",
			[
				SCRIPT_PATH,
				"--repo-root",
				root,
				"--candidate-repo",
				workspace,
				"--mode",
				"iterate",
				"--intent",
				"Train scenario selection should honor checked-in profile history.",
				"--baseline-ref",
				"origin/main",
				"--output-dir",
				firstOutputDir,
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(first.status, 0, first.stderr);
		assert.equal(readFileSync(join(firstOutputDir, "selection.txt"), "utf-8"), "probe-a,control-a");
		const historyPath = join(root, ".cautilus", "history.json");
		const firstHistory = JSON.parse(readFileSync(historyPath, "utf-8"));
		const firstSnapshot = JSON.parse(readFileSync(join(firstOutputDir, "scenario-history.snapshot.json"), "utf-8"));
		assert.equal(firstHistory.trainRunCount, 1);
		assert.equal(firstSnapshot.trainRunCount, 1);
		assert.equal(firstHistory.scenarioStats["probe-a"].graduationInterval, 2);

		const second = spawnSync(
			"node",
			[
				SCRIPT_PATH,
				"--repo-root",
				root,
				"--candidate-repo",
				workspace,
				"--mode",
				"iterate",
				"--intent",
				"Train scenario selection should respect graduated cadence.",
				"--baseline-ref",
				"origin/main",
				"--output-dir",
				secondOutputDir,
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(second.status, 0, second.stderr);
		assert.equal(readFileSync(join(secondOutputDir, "selection.txt"), "utf-8"), "control-a");
		const secondHistory = JSON.parse(readFileSync(historyPath, "utf-8"));
		const secondSnapshot = JSON.parse(readFileSync(join(secondOutputDir, "scenario-history.snapshot.json"), "utf-8"));
		assert.equal(secondHistory.trainRunCount, 2);
		assert.equal(secondSnapshot.trainRunCount, 2);
		assert.deepEqual(secondHistory.recentRuns.at(-1).selectedScenarioIds, ["control-a"]);
		assert.deepEqual(secondSnapshot.recentRuns.at(-1).selectedScenarioIds, ["control-a"]);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("evaluate-adapter-mode materializes a baseline cache seed for profile-backed comparison runs", () => {
	const { root, workspace } = createScenarioHistoryRepo();
	try {
		const outputDir = join(root, "comparison");
		const result = spawnSync(
			"node",
			[
				SCRIPT_PATH,
				"--repo-root",
				root,
				"--candidate-repo",
				workspace,
				"--mode",
				"comparison",
				"--intent",
				"Comparison runs should materialize a reusable baseline cache seed.",
				"--baseline-ref",
				"origin/main",
				"--comparison-samples",
				"5",
				"--output-dir",
				outputDir,
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(result.status, 0, result.stderr);
		const modePacket = JSON.parse(
			readFileSync(join(outputDir, "report.mode-evaluation.json"), "utf-8"),
		);
		const baselineCache = JSON.parse(readFileSync(join(outputDir, "baseline-cache.json"), "utf-8"));
		assert.equal(modePacket.baselineCacheFile, join(outputDir, "baseline-cache.json"));
		assert.equal(modePacket.baselineCache.schemaVersion, "cautilus.scenario_baseline_cache.v1");
		assert.equal(baselineCache.cacheKey.profileId, "default-train");
		assert.equal(baselineCache.cacheKey.cacheSampleCount, 5);
		assert.deepEqual(baselineCache.cacheKey.scenarioIds, ["control-a", "held-out-a", "probe-a"]);
		assert.match(baselineCache.baselineRepoLabel, /^origin\/main@[0-9a-f]{12}$/);
		assert.equal(baselineCache.results.length, 0);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("evaluate-adapter-mode honors CAUTILUS_RUN_DIR when --output-dir is omitted", () => {
	const { root, workspace } = createRepo();
	try {
		const activeRun = join(root, "active-from-env");
		mkdirSync(activeRun, { recursive: true });
		const env = { ...process.env };
		delete env[ACTIVE_RUN_ENV_VAR];
		env[ACTIVE_RUN_ENV_VAR] = activeRun;
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
				"Operator-facing behavior should remain legible.",
				"--baseline-ref",
				"origin/main",
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
				env,
			},
		);
		assert.equal(result.status, 0, result.stderr);
		assert.equal(result.stdout.trim(), join(activeRun, "report.json"));
		const report = JSON.parse(readFileSync(join(activeRun, "report.json"), "utf-8"));
		assert.equal(report.schemaVersion, "cautilus.report_packet.v2");
		// env var path is quiet — no "Active run:" banner
		assert.doesNotMatch(result.stderr, /Active run:/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("evaluate-adapter-mode auto-materializes a fresh runDir under the default root and logs Active run", () => {
	const { root, workspace } = createRepo();
	const sandboxCwd = mkdtempSync(join(tmpdir(), "cautilus-mode-auto-"));
	try {
		const env = { ...process.env };
		delete env[ACTIVE_RUN_ENV_VAR];
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
				"Auto-materialized runDir should stay explicit.",
				"--baseline-ref",
				"origin/main",
			],
			{
				cwd: sandboxCwd,
				encoding: "utf-8",
				env,
			},
		);
		assert.equal(result.status, 0, result.stderr);
		const defaultRoot = join(sandboxCwd, DEFAULT_RUNS_ROOT);
		assert.equal(existsSync(defaultRoot), true);
		const runDirs = readdirSync(defaultRoot);
		assert.equal(runDirs.length, 1, `expected exactly one auto runDir, saw ${runDirs.join(", ")}`);
		const runDir = join(defaultRoot, runDirs[0]);
		assert.equal(existsSync(join(runDir, "run.json")), true);
		assert.equal(result.stdout.trim(), join(runDir, "report.json"));
		assert.match(result.stderr, new RegExp(`Active run: ${runDir.replace(/[\\^$*+?.()|[\]{}]/g, "\\$&")}`));
	} finally {
		rmSync(sandboxCwd, { recursive: true, force: true });
		rmSync(root, { recursive: true, force: true });
	}
});

test("evaluate-adapter-mode overwrites report.json on retry inside the same active runDir", () => {
	const { root, workspace } = createRepo();
	try {
		const activeRun = join(root, "retry-run");
		mkdirSync(activeRun, { recursive: true });
		const env = { ...process.env };
		delete env[ACTIVE_RUN_ENV_VAR];
		env[ACTIVE_RUN_ENV_VAR] = activeRun;
		const runOnce = () =>
			spawnSync(
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
					"Same workflow retry should overwrite report.json cleanly.",
					"--baseline-ref",
					"origin/main",
				],
				{
					cwd: process.cwd(),
					encoding: "utf-8",
					env,
				},
			);
		const first = runOnce();
		assert.equal(first.status, 0, first.stderr);
		const firstReportPath = first.stdout.trim();
		assert.equal(firstReportPath, join(activeRun, "report.json"));
		const firstIntent = JSON.parse(readFileSync(firstReportPath, "utf-8")).intent;
		const second = runOnce();
		assert.equal(second.status, 0, second.stderr);
		assert.equal(second.stdout.trim(), firstReportPath);
		const secondReport = JSON.parse(readFileSync(firstReportPath, "utf-8"));
		assert.equal(secondReport.schemaVersion, "cautilus.report_packet.v2");
		assert.equal(secondReport.intent, firstIntent);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("evaluate-adapter-mode explicit --output-dir overrides an inherited CAUTILUS_RUN_DIR", () => {
	const { root, workspace } = createRepo();
	try {
		const inheritedRun = join(root, "inherited-run");
		mkdirSync(inheritedRun, { recursive: true });
		const explicitOutputDir = join(root, "explicit-out");
		const env = { ...process.env };
		delete env[ACTIVE_RUN_ENV_VAR];
		env[ACTIVE_RUN_ENV_VAR] = inheritedRun;
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
				"Explicit --output-dir should beat inherited CAUTILUS_RUN_DIR.",
				"--baseline-ref",
				"origin/main",
				"--output-dir",
				explicitOutputDir,
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
				env,
			},
		);
		assert.equal(result.status, 0, result.stderr);
		assert.equal(result.stdout.trim(), join(explicitOutputDir, "report.json"));
		assert.equal(existsSync(join(explicitOutputDir, "report.json")), true);
		assert.equal(existsSync(join(inheritedRun, "report.json")), false);
		// explicit path is quiet — no "Active run:" banner
		assert.doesNotMatch(result.stderr, /Active run:/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
