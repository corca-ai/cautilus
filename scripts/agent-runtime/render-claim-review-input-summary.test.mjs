import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { renderReviewInputSummary } from "./render-claim-review-input-summary.mjs";

test("renderReviewInputSummary renders a readable non-table review queue", () => {
	const packet = examplePacket();

	const markdown = renderReviewInputSummary({ packet, inputPath: ".cautilus/claims/review-input-example.json" });

	assert.match(markdown, /# Claim Review Input Summary/);
	assert.match(markdown, /deterministic `cautilus.claim_review_input.v1` packet/);
	assert.match(markdown, /## Reviewer Budget Boundary/);
	assert.match(markdown, /- maximum clusters: 2/);
	assert.match(markdown, /- parallel lanes: not selected by this packet/);
	assert.match(markdown, /Recommended next launch, if approved: one reviewer lane, one cluster, no retries/);
	assert.match(markdown, /## 1\. Claim discovery and review \/ dev\/skill/);
	assert.match(markdown, /- claim-docs-example-md-10/);
	assert.match(markdown, /Reviewer decision: keep as eval claim, merge\/drop as duplicate or fragment/);
	assert.match(markdown, /## Skipped Work/);
	assert.doesNotMatch(markdown, /^\|/m);
});

test("render-claim-review-input-summary CLI writes Markdown", () => {
	const dir = mkdtempSync(join(tmpdir(), "cautilus-review-input-summary-"));
	const inputPath = join(dir, "review-input-example.json");
	const outputPath = join(dir, "review-input-example.md");
	writeFileSync(inputPath, JSON.stringify(examplePacket()), "utf8");

	execFileSync("node", [
		"scripts/agent-runtime/render-claim-review-input-summary.mjs",
		"--input",
		inputPath,
		"--output",
		outputPath,
	]);

	const markdown = readFileSync(outputPath, "utf8");
	assert.match(markdown, new RegExp(escapeRegExp(`- Input: ${inputPath}`)));
	assert.match(markdown, /- Selected claims: 1/);
});

test("render-claim-review-input-summary CLI refuses to guess an input packet", () => {
	const dir = mkdtempSync(join(tmpdir(), "cautilus-review-input-summary-"));
	const outputPath = join(dir, "review-input-example.md");

	assert.throws(
		() =>
			execFileSync("node", [
				"scripts/agent-runtime/render-claim-review-input-summary.mjs",
				"--output",
				outputPath,
			]),
		/Missing required --input <review-input\.json>/,
	);
});

function examplePacket() {
	return {
		schemaVersion: "cautilus.claim_review_input.v1",
		packetNotice: "This packet prepares deterministic claim review input.",
		inputPath: ".cautilus/claims/evidenced-typed-runners.json",
		sourceClaimPacket: {
			schemaVersion: "cautilus.claim_proof_plan.v1",
			gitCommit: "abc123",
			candidateCount: 2,
		},
		sourceRoot: ".",
		reviewBudget: {
			actionBucket: "agent-plan-cautilus-eval",
			maxClusters: 2,
			maxClaimsPerCluster: 4,
			excerptChars: 800,
		},
		evidencePreflight: {
			status: "completed",
			matchedRefCount: 3,
			scannedFileCount: 7,
		},
		clusters: [
			{
				clusterId: "cluster-claim-discovery-dev-skill",
				claimCount: 1,
				claimAudience: "developer",
				claimSemanticGroup: "Claim discovery and review",
				recommendedEvalSurface: "dev/skill",
				priority: 30,
				reason: "Evaluator-dependent claims need review before scenario drafting.",
				candidates: [
					{
						claimId: "claim-docs-example-md-10",
						summary: "The skill states the review budget before launch.",
						nextAction: "Run a bounded dev/skill eval.",
						currentLabels: {
							claimAudience: "developer",
							claimSemanticGroup: "Claim discovery and review",
							recommendedProof: "cautilus-eval",
							recommendedEvalSurface: "dev/skill",
							verificationReadiness: "ready-to-verify",
							evidenceStatus: "unknown",
						},
						sourceRefs: [
							{
								path: "docs/contracts/claim-discovery-workflow.md",
								line: 10,
								excerpt: "Before launch, the skill states the review budget.",
							},
						],
					},
				],
			},
		],
		skippedClaims: [{ claimId: "claim-readme-md-1", reason: "action-bucket-mismatch" }],
		skippedClusters: [{ clusterId: "cluster-skipped", reason: "max-clusters-exceeded", claimCount: 3 }],
	};
}

function escapeRegExp(value) {
	return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
