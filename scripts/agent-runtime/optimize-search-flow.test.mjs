import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import test from "node:test";

import { buildOptimizeSearchInput } from "./build-optimize-search-input.mjs";
import { selectMergeParents } from "./optimize-search-merge.mjs";
import { runOptimizeSearch } from "./run-optimize-search.mjs";

function writeJson(path, value) {
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function writeExecutable(path, body) {
	writeFileSync(path, body, "utf-8");
	chmodSync(path, 0o755);
}

function createProgrammableCodex(root, cases) {
	writeExecutable(
		join(root, "codex"),
		`#!/usr/bin/env node
const fs = require("node:fs");
let out = "";
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index] === "-o") {
    out = process.argv[index + 1] || "";
    index += 1;
  }
}
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  const cases = ${JSON.stringify(cases)};
  const fence = String.fromCharCode(96).repeat(3);
  const currentPromptMatch = input.match(new RegExp("## Current Prompt\\\\n" + fence + "md\\\\n([\\\\s\\\\S]*?)\\\\n" + fence));
  const currentPrompt = currentPromptMatch ? currentPromptMatch[1] : "";
  const selected = cases.find((entry) => {
    const matchAll = Array.isArray(entry.matchAll) ? entry.matchAll.every((token) => input.includes(token)) : true;
    const matchNone = Array.isArray(entry.matchNone) ? entry.matchNone.every((token) => !input.includes(token)) : true;
    const currentPromptMatchAll = Array.isArray(entry.currentPromptMatchAll)
      ? entry.currentPromptMatchAll.every((token) => currentPrompt.includes(token))
      : true;
    const currentPromptMatchNone = Array.isArray(entry.currentPromptMatchNone)
      ? entry.currentPromptMatchNone.every((token) => !currentPrompt.includes(token))
      : true;
    return matchAll && matchNone && currentPromptMatchAll && currentPromptMatchNone;
  }) || cases[cases.length - 1];
  fs.writeFileSync(out, JSON.stringify(selected.output) + "\\n", "utf8");
});
process.stdin.resume();
`,
	);
}

function createFakeCodex(root, promptBody) {
	createProgrammableCodex(root, [
		{
			output: {
				promptMarkdown: promptBody,
				rationaleSummary: "Expand the recovery instructions with a concrete next-step checklist.",
				expectedImprovements: ["operator-recovery"],
				preservedStrengths: ["keeps the original recovery framing"],
				riskNotes: ["held-out still needs to confirm the extra detail is not too verbose"],
			},
		},
	]);
}

function createFakeClaude(root, promptBody) {
	writeExecutable(
		join(root, "claude"),
		`#!/usr/bin/env node
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  process.stdout.write(JSON.stringify({
    structured_output: ${JSON.stringify({
			promptMarkdown: promptBody,
			rationaleSummary: "Strengthen follow-up guidance with an explicit handoff map.",
			expectedImprovements: ["operator-follow-up"],
			preservedStrengths: ["keeps the original operator guidance framing"],
			riskNotes: ["held-out should confirm the extra follow-up detail stays concise"],
		})}
  }) + "\\n");
});
process.stdin.resume();
`,
	);
}

function createCheckpointFallbackFixture({ includeReviewVariants = true, gateFailsOnChecklist = false, reviewVerdict = "blocker" } = {}) {
	const root = mkdtempSync(join(tmpdir(), "cautilus-optimize-search-checkpoints-"));
	const artifactRoot = mkdtempSync(join(tmpdir(), "cautilus-optimize-search-checkpoints-artifacts-"));
	const originalPath = join(root, "prompt.md");
	const heldOutResultsPath = join(root, "held-out-results.json");
	const optimizeInputPath = join(root, "optimize-input.json");
	const schemaPath = join(root, "review-schema.json");
	mkdirSync(join(root, ".agents"), { recursive: true });
	writeFileSync(originalPath, "Keep recovery instructions explicit.\n", "utf-8");
	writeJson(schemaPath, { type: "object" });
	writeExecutable(
		join(root, "evaluate.sh"),
		`#!/bin/sh
output="$1"
recovery_score=40
recovery_status="failed"
followup_score=55
followup_status="failed"
if grep -q "detailed recovery checklist" prompt.md; then
  recovery_score=98
  recovery_status="passed"
  followup_score=88
  followup_status="failed"
fi
if grep -q "follow-up handoff map" prompt.md; then
  recovery_score=91
  recovery_status="passed"
  followup_score=92
  followup_status="passed"
fi
cat >"$output" <<EOF
{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "held_out",
  "results": [
    {
      "scenarioId": "operator-recovery",
      "status": "$recovery_status",
      "overallScore": $recovery_score,
      "telemetry": { "cost_usd": 0.04, "durationMs": 1000 }
    },
    {
      "scenarioId": "operator-follow-up",
      "status": "$followup_status",
      "overallScore": $followup_score,
      "telemetry": { "cost_usd": 0.03, "durationMs": 900 }
    }
  ]
}
EOF
`,
	);
	writeExecutable(
		join(root, "full-gate.sh"),
		`#!/bin/sh
workspace="$1"
output="$2"
status=0
if ${gateFailsOnChecklist ? "grep -q \"detailed recovery checklist\" \"$workspace/prompt.md\" && ! grep -q \"follow-up handoff map\" \"$workspace/prompt.md\"" : "false"}; then
  status=1
fi
cat >"$output" <<EOF
{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "full_gate",
  "results": [
    {
      "scenarioId": "operator-full-gate",
      "status": "$( [ "$status" -eq 0 ] && echo passed || echo failed )",
      "overallScore": $( [ "$status" -eq 0 ] && echo 100 || echo 0 )
    }
  ]
}
EOF
exit "$status"
`,
	);
if (includeReviewVariants) {
		writeExecutable(
			join(root, "review-variant.sh"),
			`#!/bin/sh
workspace="$1"
output="$2"
verdict="pass"
severity="pass"
summary="Candidate stays operator-safe."
if grep -q "detailed recovery checklist" "$workspace/prompt.md" && ! grep -q "follow-up handoff map" "$workspace/prompt.md"; then
  verdict="${reviewVerdict}"
  severity="${reviewVerdict}"
  summary="Checklist candidate still leaves operator-follow-up under-specified."
fi
cat >"$output" <<EOF
{
  "verdict": "$verdict",
  "summary": "$summary",
  "findings": [
    {
      "severity": "$severity",
      "message": "$summary",
      "path": "variant/operator-review"
    }
  ]
}
EOF
`,
		);
	}
	writeJson(heldOutResultsPath, {
		schemaVersion: "cautilus.scenario_results.v1",
		mode: "held_out",
		results: [
			{
				scenarioId: "operator-recovery",
				status: "failed",
				overallScore: 40,
				telemetry: { cost_usd: 0.02, durationMs: 1200 },
			},
			{
				scenarioId: "operator-follow-up",
				status: "failed",
				overallScore: 55,
				telemetry: { cost_usd: 0.01, durationMs: 800 },
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
			"default_schema_file: review-schema.json",
			"held_out_command_templates:",
			"  - sh evaluate.sh {scenario_results_file}",
			"full_gate_command_templates:",
			"  - sh full-gate.sh {candidate_repo} {scenario_results_file}",
			"comparison_questions:",
			"  - Did the held-out score improve?",
			"human_review_prompts:",
			"  - id: operator",
			"    prompt: Where would the prompt still leave the operator stuck?",
			...(includeReviewVariants
				? [
					"executor_variants:",
					"  - id: operator-review",
					"    tool: mock",
					"    command_template: sh review-variant.sh {candidate_repo} {output_file}",
				]
				: []),
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
			budget: "medium",
			plan: {
				evidenceLimit: 4,
				suggestedChangeLimit: 3,
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
			modesRun: [],
			modeSummaries: [],
			telemetry: { modeCount: 0 },
			improved: [],
			regressed: ["operator-recovery", "operator-follow-up"],
			unchanged: [],
			noisy: [],
			humanReviewFindings: [
				{
					severity: "concern",
					message: "The prompt needs both stronger recovery detail and a clearer operator follow-up path.",
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
					recentTrainResults: [{ status: "failed", overallScore: 80, passRate: 0 }],
				},
				"operator-follow-up": {
					recentTrainResults: [{ status: "failed", overallScore: 70, passRate: 0 }],
				},
			},
		},
		objective: {
			summary: "Propose one bounded next revision without weakening held-out, comparison, or review discipline.",
			constraints: ["Prefer repairing explicit regressions over widening scope."],
		},
	});
	initGitRepo(root);
	createProgrammableCodex(root, [
		{
			output: {
				promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist.\n",
				rationaleSummary: "Strengthen the recovery path first.",
				expectedImprovements: ["operator-recovery"],
				preservedStrengths: ["keeps the original recovery framing"],
				riskNotes: ["operator-follow-up may still remain weak"],
			},
		},
	]);
	createFakeClaude(root, "Keep recovery instructions explicit with a follow-up handoff map.\n");
	return { root, artifactRoot, originalPath, heldOutResultsPath, optimizeInputPath };
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
				"--review-checkpoint-policy",
				"frontier_promotions",
			],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		assert.equal(packet.schemaVersion, "cautilus.optimize_search_inputs.v1");
		assert.equal(packet.optimizationTarget, "prompt");
		assert.equal(packet.searchConfig.reviewCheckpointPolicy, "frontier_promotions");
		assert.equal(packet.mutationEvidencePolicy.includeCheckpointFeedback, true);
		assert.deepEqual(packet.searchConfig.selectionPolicy.tieBreakers, ["lower_cost", "lower_latency"]);
		assert.equal(packet.searchConfig.threeParentPolicy, "coverage_expansion");
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
		assert.equal(result.packet.searchConfig.reviewCheckpointPolicy, "final_only");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-optimize-search-input preserves selection constraint caps from direct JSON ingress", () => {
	const { root, optimizeInputPath, heldOutResultsPath } = createSearchFixtureRoot();
	try {
		const { packet } = buildOptimizeSearchInput(
			[
				"--input-json",
				JSON.stringify({
					optimizeInputFile: optimizeInputPath,
					heldOutResultsFile: heldOutResultsPath,
					budget: "medium",
					selectionPolicy: {
						constraintCaps: {
							maxCostUsd: 0.08,
							maxDurationMs: 1600,
						},
					},
				}),
				"--output",
				join(root, "optimize-search-input.json"),
			],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		assert.deepEqual(packet.searchConfig.selectionPolicy.constraintCaps, {
			maxCostUsd: 0.08,
			maxDurationMs: 1600,
		});
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-optimize-search-input preserves three-parent policy from direct JSON ingress", () => {
	const { root, optimizeInputPath, heldOutResultsPath } = createSearchFixtureRoot();
	try {
		const { packet } = buildOptimizeSearchInput(
			[
				"--input-json",
				JSON.stringify({
					optimizeInputFile: optimizeInputPath,
					heldOutResultsFile: heldOutResultsPath,
					budget: "medium",
					threeParentPolicy: "disabled",
				}),
				"--output",
				join(root, "optimize-search-input.json"),
			],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		assert.equal(packet.searchConfig.threeParentPolicy, "disabled");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-optimize-search-input defaults medium budget to frontier-promotion review checkpoints", () => {
	const { root, optimizeInputPath, heldOutResultsPath } = createSearchFixtureRoot();
	try {
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		assert.equal(packet.searchConfig.budget, "medium");
		assert.equal(packet.searchConfig.reviewCheckpointPolicy, "frontier_promotions");
		assert.equal(packet.mutationEvidencePolicy.includeCheckpointFeedback, true);
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

test("run-optimize-search uses frontier candidates across multiple generations", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-optimize-search-generations-"));
	const artifactRoot = mkdtempSync(join(tmpdir(), "cautilus-optimize-search-generations-artifacts-"));
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
recovery_score=40
recovery_status="failed"
followup_score=55
followup_status="failed"
if grep -q "detailed recovery checklist" prompt.md; then
  recovery_score=95
  recovery_status="passed"
fi
if grep -q "follow-up handoff map" prompt.md; then
  followup_score=96
  followup_status="passed"
fi
cat >"$output" <<EOF
{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "held_out",
  "results": [
    {
      "scenarioId": "operator-recovery",
      "status": "$recovery_status",
      "overallScore": $recovery_score,
      "telemetry": {
        "cost_usd": 0.05,
        "durationMs": 1300
      }
    },
    {
      "scenarioId": "operator-follow-up",
      "status": "$followup_status",
      "overallScore": $followup_score,
      "telemetry": {
        "cost_usd": 0.03,
        "durationMs": 900
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
				{
					scenarioId: "operator-follow-up",
					status: "failed",
					overallScore: 55,
					telemetry: {
						cost_usd: 0.01,
						durationMs: 800,
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
				budget: "medium",
				plan: {
					evidenceLimit: 4,
					suggestedChangeLimit: 3,
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
				modesRun: [],
				modeSummaries: [],
				telemetry: { modeCount: 0 },
				improved: [],
				regressed: ["operator-recovery", "operator-follow-up"],
				unchanged: [],
				noisy: [],
				humanReviewFindings: [
					{
						severity: "concern",
						message: "operator-recovery still needs a detailed recovery checklist and a follow-up handoff map",
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
					"operator-follow-up": {
						recentTrainResults: [
							{
								status: "failed",
								overallScore: 70,
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
		createProgrammableCodex(root, [
			{
				currentPromptMatchAll: ["detailed recovery checklist"],
				currentPromptMatchNone: ["follow-up handoff map"],
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist and a follow-up handoff map.\n",
					rationaleSummary: "Preserve the stronger recovery checklist and add a follow-up handoff map for the unresolved second scenario.",
					expectedImprovements: ["operator-follow-up"],
					preservedStrengths: ["keeps the detailed recovery checklist"],
					riskNotes: ["held-out still needs to confirm the combined prompt stays concise"],
				},
			},
			{
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist.\n",
					rationaleSummary: "Add a detailed recovery checklist before widening the rest of the prompt.",
					expectedImprovements: ["operator-recovery"],
					preservedStrengths: ["keeps the original recovery framing"],
					riskNotes: ["operator-follow-up may still remain weak"],
				},
			},
		]);
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		packet.mutationConfig.backends = [{ id: "codex-mutate", backend: "codex_exec" }];
		packet.searchConfig.generationLimit = 2;
		packet.searchConfig.mergeEnabled = false;
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
		assert.equal(result.searchTelemetry.generationCount, 2);
		assert.equal(result.generationSummaries.length, 2);
		assert.equal(result.candidateRegistry.length, 3);
		assert.equal(result.selectedCandidateId.startsWith("g2-"), true);
		assert.deepEqual(result.generationSummaries.map((summary) => summary.generationIndex), [1, 2]);
		assert.match(readFileSync(result.proposalBridge.selectedTargetFile.path, "utf-8"), /follow-up handoff map/);
		assert.equal(
			result.pareto.perScenarioBestCandidateIds.every((entry) => entry.candidateIds.includes(result.selectedCandidateId)),
			true,
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(artifactRoot, { recursive: true, force: true });
	}
});

test("run-optimize-search can merge complementary frontier candidates", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-optimize-search-merge-"));
	const artifactRoot = mkdtempSync(join(tmpdir(), "cautilus-optimize-search-merge-artifacts-"));
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
recovery_score=40
recovery_status="failed"
followup_score=55
followup_status="failed"
if grep -q "detailed recovery checklist" prompt.md; then
  recovery_score=95
  recovery_status="passed"
fi
if grep -q "follow-up handoff map" prompt.md; then
  followup_score=96
  followup_status="passed"
fi
cat >"$output" <<EOF
{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "held_out",
  "results": [
    {
      "scenarioId": "operator-recovery",
      "status": "$recovery_status",
      "overallScore": $recovery_score,
      "telemetry": {
        "cost_usd": 0.05,
        "durationMs": 1300
      }
    },
    {
      "scenarioId": "operator-follow-up",
      "status": "$followup_status",
      "overallScore": $followup_score,
      "telemetry": {
        "cost_usd": 0.03,
        "durationMs": 900
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
				{
					scenarioId: "operator-follow-up",
					status: "failed",
					overallScore: 55,
					telemetry: {
						cost_usd: 0.01,
						durationMs: 800,
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
				budget: "medium",
				plan: {
					evidenceLimit: 4,
					suggestedChangeLimit: 3,
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
				modesRun: [],
				modeSummaries: [],
				telemetry: { modeCount: 0 },
				improved: [],
				regressed: ["operator-recovery", "operator-follow-up"],
				unchanged: [],
				noisy: [],
				humanReviewFindings: [
					{
						severity: "concern",
						message: "The prompt needs both a detailed recovery checklist and a follow-up handoff map.",
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
					"operator-follow-up": {
						recentTrainResults: [
							{
								status: "failed",
								overallScore: 70,
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
		createProgrammableCodex(root, [
			{
				matchAll: ["## Merge Goal", "detailed recovery checklist", "follow-up handoff map"],
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist and a follow-up handoff map.\n",
					rationaleSummary: "Merge the complementary recovery and follow-up strengths into one coherent prompt.",
					expectedImprovements: ["operator-recovery", "operator-follow-up"],
					preservedStrengths: ["keeps the detailed recovery checklist", "keeps the follow-up handoff map"],
					riskNotes: ["held-out should confirm the merged prompt stays concise"],
				},
			},
			{
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist.\n",
					rationaleSummary: "Strengthen the recovery path first.",
					expectedImprovements: ["operator-recovery"],
					preservedStrengths: ["keeps the original recovery framing"],
					riskNotes: ["operator-follow-up may still remain weak"],
				},
			},
		]);
		createFakeClaude(root, "Keep recovery instructions explicit with a follow-up handoff map.\n");
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		packet.searchConfig.generationLimit = 2;
		packet.searchConfig.mergeEnabled = true;
		packet.mutationConfig.backends = [
			{ id: "codex-mutate", backend: "codex_exec" },
			{ id: "claude-mutate", backend: "claude_p" },
		];
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
		assert.equal(result.searchTelemetry.generationCount, 2);
		assert.equal(result.searchTelemetry.mergeInvocationCount, 1);
		const selected = result.candidateRegistry.find((candidate) => candidate.id === result.selectedCandidateId);
		assert.equal(selected.origin, "merge");
		assert.deepEqual(selected.parentCandidateIds.length, 2);
		assert.match(readFileSync(result.proposalBridge.selectedTargetFile.path, "utf-8"), /detailed recovery checklist/);
		assert.match(readFileSync(result.proposalBridge.selectedTargetFile.path, "utf-8"), /follow-up handoff map/);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(artifactRoot, { recursive: true, force: true });
	}
});

test("selectMergeParents prefers lower-risk metadata when held-out pair metrics tie", () => {
	const scenarioIds = ["operator-recovery", "operator-follow-up"];
	const seed = {
		id: "seed",
		heldOutEntries: [
			{ scenarioId: "operator-recovery", score: 95 },
			{ scenarioId: "operator-follow-up", score: 55 },
		],
		telemetry: { totalCostUsd: 0.03, totalDurationMs: 2000 },
	};
	const noisyFollowup = {
		id: "g1-noisy",
		expectedImprovements: ["operator-follow-up"],
		preservedStrengths: ["adds an exhaustive follow-up appendix"],
		riskNotes: ["operator-follow-up may become too verbose", "operator recovery focus may blur"],
		heldOutEntries: [
			{ scenarioId: "operator-recovery", score: 55 },
			{ scenarioId: "operator-follow-up", score: 96 },
		],
		telemetry: { totalCostUsd: 0.07, totalDurationMs: 1900 },
	};
	const stableFollowup = {
		id: "g1-stable",
		expectedImprovements: ["operator-follow-up"],
		preservedStrengths: ["keeps the follow-up handoff map crisp"],
		riskNotes: ["held-out should confirm the shorter handoff stays sufficient"],
		heldOutEntries: [
			{ scenarioId: "operator-recovery", score: 55 },
			{ scenarioId: "operator-follow-up", score: 96 },
		],
		telemetry: { totalCostUsd: 0.07, totalDurationMs: 1900 },
	};
	const selected = selectMergeParents([seed, noisyFollowup, stableFollowup], scenarioIds);
	assert.deepEqual(selected?.map((candidate) => candidate.id), ["seed", "g1-stable"]);
});

test("selectMergeParents weights metadata toward the weakest frontier scenario", () => {
	const scenarioIds = [
		"scenario-1",
		"scenario-2",
		"scenario-3",
		"scenario-4",
		"scenario-5",
		"scenario-6",
		"scenario-7",
		"scenario-8",
		"scenario-9",
		"scenario-10",
	];
	const seed = {
		id: "seed",
		heldOutEntries: scenarioIds.map((scenarioId, index) => ({
			scenarioId,
			score: index === scenarioIds.length - 1 ? 60 : 96,
		})),
		telemetry: { totalCostUsd: 0.03, totalDurationMs: 2000 },
	};
	const broadPolish = {
		id: "g1-broad",
		expectedImprovements: ["scenario-1"],
		preservedStrengths: ["keeps the broad operator framing crisp"],
		riskNotes: ["held-out should confirm the broader framing stays concise"],
		heldOutEntries: scenarioIds.map((scenarioId, index) => ({
			scenarioId,
			score: index === scenarioIds.length - 1 ? 89 : 95,
		})),
		telemetry: { totalCostUsd: 0.05, totalDurationMs: 2100 },
	};
	const weakestRepair = {
		id: "g1-weakest",
		expectedImprovements: ["scenario-10"],
		preservedStrengths: ["keeps the narrow recovery path explicit"],
		riskNotes: ["scenario-3 may still need held-out confirmation"],
		heldOutEntries: scenarioIds.map((scenarioId, index) => ({
			scenarioId,
			score: index === scenarioIds.length - 1 ? 89 : 95,
		})),
		telemetry: { totalCostUsd: 0.05, totalDurationMs: 2100 },
	};
	const selected = selectMergeParents([seed, broadPolish, weakestRepair], scenarioIds);
	assert.deepEqual(selected?.map((candidate) => candidate.id), ["seed", "g1-weakest"]);
});

test("selectMergeParents can pick a bounded three-parent merge when coverage expands", () => {
	const scenarioIds = ["operator-recovery", "operator-follow-up", "operator-escalation"];
	const recovery = {
		id: "g1-recovery",
		expectedImprovements: ["operator-recovery"],
		preservedStrengths: ["keeps the recovery checklist concrete"],
		riskNotes: ["operator-follow-up may still remain sparse"],
		heldOutEntries: [
			{ scenarioId: "operator-recovery", score: 96 },
			{ scenarioId: "operator-follow-up", score: 50 },
			{ scenarioId: "operator-escalation", score: 45 },
		],
		telemetry: { totalCostUsd: 0.04, totalDurationMs: 1800 },
	};
	const followUp = {
		id: "g1-followup",
		expectedImprovements: ["operator-follow-up"],
		preservedStrengths: ["keeps the handoff map concise"],
		riskNotes: ["operator-escalation may still remain implicit"],
		heldOutEntries: [
			{ scenarioId: "operator-recovery", score: 48 },
			{ scenarioId: "operator-follow-up", score: 96 },
			{ scenarioId: "operator-escalation", score: 44 },
		],
		telemetry: { totalCostUsd: 0.04, totalDurationMs: 1800 },
	};
	const escalation = {
		id: "g1-escalation",
		expectedImprovements: ["operator-escalation"],
		preservedStrengths: ["keeps the escalation ladder explicit"],
		riskNotes: ["operator-recovery may still need stronger wording"],
		heldOutEntries: [
			{ scenarioId: "operator-recovery", score: 46 },
			{ scenarioId: "operator-follow-up", score: 49 },
			{ scenarioId: "operator-escalation", score: 96 },
		],
		telemetry: { totalCostUsd: 0.04, totalDurationMs: 1800 },
	};
	const selected = selectMergeParents([recovery, followUp, escalation], scenarioIds);
	assert.deepEqual(selected?.map((candidate) => candidate.id), ["g1-recovery", "g1-followup", "g1-escalation"]);
});

test("selectMergeParents keeps a bounded pair when a third parent does not expand frontier coverage", () => {
	const scenarioIds = ["operator-recovery", "operator-follow-up", "operator-escalation"];
	const recovery = {
		id: "g1-recovery",
		expectedImprovements: ["operator-recovery"],
		preservedStrengths: ["keeps the recovery checklist concrete"],
		riskNotes: ["operator-follow-up may still remain sparse"],
		heldOutEntries: [
			{ scenarioId: "operator-recovery", score: 96 },
			{ scenarioId: "operator-follow-up", score: 65 },
			{ scenarioId: "operator-escalation", score: 92 },
		],
		telemetry: { totalCostUsd: 0.04, totalDurationMs: 1800 },
	};
	const followUp = {
		id: "g1-followup",
		expectedImprovements: ["operator-follow-up"],
		preservedStrengths: ["keeps the handoff map concise"],
		riskNotes: ["operator-escalation may still remain implicit"],
		heldOutEntries: [
			{ scenarioId: "operator-recovery", score: 64 },
			{ scenarioId: "operator-follow-up", score: 96 },
			{ scenarioId: "operator-escalation", score: 90 },
		],
		telemetry: { totalCostUsd: 0.04, totalDurationMs: 1800 },
	};
	const escalationPolish = {
		id: "g1-escalation-polish",
		expectedImprovements: ["operator-escalation"],
		preservedStrengths: ["keeps the escalation ladder explicit"],
		riskNotes: ["operator-recovery may still need stronger wording"],
		heldOutEntries: [
			{ scenarioId: "operator-recovery", score: 95 },
			{ scenarioId: "operator-follow-up", score: 95 },
			{ scenarioId: "operator-escalation", score: 92 },
		],
		telemetry: { totalCostUsd: 0.04, totalDurationMs: 1800 },
	};
	const selected = selectMergeParents([recovery, followUp, escalationPolish], scenarioIds);
	assert.deepEqual(selected?.map((candidate) => candidate.id), ["g1-recovery", "g1-followup"]);
});

test("run-optimize-search treats constraint-cap breaches as final-selection ineligible", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-optimize-search-constraints-"));
	const artifactRoot = mkdtempSync(join(tmpdir(), "cautilus-optimize-search-constraints-artifacts-"));
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
recovery_score=40
recovery_cost=0.02
followup_score=55
followup_cost=0.02
if grep -q "deep recovery appendix" prompt.md; then
  recovery_score=99
  recovery_cost=0.09
  followup_score=91
  followup_cost=0.03
fi
if grep -q "follow-up handoff map" prompt.md; then
  recovery_score=92
  recovery_cost=0.03
  followup_score=96
  followup_cost=0.02
fi
cat >"$output" <<EOF
{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "held_out",
  "results": [
    {
      "scenarioId": "operator-recovery",
      "status": "passed",
      "overallScore": $recovery_score,
      "telemetry": {
        "cost_usd": $recovery_cost,
        "durationMs": 900
      }
    },
    {
      "scenarioId": "operator-follow-up",
      "status": "passed",
      "overallScore": $followup_score,
      "telemetry": {
        "cost_usd": $followup_cost,
        "durationMs": 700
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
					telemetry: { cost_usd: 0.02, durationMs: 900 },
				},
				{
					scenarioId: "operator-follow-up",
					status: "failed",
					overallScore: 55,
					telemetry: { cost_usd: 0.02, durationMs: 700 },
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
				budget: "medium",
				plan: {
					evidenceLimit: 4,
					suggestedChangeLimit: 3,
					reviewVariantLimit: 1,
					historySignalLimit: 1,
				},
			},
			targetFile: { path: originalPath, exists: true },
			reportFile: join(root, "report.json"),
			report: {
				schemaVersion: "cautilus.report_packet.v2",
				generatedAt: "2026-04-13T09:57:00.000Z",
				candidate: root,
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
				modesRun: [],
				modeSummaries: [],
				telemetry: { modeCount: 0 },
				improved: [],
				regressed: ["operator-recovery", "operator-follow-up"],
				unchanged: [],
				noisy: [],
				humanReviewFindings: [
					{
						severity: "concern",
						message: "The prompt needs either a deep recovery appendix or a follow-up handoff map.",
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
					"operator-recovery": { recentTrainResults: [{ status: "failed", overallScore: 80, passRate: 0 }] },
					"operator-follow-up": { recentTrainResults: [{ status: "failed", overallScore: 70, passRate: 0 }] },
				},
			},
			objective: {
				summary: "Propose one bounded next revision without weakening held-out, comparison, or review discipline.",
				constraints: ["Prefer repairing explicit regressions over widening scope."],
			},
		});
		initGitRepo(root);
		createProgrammableCodex(root, [
			{
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a deep recovery appendix.\n",
					rationaleSummary: "Bias toward the strongest recovery improvement.",
					expectedImprovements: ["operator-recovery"],
					preservedStrengths: ["keeps the operator framing explicit"],
					riskNotes: ["held-out should confirm the appendix cost stays acceptable"],
				},
			},
		]);
		createFakeClaude(root, "Keep recovery instructions explicit with a follow-up handoff map.\n");
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		packet.searchConfig.generationLimit = 1;
		packet.searchConfig.mergeEnabled = false;
		packet.searchConfig.selectionPolicy.constraintCaps = { maxCostUsd: 0.08 };
		packet.mutationConfig.backends = [
			{ id: "codex-mutate", backend: "codex_exec" },
			{ id: "claude-mutate", backend: "claude_p" },
		];
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
		const selected = result.candidateRegistry.find((candidate) => candidate.id === result.selectedCandidateId);
		assert.match(readFileSync(result.proposalBridge.selectedTargetFile.path, "utf-8"), /follow-up handoff map/);
		assert.equal(selected.telemetry.totalCostUsd <= 0.08, true);
		assert.deepEqual(result.selectionTelemetry.selectionConstraintIneligibleCandidateIds, ["g1-1-codex-exec"]);
		assert.deepEqual(result.selectionTelemetry.rejectionReasons["g1-1-codex-exec"], ["selection_constraint_max_cost_exceeded"]);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(artifactRoot, { recursive: true, force: true });
	}
});

test("run-optimize-search emits a stable selection-policy blocked code when every finalist breaches a cap", () => {
	const { root, artifactRoot, optimizeInputPath, heldOutResultsPath } = createCheckpointFallbackFixture({
		includeReviewVariants: false,
	});
	try {
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		packet.searchConfig.generationLimit = 1;
		packet.searchConfig.mergeEnabled = false;
		packet.searchConfig.selectionPolicy.constraintCaps = { maxCostUsd: 0.01 };
		packet.mutationConfig.backends = [
			{ id: "codex-mutate", backend: "codex_exec" },
			{ id: "claude-mutate", backend: "claude_p" },
		];
		const result = runOptimizeSearch(packet, {
			inputFile: join(root, "optimize-search-input.json"),
			outputFile: join(artifactRoot, "optimize-search-result.json"),
			now: new Date("2026-04-13T10:01:00.000Z"),
			env: {
				...process.env,
				PATH: `${root}:${process.env.PATH ?? ""}`,
			},
		});
		assert.equal(result.status, "blocked");
		assert.deepEqual(result.reasonCodes, ["no_selection_policy_eligible_candidate"]);
		assert.deepEqual(
			result.selectionTelemetry.selectionConstraintIneligibleCandidateIds,
			["g1-1-codex-exec", "g1-2-claude-p"],
		);
		assert.deepEqual(result.selectionTelemetry.rejectionReasons["g1-1-codex-exec"], ["selection_constraint_max_cost_exceeded"]);
		assert.deepEqual(result.selectionTelemetry.rejectionReasons["g1-2-claude-p"], ["selection_constraint_max_cost_exceeded"]);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(artifactRoot, { recursive: true, force: true });
	}
});

test("run-optimize-search can synthesize a bounded three-parent frontier candidate", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-optimize-search-three-parent-"));
	const artifactRoot = mkdtempSync(join(tmpdir(), "cautilus-optimize-search-three-parent-artifacts-"));
	const originalPath = join(root, "prompt.md");
	const heldOutResultsPath = join(root, "held-out-results.json");
	const optimizeInputPath = join(root, "optimize-input.json");
	mkdirSync(join(root, ".agents"), { recursive: true });
	try {
		writeFileSync(originalPath, "Keep recovery instructions explicit with an escalation ladder.\n", "utf-8");
		writeExecutable(
			join(root, "evaluate.sh"),
			`#!/bin/sh
output="$1"
recovery_score=40
recovery_status="failed"
followup_score=55
followup_status="failed"
escalation_score=45
escalation_status="failed"
if grep -q "detailed recovery checklist" prompt.md; then
  recovery_score=95
  recovery_status="passed"
fi
if grep -q "follow-up handoff map" prompt.md; then
  followup_score=96
  followup_status="passed"
fi
if grep -q "escalation ladder" prompt.md; then
  escalation_score=96
  escalation_status="passed"
fi
cat >"$output" <<EOF
{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "held_out",
  "results": [
    {
      "scenarioId": "operator-recovery",
      "status": "$recovery_status",
      "overallScore": $recovery_score,
      "telemetry": {
        "cost_usd": 0.05,
        "durationMs": 1300
      }
    },
    {
      "scenarioId": "operator-follow-up",
      "status": "$followup_status",
      "overallScore": $followup_score,
      "telemetry": {
        "cost_usd": 0.03,
        "durationMs": 900
      }
    },
    {
      "scenarioId": "operator-escalation",
      "status": "$escalation_status",
      "overallScore": $escalation_score,
      "telemetry": {
        "cost_usd": 0.02,
        "durationMs": 700
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
				{
					scenarioId: "operator-follow-up",
					status: "failed",
					overallScore: 55,
					telemetry: {
						cost_usd: 0.01,
						durationMs: 800,
					},
				},
				{
					scenarioId: "operator-escalation",
					status: "passed",
					overallScore: 96,
					telemetry: {
						cost_usd: 0.01,
						durationMs: 700,
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
				budget: "medium",
				plan: {
					evidenceLimit: 4,
					suggestedChangeLimit: 3,
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
				modesRun: [],
				modeSummaries: [],
				telemetry: { modeCount: 0 },
				improved: [],
				regressed: ["operator-recovery", "operator-follow-up"],
				unchanged: [],
				noisy: [],
				humanReviewFindings: [
					{
						severity: "concern",
						message: "The prompt needs a detailed recovery checklist, a follow-up handoff map, and an escalation ladder.",
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
						recentTrainResults: [{ status: "failed", overallScore: 80, passRate: 0 }],
					},
					"operator-follow-up": {
						recentTrainResults: [{ status: "failed", overallScore: 70, passRate: 0 }],
					},
					"operator-escalation": {
						recentTrainResults: [{ status: "passed", overallScore: 95, passRate: 1 }],
					},
				},
			},
			objective: {
				summary: "Propose one bounded next revision without weakening held-out, comparison, or review discipline.",
				constraints: ["Prefer repairing explicit regressions over widening scope."],
			},
		});
		initGitRepo(root);
		createProgrammableCodex(root, [
			{
				matchAll: ["## Merge Goal", "detailed recovery checklist", "follow-up handoff map", "escalation ladder"],
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist, a follow-up handoff map, and an escalation ladder.\n",
					rationaleSummary: "Merge the complementary recovery, follow-up, and escalation strengths into one coherent prompt.",
					expectedImprovements: ["operator-recovery", "operator-follow-up", "operator-escalation"],
					preservedStrengths: ["keeps the recovery checklist", "keeps the follow-up handoff map", "keeps the escalation ladder"],
					riskNotes: ["held-out should confirm the merged prompt stays concise"],
				},
			},
			{
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist.\n",
					rationaleSummary: "Strengthen the recovery path first.",
					expectedImprovements: ["operator-recovery"],
					preservedStrengths: ["keeps the original recovery framing"],
					riskNotes: ["operator-follow-up may still remain weak"],
				},
			},
		]);
		createFakeClaude(root, "Keep recovery instructions explicit with a follow-up handoff map.\n");
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		packet.searchConfig.generationLimit = 2;
		packet.searchConfig.mergeEnabled = true;
		assert.equal(packet.searchConfig.threeParentPolicy, "coverage_expansion");
		packet.mutationConfig.backends = [
			{ id: "codex-mutate", backend: "codex_exec" },
			{ id: "claude-mutate", backend: "claude_p" },
		];
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
		assert.equal(result.searchTelemetry.generationCount, 2);
		assert.equal(result.searchTelemetry.mergeInvocationCount, 1);
		const selected = result.candidateRegistry.find((candidate) => candidate.id === result.selectedCandidateId);
		assert.equal(selected.origin, "merge");
		assert.deepEqual(selected.parentCandidateIds.length, 3);
		assert.match(readFileSync(result.proposalBridge.selectedTargetFile.path, "utf-8"), /detailed recovery checklist/);
		assert.match(readFileSync(result.proposalBridge.selectedTargetFile.path, "utf-8"), /follow-up handoff map/);
		assert.match(readFileSync(result.proposalBridge.selectedTargetFile.path, "utf-8"), /escalation ladder/);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(artifactRoot, { recursive: true, force: true });
	}
});

test("run-optimize-search carries relevant frontier checkpoint feedback into merge prompts", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-optimize-search-merge-feedback-"));
	const artifactRoot = mkdtempSync(join(tmpdir(), "cautilus-optimize-search-merge-feedback-artifacts-"));
	const originalPath = join(root, "prompt.md");
	const heldOutResultsPath = join(root, "held-out-results.json");
	const optimizeInputPath = join(root, "optimize-input.json");
	const schemaPath = join(root, "review-schema.json");
	mkdirSync(join(root, ".agents"), { recursive: true });
	try {
		writeFileSync(originalPath, "Keep recovery instructions explicit with an escalation ladder.\n", "utf-8");
		writeJson(schemaPath, { type: "object" });
		writeExecutable(
			join(root, "evaluate.sh"),
			`#!/bin/sh
output="$1"
recovery_score=40
recovery_status="failed"
followup_score=55
followup_status="failed"
escalation_score=96
escalation_status="passed"
if grep -q "detailed recovery checklist" prompt.md && ! grep -q "follow-up handoff map" prompt.md; then
  recovery_score=98
  recovery_status="passed"
  followup_score=70
  followup_status="failed"
  escalation_score=80
  escalation_status="failed"
fi
if grep -q "follow-up handoff map" prompt.md && ! grep -q "detailed recovery checklist" prompt.md; then
  recovery_score=60
  recovery_status="failed"
  followup_score=96
  followup_status="passed"
  escalation_score=82
  escalation_status="failed"
fi
if grep -q "detailed recovery checklist" prompt.md && grep -q "follow-up handoff map" prompt.md; then
  recovery_score=97
  recovery_status="passed"
  followup_score=97
  followup_status="passed"
  escalation_score=96
  escalation_status="passed"
fi
cat >"$output" <<EOF
{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "held_out",
  "results": [
    {
      "scenarioId": "operator-recovery",
      "status": "$recovery_status",
      "overallScore": $recovery_score,
      "telemetry": { "cost_usd": 0.05, "durationMs": 1100 }
    },
    {
      "scenarioId": "operator-follow-up",
      "status": "$followup_status",
      "overallScore": $followup_score,
      "telemetry": { "cost_usd": 0.03, "durationMs": 900 }
    },
    {
      "scenarioId": "operator-escalation",
      "status": "$escalation_status",
      "overallScore": $escalation_score,
      "telemetry": { "cost_usd": 0.02, "durationMs": 700 }
    }
  ]
}
EOF
`,
		);
		writeExecutable(
			join(root, "full-gate.sh"),
			`#!/bin/sh
workspace="$1"
output="$2"
cat >"$output" <<EOF
{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "full_gate",
  "results": [
    {
      "scenarioId": "operator-full-gate",
      "status": "passed",
      "overallScore": 100
    }
  ]
}
EOF
`,
		);
		writeExecutable(
			join(root, "review-variant.sh"),
			`#!/bin/sh
workspace="$1"
output="$2"
verdict="pass"
severity="pass"
summary="Candidate stays operator-safe."
if grep -q "detailed recovery checklist" "$workspace/prompt.md" && ! grep -q "follow-up handoff map" "$workspace/prompt.md"; then
  verdict="concern"
  severity="concern"
  summary="Checklist candidate still leaves operator-follow-up under-specified."
fi
cat >"$output" <<EOF
{
  "verdict": "$verdict",
  "summary": "$summary",
  "findings": [
    {
      "severity": "$severity",
      "message": "$summary",
      "path": "variant/operator-review"
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
				{ scenarioId: "operator-recovery", status: "failed", overallScore: 40, telemetry: { cost_usd: 0.02, durationMs: 1200 } },
				{ scenarioId: "operator-follow-up", status: "failed", overallScore: 55, telemetry: { cost_usd: 0.01, durationMs: 800 } },
				{ scenarioId: "operator-escalation", status: "passed", overallScore: 96, telemetry: { cost_usd: 0.01, durationMs: 700 } },
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
				"default_schema_file: review-schema.json",
				"held_out_command_templates:",
				"  - sh evaluate.sh {scenario_results_file}",
				"full_gate_command_templates:",
				"  - sh full-gate.sh {candidate_repo} {scenario_results_file}",
				"comparison_questions:",
				"  - Did the held-out score improve?",
				"human_review_prompts:",
				"  - id: operator",
				"    prompt: Where would the prompt still leave the operator stuck?",
				"executor_variants:",
				"  - id: operator-review",
				"    tool: mock",
				"    command_template: sh review-variant.sh {candidate_repo} {output_file}",
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
				budget: "medium",
				plan: { evidenceLimit: 4, suggestedChangeLimit: 3, reviewVariantLimit: 1, historySignalLimit: 1 },
			},
			targetFile: { path: originalPath, exists: true },
			reportFile: join(root, "report.json"),
			report: {
				schemaVersion: "cautilus.report_packet.v2",
				generatedAt: "2026-04-13T09:57:00.000Z",
				candidate: root,
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
				modesRun: [],
				modeSummaries: [],
				telemetry: { modeCount: 0 },
				improved: [],
				regressed: ["operator-recovery", "operator-follow-up"],
				unchanged: [],
				noisy: [],
				humanReviewFindings: [
					{
						severity: "concern",
						message: "The prompt needs a detailed recovery checklist and a follow-up handoff map without losing the escalation ladder.",
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
					"operator-recovery": { recentTrainResults: [{ status: "failed", overallScore: 80, passRate: 0 }] },
					"operator-follow-up": { recentTrainResults: [{ status: "failed", overallScore: 70, passRate: 0 }] },
					"operator-escalation": { recentTrainResults: [{ status: "passed", overallScore: 95, passRate: 1 }] },
				},
			},
			objective: {
				summary: "Propose one bounded next revision without weakening held-out, comparison, or review discipline.",
				constraints: ["Prefer repairing explicit regressions over widening scope."],
			},
		});
		initGitRepo(root);
		createProgrammableCodex(root, [
			{
				matchAll: ["## Frontier Checkpoint Feedback", "review:operator-review:concern", "Checklist candidate still leaves operator-follow-up under-specified."],
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist, a follow-up handoff map, and an escalation ladder.\n",
					rationaleSummary: "Merge the admissible frontier strengths while repairing the sibling checkpoint concern.",
					expectedImprovements: ["operator-recovery", "operator-follow-up", "operator-escalation"],
					preservedStrengths: ["keeps the escalation ladder", "keeps the handoff map"],
					riskNotes: ["held-out should confirm the merged prompt stays concise"],
				},
			},
			{
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist.\n",
					rationaleSummary: "Strengthen the recovery path first.",
					expectedImprovements: ["operator-recovery"],
					preservedStrengths: ["keeps the original recovery framing"],
					riskNotes: ["operator-follow-up may still remain weak"],
				},
			},
		]);
		createFakeClaude(root, "Keep recovery instructions explicit with a follow-up handoff map and an escalation ladder.\n");
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		packet.searchConfig.reviewCheckpointPolicy = "frontier_promotions";
		packet.searchConfig.generationLimit = 2;
		packet.searchConfig.mergeEnabled = true;
		packet.mutationConfig.backends = [
			{ id: "codex-mutate", backend: "codex_exec" },
			{ id: "claude-mutate", backend: "claude_p" },
		];
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
		const mergeCandidate = result.candidateRegistry.find((candidate) => candidate.origin === "merge");
		assert.equal(Boolean(mergeCandidate), true);
		const mergePrompt = readFileSync(mergeCandidate.artifacts.promptFile, "utf-8");
		assert.match(mergePrompt, /## Frontier Checkpoint Feedback/);
		assert.match(mergePrompt, /review:operator-review:concern/);
		assert.match(mergePrompt, /Checklist candidate still leaves operator-follow-up under-specified\./);
		assert.match(mergePrompt, /sourceCandidateId/);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(artifactRoot, { recursive: true, force: true });
	}
});

test("run-optimize-search falls back to the next frontier candidate when final review rejects the leader", () => {
	const { root, artifactRoot, optimizeInputPath, heldOutResultsPath } = createCheckpointFallbackFixture({
		includeReviewVariants: true,
		gateFailsOnChecklist: false,
	});
	try {
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		packet.searchConfig.generationLimit = 1;
		packet.searchConfig.mergeEnabled = false;
		packet.mutationConfig.backends = [
			{ id: "codex-mutate", backend: "codex_exec" },
			{ id: "claude-mutate", backend: "claude_p" },
		];
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
		assert.equal(result.searchTelemetry.reviewCheckpointCount, 2);
		assert.equal(result.searchTelemetry.fullGateCheckpointCount, 1);
		assert.deepEqual(result.selectionTelemetry.rejectedFinalistCandidateIds, ["g1-1-codex-exec"]);
		assert.deepEqual(result.selectionTelemetry.rejectionReasons["g1-1-codex-exec"], ["review:operator-review:blocker"]);
		assert.equal(result.selectedCandidateId, "g1-2-claude-p");
		assert.match(readFileSync(result.proposalBridge.selectedTargetFile.path, "utf-8"), /follow-up handoff map/);
		assert.equal(result.checkpointOutcomes.review[0].admissible, false);
		assert.equal(result.checkpointOutcomes.review[1].admissible, true);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(artifactRoot, { recursive: true, force: true });
	}
});

test("run-optimize-search reuses frontier-promotion review checkpoints before final selection", () => {
	const { root, artifactRoot, optimizeInputPath, heldOutResultsPath } = createCheckpointFallbackFixture({
		includeReviewVariants: true,
		gateFailsOnChecklist: false,
	});
	try {
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		packet.searchConfig.reviewCheckpointPolicy = "frontier_promotions";
		packet.searchConfig.generationLimit = 1;
		packet.searchConfig.mergeEnabled = false;
		packet.mutationConfig.backends = [
			{ id: "codex-mutate", backend: "codex_exec" },
			{ id: "claude-mutate", backend: "claude_p" },
		];
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
		assert.equal(result.searchTelemetry.reviewCheckpointCount, 2);
		assert.equal(result.searchTelemetry.fullGateCheckpointCount, 1);
		assert.deepEqual(
			result.checkpointOutcomes.review.map((outcome) => outcome.candidateId),
			["g1-1-codex-exec", "g1-2-claude-p"],
		);
		assert.deepEqual(result.selectionTelemetry.rejectedFinalistCandidateIds, ["g1-1-codex-exec"]);
		assert.deepEqual(result.selectionTelemetry.rejectionReasons["g1-1-codex-exec"], ["review:operator-review:blocker"]);
		assert.equal(result.selectedCandidateId, "g1-2-claude-p");
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(artifactRoot, { recursive: true, force: true });
	}
});

test("run-optimize-search reinjects frontier-promotion review feedback into the next mutation prompt", () => {
	const { root, artifactRoot, optimizeInputPath, heldOutResultsPath } = createCheckpointFallbackFixture({
		includeReviewVariants: true,
		gateFailsOnChecklist: false,
		reviewVerdict: "concern",
	});
	try {
		createProgrammableCodex(root, [
			{
				matchAll: ["review:operator-review:concern", "Checklist candidate still leaves operator-follow-up under-specified."],
				currentPromptMatchAll: ["detailed recovery checklist"],
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist and a follow-up handoff map.\n",
					rationaleSummary: "Repair the rejected checklist variant by adding the missing follow-up handoff path.",
					expectedImprovements: ["operator-recovery", "operator-follow-up"],
					preservedStrengths: ["keeps the detailed recovery checklist"],
					riskNotes: ["held-out should confirm the repaired prompt stays concise"],
				},
			},
			{
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist.\n",
					rationaleSummary: "Strengthen the recovery path first.",
					expectedImprovements: ["operator-recovery"],
					preservedStrengths: ["keeps the original recovery framing"],
					riskNotes: ["operator-follow-up may still remain weak"],
				},
			},
		]);
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		packet.searchConfig.reviewCheckpointPolicy = "frontier_promotions";
		packet.searchConfig.generationLimit = 2;
		packet.searchConfig.mergeEnabled = false;
		packet.mutationConfig.backends = [{ id: "codex-mutate", backend: "codex_exec" }];
		packet.mutationConfig.trainScenarioLimit = 1;
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
		assert.equal(result.selectedCandidateId, "g2-1-codex-exec");
		const rejectedCandidate = result.candidateRegistry.find((candidate) => candidate.id === "g1-1-codex-exec");
		assert.deepEqual(rejectedCandidate.checkpointFeedback, [{
			source: "frontier_promotion_review",
			scope: "scenario",
			scenarioIds: ["operator-follow-up"],
			rejectionReasons: ["review:operator-review:concern"],
			feedbackMessages: ["Checklist candidate still leaves operator-follow-up under-specified."],
		}]);
		const repairedCandidate = result.candidateRegistry.find((candidate) => candidate.id === "g2-1-codex-exec");
		assert.match(readFileSync(repairedCandidate.artifacts.promptFile, "utf-8"), /review:operator-review:concern/);
		assert.match(readFileSync(repairedCandidate.artifacts.promptFile, "utf-8"), /Checklist candidate still leaves operator-follow-up under-specified\./);
		assert.match(readFileSync(result.proposalBridge.selectedTargetFile.path, "utf-8"), /follow-up handoff map/);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(artifactRoot, { recursive: true, force: true });
	}
});

test("run-optimize-search filters checkpoint feedback to the reflected scenarios", () => {
	const { root, artifactRoot, optimizeInputPath, heldOutResultsPath } = createCheckpointFallbackFixture({
		includeReviewVariants: true,
	});
	try {
		writeExecutable(
			join(root, "review-variant.sh"),
			`#!/bin/sh
workspace="$1"
output="$2"
verdict="pass"
severity="pass"
summary="Candidate stays operator-safe."
if grep -q "detailed recovery checklist" "$workspace/prompt.md" && ! grep -q "follow-up handoff map" "$workspace/prompt.md"; then
  verdict="concern"
  severity="concern"
  summary="Checklist candidate still leaves operator-follow-up under-specified."
fi
cat >"$output" <<EOF
{
  "verdict": "$verdict",
  "summary": "$summary",
  "findings": [
    {
      "severity": "$severity",
      "message": "Checklist candidate still leaves operator-follow-up under-specified.",
      "path": "variant/operator-review"
    },
    {
      "severity": "$severity",
      "message": "Checklist candidate still leaves operator-recovery sequencing too implicit.",
      "path": "variant/operator-review"
    }
  ]
}
EOF
`,
		);
		createProgrammableCodex(root, [
			{
				currentPromptMatchNone: ["detailed recovery checklist"],
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist.\n",
					rationaleSummary: "Strengthen the recovery path first.",
					expectedImprovements: ["operator-recovery"],
					preservedStrengths: ["keeps the original recovery framing"],
					riskNotes: ["operator-follow-up may still remain weak"],
				},
			},
			{
				currentPromptMatchAll: ["detailed recovery checklist"],
				matchAll: ["operator-follow-up under-specified."],
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a follow-up handoff map.\n",
					rationaleSummary: "Repair the follow-up gap the checkpoint still flagged.",
					expectedImprovements: ["operator-follow-up"],
					preservedStrengths: ["keeps the detailed recovery checklist"],
					riskNotes: ["held-out should confirm the repaired handoff stays concise"],
				},
			},
			{
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a generic escalation note.\n",
					rationaleSummary: "Fallback mutation output.",
					expectedImprovements: ["operator-follow-up"],
					preservedStrengths: ["keeps the detailed recovery checklist"],
					riskNotes: ["held-out should confirm the fallback stays sufficient"],
				},
			},
		]);
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		packet.searchConfig.reviewCheckpointPolicy = "frontier_promotions";
		packet.searchConfig.generationLimit = 2;
		packet.searchConfig.mergeEnabled = false;
		packet.mutationConfig.backends = [{ id: "codex-mutate", backend: "codex_exec" }];
		packet.mutationConfig.trainScenarioLimit = 1;
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
		const rejectedCandidate = result.candidateRegistry.find((candidate) => candidate.id === "g1-1-codex-exec");
		assert.deepEqual(rejectedCandidate.checkpointFeedback, [
			{
				source: "frontier_promotion_review",
				scope: "scenario",
				scenarioIds: ["operator-recovery"],
				rejectionReasons: ["review:operator-review:concern"],
				feedbackMessages: ["Checklist candidate still leaves operator-recovery sequencing too implicit."],
			},
			{
				source: "frontier_promotion_review",
				scope: "scenario",
				scenarioIds: ["operator-follow-up"],
				rejectionReasons: ["review:operator-review:concern"],
				feedbackMessages: ["Checklist candidate still leaves operator-follow-up under-specified."],
			},
		]);
		const repairedCandidate = result.candidateRegistry.find((candidate) => candidate.id === "g2-1-codex-exec");
		const mutationPrompt = readFileSync(repairedCandidate.artifacts.promptFile, "utf-8");
		assert.match(mutationPrompt, /operator-follow-up under-specified\./);
		assert.doesNotMatch(mutationPrompt, /operator-recovery sequencing too implicit\./);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(artifactRoot, { recursive: true, force: true });
	}
});

test("run-optimize-search prioritizes scenario-scoped checkpoint feedback when choosing the next reflection batch", () => {
	const { root, artifactRoot, optimizeInputPath, heldOutResultsPath } = createCheckpointFallbackFixture({
		includeReviewVariants: true,
		gateFailsOnChecklist: false,
		reviewVerdict: "concern",
	});
	try {
		writeExecutable(
			join(root, "evaluate.sh"),
			`#!/bin/sh
output="$1"
recovery_score=40
recovery_status="failed"
followup_score=55
followup_status="failed"
if grep -q "detailed recovery checklist" prompt.md && ! grep -q "explicit recovery sequencing map" prompt.md; then
  recovery_score=92
  recovery_status="passed"
  followup_score=70
  followup_status="failed"
fi
if grep -q "explicit recovery sequencing map" prompt.md; then
  recovery_score=99
  recovery_status="passed"
  followup_score=72
  followup_status="failed"
fi
cat >"$output" <<EOF
{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "held_out",
  "results": [
    {
      "scenarioId": "operator-recovery",
      "status": "$recovery_status",
      "overallScore": $recovery_score,
      "telemetry": { "cost_usd": 0.04, "durationMs": 1000 }
    },
    {
      "scenarioId": "operator-follow-up",
      "status": "$followup_status",
      "overallScore": $followup_score,
      "telemetry": { "cost_usd": 0.03, "durationMs": 900 }
    }
  ]
}
EOF
`,
		);
		writeExecutable(
			join(root, "review-variant.sh"),
			`#!/bin/sh
workspace="$1"
output="$2"
verdict="pass"
severity="pass"
summary="Candidate stays operator-safe."
if grep -q "detailed recovery checklist" "$workspace/prompt.md" && ! grep -q "explicit recovery sequencing map" "$workspace/prompt.md"; then
  verdict="concern"
  severity="concern"
  summary="Checklist candidate still leaves operator-recovery sequencing too implicit."
fi
cat >"$output" <<EOF
{
  "verdict": "$verdict",
  "summary": "$summary",
  "findings": [
    {
      "severity": "$severity",
      "message": "Checklist candidate still leaves operator-recovery sequencing too implicit.",
      "path": "variant/operator-review"
    }
  ]
}
EOF
`,
		);
		createProgrammableCodex(root, [
			{
				currentPromptMatchNone: ["detailed recovery checklist"],
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist.\n",
					rationaleSummary: "Strengthen the recovery path first.",
					expectedImprovements: ["operator-recovery"],
					preservedStrengths: ["keeps the original recovery framing"],
					riskNotes: ["operator-follow-up may still remain weak"],
				},
			},
			{
				currentPromptMatchAll: ["detailed recovery checklist"],
				matchAll: ["operator-recovery sequencing too implicit."],
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist and an explicit recovery sequencing map.\n",
					rationaleSummary: "Repair the checkpointed recovery sequencing gap before widening other scenarios.",
					expectedImprovements: ["operator-recovery"],
					preservedStrengths: ["keeps the detailed recovery checklist"],
					riskNotes: ["operator-follow-up still needs later repair"],
				},
			},
			{
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a follow-up handoff map.\n",
					rationaleSummary: "Fallback mutation output.",
					expectedImprovements: ["operator-follow-up"],
					preservedStrengths: ["keeps the detailed recovery checklist"],
					riskNotes: ["held-out should confirm the fallback stays sufficient"],
				},
			},
		]);
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		packet.searchConfig.reviewCheckpointPolicy = "frontier_promotions";
		packet.searchConfig.generationLimit = 2;
		packet.searchConfig.mergeEnabled = false;
		packet.mutationConfig.backends = [{ id: "codex-mutate", backend: "codex_exec" }];
		packet.mutationConfig.trainScenarioLimit = 1;
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
		assert.equal(result.selectedCandidateId, "g2-1-codex-exec");
		const repairedCandidate = result.candidateRegistry.find((candidate) => candidate.id === "g2-1-codex-exec");
		const mutationPrompt = readFileSync(repairedCandidate.artifacts.promptFile, "utf-8");
		assert.match(mutationPrompt, /operator-recovery sequencing too implicit\./);
		assert.doesNotMatch(mutationPrompt, /operator-follow-up under-specified\./);
		assert.match(readFileSync(result.proposalBridge.selectedTargetFile.path, "utf-8"), /explicit recovery sequencing map/);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(artifactRoot, { recursive: true, force: true });
	}
});

test("run-optimize-search keeps concern-level rejected lineage for one repair generation before pruning", () => {
	const { root, artifactRoot, optimizeInputPath, heldOutResultsPath } = createCheckpointFallbackFixture({
		includeReviewVariants: true,
		gateFailsOnChecklist: false,
		reviewVerdict: "concern",
	});
	try {
		createProgrammableCodex(root, [
			{
				currentPromptMatchNone: ["detailed recovery checklist"],
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist.\n",
					rationaleSummary: "First repair pass adds the checklist.",
					expectedImprovements: ["operator-recovery"],
					preservedStrengths: ["keeps the original recovery framing"],
					riskNotes: ["operator-follow-up may still remain weak"],
				},
			},
			{
				currentPromptMatchAll: ["detailed recovery checklist"],
				currentPromptMatchNone: ["operator timeline"],
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist and operator timeline.\n",
					rationaleSummary: "Second repair pass keeps the checklist but still misses follow-up.",
					expectedImprovements: ["operator-recovery"],
					preservedStrengths: ["keeps the detailed recovery checklist"],
					riskNotes: ["operator-follow-up may still remain weak"],
				},
			},
			{
				currentPromptMatchAll: ["operator timeline"],
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist, operator timeline, and escalation ladder.\n",
					rationaleSummary: "Third repair pass continues from the newest rejected lineage only.",
					expectedImprovements: ["operator-recovery"],
					preservedStrengths: ["keeps the detailed recovery checklist"],
					riskNotes: ["operator-follow-up may still remain weak"],
				},
			},
		]);
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		packet.searchConfig.reviewCheckpointPolicy = "frontier_promotions";
		packet.searchConfig.generationLimit = 3;
		packet.searchConfig.mergeEnabled = false;
		packet.mutationConfig.backends = [{ id: "codex-mutate", backend: "codex_exec" }];
		packet.mutationConfig.trainScenarioLimit = 1;
		const result = runOptimizeSearch(packet, {
			inputFile: join(root, "optimize-search-input.json"),
			outputFile: join(artifactRoot, "optimize-search-result.json"),
			now: new Date("2026-04-13T10:01:00.000Z"),
			env: {
				...process.env,
				PATH: `${root}:${process.env.PATH ?? ""}`,
			},
		});
		assert.equal(result.status, "blocked");
		assert.equal(result.searchTelemetry.generationCount, 3);
		assert.deepEqual(
			result.generationSummaries.map((summary) => summary.parentFrontierCandidateIds),
			[
				["seed"],
				["g1-1-codex-exec"],
				["g2-1-codex-exec"],
			],
		);
		assert.deepEqual(
			result.generationSummaries.map((summary) => summary.proposedCandidateIds),
			[
				["g1-1-codex-exec"],
				["g2-1-codex-exec"],
				["g3-1-codex-exec"],
			],
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(artifactRoot, { recursive: true, force: true });
	}
});

test("run-optimize-search prunes blocker-level rejected lineage before the next generation", () => {
	const { root, artifactRoot, optimizeInputPath, heldOutResultsPath } = createCheckpointFallbackFixture({
		includeReviewVariants: true,
		gateFailsOnChecklist: false,
		reviewVerdict: "blocker",
	});
	try {
		createProgrammableCodex(root, [
			{
				output: {
					promptMarkdown: "Keep recovery instructions explicit with a detailed recovery checklist.\n",
					rationaleSummary: "First repair pass adds the checklist.",
					expectedImprovements: ["operator-recovery"],
					preservedStrengths: ["keeps the original recovery framing"],
					riskNotes: ["operator-follow-up may still remain weak"],
				},
			},
		]);
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		packet.searchConfig.reviewCheckpointPolicy = "frontier_promotions";
		packet.searchConfig.generationLimit = 3;
		packet.searchConfig.mergeEnabled = false;
		packet.mutationConfig.backends = [{ id: "codex-mutate", backend: "codex_exec" }];
		packet.mutationConfig.trainScenarioLimit = 1;
		const result = runOptimizeSearch(packet, {
			inputFile: join(root, "optimize-search-input.json"),
			outputFile: join(artifactRoot, "optimize-search-result.json"),
			now: new Date("2026-04-13T10:01:00.000Z"),
			env: {
				...process.env,
				PATH: `${root}:${process.env.PATH ?? ""}`,
			},
		});
		assert.equal(result.status, "blocked");
		assert.equal(result.searchTelemetry.generationCount, 1);
		assert.deepEqual(
			result.generationSummaries.map((summary) => summary.parentFrontierCandidateIds),
			[["seed"]],
		);
		assert.deepEqual(
			result.generationSummaries.map((summary) => summary.proposedCandidateIds),
			[["g1-1-codex-exec"]],
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(artifactRoot, { recursive: true, force: true });
	}
});

test("run-optimize-search falls back to the next frontier candidate when full gate rejects the leader", () => {
	const { root, artifactRoot, optimizeInputPath, heldOutResultsPath } = createCheckpointFallbackFixture({
		includeReviewVariants: false,
		gateFailsOnChecklist: true,
	});
	try {
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "medium"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		packet.searchConfig.generationLimit = 1;
		packet.searchConfig.mergeEnabled = false;
		packet.mutationConfig.backends = [
			{ id: "codex-mutate", backend: "codex_exec" },
			{ id: "claude-mutate", backend: "claude_p" },
		];
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
		assert.equal(result.searchTelemetry.reviewCheckpointCount, 0);
		assert.equal(result.searchTelemetry.fullGateCheckpointCount, 2);
		assert.deepEqual(result.selectionTelemetry.rejectedFinalistCandidateIds, ["g1-1-codex-exec"]);
		assert.deepEqual(result.selectionTelemetry.rejectionReasons["g1-1-codex-exec"], ["full_gate:reject"]);
		assert.equal(result.selectedCandidateId, "g1-2-claude-p");
		assert.match(readFileSync(result.proposalBridge.selectedTargetFile.path, "utf-8"), /follow-up handoff map/);
		assert.equal(result.checkpointOutcomes.fullGate[0].admissible, false);
		assert.equal(result.checkpointOutcomes.fullGate[1].admissible, true);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(artifactRoot, { recursive: true, force: true });
	}
});

test("run-optimize-search blocks when every frontier candidate fails the final checkpoints", () => {
	const { root, artifactRoot, optimizeInputPath, heldOutResultsPath } = createCheckpointFallbackFixture({
		includeReviewVariants: false,
		gateFailsOnChecklist: true,
	});
	try {
		const { packet } = buildOptimizeSearchInput(
			["--optimize-input", optimizeInputPath, "--held-out-results-file", heldOutResultsPath, "--budget", "light"],
			{ now: new Date("2026-04-13T10:00:00.000Z") },
		);
		packet.searchConfig.generationLimit = 1;
		packet.searchConfig.mergeEnabled = false;
		packet.mutationConfig.backends = [{ id: "codex-mutate", backend: "codex_exec" }];
		const result = runOptimizeSearch(packet, {
			inputFile: join(root, "optimize-search-input.json"),
			outputFile: join(artifactRoot, "optimize-search-result.json"),
			now: new Date("2026-04-13T10:01:00.000Z"),
			env: {
				...process.env,
				PATH: `${root}:${process.env.PATH ?? ""}`,
			},
		});
		assert.equal(result.status, "blocked");
		assert.deepEqual(result.reasonCodes, ["no_checkpoint_admissible_candidate"]);
		assert.equal("selectedCandidateId" in result, false);
		assert.deepEqual(result.selectionTelemetry.rejectedFinalistCandidateIds, ["g1-1-codex-exec"]);
		assert.equal(result.searchTelemetry.fullGateCheckpointCount, 1);
		assert.equal(result.checkpointOutcomes.fullGate[0].admissible, false);
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
