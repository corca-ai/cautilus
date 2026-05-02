import assert from "node:assert/strict";
import test from "node:test";

import {
	claimIndexForPacket,
	claimIdsForPacket,
	filterReviewResultForCurrentClaims,
	filterReviewResultForClaimIds,
	reviewResultPaths,
} from "./apply-current-review-results.mjs";

test("filterReviewResultForClaimIds drops stale updates before replay", () => {
	const claimIds = claimIdsForPacket({
		claimCandidates: [{ claimId: "claim-current-1" }, { claimId: "claim-current-2" }],
	});
	const result = filterReviewResultForClaimIds(
		{
			schemaVersion: "cautilus.claim_review_result.v1",
			clusterResults: [
				{
					clusterId: "mixed",
					claimUpdates: [
						{ claimId: "claim-current-1", reviewStatus: "agent-reviewed" },
						{ claimId: "claim-stale-1", reviewStatus: "agent-reviewed" },
					],
				},
				{
					clusterId: "stale-only",
					claimUpdates: [{ claimId: "claim-stale-2", reviewStatus: "agent-reviewed" }],
				},
			],
		},
		claimIds,
	);

	assert.equal(result.keptUpdateCount, 1);
	assert.equal(result.droppedUpdateCount, 2);
	assert.deepEqual(
		result.reviewResult.clusterResults.map((cluster) => cluster.clusterId),
		["mixed"],
	);
	assert.deepEqual(result.reviewResult.clusterResults[0].claimUpdates, [
		{ claimId: "claim-current-1", reviewStatus: "agent-reviewed" },
	]);
});

test("reviewResultPaths keeps explicit review-result order deterministic", () => {
	assert.deepEqual(
		reviewResultPaths({ reviewResults: ["z.json", "a.json"], claimsDir: "unused" }),
		["a.json", "z.json"],
	);
});

test("filterReviewResultForCurrentClaims drops reused ids with mismatched fingerprints", () => {
	const claimIndex = claimIndexForPacket({
		claimCandidates: [
			{
				claimId: "claim-skills-cautilus-skill-md-68",
				claimFingerprint: "sha256:current",
			},
		],
	});
	const result = filterReviewResultForCurrentClaims(
		{
			schemaVersion: "cautilus.claim_review_result.v1",
			clusterResults: [
				{
					clusterId: "reused-line-id",
					claimUpdates: [
						{
							claimId: "claim-skills-cautilus-skill-md-68",
							claimFingerprint: "sha256:old",
							reviewStatus: "human-reviewed",
						},
						{
							claimId: "claim-skills-cautilus-skill-md-68",
							claimFingerprint: "sha256:current",
							reviewStatus: "agent-reviewed",
						},
					],
				},
			],
		},
		claimIndex,
	);

	assert.equal(result.keptUpdateCount, 1);
	assert.equal(result.droppedUpdateCount, 1);
	assert.deepEqual(result.reviewResult.clusterResults[0].claimUpdates, [
		{
			claimId: "claim-skills-cautilus-skill-md-68",
			claimFingerprint: "sha256:current",
			reviewStatus: "agent-reviewed",
		},
	]);
});
