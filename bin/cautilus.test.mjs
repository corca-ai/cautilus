import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { COMPARE_ARTIFACT_SCHEMA, SCENARIO_RESULTS_SCHEMA } from "../scripts/agent-runtime/contract-versions.mjs";

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
			join(adapterDir, "cautilus-adapter.yaml"),
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
			join(adapterDir, "cautilus-adapter.yaml"),
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
		assert.equal(payload.adapter_path, join(root, ".agents", "cautilus-adapter.yaml"));
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
			join(adapterDir, "cautilus-adapter.yaml"),
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
		const adapterPath = join(root, ".agents", "cautilus-adapter.yaml");
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

test("cautilus workspace prepare-compare creates baseline and candidate worktrees", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-compare-worktrees-"));
	try {
		const git = (args) => {
			const result = spawnSync("git", ["-C", root, ...args], {
				encoding: "utf-8",
			});
			assert.equal(result.status, 0, result.stderr);
			return result.stdout.trim();
		};
		git(["init"]);
		git(["config", "user.name", "Cautilus Test"]);
		git(["config", "user.email", "test@example.com"]);
		writeFileSync(join(root, "sample.txt"), "baseline\n", "utf-8");
		git(["add", "sample.txt"]);
		git(["commit", "-m", "baseline"]);
		const baselineCommit = git(["rev-parse", "HEAD"]);
		writeFileSync(join(root, "sample.txt"), "candidate\n", "utf-8");
		git(["commit", "-am", "candidate"]);
		const outputDir = join(root, "compare");

		const result = spawnSync(
			"node",
			[
				BIN_PATH,
				"workspace",
				"prepare-compare",
				"--repo-root",
				root,
				"--baseline-ref",
				baselineCommit,
				"--output-dir",
				outputDir,
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(readFileSync(join(payload.baseline.path, "sample.txt"), "utf-8"), "baseline\n");
		assert.equal(readFileSync(join(payload.candidate.path, "sample.txt"), "utf-8"), "candidate\n");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cautilus scenario propose generates a standalone proposal packet from normalized input", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-scenario-propose-"));
	try {
		const inputPath = join(root, "scenario-proposal-input.json");
		const outputPath = join(root, "scenario-proposals.json");
		writeFileSync(
			inputPath,
			`${JSON.stringify(
				{
					schemaVersion: "cautilus.scenario_proposal_inputs.v1",
					windowDays: 14,
					families: ["fast_regression"],
					proposalCandidates: [
						{
							proposalKey: "review-after-retro",
							title: "Refresh review-after-retro scenario from recent activity",
							family: "fast_regression",
							name: "Review After Retro",
							description: "The user pivots from retro back to review in one thread.",
							brief: "Recent activity shows a retro turn followed by a review turn.",
							simulatorTurns: ["retro 먼저 해주세요", "이제 review로 돌아가죠"],
							evidence: [
								{
									sourceKind: "human_conversation",
									title: "review after retro",
									threadKey: "thread-1",
									observedAt: "2026-04-09T21:00:00.000Z",
									messages: ["retro 먼저 해주세요", "이제 review로 돌아가죠"],
								},
							],
						},
					],
					existingScenarioRegistry: [
						{
							scenarioId: "review-after-retro",
							scenarioKey: "review-after-retro",
							family: "fast_regression",
						},
					],
					scenarioCoverage: [
						{
							scenarioKey: "review-after-retro",
							recentResultCount: 2,
						},
					],
					now: "2026-04-11T00:00:00.000Z",
				},
				null,
				2,
			)}\n`,
			"utf-8",
		);

		const result = spawnSync("node", [BIN_PATH, "scenario", "propose", "--input", inputPath, "--output", outputPath], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
		assert.equal(result.stdout, "");
		const payload = JSON.parse(readFileSync(outputPath, "utf-8"));
		assert.equal(payload.schemaVersion, "cautilus.scenario_proposals.v1");
		assert.equal(payload.proposals.length, 1);
		assert.equal(payload.proposals[0].action, "refresh_existing_scenario");
		assert.equal(payload.proposals[0].draftScenario.schemaVersion, "cautilus.scenario.v1");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cautilus scenario summarize-telemetry aggregates scenario costs from results", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-scenario-telemetry-"));
	try {
		const inputPath = join(root, "results.json");
		writeFileSync(
			inputPath,
			`${JSON.stringify({
				schemaVersion: SCENARIO_RESULTS_SCHEMA,
				mode: "held_out",
				results: [
					{
						scenarioId: "alpha",
						durationMs: 100,
						telemetry: { total_tokens: 120, cost_usd: 0.01 },
					},
					{
						scenarioId: "beta",
						durationMs: 200,
						telemetry: { total_tokens: 220, cost_usd: 0.02 },
					},
				],
			})}\n`,
			"utf-8",
		);
		const result = spawnSync("node", [BIN_PATH, "scenario", "summarize-telemetry", "--results", inputPath], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.overall.runCount, 2);
		assert.equal(payload.overall.total_tokens, 340);
		assert.equal(payload.overall.cost_usd, 0.03);
		assert.equal(payload.scenarios[0].scenarioId, "beta");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cautilus report build emits a machine-readable report packet with mode telemetry", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-report-build-"));
	try {
		const inputPath = join(root, "report-input.json");
		writeFileSync(
			inputPath,
			`${JSON.stringify(
				{
					schemaVersion: "cautilus.report_inputs.v1",
					candidate: "feature/intentful-cli",
					baseline: "origin/main",
					intent: "The CLI should explain missing adapter setup without operator guesswork.",
					commands: [
						{
							mode: "held_out",
							command: "node ./bin/cautilus doctor --repo-root /tmp/repo",
						},
					],
					modeRuns: [
						{
							mode: "held_out",
							status: "passed",
							durationMs: 10000,
							scenarioResults: {
								schemaVersion: SCENARIO_RESULTS_SCHEMA,
								mode: "held_out",
								results: [
									{
										scenarioId: "doctor-missing-adapter",
										durationMs: 1200,
										telemetry: {
											total_tokens: 200,
											cost_usd: 0.02,
										},
									},
								],
								compareArtifact: {
									schemaVersion: COMPARE_ARTIFACT_SCHEMA,
									summary: "Missing-adapter messaging improved.",
									verdict: "improved",
									improved: ["doctor-missing-adapter"],
								},
							},
						},
						{
							mode: "full_gate",
							status: "failed",
							durationMs: 15000,
							telemetry: {
								total_tokens: 300,
								cost_usd: 0.03,
							},
						},
					],
					humanReviewFindings: [
						{
							severity: "concern",
							message: "CLI wording is still terse",
						},
					],
					recommendation: "defer",
				},
				null,
				2,
			)}\n`,
			"utf-8",
		);
		const result = spawnSync("node", [BIN_PATH, "report", "build", "--input", inputPath], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.schemaVersion, "cautilus.report_packet.v1");
		assert.deepEqual(payload.modesRun, ["held_out", "full_gate"]);
		assert.equal(payload.telemetry.total_tokens, 500);
		assert.equal(payload.telemetry.cost_usd, 0.05);
		assert.equal(payload.telemetry.durationMs, 25000);
		assert.equal(payload.modeSummaries[0].scenarioTelemetrySummary.overall.total_tokens, 200);
		assert.equal(payload.modeSummaries[0].compareArtifact.verdict, "improved");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cautilus cli evaluate executes an intent packet and emits a report-backed summary", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-cli-eval-"));
	try {
		const repoRoot = process.cwd();
		const workspace = join(root, "workspace");
		mkdirSync(workspace, { recursive: true });
		const inputPath = join(root, "cli-input.json");
		writeFileSync(
			inputPath,
			`${JSON.stringify(
				{
					schemaVersion: "cautilus.cli_evaluation_inputs.v1",
					candidate: "current-cautilus-cli",
					baseline: "current-doctor-contract",
					intent: "The doctor command should explain missing adapter setup.",
					surfaceId: "doctor-missing-adapter",
					mode: "held_out",
					workingDirectory: repoRoot,
					command: ["node", join(repoRoot, "bin", "cautilus"), "doctor", "--repo-root", workspace],
					expectations: {
						exitCode: 1,
						stdoutContains: ["missing_adapter", "adapter init"],
						stderrNotContains: ["Traceback"],
					},
				},
				null,
				2,
			)}\n`,
			"utf-8",
		);
		const result = spawnSync("node", [BIN_PATH, "cli", "evaluate", "--input", inputPath], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.schemaVersion, "cautilus.cli_evaluation_packet.v1");
		assert.equal(payload.summary.recommendation, "accept-now");
		assert.equal(payload.report.schemaVersion, "cautilus.report_packet.v1");
		assert.equal(payload.report.modesRun[0], "held_out");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cautilus mode evaluate executes adapter command templates and writes a report packet", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-mode-eval-"));
	try {
		const adapterDir = join(root, ".agents");
		const workspace = join(root, "workspace");
		mkdirSync(adapterDir, { recursive: true });
		mkdirSync(workspace, { recursive: true });
		writeExecutable(
			workspace,
			"bench.sh",
			`#!/bin/sh
scenario_results_file="$1"
cat > "$scenario_results_file" <<'JSON'
{
  "schemaVersion": "cautilus.scenario_results.v1",
  "mode": "held_out",
  "results": [
    {
      "scenarioId": "doctor-missing-adapter",
      "status": "passed",
      "durationMs": 90,
      "telemetry": {
        "total_tokens": 21,
        "cost_usd": 0.005
      }
    }
  ],
  "compareArtifact": {
    "schemaVersion": "cautilus.compare_artifact.v1",
    "summary": "CLI doctor recovery stayed explicit.",
    "verdict": "improved",
    "improved": [
      "doctor-missing-adapter"
    ]
  }
}
JSON
echo ok
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
				"held_out_command_templates:",
				"  - sh {candidate_repo}/bench.sh {scenario_results_file}",
				"",
			].join("\n"),
			"utf-8",
		);
		const outputDir = join(root, "outputs");
		const result = spawnSync(
			"node",
			[
				BIN_PATH,
				"mode",
				"evaluate",
				"--repo-root",
				root,
				"--candidate-repo",
				workspace,
				"--mode",
				"held_out",
				"--intent",
				"CLI behavior should remain legible.",
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
		assert.equal(report.commandObservations.length, 1);
		assert.equal(report.modeSummaries[0].scenarioTelemetrySummary.overall.total_tokens, 21);
		assert.equal(report.modeSummaries[0].compareArtifact.verdict, "improved");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cautilus review prepare-input builds a review packet from adapter review surfaces and a report", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-review-packet-"));
	try {
		const adapterDir = join(root, ".agents");
		mkdirSync(adapterDir, { recursive: true });
		mkdirSync(join(root, "fixtures"), { recursive: true });
		mkdirSync(join(root, "reports"), { recursive: true });
		writeFileSync(join(root, "fixtures", "review.prompt.md"), "prompt\n", "utf-8");
		writeFileSync(join(root, "fixtures", "review.schema.json"), '{"type":"object"}\n', "utf-8");
		writeFileSync(
			join(adapterDir, "cautilus-adapter.yaml"),
			[
				"version: 1",
				"repo: temp",
				"evaluation_surfaces:",
				"  - cli behavior",
				"baseline_options:",
				"  - baseline git ref via {baseline_ref}",
				"held_out_command_templates:",
				"  - npm run held-out",
				"artifact_paths:",
				"  - fixtures/review.prompt.md",
				"report_paths:",
				"  - reports/latest.json",
				"comparison_questions:",
				"  - Which scenarios improved?",
				"human_review_prompts:",
				"  - id: operator",
				"    prompt: Where is the workflow still brittle?",
				"default_prompt_file: fixtures/review.prompt.md",
				"default_schema_file: fixtures/review.schema.json",
				"",
			].join("\n"),
			"utf-8",
		);
		const reportFile = join(root, "reports", "latest.json");
		writeFileSync(
			reportFile,
			`${JSON.stringify(
				{
					schemaVersion: "cautilus.report_packet.v1",
					generatedAt: "2026-04-11T00:00:00.000Z",
					candidate: "feature/cli",
					baseline: "origin/main",
					intent: "CLI behavior should stay legible.",
					commands: [],
					modesRun: [],
					modeSummaries: [],
					telemetry: {},
					improved: [],
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
		const result = spawnSync(
			"node",
			[BIN_PATH, "review", "prepare-input", "--repo-root", root, "--report-file", reportFile],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(result.status, 0, result.stderr);
		const packet = JSON.parse(result.stdout);
		assert.equal(packet.schemaVersion, "cautilus.review_packet.v1");
		assert.equal(packet.artifactFiles[0].exists, true);
		assert.equal(packet.humanReviewPrompts[0].id, "operator");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cautilus review build-prompt-input and render-prompt close the generic meta-prompt seam", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-review-prompt-"));
	try {
		const reviewPacketPath = join(root, "review-packet.json");
		const promptPath = join(root, "review.prompt.md");
		const promptInputPath = join(root, "review-prompt-input.json");
		mkdirSync(join(root, "fixtures"), { recursive: true });
		writeFileSync(join(root, "fixtures", "consumer.prompt.md"), "Prefer operator-visible evidence.\n", "utf-8");
		writeFileSync(
			reviewPacketPath,
			`${JSON.stringify(
				{
					schemaVersion: "cautilus.review_packet.v1",
					generatedAt: "2026-04-11T00:03:00.000Z",
					repoRoot: root,
					adapterPath: join(root, ".agents", "cautilus-adapter.yaml"),
					reportFile: join(root, "report.json"),
					report: {
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
									schemaVersion: COMPARE_ARTIFACT_SCHEMA,
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
					defaultPromptFile: {
						relativePath: "fixtures/consumer.prompt.md",
						absolutePath: join(root, "fixtures", "consumer.prompt.md"),
						exists: true,
					},
					defaultSchemaFile: null,
					artifactFiles: [],
					reportArtifacts: [],
					comparisonQuestions: ["Which scenario-level deltas actually matter to a real operator?"],
					humanReviewPrompts: [
						{
							id: "real-user",
							prompt: "Where would a real user still judge the candidate worse despite benchmark wins?",
						},
					],
				},
				null,
				2,
			)}\n`,
			"utf-8",
		);
		const buildResult = spawnSync(
			"node",
			[BIN_PATH, "review", "build-prompt-input", "--review-packet", reviewPacketPath, "--output", promptInputPath],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(buildResult.status, 0, buildResult.stderr);
		const promptInput = JSON.parse(readFileSync(promptInputPath, "utf-8"));
		assert.equal(promptInput.schemaVersion, "cautilus.review_prompt_inputs.v1");
		const renderResult = spawnSync(
			"node",
			[BIN_PATH, "review", "render-prompt", "--input", promptInputPath, "--output", promptPath],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(renderResult.status, 0, renderResult.stderr);
		const prompt = readFileSync(promptPath, "utf-8");
		assert.match(prompt, /Held-out doctor messaging improved\./);
		assert.match(prompt, /Prefer operator-visible evidence\./);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cautilus scenario prepare-input builds a proposal input packet from split normalized sources", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-scenario-prepare-"));
	try {
		const candidatesPath = join(root, "candidates.json");
		const registryPath = join(root, "registry.json");
		const coveragePath = join(root, "coverage.json");
		const inputPath = join(root, "scenario-proposal-input.json");
		const outputPath = join(root, "scenario-proposals.json");

		writeFileSync(
			candidatesPath,
			`${JSON.stringify(
				[
					{
						proposalKey: "review-after-retro",
						title: "Refresh review-after-retro scenario from recent activity",
						family: "fast_regression",
						name: "Review After Retro",
						description: "The user pivots from retro back to review in one thread.",
						brief: "Recent activity shows a retro turn followed by a review turn.",
						simulatorTurns: ["retro 먼저 해주세요", "이제 review로 돌아가죠"],
						evidence: [
							{
								sourceKind: "human_conversation",
								title: "review after retro",
								threadKey: "thread-1",
								observedAt: "2026-04-09T21:00:00.000Z",
								messages: ["retro 먼저 해주세요", "이제 review로 돌아가죠"],
							},
						],
					},
				],
				null,
				2,
			)}\n`,
			"utf-8",
		);
		writeFileSync(
			registryPath,
			`${JSON.stringify(
				[
					{
						scenarioId: "review-after-retro",
						scenarioKey: "review-after-retro",
						family: "fast_regression",
					},
				],
				null,
				2,
			)}\n`,
			"utf-8",
		);
		writeFileSync(
			coveragePath,
			`${JSON.stringify(
				[
					{
						scenarioKey: "review-after-retro",
						recentResultCount: 2,
					},
				],
				null,
				2,
			)}\n`,
			"utf-8",
		);

		const prepare = spawnSync(
			"node",
			[
				BIN_PATH,
				"scenario",
				"prepare-input",
				"--candidates",
				candidatesPath,
				"--registry",
				registryPath,
				"--coverage",
				coveragePath,
				"--family",
				"fast_regression",
				"--window-days",
				"14",
				"--now",
				"2026-04-11T00:00:00.000Z",
				"--output",
				inputPath,
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(prepare.status, 0, prepare.stderr);
		const prepared = JSON.parse(readFileSync(inputPath, "utf-8"));
		assert.equal(prepared.schemaVersion, "cautilus.scenario_proposal_inputs.v1");
		assert.equal(prepared.proposalCandidates.length, 1);

		const propose = spawnSync("node", [BIN_PATH, "scenario", "propose", "--input", inputPath, "--output", outputPath], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(propose.status, 0, propose.stderr);
		const payload = JSON.parse(readFileSync(outputPath, "utf-8"));
		assert.equal(payload.proposals.length, 1);
		assert.equal(payload.proposals[0].proposalKey, "review-after-retro");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cautilus scenario normalize chatbot produces proposal candidates that chain into prepare-input and propose", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-chatbot-normalize-"));
	try {
		const chatbotInputPath = join(root, "chatbot-input.json");
		const candidatesPath = join(root, "chatbot-candidates.json");
		const proposalInputPath = join(root, "scenario-proposal-input.json");
		const proposalOutputPath = join(root, "scenario-proposals.json");
		const registryPath = join(root, "registry.json");
		const coveragePath = join(root, "coverage.json");

		writeFileSync(
			chatbotInputPath,
			`${JSON.stringify(
				{
					schemaVersion: "cautilus.chatbot_normalization_inputs.v1",
					conversationSummaries: [
						{
							threadKey: "thread-chatbot-1",
							lastObservedAt: "2026-04-11T00:00:00.000Z",
							records: [
								{ actorKind: "user", text: "repo review 해주세요" },
								{ actorKind: "user", text: "지금 이 저장소 기준으로 봐주세요" },
							],
						},
					],
					runSummaries: [
						{
							runId: "run-chatbot-1",
							threadKey: "thread-chatbot-2",
							startedAt: "2026-04-11T00:00:00.000Z",
							textPreview: "네, 그대로 진행해주세요.",
							blockedReason: "ambiguous_confirmation_without_thread_context",
						},
					],
				},
				null,
				2,
			)}\n`,
			"utf-8",
		);
		writeFileSync(
			registryPath,
			`${JSON.stringify(
				[
					{
						scenarioId: "repo-review-needs-target-clarification",
						scenarioKey: "repo-review-needs-target-clarification",
						family: "fast_regression",
					},
				],
				null,
				2,
			)}\n`,
			"utf-8",
		);
		writeFileSync(
			coveragePath,
			`${JSON.stringify(
				[
					{
						scenarioKey: "repo-review-needs-target-clarification",
						recentResultCount: 2,
					},
				],
				null,
				2,
			)}\n`,
			"utf-8",
		);

		const normalize = spawnSync(
			"node",
			[BIN_PATH, "scenario", "normalize", "chatbot", "--input", chatbotInputPath, "--output", candidatesPath],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(normalize.status, 0, normalize.stderr);
		const candidates = JSON.parse(readFileSync(candidatesPath, "utf-8"));
		assert.equal(candidates.length, 2);

		const prepare = spawnSync(
			"node",
			[
				BIN_PATH,
				"scenario",
				"prepare-input",
				"--candidates",
				candidatesPath,
				"--registry",
				registryPath,
				"--coverage",
				coveragePath,
				"--family",
				"fast_regression",
				"--window-days",
				"14",
				"--now",
				"2026-04-11T00:00:00.000Z",
				"--output",
				proposalInputPath,
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(prepare.status, 0, prepare.stderr);

		const propose = spawnSync("node", [BIN_PATH, "scenario", "propose", "--input", proposalInputPath, "--output", proposalOutputPath], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(propose.status, 0, propose.stderr);
		const proposals = JSON.parse(readFileSync(proposalOutputPath, "utf-8"));
		assert.equal(proposals.proposals.length, 2);
		assert.equal(proposals.proposals[0].family, "fast_regression");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cautilus scenario normalize skill produces proposal candidates that chain into prepare-input and propose", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-skill-normalize-"));
	try {
		const skillInputPath = join(root, "skill-input.json");
		const candidatesPath = join(root, "skill-candidates.json");
		const proposalInputPath = join(root, "scenario-proposal-input.json");
		const proposalOutputPath = join(root, "scenario-proposals.json");
		const registryPath = join(root, "registry.json");
		const coveragePath = join(root, "coverage.json");

		writeFileSync(
			skillInputPath,
			`${JSON.stringify(
				{
					schemaVersion: "cautilus.skill_normalization_inputs.v1",
					evaluationRuns: [
						{
							targetKind: "public_skill",
							targetId: "impl",
							displayName: "impl",
							surface: "smoke_scenario",
							startedAt: "2026-04-11T00:00:00.000Z",
							status: "failed",
							summary: "The impl smoke scenario stopped producing a bounded execution plan.",
						},
						{
							targetKind: "cli_workflow",
							targetId: "scan-settings-seed",
							displayName: "Scan Settings Seed",
							surface: "replay_seed",
							startedAt: "2026-04-11T01:00:00.000Z",
							status: "blocked",
							summary: "Replay seed stalled on the same settings screen after two retries.",
							blockerKind: "repeated_screen_no_progress",
							blockedSteps: ["open_settings", "open_settings"],
						},
					],
				},
				null,
				2,
			)}\n`,
			"utf-8",
		);
		writeFileSync(
			registryPath,
			`${JSON.stringify(
				[
					{
						scenarioId: "public-skill-impl-smoke-scenario-regression",
						scenarioKey: "public-skill-impl-smoke-scenario-regression",
						family: "fast_regression",
					},
				],
				null,
				2,
			)}\n`,
			"utf-8",
		);
		writeFileSync(
			coveragePath,
			`${JSON.stringify(
				[
					{
						scenarioKey: "public-skill-impl-smoke-scenario-regression",
						recentResultCount: 1,
					},
				],
				null,
				2,
			)}\n`,
			"utf-8",
		);

		const normalize = spawnSync(
			"node",
			[BIN_PATH, "scenario", "normalize", "skill", "--input", skillInputPath, "--output", candidatesPath],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(normalize.status, 0, normalize.stderr);
		const candidates = JSON.parse(readFileSync(candidatesPath, "utf-8"));
		assert.equal(candidates.length, 2);
		assert.equal(candidates[0].family, "fast_regression");

		const prepare = spawnSync(
			"node",
			[
				BIN_PATH,
				"scenario",
				"prepare-input",
				"--candidates",
				candidatesPath,
				"--registry",
				registryPath,
				"--coverage",
				coveragePath,
				"--family",
				"fast_regression",
				"--window-days",
				"14",
				"--now",
				"2026-04-11T00:00:00.000Z",
				"--output",
				proposalInputPath,
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(prepare.status, 0, prepare.stderr);

		const propose = spawnSync("node", [BIN_PATH, "scenario", "propose", "--input", proposalInputPath, "--output", proposalOutputPath], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(propose.status, 0, propose.stderr);
		const proposals = JSON.parse(readFileSync(proposalOutputPath, "utf-8"));
		assert.equal(proposals.proposals.length, 2);
		assert.equal(proposals.proposals[0].family, "fast_regression");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("cautilus scenario normalize cli produces proposal candidates that chain into prepare-input and propose", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bin-cli-normalize-"));
	try {
		const cliInputPath = join(root, "cli-input.json");
		const candidatesPath = join(root, "cli-candidates.json");
		const proposalInputPath = join(root, "scenario-proposal-input.json");
		const proposalOutputPath = join(root, "scenario-proposals.json");
		const registryPath = join(root, "registry.json");
		const coveragePath = join(root, "coverage.json");

		writeFileSync(
			cliInputPath,
			`${JSON.stringify(
				{
					schemaVersion: "cautilus.cli_normalization_inputs.v1",
					cliRuns: [
						{
							surfaceId: "doctor_missing_adapter",
							commandId: "doctor-no-adapter",
							displayName: "cautilus doctor",
							startedAt: "2026-04-11T00:00:00.000Z",
							status: "failed",
							intent: "Explain how to add the official adapter when none is present.",
							summary: "The command no longer mentioned adapter init or the official adapter path.",
							failureKinds: ["stdout_missing_expected_guidance", "ambiguous_next_step"],
						},
						{
							surfaceId: "adapter_init_scaffold",
							commandId: "adapter-init-default",
							displayName: "cautilus adapter init",
							startedAt: "2026-04-11T01:00:00.000Z",
							status: "failed",
							intent: "Scaffold the official adapter in the default .agents location.",
							summary: "The command exited 0 but did not create .agents/cautilus-adapter.yaml.",
							failureKinds: ["missing_side_effect"],
						},
					],
				},
				null,
				2,
			)}\n`,
			"utf-8",
		);
		writeFileSync(
			registryPath,
			`${JSON.stringify(
				[
					{
						scenarioId: "cli-doctor-missing-adapter-doctor-no-adapter-operator-guidance",
						scenarioKey: "cli-doctor-missing-adapter-doctor-no-adapter-operator-guidance",
						family: "fast_regression",
					},
				],
				null,
				2,
			)}\n`,
			"utf-8",
		);
		writeFileSync(
			coveragePath,
			`${JSON.stringify(
				[
					{
						scenarioKey: "cli-doctor-missing-adapter-doctor-no-adapter-operator-guidance",
						recentResultCount: 1,
					},
				],
				null,
				2,
			)}\n`,
			"utf-8",
		);

		const normalize = spawnSync(
			"node",
			[BIN_PATH, "scenario", "normalize", "cli", "--input", cliInputPath, "--output", candidatesPath],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(normalize.status, 0, normalize.stderr);
		const candidates = JSON.parse(readFileSync(candidatesPath, "utf-8"));
		assert.equal(candidates.length, 2);
		assert.equal(candidates[0].family, "fast_regression");

		const prepare = spawnSync(
			"node",
			[
				BIN_PATH,
				"scenario",
				"prepare-input",
				"--candidates",
				candidatesPath,
				"--registry",
				registryPath,
				"--coverage",
				coveragePath,
				"--family",
				"fast_regression",
				"--window-days",
				"14",
				"--now",
				"2026-04-11T00:00:00.000Z",
				"--output",
				proposalInputPath,
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(prepare.status, 0, prepare.stderr);

		const propose = spawnSync("node", [BIN_PATH, "scenario", "propose", "--input", proposalInputPath, "--output", proposalOutputPath], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(propose.status, 0, propose.stderr);
		const proposals = JSON.parse(readFileSync(proposalOutputPath, "utf-8"));
		assert.equal(proposals.proposals.length, 2);
		assert.equal(proposals.proposals[0].family, "fast_regression");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
