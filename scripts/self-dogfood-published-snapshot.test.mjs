import assert from "node:assert/strict";
import test from "node:test";

import {
	buildPublishedReviewSummary,
	buildPublishedSummary,
} from "./self-dogfood-published-snapshot.mjs";

test("published self-dogfood artifacts keep diagnostic stderr paths for failed review variants", () => {
	const repoRoot = "/repo";
	const reviewSummary = {
		repoRoot,
		workspace: repoRoot,
		adapterPath: "/repo/.agents/cautilus-adapters/self-dogfood.yaml",
		promptFile: "/repo/tmp/review.prompt.md",
		reviewPacketFile: "/repo/tmp/review-packet.json",
		reviewPromptInputFile: "/repo/tmp/review-prompt-input.json",
		schemaFile: "/repo/fixtures/review/review-verdict.schema.json",
		outputDir: "/repo/tmp/review",
		humanReviewFindings: [
			{
				severity: "pass",
				message: "published",
				path: "/repo/artifacts/self-dogfood/runs/run-1/mode/report.json",
			},
		],
		successfulVariantOutputs: [
			{
				id: "codex-review",
				outputFile: "/repo/artifacts/self-dogfood/runs/run-1/review/codex-review.json",
			},
		],
		variants: [
			{
				id: "codex-review",
				status: "failed",
				outputFile: null,
				stdoutFile: "/repo/artifacts/self-dogfood/runs/run-1/review/codex-review.json.stdout",
				stderrFile: "/repo/artifacts/self-dogfood/runs/run-1/review/codex-review.json.stderr",
				command: "codex exec ...",
				stdout: "",
				stderr: "schema rejected",
				output: {
					findings: [
						{
							severity: "blocker",
							message: "review variant command failed",
							path: "/repo/scripts/run-self-dogfood.mjs",
						},
					],
					rawOutput: {
						findings: [
							{
								severity: "blocker",
								message: "raw failure path",
								path: "/repo/artifacts/self-dogfood/runs/run-1/mode/report.json",
							},
						],
					},
				},
			},
		],
	};
	const summary = {
		repoRoot,
		workspace: repoRoot,
		artifactRoot: "/repo/artifacts/self-dogfood",
		reportPath: "/repo/artifacts/self-dogfood/latest/report.json",
		reviewSummaryPath: "/repo/artifacts/self-dogfood/latest/review-summary.json",
		reviewVariants: [
			{
				id: "codex-review",
				executionStatus: "failed",
				outputFile: null,
				stderrFile: "/repo/artifacts/self-dogfood/runs/run-1/review/codex-review.json.stderr",
			},
		],
	};

	const publishedReviewSummary = buildPublishedReviewSummary(repoRoot, reviewSummary);
	assert.equal(
		publishedReviewSummary.variants[0].stderrFile,
		"artifacts/self-dogfood/runs/run-1/review/codex-review.json.stderr",
	);
	assert.equal(
		publishedReviewSummary.variants[0].stdoutFile,
		"artifacts/self-dogfood/runs/run-1/review/codex-review.json.stdout",
	);
	assert.equal(
		publishedReviewSummary.variants[0].output.findings[0].path,
		"scripts/run-self-dogfood.mjs",
	);
	assert.equal(
		publishedReviewSummary.variants[0].output.rawOutput.findings[0].path,
		"artifacts/self-dogfood/runs/run-1/mode/report.json",
	);
	assert.equal(
		publishedReviewSummary.humanReviewFindings[0].path,
		"artifacts/self-dogfood/runs/run-1/mode/report.json",
	);
	assert.equal(
		publishedReviewSummary.successfulVariantOutputs[0].outputFile,
		"artifacts/self-dogfood/runs/run-1/review/codex-review.json",
	);

	const publishedSummary = buildPublishedSummary(repoRoot, "/repo/artifacts/self-dogfood", summary);
	assert.equal(
		publishedSummary.reviewVariants[0].stderrFile,
		"artifacts/self-dogfood/runs/run-1/review/codex-review.json.stderr",
	);
});

test("published self-dogfood paths normalize windows separators", () => {
	const published = buildPublishedReviewSummary("C:\\repo", {
		adapterPath: "C:\\repo\\.agents\\cautilus-adapters\\self-dogfood.yaml",
		schemaFile: "C:\\repo\\fixtures\\review\\review-verdict.schema.json",
		variants: [],
	});
	assert.equal(published.adapterPath, ".agents/cautilus-adapters/self-dogfood.yaml");
	assert.equal(published.schemaFile, "fixtures/review/review-verdict.schema.json");
});
