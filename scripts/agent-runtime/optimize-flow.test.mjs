import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { ACTIVE_RUN_ENV_VAR } from "./active-run.mjs";
import { BEHAVIOR_DIMENSIONS } from "./behavior-intent.mjs";
import { buildOptimizeInput } from "./build-optimize-input.mjs";
import { buildRevisionArtifact } from "./build-revision-artifact.mjs";
import { generateOptimizeProposal } from "./generate-optimize-proposal.mjs";

const BUILD_OPTIMIZE_INPUT = join(process.cwd(), "scripts", "agent-runtime", "build-optimize-input.mjs");
const GENERATE_OPTIMIZE_PROPOSAL = join(
	process.cwd(),
	"scripts",
	"agent-runtime",
	"generate-optimize-proposal.mjs",
);
const BUILD_REVISION_ARTIFACT = join(
	process.cwd(),
	"scripts",
	"agent-runtime",
	"build-revision-artifact.mjs",
);

function writeJson(path, value) {
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function createOptimizeFixtureRoot() {
	const root = mkdtempSync(join(tmpdir(), "cautilus-optimize-flow-"));
	const reportFile = join(root, "report.json");
	const reviewSummaryFile = join(root, "review-summary.json");
	const historyFile = join(root, "scenario-history.snapshot.json");
	const targetFile = join(root, "prompt.md");
	writeJson(reportFile, {
		schemaVersion: "cautilus.report_packet.v2",
		generatedAt: "2026-04-11T00:02:00.000Z",
		candidate: "feature/cli",
		baseline: "origin/main",
		intent: "CLI guidance should stay legible under recovery pressure.",
		intentProfile: {
			schemaVersion: "cautilus.behavior_intent.v1",
			intentId: "intent-cli-recovery-guidance",
			summary: "CLI guidance should stay legible under recovery pressure.",
			behaviorSurface: "operator_cli",
			successDimensions: [
				{
					id: BEHAVIOR_DIMENSIONS.RECOVERY_NEXT_STEP,
					summary: "Make the next safe recovery step explicit without operator guesswork.",
				},
			],
			guardrailDimensions: [],
		},
		commands: [],
		commandObservations: [],
		modesRun: ["held_out", "comparison"],
		modeSummaries: [
			{
				mode: "comparison",
				status: "failed",
				summary: "comparison found a regression in recovery messaging.",
				compareArtifact: {
					schemaVersion: "cautilus.compare_artifact.v1",
					verdict: "regressed",
					summary: "Recovery guidance regressed.",
					regressed: ["operator-recovery"],
				},
			},
		],
		telemetry: { modeCount: 2 },
		improved: [],
		regressed: ["operator-recovery"],
		unchanged: [],
		noisy: ["workflow-retry-budget"],
		humanReviewFindings: [],
		recommendation: "defer",
	});
	writeJson(reviewSummaryFile, {
		variants: [
			{
				id: "codex-review",
				status: "failed",
				output: {
					findings: [
						{
							severity: "blocker",
							message: "The operator still cannot tell whether retry is safe.",
							path: "variant/codex-review",
						},
					],
				},
			},
		],
	});
	writeJson(historyFile, {
		schemaVersion: "cautilus.scenario_history.v1",
		profileId: "default-train",
		trainRunCount: 3,
		scenarioStats: {
			"operator-recovery": {
				lastTrainRunIndex: 3,
				graduationInterval: 1,
				recentTrainResults: [
					{
						runIndex: 3,
						timestamp: "2026-04-10T23:58:00.000Z",
						overallScore: 80,
						passRate: 0,
						status: "failed",
						fullCheck: false,
					},
				],
			},
		},
		recentRuns: [],
	});
	writeFileSync(targetFile, "Keep instructions explicit.\n", "utf-8");
	return { root, reportFile, reviewSummaryFile, historyFile, targetFile };
}

test("buildOptimizeInput assembles a bounded optimization packet from explicit evidence", () => {
	const { root, reportFile, reviewSummaryFile, historyFile, targetFile } = createOptimizeFixtureRoot();
	try {
		const packet = buildOptimizeInput(
			[
				"--repo-root",
				root,
				"--report-file",
				reportFile,
				"--review-summary",
				reviewSummaryFile,
				"--history-file",
				historyFile,
				"--target",
				"prompt",
				"--target-file",
				targetFile,
				"--optimizer",
				"reflection",
				"--budget",
				"heavy",
			],
			{ now: new Date("2026-04-11T00:05:00.000Z") },
		);
		assert.equal(packet.schemaVersion, "cautilus.optimize_inputs.v1");
		assert.equal(packet.optimizationTarget, "prompt");
		assert.equal(packet.intentProfile.intentId, "intent-cli-recovery-guidance");
		assert.equal(packet.intentProfile.guardrailDimensions.length, 4);
		assert.equal(packet.optimizer.kind, "reflection");
		assert.equal(packet.optimizer.budget, "heavy");
		assert.equal(packet.optimizer.plan.evidenceLimit, 8);
		assert.equal(packet.targetFile.exists, true);
		assert.equal(packet.report.regressed[0], "operator-recovery");
		assert.equal(packet.reviewSummary.variants[0].id, "codex-review");
		assert.equal(packet.scenarioHistory.scenarioStats["operator-recovery"].recentTrainResults[0].status, "failed");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("generateOptimizeProposal turns explicit evidence into one bounded revision plan", () => {
	const { root, reportFile, reviewSummaryFile, historyFile, targetFile } = createOptimizeFixtureRoot();
	try {
		const input = buildOptimizeInput(
			[
				"--repo-root",
				root,
				"--report-file",
				reportFile,
				"--review-summary",
				reviewSummaryFile,
				"--history-file",
				historyFile,
				"--target",
				"prompt",
				"--target-file",
				targetFile,
				"--optimizer",
				"reflection",
				"--budget",
				"light",
			],
			{ now: new Date("2026-04-11T00:05:00.000Z") },
		);
		const proposal = generateOptimizeProposal(input, {
			now: new Date("2026-04-11T00:06:00.000Z"),
			inputFile: join(root, "optimize-input.json"),
		});
		assert.equal(proposal.schemaVersion, "cautilus.optimize_proposal.v1");
		assert.equal(proposal.decision, "revise");
		assert.equal(proposal.intentProfile.intentId, "intent-cli-recovery-guidance");
		assert.equal(proposal.optimizer.kind, "reflection");
		assert.equal(proposal.optimizer.budget, "light");
		assert.equal(proposal.trialTelemetry.plan.evidenceLimit, 3);
		assert.equal(proposal.prioritizedEvidence.length, 3);
		assert.equal(proposal.prioritizedEvidence[0].source, "review.finding");
		assert.equal(proposal.suggestedChanges[0].changeKind, "prompt_revision");
		assert.match(proposal.revisionBrief, /CLI guidance should stay legible under recovery pressure/);
		assert.equal(proposal.trialTelemetry.suggestedChangeCount, 2);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("buildRevisionArtifact materializes one durable revision packet from proposal and input", () => {
	const { root, reportFile, reviewSummaryFile, historyFile, targetFile } = createOptimizeFixtureRoot();
	try {
		const input = buildOptimizeInput(
			[
				"--repo-root",
				root,
				"--report-file",
				reportFile,
				"--review-summary",
				reviewSummaryFile,
				"--history-file",
				historyFile,
				"--target",
				"prompt",
				"--target-file",
				targetFile,
				"--optimizer",
				"repair",
				"--budget",
				"medium",
			],
			{ now: new Date("2026-04-11T00:05:00.000Z") },
		);
		const inputPath = join(root, "optimize-input.json");
		const proposalPath = join(root, "optimize-proposal.json");
		writeJson(inputPath, input);
		writeJson(
			proposalPath,
			generateOptimizeProposal(input, {
				now: new Date("2026-04-11T00:06:00.000Z"),
				inputFile: inputPath,
			}),
		);
		const artifact = buildRevisionArtifact(
			[
				"--proposal-file",
				proposalPath,
			],
			{ now: new Date("2026-04-11T00:07:00.000Z") },
		);
		assert.equal(artifact.schemaVersion, "cautilus.revision_artifact.v1");
		assert.equal(artifact.optimizeInputFile, inputPath);
		assert.equal(artifact.repoRoot, root);
		assert.equal(artifact.intentProfile.intentId, "intent-cli-recovery-guidance");
		assert.equal(artifact.reportContext.intentProfile.intentId, "intent-cli-recovery-guidance");
		assert.equal(artifact.targetSnapshot.sha256.length, 64);
		assert.equal(artifact.sourceFiles.reportFile.exists, true);
		assert.equal(artifact.decision, "revise");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-optimize-input CLI rejects review summaries without variants", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-optimize-invalid-"));
	try {
		const reportFile = join(root, "report.json");
		const summaryFile = join(root, "review-summary.json");
		writeJson(reportFile, {
			schemaVersion: "cautilus.report_packet.v2",
			generatedAt: "2026-04-11T00:02:00.000Z",
			candidate: "feature/cli",
			baseline: "origin/main",
			intent: "CLI behavior should stay legible.",
			intentProfile: {
				schemaVersion: "cautilus.behavior_intent.v1",
				intentId: "intent-cli-behavior-legibility",
				summary: "CLI behavior should stay legible.",
				behaviorSurface: "operator_cli",
				successDimensions: [
					{
						id: BEHAVIOR_DIMENSIONS.OPERATOR_GUIDANCE_CLARITY,
						summary: "Keep the operator-facing guidance explicit and easy to follow.",
					},
				],
				guardrailDimensions: [],
			},
			commands: [],
			modesRun: [],
			modeSummaries: [],
			telemetry: {},
			improved: [],
			regressed: [],
			unchanged: [],
			noisy: [],
			humanReviewFindings: [],
			recommendation: "accept-now",
		});
		writeJson(summaryFile, { status: "failed" });
		const result = spawnSync(
			"node",
			[
				BUILD_OPTIMIZE_INPUT,
				"--report-file",
				reportFile,
				"--review-summary",
				summaryFile,
			],
			{
				cwd: process.cwd(),
				encoding: "utf-8",
			},
		);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /variants array/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-optimize-input CLI rejects legacy report packet schema versions at the boundary", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-optimize-legacy-report-"));
	try {
		const reportFile = join(root, "report.json");
		writeJson(reportFile, {
			schemaVersion: "cautilus.report_packet.v1",
		});
		const result = spawnSync("node", [BUILD_OPTIMIZE_INPUT, "--report-file", reportFile], {
			cwd: process.cwd(),
			encoding: "utf-8",
		});
		assert.equal(result.status, 1);
		assert.match(result.stderr, /legacy schemaVersion cautilus\.report_packet\.v1/);
		assert.match(result.stderr, /cautilus report build/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-optimize-input defaults report.json and optimize-input.json inside the active run", () => {
	const { root, reportFile, reviewSummaryFile, historyFile } = createOptimizeFixtureRoot();
	try {
		const runDir = join(root, "active-run");
		mkdirSync(runDir, { recursive: true });
		writeJson(join(runDir, "report.json"), JSON.parse(readFileSync(reportFile, "utf-8")));
		writeJson(join(runDir, "review-summary.json"), JSON.parse(readFileSync(reviewSummaryFile, "utf-8")));
		writeJson(join(runDir, "scenario-history.snapshot.json"), JSON.parse(readFileSync(historyFile, "utf-8")));
		const result = spawnSync("node", [BUILD_OPTIMIZE_INPUT], {
			cwd: root,
			encoding: "utf-8",
			env: { ...process.env, [ACTIVE_RUN_ENV_VAR]: runDir },
		});
		assert.equal(result.status, 0, result.stderr);
		const inputPath = join(runDir, "optimize-input.json");
		assert.equal(existsSync(inputPath), true);
		const packet = JSON.parse(readFileSync(inputPath, "utf-8"));
		assert.equal(packet.reportFile, join(runDir, "report.json"));
		assert.equal(packet.reviewSummaryFile, join(runDir, "review-summary.json"));
		assert.equal(packet.scenarioHistoryFile, join(runDir, "scenario-history.snapshot.json"));
		assert.equal(packet.schemaVersion, "cautilus.optimize_inputs.v1");
		assert.equal(result.stdout, "");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("generate-optimize-proposal defaults optimize-input.json and optimize-proposal.json inside the active run", () => {
	const { root, reportFile } = createOptimizeFixtureRoot();
	try {
		const runDir = join(root, "active-run");
		mkdirSync(runDir, { recursive: true });
		writeJson(
			join(runDir, "optimize-input.json"),
			buildOptimizeInput(
				[
					"--repo-root",
					root,
					"--report-file",
					reportFile,
				],
				{ now: new Date("2026-04-11T00:05:00.000Z") },
			),
		);
		const result = spawnSync("node", [GENERATE_OPTIMIZE_PROPOSAL], {
			cwd: root,
			encoding: "utf-8",
			env: { ...process.env, [ACTIVE_RUN_ENV_VAR]: runDir },
		});
		assert.equal(result.status, 0, result.stderr);
		const proposalPath = join(runDir, "optimize-proposal.json");
		assert.equal(existsSync(proposalPath), true);
		const proposal = JSON.parse(readFileSync(proposalPath, "utf-8"));
		assert.equal(proposal.inputFile, join(runDir, "optimize-input.json"));
		assert.equal(proposal.schemaVersion, "cautilus.optimize_proposal.v1");
		assert.equal(result.stdout, "");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("build-revision-artifact defaults optimize-proposal.json and revision-artifact.json inside the active run", () => {
	const { root, reportFile } = createOptimizeFixtureRoot();
	try {
		const runDir = join(root, "active-run");
		mkdirSync(runDir, { recursive: true });
		const inputPath = join(runDir, "optimize-input.json");
		const proposalPath = join(runDir, "optimize-proposal.json");
		const input = buildOptimizeInput(
			[
				"--repo-root",
				root,
				"--report-file",
				reportFile,
			],
			{ now: new Date("2026-04-11T00:05:00.000Z") },
		);
		writeJson(inputPath, input);
		writeJson(
			proposalPath,
			generateOptimizeProposal(input, {
				now: new Date("2026-04-11T00:06:00.000Z"),
				inputFile: inputPath,
			}),
		);
		const result = spawnSync("node", [BUILD_REVISION_ARTIFACT], {
			cwd: root,
			encoding: "utf-8",
			env: { ...process.env, [ACTIVE_RUN_ENV_VAR]: runDir },
		});
		assert.equal(result.status, 0, result.stderr);
		const artifactPath = join(runDir, "revision-artifact.json");
		assert.equal(existsSync(artifactPath), true);
		const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));
		assert.equal(artifact.proposalFile, proposalPath);
		assert.equal(artifact.optimizeInputFile, inputPath);
		assert.equal(artifact.schemaVersion, "cautilus.revision_artifact.v1");
		assert.equal(result.stdout, "");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
