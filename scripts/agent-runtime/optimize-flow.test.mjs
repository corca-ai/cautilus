import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { BEHAVIOR_DIMENSIONS } from "./behavior-intent.mjs";
import { buildOptimizeInput } from "./build-optimize-input.mjs";
import { buildRevisionArtifact } from "./build-revision-artifact.mjs";
import { generateOptimizeProposal } from "./generate-optimize-proposal.mjs";

function writeJson(path, value) {
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function createOptimizeFixtureRoot() {
	const root = mkdtempSync(join(tmpdir(), "cautilus-optimize-flow-"));
	const reportFile = join(root, "report.json");
	const reviewSummaryFile = join(root, "summary.json");
	const historyFile = join(root, "history.json");
	const targetFile = join(root, "prompt.md");
	writeJson(reportFile, {
		schemaVersion: "cautilus.report_packet.v1",
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
		const summaryFile = join(root, "summary.json");
		writeJson(reportFile, {
			schemaVersion: "cautilus.report_packet.v1",
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
						id: "legibility",
						summary: "Operators can understand the next step.",
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
				join(process.cwd(), "scripts", "agent-runtime", "build-optimize-input.mjs"),
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
