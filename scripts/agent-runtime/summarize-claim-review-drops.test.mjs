import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	buildReviewDropSummary,
	renderReviewDropSummary,
} from "./summarize-claim-review-drops.mjs";

test("buildReviewDropSummary classifies dropped review updates into operator actions", () => {
	const summary = buildReviewDropSummary({
		claimsPacket: exampleClaimsPacket(),
		claimsPath: ".cautilus/claims/evidenced-typed-runners.json",
		sampleLimit: 2,
	});

	assert.equal(summary.schemaVersion, "cautilus.claim_review_drop_summary.v1");
	assert.deepEqual(summary.samplePolicy, {
		selection: "bounded-reason-representation",
		maxRecordedSamples: 2,
		sourceRecordedSampleCount: 3,
		selectedSampleCount: 2,
		preservesSourceSampleReasonRepresentationWhenCapAllows: true,
		proportionalSampling: false,
	});
	assert.equal(summary.replaySummary.droppedUpdateCount, 3);
	assert.deepEqual(summary.replaySummary.droppedUpdateReasonCounts, {
		"missing-fingerprint": 1,
		"missing-live-fingerprint": 2,
	});
	assert.deepEqual(
		summary.actionClasses.map((entry) => [entry.reason, entry.actionClass, entry.count]),
		[
			["missing-fingerprint", "unrecoverable", 1],
			["missing-live-fingerprint", "stale-fingerprint", 2],
		],
	);
	assert.deepEqual(summary.replaySummary.recordedSampleReasonCounts, {
		"missing-fingerprint": 1,
		"missing-live-fingerprint": 1,
	});
	assert.deepEqual(summary.sampleCoverage, [
		{
			reason: "missing-fingerprint",
			count: 1,
			recordedSampleCount: 1,
			sampleStatus: "represented",
		},
		{
			reason: "missing-live-fingerprint",
			count: 2,
			recordedSampleCount: 1,
			sampleStatus: "represented",
		},
	]);
	assert.deepEqual(summary.reviewResultBuckets, [
		{
			reviewResultPath: ".cautilus/claims/review-result-a.json",
			droppedSampleCount: 2,
			reasonCounts: {
				"missing-fingerprint": 1,
				"missing-live-fingerprint": 1,
			},
			sampleClaimIds: ["claim-docs-a-md-10", "claim-docs-b-md-12"],
		},
	]);
	assert.deepEqual(summary.droppedUpdateSamples, [
		{
			reviewResultPath: ".cautilus/claims/review-result-a.json",
			claimId: "claim-docs-a-md-10",
			claimFingerprint: "",
			reason: "missing-fingerprint",
			actionClass: "unrecoverable",
		},
		{
			reviewResultPath: ".cautilus/claims/review-result-a.json",
			claimId: "claim-docs-b-md-12",
			claimFingerprint: "sha256:stale",
			reason: "missing-live-fingerprint",
			actionClass: "stale-fingerprint",
		},
	]);
});

test("buildReviewDropSummary treats unsampled reasons as count-level debt", () => {
	const packet = exampleClaimsPacket();
	packet.reviewApplication.droppedUpdateSamples = packet.reviewApplication.droppedUpdateSamples.filter(
		(sample) => sample.reason === "missing-fingerprint",
	);

	const summary = buildReviewDropSummary({
		claimsPacket: packet,
		claimsPath: ".cautilus/claims/evidenced-typed-runners.json",
	});

	const staleAction = summary.actionClasses.find((entry) => entry.reason === "missing-live-fingerprint");
	assert.deepEqual(summary.sampleCoverage, [
		{
			reason: "missing-fingerprint",
			count: 1,
			recordedSampleCount: 1,
			sampleStatus: "represented",
		},
		{
			reason: "missing-live-fingerprint",
			count: 2,
			recordedSampleCount: 0,
			sampleStatus: "not-represented",
		},
	]);
	assert.equal(staleAction.recordedSampleCount, 0);
	assert.equal(staleAction.sampleStatus, "not-represented");
	assert.match(staleAction.recommendedAction, /count-level dropped update/);
	assert.match(staleAction.queueHint, /No bounded queue can be selected/);
	assert.match(summary.nextActions.join("\n"), /count-level review debt only/);

	const markdown = renderReviewDropSummary(summary);
	assert.match(markdown, /missing-live-fingerprint: 0\/2 recorded sample\(s\); not-represented/);
	assert.match(markdown, /No bounded queue can be selected from this packet/);
});

test("buildReviewDropSummary preserves represented reasons when sampleLimit is lower than recorded samples", () => {
	const packet = exampleClaimsPacket();
	packet.reviewApplication.droppedUpdateSamples = [
		{
			reviewResultPath: ".cautilus/claims/review-result-a.json",
			claimId: "claim-docs-a-md-10",
			claimFingerprint: "",
			reason: "missing-fingerprint",
		},
		{
			reviewResultPath: ".cautilus/claims/review-result-b.json",
			claimId: "claim-docs-b-md-11",
			claimFingerprint: "",
			reason: "missing-fingerprint",
		},
		{
			reviewResultPath: ".cautilus/claims/review-result-c.json",
			claimId: "claim-docs-c-md-12",
			claimFingerprint: "sha256:stale",
			reason: "missing-live-fingerprint",
		},
	];

	const summary = buildReviewDropSummary({
		claimsPacket: packet,
		claimsPath: ".cautilus/claims/evidenced-typed-runners.json",
		sampleLimit: 2,
	});

	assert.deepEqual(summary.replaySummary.recordedSampleReasonCounts, {
		"missing-fingerprint": 1,
		"missing-live-fingerprint": 1,
	});
	assert.deepEqual(summary.sampleCoverage, [
		{
			reason: "missing-fingerprint",
			count: 1,
			recordedSampleCount: 1,
			sampleStatus: "represented",
		},
		{
			reason: "missing-live-fingerprint",
			count: 2,
			recordedSampleCount: 1,
			sampleStatus: "represented",
		},
	]);
	assert.deepEqual(
		summary.droppedUpdateSamples.map((sample) => sample.reason),
		["missing-fingerprint", "missing-live-fingerprint"],
	);
});

test("renderReviewDropSummary explains that dropped updates are not recovered", () => {
	const summary = buildReviewDropSummary({
		claimsPacket: exampleClaimsPacket(),
		claimsPath: ".cautilus/claims/evidenced-typed-runners.json",
	});
	const markdown = renderReviewDropSummary(summary);

	assert.match(markdown, /# Claim Review Drop Summary/);
	assert.match(markdown, /does not recover stale updates or infer identity/);
	assert.match(markdown, /missing-fingerprint: 1 update\(s\)/);
	assert.match(markdown, /Class: unrecoverable/);
	assert.match(markdown, /missing-live-fingerprint: 2 update\(s\)/);
	assert.match(markdown, /Class: stale-fingerprint/);
	assert.match(markdown, /## Sample Coverage/);
	assert.match(markdown, /missing-live-fingerprint: 2\/2 recorded sample\(s\); represented/);
	assert.match(markdown, /Review result: \.cautilus\/claims\/review-result-a\.json/);
	assert.doesNotMatch(markdown, /^\|/m);
});

test("renderReviewDropSummary renders every bounded dropped update sample", () => {
	const droppedUpdateSamples = Array.from({ length: 12 }, (_, index) => ({
		reviewResultPath: ".cautilus/claims/review-result-many.json",
		claimId: `claim-many-${index}`,
		claimFingerprint: "",
		reason: "missing-fingerprint",
	}));
	const summary = buildReviewDropSummary({
		claimsPacket: {
			schemaVersion: "cautilus.claim_proof_plan.v1",
			claimCandidates: [],
			reviewApplication: {
				droppedUpdateCount: droppedUpdateSamples.length,
				droppedUpdateReasonCounts: {
					"missing-fingerprint": droppedUpdateSamples.length,
				},
				droppedUpdateSamples,
			},
		},
	});
	const markdown = renderReviewDropSummary(summary);

	assert.match(markdown, /claim-many-0/);
	assert.match(markdown, /claim-many-10/);
	assert.match(markdown, /claim-many-11/);
	assert.equal(markdown.match(/Action class: unrecoverable/g).length, 12);
});

test("summarize-claim-review-drops CLI writes JSON and Markdown outputs", () => {
	const dir = mkdtempSync(join(tmpdir(), "cautilus-review-drops-"));
	const claimsPath = join(dir, "claims.json");
	const outputPath = join(dir, "drops.json");
	const markdownPath = join(dir, "drops.md");
	writeFileSync(claimsPath, JSON.stringify(exampleClaimsPacket()), "utf8");

	execFileSync("node", [
		"scripts/agent-runtime/summarize-claim-review-drops.mjs",
		"--claims",
		claimsPath,
		"--output",
		outputPath,
		"--markdown",
		markdownPath,
	]);

	const packet = JSON.parse(readFileSync(outputPath, "utf8"));
	const markdown = readFileSync(markdownPath, "utf8");
	assert.equal(packet.schemaVersion, "cautilus.claim_review_drop_summary.v1");
	assert.equal(packet.sourceClaimPacket.path, claimsPath);
	assert.match(markdown, /Dropped updates: 3/);
	assert.match(markdown, /Sample policy: bounded-reason-representation/);
	assert.match(markdown, /Selected samples: 3/);
	assert.match(markdown, /Proportional sampling: no/);

	execFileSync("node", [
		"scripts/agent-runtime/summarize-claim-review-drops.mjs",
		"--claims",
		claimsPath,
		"--output",
		outputPath,
		"--markdown",
		markdownPath,
		"--check",
	]);

	writeFileSync(outputPath, "{}\n", "utf8");
	const staleResult = spawnSync(
		"node",
		[
			"scripts/agent-runtime/summarize-claim-review-drops.mjs",
			"--claims",
			claimsPath,
			"--output",
			outputPath,
			"--markdown",
			markdownPath,
			"--check",
		],
		{ encoding: "utf8" },
	);
	assert.notEqual(staleResult.status, 0);
	assert.match(staleResult.stderr, /stale/);
});

function exampleClaimsPacket() {
	return {
		schemaVersion: "cautilus.claim_proof_plan.v1",
		gitCommit: "abc123",
		claimCandidates: [
			{ claimId: "claim-current-a" },
			{ claimId: "claim-current-b" },
		],
		reviewApplication: {
			appliedResultCount: 4,
			skippedResultCount: 2,
			keptUpdateCount: 10,
			rewrittenUpdateCount: 5,
			droppedUpdateCount: 3,
			droppedUpdateReasonCounts: {
				"missing-fingerprint": 1,
				"missing-live-fingerprint": 2,
			},
			droppedUpdateSamples: [
				{
					reviewResultPath: ".cautilus/claims/review-result-a.json",
					claimId: "claim-docs-a-md-10",
					claimFingerprint: "",
					reason: "missing-fingerprint",
				},
				{
					reviewResultPath: ".cautilus/claims/review-result-a.json",
					claimId: "claim-docs-b-md-12",
					claimFingerprint: "sha256:stale",
					reason: "missing-live-fingerprint",
				},
				{
					reviewResultPath: ".cautilus/claims/review-result-b.json",
					claimId: "claim-docs-c-md-20",
					claimFingerprint: "sha256:older",
					reason: "missing-live-fingerprint",
				},
			],
		},
	};
}
