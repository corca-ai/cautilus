import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	claimIndexForPacket,
	claimIdsForPacket,
	compareReviewResultPaths,
	claimFingerprintIndexForPacket,
	applyCurrentReviewResults,
	filterReviewResultForCurrentClaims,
	filterReviewResultForClaimIds,
	normalizeAggregateReviewApplication,
	projectAggregateProvenance,
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

test("applyCurrentReviewResults records bounded samples across dropped reasons", () => {
	const dir = mkdtempSync(join(tmpdir(), "cautilus-balanced-drop-samples-"));
	const claims = join(dir, "latest.json");
	const reviewResult = join(dir, "review-result-balanced-2026-07-09.json");
	const output = join(dir, "evidenced.json");
	writeFileSync(
		claims,
		`${JSON.stringify({
			claimCandidates: [
				{
					claimId: "claim-live",
					claimFingerprint: "sha256:current",
				},
			],
		}, null, 2)}\n`,
	);
	writeFileSync(
		reviewResult,
		`${JSON.stringify({
			schemaVersion: "cautilus.claim_review_result.v1",
			clusterResults: [
				{
					clusterId: "many-fingerprintless",
					claimUpdates: [
						...Array.from({ length: 21 }, (_, index) => ({
							claimId: `claim-missing-${index}`,
							reviewStatus: "agent-reviewed",
						})),
						{
							claimId: "claim-live",
							claimFingerprint: "sha256:old",
							reviewStatus: "agent-reviewed",
						},
					],
				},
			],
		}, null, 2)}\n`,
	);
	const originalWarn = console.warn;
	console.warn = () => {};
	try {
		applyCurrentReviewResults({
			claims,
			output,
			reviewResults: [reviewResult],
			claimsDir: dir,
			cautilusBin: "unused",
		});
	} finally {
		console.warn = originalWarn;
	}

	const projected = JSON.parse(readFileSync(output, "utf8"));
	assert.equal(projected.reviewApplication.droppedUpdateCount, 22);
	assert.deepEqual(projected.reviewApplication.droppedUpdateReasonCounts, {
		"missing-fingerprint": 21,
		"missing-live-fingerprint": 1,
	});
	assert.equal(projected.reviewApplication.droppedUpdateSamples.length, 20);
	assert.equal(
		projected.reviewApplication.droppedUpdateSamples.filter((sample) => sample.reason === "missing-live-fingerprint").length,
		1,
	);
	assert.deepEqual(projected.reviewApplication.droppedUpdateSamplePolicy, {
		selection: "bounded-reason-representation",
		maxRecordedSamples: 20,
		sourceDroppedUpdateCount: 22,
		selectedSampleCount: 20,
		preservesDroppedReasonRepresentationWhenCapAllows: true,
		proportionalSampling: false,
	});
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
	assert.deepEqual(result.droppedUpdateReasonCounts, { "missing-live-fingerprint": 1 });
	assert.deepEqual(result.droppedUpdates, [
		{
			claimId: "claim-skills-cautilus-skill-md-68",
			claimFingerprint: "sha256:old",
			reason: "missing-live-fingerprint",
		},
	]);
	assert.deepEqual(result.reviewResult.clusterResults[0].claimUpdates, [
		{
			claimId: "claim-skills-cautilus-skill-md-68",
			claimFingerprint: "sha256:current",
			reviewStatus: "agent-reviewed",
		},
	]);
});

test("filterReviewResultForCurrentClaims drops fingerprintless updates for fingerprinted reused ids", () => {
	const claimIndex = claimIndexForPacket({
		claimCandidates: [
			{
				claimId: "claim-docs-contracts-md-42",
				claimFingerprint: "sha256:current",
			},
		],
	});
	const result = filterReviewResultForCurrentClaims(
		{
			schemaVersion: "cautilus.claim_review_result.v1",
			clusterResults: [
				{
					clusterId: "fingerprintless-reused-id",
					claimUpdates: [
						{
							claimId: "claim-docs-contracts-md-42",
							reviewStatus: "agent-reviewed",
						},
					],
				},
			],
		},
		claimIndex,
	);

	assert.equal(result.keptUpdateCount, 0);
	assert.equal(result.droppedUpdateCount, 1);
	assert.deepEqual(result.droppedUpdateReasonCounts, { "missing-fingerprint": 1 });
	assert.deepEqual(result.droppedUpdates, [
		{
			claimId: "claim-docs-contracts-md-42",
			claimFingerprint: "",
			reason: "missing-fingerprint",
		},
	]);
	assert.deepEqual(result.reviewResult.clusterResults, []);
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

test("projectAggregateProvenance records aggregate fields in one pass without duplicating helpers", () => {
	const projected = projectAggregateProvenance(
		{
			reviewApplication: {
				schemaVersion: "cautilus.claim_review_result.v1",
				appliedUpdateCount: 1,
			},
		},
		{
			claims: "/repo/.cautilus/claims/latest.json",
			output: "/repo/.cautilus/claims/evidenced.json",
			applicationLog: {
				appliedReviewResultPaths: [
					"/repo/.cautilus/claims/review-result-one.json",
					"/repo/.cautilus/claims/review-result-two.json",
				],
				skippedReviewResultPaths: ["/repo/.cautilus/claims/review-result-stale.json"],
				lastAppliedReviewResultPath: "/repo/.cautilus/claims/review-result-two.json",
				appliedResultCount: 2,
				skippedResultCount: 1,
				keptUpdateCount: 3,
				rewrittenUpdateCount: 0,
				droppedUpdateCount: 4,
				droppedUpdateReasonCounts: {
					"missing-fingerprint": 4,
				},
				droppedUpdateSamples: [
					{
						reviewResultPath: "/repo/.cautilus/claims/review-result-one.json",
						claimId: "claim-old-1",
						claimFingerprint: "",
						reason: "missing-fingerprint",
					},
					{
						reviewResultPath: "/repo/.cautilus/claims/review-result-one.json",
						claimId: "claim-old-2",
						claimFingerprint: "",
						reason: "missing-fingerprint",
					},
					{
						reviewResultPath: "/repo/.cautilus/claims/review-result-two.json",
						claimId: "claim-old-3",
						claimFingerprint: "",
						reason: "missing-fingerprint",
					},
					{
						reviewResultPath: "/repo/.cautilus/claims/review-result-two.json",
						claimId: "claim-old-4",
						claimFingerprint: "",
						reason: "missing-fingerprint",
					},
				],
			},
			cwd: "/repo",
		},
	);

	assert.deepEqual(projected.reviewApplication, {
		schemaVersion: "cautilus.claim_review_result.v1",
		appliedUpdateCount: 1,
		claimsPath: ".cautilus/claims/latest.json",
		outputPath: ".cautilus/claims/evidenced.json",
		reviewResultPath: ".cautilus/claims/review-result-two.json",
		aggregateReviewResultPaths: [
			".cautilus/claims/review-result-one.json",
			".cautilus/claims/review-result-two.json",
		],
		skippedReviewResultPaths: [".cautilus/claims/review-result-stale.json"],
		appliedResultCount: 2,
		skippedResultCount: 1,
		keptUpdateCount: 3,
		rewrittenUpdateCount: 0,
		droppedUpdateCount: 4,
		droppedUpdateReasonCounts: {
			"missing-fingerprint": 4,
		},
		droppedUpdateSamples: [
			{
				reviewResultPath: ".cautilus/claims/review-result-one.json",
				claimId: "claim-old-1",
				claimFingerprint: "",
				reason: "missing-fingerprint",
			},
			{
				reviewResultPath: ".cautilus/claims/review-result-one.json",
				claimId: "claim-old-2",
				claimFingerprint: "",
				reason: "missing-fingerprint",
			},
			{
				reviewResultPath: ".cautilus/claims/review-result-two.json",
				claimId: "claim-old-3",
				claimFingerprint: "",
				reason: "missing-fingerprint",
			},
			{
				reviewResultPath: ".cautilus/claims/review-result-two.json",
				claimId: "claim-old-4",
				claimFingerprint: "",
				reason: "missing-fingerprint",
			},
		],
		droppedUpdateSamplePolicy: {
			selection: "bounded-reason-representation",
			maxRecordedSamples: 20,
			sourceDroppedUpdateCount: 4,
			selectedSampleCount: 4,
			preservesDroppedReasonRepresentationWhenCapAllows: true,
			proportionalSampling: false,
		},
		provenanceMode: "aggregate-current-review-results",
	});
});

test("projectAggregateProvenance throws when reviewApplication still references a tmpdir prefix", () => {
	assert.throws(
		() =>
			projectAggregateProvenance(
				{
					reviewApplication: {
						schemaVersion: "cautilus.claim_review_result.v1",
						leakedSidePath: "/tmp/cautilus-review-results-abc/applied-1.json",
					},
				},
				{
					claims: "/repo/.cautilus/claims/latest.json",
					output: "/repo/.cautilus/claims/evidenced.json",
					applicationLog: {
						appliedReviewResultPaths: ["/repo/.cautilus/claims/review-result-one.json"],
						skippedReviewResultPaths: [],
						lastAppliedReviewResultPath: "/repo/.cautilus/claims/review-result-one.json",
						appliedResultCount: 1,
						skippedResultCount: 0,
						keptUpdateCount: 1,
						droppedUpdateCount: 0,
					},
					cwd: "/repo",
					tmpdirPrefix: "/tmp/cautilus-review-results-abc",
				},
			),
		/temp path leak detected/,
	);
});

test("projectAggregateProvenance throws when applicationLog count drifts from aggregate paths", () => {
	assert.throws(
		() =>
			projectAggregateProvenance(
				{ reviewApplication: { schemaVersion: "cautilus.claim_review_result.v1" } },
				{
					claims: "/repo/.cautilus/claims/latest.json",
					output: "/repo/.cautilus/claims/evidenced.json",
					applicationLog: {
						appliedReviewResultPaths: ["/repo/.cautilus/claims/review-result-one.json"],
						skippedReviewResultPaths: [],
						lastAppliedReviewResultPath: "/repo/.cautilus/claims/review-result-one.json",
						appliedResultCount: 2,
						skippedResultCount: 0,
						keptUpdateCount: 1,
						droppedUpdateCount: 0,
					},
					cwd: "/repo",
				},
			),
		/aggregateReviewResultPaths length 1 does not match appliedResultCount 2/,
	);
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
			rewrittenUpdateCount: 0,
			droppedUpdateCount: 4,
			droppedUpdateReasonCounts: {
				"missing-fingerprint": 4,
			},
			droppedUpdateSamples: [
				{
					reviewResultPath: "/repo/.cautilus/claims/review-result-one.json",
					claimId: "claim-old-1",
					claimFingerprint: "",
					reason: "missing-fingerprint",
				},
				{
					reviewResultPath: "/repo/.cautilus/claims/review-result-one.json",
					claimId: "claim-old-2",
					claimFingerprint: "",
					reason: "missing-fingerprint",
				},
				{
					reviewResultPath: "/repo/.cautilus/claims/review-result-two.json",
					claimId: "claim-old-3",
					claimFingerprint: "",
					reason: "missing-fingerprint",
				},
				{
					reviewResultPath: "/repo/.cautilus/claims/review-result-two.json",
					claimId: "claim-old-4",
					claimFingerprint: "",
					reason: "missing-fingerprint",
				},
			],
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
		rewrittenUpdateCount: 0,
		droppedUpdateCount: 4,
		droppedUpdateReasonCounts: {
			"missing-fingerprint": 4,
		},
		droppedUpdateSamples: [
			{
				reviewResultPath: ".cautilus/claims/review-result-one.json",
				claimId: "claim-old-1",
				claimFingerprint: "",
				reason: "missing-fingerprint",
			},
			{
				reviewResultPath: ".cautilus/claims/review-result-one.json",
				claimId: "claim-old-2",
				claimFingerprint: "",
				reason: "missing-fingerprint",
			},
			{
				reviewResultPath: ".cautilus/claims/review-result-two.json",
				claimId: "claim-old-3",
				claimFingerprint: "",
				reason: "missing-fingerprint",
			},
			{
				reviewResultPath: ".cautilus/claims/review-result-two.json",
				claimId: "claim-old-4",
				claimFingerprint: "",
				reason: "missing-fingerprint",
			},
		],
		droppedUpdateSamplePolicy: {
			selection: "bounded-reason-representation",
			maxRecordedSamples: 20,
			sourceDroppedUpdateCount: 4,
			selectedSampleCount: 4,
			preservesDroppedReasonRepresentationWhenCapAllows: true,
			proportionalSampling: false,
		},
		provenanceMode: "aggregate-current-review-results",
	});
});

test("filterReviewResultForCurrentClaims recovers fingerprinted updates across display-id drift", () => {
	const packet = {
		claimCandidates: [
			{
				claimId: "claim-docs-master-plan-md-91",
				claimFingerprint: "sha256:stable",
			},
		],
	};
	const result = filterReviewResultForCurrentClaims(
		{
			schemaVersion: "cautilus.claim_review_result.v1",
			clusterResults: [
				{
					clusterId: "drifted-id",
					claimUpdates: [
						{
							claimId: "claim-docs-master-plan-md-90",
							claimFingerprint: "sha256:stable",
							verificationReadiness: "blocked",
							evidenceRefs: [
								{
									refId: "evidence-1",
									supportsClaimIds: ["claim-docs-master-plan-md-90", "claim-other"],
								},
							],
						},
						{
							claimId: "claim-docs-master-plan-md-12",
							verificationReadiness: "blocked",
						},
					],
				},
			],
		},
		claimIndexForPacket(packet),
		claimFingerprintIndexForPacket(packet),
	);

	assert.equal(result.keptUpdateCount, 1);
	assert.equal(result.rewrittenUpdateCount, 1);
	assert.equal(result.droppedUpdateCount, 1);
	assert.deepEqual(result.droppedUpdateReasonCounts, { "missing-fingerprint": 1 });
	assert.deepEqual(result.droppedUpdates, [
		{ claimId: "claim-docs-master-plan-md-12", claimFingerprint: "", reason: "missing-fingerprint" },
	]);
	assert.deepEqual(result.reviewResult.clusterResults[0].claimUpdates, [
		{
			claimId: "claim-docs-master-plan-md-91",
			claimFingerprint: "sha256:stable",
			verificationReadiness: "blocked",
			evidenceRefs: [
				{
					refId: "evidence-1",
					supportsClaimIds: ["claim-docs-master-plan-md-91", "claim-other"],
				},
			],
		},
	]);
});

test("projectAggregateProvenance records structured dropped update diagnostics", () => {
	const projected = projectAggregateProvenance(
		{ reviewApplication: { schemaVersion: "cautilus.claim_review_result.v1" } },
		{
			claims: "/repo/.cautilus/claims/latest.json",
			output: "/repo/.cautilus/claims/evidenced.json",
			applicationLog: {
				appliedReviewResultPaths: ["/repo/.cautilus/claims/review-result-one.json"],
				skippedReviewResultPaths: [],
				lastAppliedReviewResultPath: "/repo/.cautilus/claims/review-result-one.json",
				appliedResultCount: 1,
				skippedResultCount: 0,
				keptUpdateCount: 1,
				rewrittenUpdateCount: 2,
				droppedUpdateCount: 3,
				droppedUpdateReasonCounts: {
					"missing-fingerprint": 1,
					"missing-live-fingerprint": 2,
				},
				droppedUpdateSamples: [
					{
						reviewResultPath: "/repo/.cautilus/claims/review-result-one.json",
						claimId: "claim-old",
						claimFingerprint: "",
						reason: "missing-fingerprint",
					},
				],
			},
			cwd: "/repo",
		},
	);

	assert.deepEqual(projected.reviewApplication.droppedUpdateReasonCounts, {
		"missing-fingerprint": 1,
		"missing-live-fingerprint": 2,
	});
	assert.deepEqual(projected.reviewApplication.droppedUpdateSamples, [
		{
			reviewResultPath: ".cautilus/claims/review-result-one.json",
			claimId: "claim-old",
			claimFingerprint: "",
			reason: "missing-fingerprint",
		},
	]);
	assert.deepEqual(projected.reviewApplication.droppedUpdateSamplePolicy, {
		selection: "bounded-reason-representation",
		maxRecordedSamples: 20,
		sourceDroppedUpdateCount: 3,
		selectedSampleCount: 1,
		preservesDroppedReasonRepresentationWhenCapAllows: true,
		proportionalSampling: false,
	});
});

test("applyCurrentReviewResults records dropped diagnostics when every result is stale", () => {
	const dir = mkdtempSync(join(tmpdir(), "cautilus-all-stale-review-"));
	const claims = join(dir, "latest.json");
	const reviewResult = join(dir, "review-result-stale-2026-07-09.json");
	const output = join(dir, "evidenced.json");
	writeFileSync(
		claims,
		`${JSON.stringify({
			claimCandidates: [
				{
					claimId: "claim-current",
					claimFingerprint: "sha256:current",
				},
			],
		}, null, 2)}\n`,
	);
	writeFileSync(
		reviewResult,
		`${JSON.stringify({
			schemaVersion: "cautilus.claim_review_result.v1",
			clusterResults: [
				{
					clusterId: "all-stale",
					claimUpdates: [
						{
							claimId: "claim-old",
							reviewStatus: "agent-reviewed",
						},
					],
				},
			],
		}, null, 2)}\n`,
	);
	const warnings = [];
	const originalWarn = console.warn;
	console.warn = (message) => warnings.push(message);
	try {
		const summary = applyCurrentReviewResults({
			claims,
			output,
			reviewResults: [reviewResult],
			claimsDir: dir,
			cautilusBin: "unused",
		});

		assert.deepEqual(
			{
				appliedResultCount: summary.appliedResultCount,
				skippedResultCount: summary.skippedResultCount,
				keptUpdateCount: summary.keptUpdateCount,
				droppedUpdateCount: summary.droppedUpdateCount,
			},
			{
				appliedResultCount: 0,
				skippedResultCount: 1,
				keptUpdateCount: 0,
				droppedUpdateCount: 1,
			},
		);
	} finally {
		console.warn = originalWarn;
	}

	assert.equal(warnings.length, 1);
	assert.match(warnings[0], /dropped 1 update\(s\)/);
	assert.match(warnings[0], /missing-fingerprint=1/);
	const projected = JSON.parse(readFileSync(output, "utf8"));
	assert.equal(projected.reviewApplication.appliedResultCount, 0);
	assert.equal(projected.reviewApplication.skippedResultCount, 1);
	assert.equal(projected.reviewApplication.droppedUpdateCount, 1);
	assert.deepEqual(projected.reviewApplication.droppedUpdateReasonCounts, { "missing-fingerprint": 1 });
	assert.deepEqual(projected.reviewApplication.droppedUpdateSamples, [
		{
			reviewResultPath: reviewResult,
			claimId: "claim-old",
			claimFingerprint: "",
			reason: "missing-fingerprint",
		},
	]);
	assert.deepEqual(projected.reviewApplication.droppedUpdateSamplePolicy, {
		selection: "bounded-reason-representation",
		maxRecordedSamples: 20,
		sourceDroppedUpdateCount: 1,
		selectedSampleCount: 1,
		preservesDroppedReasonRepresentationWhenCapAllows: true,
		proportionalSampling: false,
	});
});
