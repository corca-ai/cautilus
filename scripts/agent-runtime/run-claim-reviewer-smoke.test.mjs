import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const SCRIPT = new URL("./run-claim-reviewer-smoke.mjs", import.meta.url).pathname;

function tempDir() {
	return mkdtempSync(join(tmpdir(), "cautilus-reviewer-smoke-"));
}

function writeReviewInput(dir) {
	const input = {
		schemaVersion: "cautilus.claim_review_input.v1",
		sourceClaimPacket: {
			schemaVersion: "cautilus.claim_proof_plan.v1",
			gitCommit: "abc123",
			candidateCount: 1,
		},
		reviewBudget: {
			maxClusters: 1,
			maxClaimsPerCluster: 1,
			excerptChars: 400,
			budgetSource: "test",
		},
		clusters: [
			{
				clusterId: "cluster-demo",
				candidates: [
					{
						claimId: "claim-demo",
						summary: "Cautilus keeps reviewer launch bounded.",
						currentLabels: {
							reviewStatus: "heuristic",
							evidenceStatus: "unknown",
						},
					},
				],
			},
		],
	};
	const path = join(dir, "review-input.json");
	writeFileSync(path, `${JSON.stringify(input, null, 2)}\n`);
	return path;
}

test("fixture backend writes a bounded claim review result packet", () => {
	const dir = tempDir();
	const reviewInput = writeReviewInput(dir);
	const output = join(dir, "review-result.json");
	const result = spawnSync(process.execPath, [
		SCRIPT,
		"--review-input", reviewInput,
		"--output", output,
		"--backend", "fixture",
	], {
		encoding: "utf-8",
	});
	assert.equal(result.status, 0, result.stderr);
	const summary = JSON.parse(result.stdout);
	assert.equal(summary.reviewerExecuted, false);
	assert.equal(summary.backend, "fixture");
	const packet = JSON.parse(readFileSync(output, "utf-8"));
	assert.equal(packet.schemaVersion, "cautilus.claim_review_result.v1");
	assert.equal(packet.clusterResults[0].clusterId, "cluster-demo");
	assert.equal(packet.clusterResults[0].claimUpdates[0].claimId, "claim-demo");
	assert.equal(packet.clusterResults[0].claimUpdates[0].reviewStatus, "agent-reviewed");
});
