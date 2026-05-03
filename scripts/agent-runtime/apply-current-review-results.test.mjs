import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	claimIndexForPacket,
	claimIdsForPacket,
	compareReviewResultPaths,
	filterReviewResultForCurrentClaims,
	filterReviewResultForClaimIds,
	normalizeAggregateReviewApplication,
	reviewResultPaths,
	reviewResultTimestamp,
	writeAggregateReviewApplication,
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

test("reviewResultPaths replays older dated review results before newer overrides", () => {
	const dir = mkdtempSync(join(tmpdir(), "cautilus-review-result-order-"));
	const olderHitl = join(dir, "review-result-hitl-audience-2026-05-02.json");
	const sameDayHitl = join(dir, "review-result-hitl-priority-reset-2026-05-03.json");
	const newerFinal = join(dir, "review-result-final-deterministic-proof-debt-2026-05-03.json");
	writeFileSync(
		olderHitl,
		JSON.stringify({
			schemaVersion: "cautilus.claim_review_result.v1",
			reviewRun: { reviewer: "human-maintainer" },
			clusterResults: [],
		}),
	);
	writeFileSync(
		sameDayHitl,
		JSON.stringify({
			schemaVersion: "cautilus.claim_review_result.v1",
			reviewRun: { reviewer: "human-maintainer" },
			clusterResults: [],
		}),
	);
	writeFileSync(
		newerFinal,
		JSON.stringify({
			schemaVersion: "cautilus.claim_review_result.v1",
			reviewer: { id: "final-synthesis", reviewedAt: "2026-05-03T00:00:00Z" },
			clusterResults: [],
		}),
	);

	assert.deepEqual(reviewResultPaths({ reviewResults: [sameDayHitl, olderHitl, newerFinal], claimsDir: "unused" }), [
		olderHitl,
		sameDayHitl,
		newerFinal,
	]);
	assert.equal(compareReviewResultPaths(newerFinal, olderHitl) > 0, true);
	assert.equal(compareReviewResultPaths(newerFinal, sameDayHitl) > 0, true);
	assert.equal(reviewResultTimestamp(olderHitl), Date.parse("2026-05-02T00:00:00Z"));
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

test("normalizeAggregateReviewApplication replaces temporary paths with stable inputs", () => {
	const packet = normalizeAggregateReviewApplication(
		{
			reviewApplication: {
				schemaVersion: "cautilus.claim_review_result.v1",
				claimsPath: "/tmp/cautilus-review-results-abc/applied-16.json",
				reviewResultPath: "/tmp/cautilus-review-results-abc/review-result-final.json",
				appliedUpdateCount: 1,
			},
		},
		{
			claims: "/repo/.cautilus/claims/latest.json",
			reviewResultPath: "/repo/.cautilus/claims/review-result-final.json",
			cwd: "/repo",
		},
	);

	assert.deepEqual(packet.reviewApplication, {
		schemaVersion: "cautilus.claim_review_result.v1",
		claimsPath: ".cautilus/claims/latest.json",
		reviewResultPath: ".cautilus/claims/review-result-final.json",
		appliedUpdateCount: 1,
		provenanceMode: "aggregate-current-review-results",
	});
});

test("writeAggregateReviewApplication records all applied review-result paths", () => {
	const packet = writeAggregateReviewApplication(
		{
			reviewApplication: {
				schemaVersion: "cautilus.claim_review_result.v1",
				reviewResultPath: ".cautilus/claims/review-result-last.json",
				appliedUpdateCount: 1,
			},
		},
		{
			claims: "/repo/.cautilus/claims/latest.json",
			output: "/repo/.cautilus/claims/evidenced.json",
			appliedReviewResultPaths: [
				"/repo/.cautilus/claims/review-result-one.json",
				"/repo/.cautilus/claims/review-result-two.json",
			],
			skippedReviewResultPaths: [
				"/repo/.cautilus/claims/review-result-stale.json",
			],
			appliedResultCount: 2,
			skippedResultCount: 1,
			keptUpdateCount: 3,
			droppedUpdateCount: 4,
			cwd: "/repo",
		},
	);

	assert.deepEqual(packet.reviewApplication, {
		schemaVersion: "cautilus.claim_review_result.v1",
		reviewResultPath: ".cautilus/claims/review-result-last.json",
		appliedUpdateCount: 1,
		claimsPath: ".cautilus/claims/latest.json",
		outputPath: ".cautilus/claims/evidenced.json",
		aggregateReviewResultPaths: [
			".cautilus/claims/review-result-one.json",
			".cautilus/claims/review-result-two.json",
		],
		skippedReviewResultPaths: [
			".cautilus/claims/review-result-stale.json",
		],
		appliedResultCount: 2,
		skippedResultCount: 1,
		keptUpdateCount: 3,
		droppedUpdateCount: 4,
		provenanceMode: "aggregate-current-review-results",
	});
});
