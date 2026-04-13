import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import test from "node:test";

import { buildOptimizeSearchInput } from "./build-optimize-search-input.mjs";
import { runOptimizeSearch } from "./run-optimize-search.mjs";

function writeJson(path, value) {
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function writeExecutable(path, body) {
	writeFileSync(path, body, "utf-8");
	chmodSync(path, 0o755);
}

function createFakeCodex(root, promptBody) {
	writeExecutable(
		join(root, "codex"),
		`#!/bin/sh
out=""
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-o" ]; then
    out="$2"
    shift 2
    continue
  fi
  shift
done
cat >/dev/null
printf '%s\\n' '${JSON.stringify({
			promptMarkdown: promptBody,
			rationaleSummary: "Expand the recovery instructions with a concrete next-step checklist.",
			expectedImprovements: ["operator-recovery"],
			preservedStrengths: ["keeps the original recovery framing"],
			riskNotes: ["held-out still needs to confirm the extra detail is not too verbose"],
		})}' > "$out"
`,
	);
}

function initGitRepo(root) {
	execFileSync("git", ["-C", root, "init"], { stdio: "pipe" });
	execFileSync("git", ["-C", root, "config", "user.email", "test@example.com"], { stdio: "pipe" });
	execFileSync("git", ["-C", root, "config", "user.name", "Cautilus Test"], { stdio: "pipe" });
	execFileSync("git", ["-C", root, "add", "."], { stdio: "pipe" });
	execFileSync("git", ["-C", root, "commit", "-m", "initial"], { stdio: "pipe" });
}

function createSearchFixtureRoot({ includeHeldOut = true, includeFeedback = true } = {}) {
	const root = mkdtempSync(join(tmpdir(), "cautilus-optimize-search-"));
	const optimizeInputPath = join(root, "optimize-input.json");
	const targetFile = join(root, "prompt.md");
	const heldOutResultsPath = join(root, "held-out-results.json");
	writeFileSync(targetFile, "Keep recovery instructions explicit.\n", "utf-8");
	const modeRuns = [];
	if (includeHeldOut) {
		writeJson(heldOutResultsPath, {
			schemaVersion: "cautilus.scenario_results.v1",
			mode: "held_out",
			results: [
				{
					scenarioId: "operator-recovery",
					status: "failed",
					overallScore: 40,
					telemetry: {
						cost_usd: 0.02,
						durationMs: 1200,
					},
				},
			],
		});
	}
	writeJson(optimizeInputPath, {
		schemaVersion: "cautilus.optimize_inputs.v1",
		generatedAt: "2026-04-13T09:58:00.000Z",
		repoRoot: root,
		optimizationTarget: "prompt",
		intentProfile: {
			schemaVersion: "cautilus.behavior_intent.v1",
			intentId: "intent-operator-recovery-guidance",
			summary: "Operator guidance should stay legible under recovery pressure.",
			behaviorSurface: "operator_behavior",
		},
		optimizer: {
			kind: "reflection",
			budget: "light",
			plan: {
				evidenceLimit: 3,
				suggestedChangeLimit: 2,
				reviewVariantLimit: 1,
				historySignalLimit: 1,
			},
		},
		targetFile: {
			path: targetFile,
			exists: true,
		},
		reportFile: join(root, "report.json"),
		report: {
			schemaVersion: "cautilus.report_packet.v2",
			generatedAt: "2026-04-13T09:57:00.000Z",
			candidate: "feature/operator-guidance",
			baseline: "origin/main",
			intent: "Operator guidance should stay legible under recovery pressure.",
			intentProfile: {
				schemaVersion: "cautilus.behavior_intent.v1",
				intentId: "intent-operator-recovery-guidance",
				summary: "Operator guidance should stay legible under recovery pressure.",
				behaviorSurface: "operator_behavior",
			},
			commands: [],
			commandObservations: [],
			modesRun: modeRuns,
			modeSummaries: [],
			telemetry: {
				modeCount: modeRuns.length,
			},
			improved: [],
			regressed: ["operator-recovery"],
			unchanged: [],
			noisy: [],
			humanReviewFindings: includeFeedback
				? [
					{
						severity: "concern",
						message: "The recovery step is still terse.",
					},
				]
				: [],
			recommendation: "defer",
		},
		reviewSummaryFile: join(root, "review-summary.json"),
		reviewSummary: includeFeedback
			? {
				variants: [
					{
						id: "codex-review",
						status: "failed",
						output: {
							findings: [
								{
									severity: "blocker",
									message: "Retry safety remains unclear.",
								},
							],
						},
					},
				],
			}
			: { variants: [] },
		scenarioHistoryFile: join(root, "history.json"),
		scenarioHistory: includeFeedback
			? {
				schemaVersion: "cautilus.scenario_history.v1",
				scenarioStats: {
					"operator-recovery": {
						recentTrainResults: [
							{
								status: "failed",
								overallScore: 80,
								passRate: 0,
							},
						],
					},
				},
			}
			: {
				schemaVersion: "cautilus.scenario_history.v1",
				scenarioStats: {},
			},
		objective: {
			summary: "Propose one bounded next revision without weakening held-out, comparison, or review discipline.",
			constraints: ["Prefer repairing explicit regressions over widening scope."],
		},
	});
	return { root, optimizeInputPath, targetFile, heldOutResultsPath };
}

test("build-optimize-search-input assembles a canonical packet from optimize input", () => {
	const { root, optimizeInputPath, targetFile, heldOutResultsPath } = createSearchFixtureRoot();
	try {
		const { packet } = buildOptimizeSearchInput(
			[
				"--optimize-input",
				optimizeInputPath,
				"--target-file",
				targetFile,
				"--held-out-results-file",
				heldOutResultsPath,
				"--budget",
				"light",
			],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		assert.equal(packet.schemaVersion, "cautilus.optimize_search_inputs.v1");
		assert.equal(packet.optimizationTarget, "prompt");
		assert.equal(packet.searchConfig.reviewCheckpointPolicy, "final_only");
		assert.deepEqual(packet.searchConfig.selectionPolicy.tieBreakers, ["lower_cost", "lower_latency"]);
		assert.deepEqual(packet.scenarioSets.heldOutScenarioSet, ["operator-recovery"]);
		assert.equal(packet.evaluationContext.mode, "held_out");
		assert.equal(packet.evaluationContext.baselineRef, "origin/main");
		assert.equal(packet.mutationConfig.backends[0].backend, "codex_exec");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-optimize-search-input materializes raw and canonical files for direct JSON ingress", () => {
	const { root, optimizeInputPath, heldOutResultsPath } = createSearchFixtureRoot();
	try {
		const output = join(root, "optimize-search-input.json");
		const result = buildOptimizeSearchInput(
			[
				"--input-json",
				JSON.stringify({
					optimizeInputFile: optimizeInputPath,
					heldOutResultsFile: heldOutResultsPath,
					budget: "light",
				}),
				"--output",
				output,
				"--json",
			],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		assert.equal(result.inputFile, output);
		assert.equal(existsSync(output), true);
		assert.equal(existsSync(join(root, "optimize-search-input.raw.json")), true);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-optimize-search emits a blocked result when held-out evidence is missing", () => {
	const { root, optimizeInputPath } = createSearchFixtureRoot({ includeHeldOut: false, includeFeedback: false });
	try {
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		const result = runOptimizeSearch(packet, {
			inputFile: join(root, "optimize-search-input.json"),
			now: new Date("2026-04-13T10:01:00.000Z"),
		});
		assert.equal(result.status, "blocked");
		assert.deepEqual(result.reasonCodes, [
			"missing_held_out_scenarios",
			"missing_per_scenario_scores",
			"missing_textual_feedback",
		]);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-optimize-search produces a seed-only completed result with frontier metadata", () => {
	const { root, optimizeInputPath, heldOutResultsPath } = createSearchFixtureRoot();
	try {
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		const result = runOptimizeSearch(packet, {
			inputFile: join(root, "optimize-search-input.json"),
			now: new Date("2026-04-13T10:01:00.000Z"),
		});
		assert.equal(result.status, "completed");
		assert.equal(result.selectedCandidateId, "seed");
		assert.deepEqual(result.pareto.frontierCandidateIds, ["seed"]);
		assert.equal(result.heldOutEvaluationMatrix.length, 1);
		assert.equal(result.searchTelemetry.stopReason, "seed_only");
		assert.equal(result.proposalBridge.selectedTargetFile.path, packet.targetFile.path);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("run-optimize-search generates and selects a reflective mutation candidate", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-optimize-search-mutation-"));
	const artifactRoot = mkdtempSync(join(tmpdir(), "cautilus-optimize-search-artifacts-"));
	const originalPath = join(root, "prompt.md");
	const heldOutResultsPath = join(root, "held-out-results.json");
	const optimizeInputPath = join(root, "optimize-input.json");
	mkdirSync(join(root, ".agents"), { recursive: true });
	try {
		writeFileSync(originalPath, "Keep recovery instructions explicit.\n", "utf-8");
		writeExecutable(
			join(root, "evaluate.sh"),
			`#!/bin/sh
output="$1"
score=40
status="failed"
if grep -q "detailed recovery checklist" prompt.md; then
  score=95
  status="passed"
fi
cat >"$output" <<EOF
{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "held_out",
  "results": [
    {
      "scenarioId": "operator-recovery",
      "status": "$status",
      "overallScore": $score,
      "telemetry": {
        "cost_usd": 0.05,
        "durationMs": 1300
      }
    }
  ]
}
EOF
`,
		);
		writeJson(heldOutResultsPath, {
			schemaVersion: "cautilus.scenario_results.v1",
			mode: "held_out",
			results: [
				{
					scenarioId: "operator-recovery",
					status: "failed",
					overallScore: 40,
					telemetry: {
						cost_usd: 0.02,
						durationMs: 1200,
					},
				},
			],
		});
		writeFileSync(
			join(root, ".agents", "cautilus-adapter.yaml"),
			[
				"version: 1",
				"repo: temp-optimize-search",
				"evaluation_surfaces:",
				"  - prompt behavior",
				"baseline_options:",
				"  - baseline git ref in the same repo via {baseline_ref}",
				"required_prerequisites: []",
				"held_out_command_templates:",
				"  - sh evaluate.sh {scenario_results_file}",
				"comparison_questions:",
				"  - Did the held-out score improve?",
				"human_review_prompts:",
				"  - id: operator",
				"    prompt: Where would the prompt still leave the operator stuck?",
			].join("\n"),
			"utf-8",
		);
		writeJson(optimizeInputPath, {
			schemaVersion: "cautilus.optimize_inputs.v1",
			generatedAt: "2026-04-13T09:58:00.000Z",
			repoRoot: root,
			optimizationTarget: "prompt",
			intentProfile: {
				schemaVersion: "cautilus.behavior_intent.v1",
				intentId: "intent-operator-recovery-guidance",
				summary: "Operator guidance should stay legible under recovery pressure.",
				behaviorSurface: "operator_behavior",
			},
			optimizer: {
				kind: "reflection",
				budget: "light",
				plan: {
					evidenceLimit: 3,
					suggestedChangeLimit: 2,
					reviewVariantLimit: 1,
					historySignalLimit: 1,
				},
			},
			targetFile: {
				path: originalPath,
				exists: true,
			},
			reportFile: join(root, "report.json"),
			report: {
				schemaVersion: "cautilus.report_packet.v2",
				generatedAt: "2026-04-13T09:57:00.000Z",
				candidate: root,
				baseline: "HEAD",
				intent: "Operator guidance should stay legible under recovery pressure.",
				intentProfile: {
					schemaVersion: "cautilus.behavior_intent.v1",
					intentId: "intent-operator-recovery-guidance",
					summary: "Operator guidance should stay legible under recovery pressure.",
					behaviorSurface: "operator_behavior",
				},
				commands: [],
				commandObservations: [],
				modesRun: [],
				modeSummaries: [],
				telemetry: { modeCount: 0 },
				improved: [],
				regressed: ["operator-recovery"],
				unchanged: [],
				noisy: [],
				humanReviewFindings: [
					{
						severity: "concern",
						message: "operator-recovery still needs a detailed recovery checklist",
					},
				],
				recommendation: "defer",
			},
			reviewSummaryFile: join(root, "review-summary.json"),
			reviewSummary: { variants: [] },
			scenarioHistoryFile: join(root, "history.json"),
			scenarioHistory: {
				schemaVersion: "cautilus.scenario_history.v1",
				scenarioStats: {
					"operator-recovery": {
						recentTrainResults: [
							{
								status: "failed",
								overallScore: 80,
								passRate: 0,
							},
						],
					},
				},
			},
			objective: {
				summary: "Propose one bounded next revision without weakening held-out, comparison, or review discipline.",
				constraints: ["Prefer repairing explicit regressions over widening scope."],
			},
		});
		initGitRepo(root);
		createFakeCodex(root, "Keep recovery instructions explicit with a detailed recovery checklist.\n");
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "light"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		const result = runOptimizeSearch(packet, {
			inputFile: join(root, "optimize-search-input.json"),
			outputFile: join(artifactRoot, "optimize-search-result.json"),
			now: new Date("2026-04-13T10:01:00.000Z"),
			env: {
				...process.env,
				PATH: `${root}:${process.env.PATH ?? ""}`,
			},
		});
		assert.equal(result.status, "completed");
		assert.notEqual(result.selectedCandidateId, "seed");
		assert.equal(result.searchTelemetry.generationCount, 1);
		assert.equal(result.searchTelemetry.mutationInvocationCount, 1);
		assert.equal(result.candidateRegistry.length, 2);
		const selectedTargetFile = result.proposalBridge.selectedTargetFile.path;
		assert.equal(existsSync(selectedTargetFile), true);
		assert.match(readFileSync(selectedTargetFile, "utf-8"), /detailed recovery checklist/);
		const bestForScenario = result.pareto.perScenarioBestCandidateIds[0];
		assert.deepEqual(bestForScenario.candidateIds, [result.selectedCandidateId]);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(artifactRoot, { recursive: true, force: true });
	}
});

test("run-optimize-search CLI reports blocked readiness in JSON mode with exit code 1", () => {
	const { root, optimizeInputPath } = createSearchFixtureRoot({ includeHeldOut: false, includeFeedback: false });
	try {
		const inputPath = join(root, "optimize-search-input.json");
		buildOptimizeSearchInput(["--optimize-input", optimizeInputPath, "--output", inputPath], {
			now: new Date("2026-04-13T10:00:00.000Z"),
		});
		const result = spawnSync(process.execPath, [
			join(process.cwd(), "scripts", "agent-runtime", "run-optimize-search.mjs"),
			"--input",
			inputPath,
			"--json",
		], {
			encoding: "utf-8",
		});
		assert.equal(result.status, 1);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.status, "blocked");
		assert.deepEqual(payload.reasonCodes, [
			"missing_held_out_scenarios",
			"missing_per_scenario_scores",
			"missing_textual_feedback",
		]);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
