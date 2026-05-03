import assert from "node:assert/strict";
import test from "node:test";

import { renderStatusReport } from "./render-claim-status-report.mjs";

test("renderStatusReport summarizes status, review results, validation, and eval plans", () => {
	const args = {
		claims: ".cautilus/claims/evidenced-typed-runners.json",
		status: ".cautilus/claims/status-summary.json",
		samplePerBucket: 2,
		reviewSample: 2,
	};
	const claimsPacket = {
		gitCommit: "abc123",
		candidateCount: 2,
		sourceCount: 1,
		effectiveScanScope: {
			entries: ["README.md"],
			traversal: "entry-markdown-links",
			linkedMarkdownDepth: 3,
			gitignorePolicy: "respect-repo-gitignore",
			explicitSources: false,
		},
		claimCandidates: [
			{
				claimId: "claim-readme-md-1",
				summary: "Cautilus emits a readable status report.",
				recommendedProof: "deterministic",
				verificationReadiness: "ready-to-verify",
				reviewStatus: "agent-reviewed",
				evidenceStatus: "unknown",
				sourceRefs: [{ path: "README.md", line: 1 }],
			},
			{
				claimId: "claim-readme-md-2",
				summary: "Humans can inspect the remaining ambiguous claims.",
				recommendedProof: "human-auditable",
				verificationReadiness: "needs-alignment",
				reviewStatus: "heuristic",
				evidenceStatus: "unknown",
				sourceRefs: [{ path: "README.md", line: 2 }],
			},
		],
	};
	const statusPacket = {
		candidateCount: 2,
		sourceCount: 1,
		gitState: {
			comparisonStatus: "fresh",
			changedFilesBasis: {
				scope: "committed-diff-between-packet-and-current-head",
				workingTreePolicy: "excluded",
			},
			workingTreePolicy: "excluded",
			isStale: false,
		},
		actionSummary: {
			primaryBuckets: [
				{
					id: "agent-add-deterministic-proof",
					recommendedActor: "agent",
					count: 1,
					byReviewStatus: { "agent-reviewed": 1 },
					byEvidenceStatus: { unknown: 1 },
					summary: "Add deterministic proof.",
					sampleClaimIds: ["claim-readme-md-1"],
				},
				{
					id: "human-align-surfaces",
					recommendedActor: "human",
					count: 1,
					byReviewStatus: { heuristic: 1 },
					byEvidenceStatus: { unknown: 1 },
					summary: "Reconcile ownership before proof.",
					sampleClaimIds: ["claim-readme-md-2"],
				},
			],
			crossCuttingSignals: [
				{
					id: "heuristic-review-needed",
					count: 1,
					summary: "Review heuristic labels.",
				},
			],
		},
	};
	const digests = {
		reviewResults: [
			{
				path: ".cautilus/claims/review-result-human-align-action-bucket.json",
				reviewRun: { mode: "action-bucket-focused-review", reviewer: "codex-current-agent" },
				clusterCount: 1,
				updateCount: 1,
				byProof: { "human-auditable": 1 },
				byReadiness: { "needs-alignment": 1 },
				updates: [
					{
						claimId: "claim-readme-md-2",
						recommendedProof: "human-auditable",
						verificationReadiness: "needs-alignment",
						evidenceStatus: "unknown",
						nextAction: "Ask the maintainer to confirm the boundary.",
					},
					{
						claimId: "claim-docs-maintainers-stale-md-1",
						recommendedProof: "human-auditable",
						verificationReadiness: "needs-alignment",
						evidenceStatus: "unknown",
						nextAction: "This old maintainer-only claim should not appear in the current report.",
					},
				],
			},
		],
		validationReports: [{ path: ".cautilus/claims/validation-report.json", valid: true, issueCount: 0 }],
		evalPlans: [
			{
				path: ".cautilus/claims/eval-plan.json",
				evalPlanCount: 0,
				skippedClaimCount: 2,
				skippedByReason: { "not-cautilus-eval": 2 },
				zeroPlanReason: "no-eval-targets",
				zeroPlanExpectation: "Zero eval plans are expected for deterministic-only claims.",
			},
		],
		refreshPlans: [
			{
				path: ".cautilus/claims/refresh-plan-claim-status-report.json",
				status: "changes-detected",
				changedSourceCount: 1,
				changedClaimCount: 2,
				carriedForwardClaimCount: 0,
				targetCommit: "abc123",
				summary: "The saved claim map is stale.",
				changedClaimSources: [{ path: "skills/cautilus/SKILL.md", claimCount: 2 }],
				nextActions: [
					{
						id: "update_saved_claim_map",
						label: "Update the saved claim map before review or eval planning",
						detail: "Run claim discovery to write a fresh claim packet.",
					},
				],
			},
		],
		canonicalMap: {
			path: ".cautilus/claims/canonical-claim-map.json",
			coverageSummary: {
				userRawClaimCount: 2,
				userMappedToCanonicalCount: 1,
				userUnmappedCount: 1,
				userSemanticReviewRecommendedCount: 1,
				byDisposition: {
					"mapped-to-user-canonical": 1,
					"user-review-needed": 1,
				},
				byMaintainerCanonicalClaimId: {
					M1: 1,
				},
				byMappingConfidence: {
					medium: 1,
					low: 1,
				},
				reviewNeededClaimIds: ["claim-readme-md-2"],
				semanticReviewRecommendedClaimIds: ["claim-readme-md-1"],
			},
			userCoverage: [
				{
					canonicalClaimId: "U1",
					title: "Cautilus Produces Reviewable Reports",
					absorbedRawClaimCount: 1,
					byEvidenceStatus: { unknown: 1 },
					byReviewStatus: { "agent-reviewed": 1 },
				},
			],
			maintainerCoverage: [
				{
					canonicalClaimId: "M1",
					title: "Evidence State",
					absorbedRawClaimCount: 1,
					byRecommendedProof: { deterministic: 1 },
					byEvidenceStatus: { unknown: 1 },
					byReviewStatus: { heuristic: 1 },
					absorbedRawClaims: [
						{
							claimId: "claim-readme-md-1",
							mappingConfidence: "medium",
							requiresSemanticReview: true,
						},
					],
				},
			],
			catalogs: {
				maintainer: {
					claims: [{ id: "M1" }],
				},
			},
		},
	};

	const report = renderStatusReport({ claimsPacket, statusPacket, digests, args });

	assert.match(report, /# Cautilus Claim Status Report/);
	assert.match(report, /Snapshot notice: git state is a generated status snapshot/);
	assert.match(report, /Git state snapshot: fresh; stale=no/);
	assert.match(report, /Changed-file scope: committed-diff-between-packet-and-current-head; working tree=excluded/);
	assert.match(report, /## Scoreboard/);
	assert.match(report, /agent-add-deterministic-proof/);
	assert.match(report, /human-align-surfaces/);
	assert.match(report, /review-result-human-align-action-bucket\.json/);
	assert.match(report, /validation-report\.json/);
	assert.match(report, /Zero eval plans are expected/);
	assert.match(report, /refresh-plan-claim-status-report\.json/);
	assert.match(report, /## Canonical Claim Map/);
	assert.match(report, /User claims mapped to canonical user claims: 1/);
	assert.match(report, /User claims not mapped to canonical user claims: 1/);
	assert.match(report, /Maintainer claims mapped to M1-M1: M1: 1/);
	assert.match(report, /Maintainer claim/);
	assert.match(report, /Evidence State/);
	assert.match(report, /Maintainer semantic sampling queue/);
	assert.match(report, /claim-readme-md-1 \(medium\)/);
	assert.match(report, /Semantic sampling recommended for 1 raw claim/);
	assert.match(report, /claim-readme-md-2/);
	assert.match(report, /Update the saved claim map before review or eval planning/);
	assert.match(report, /Gitignore policy: respect-repo-gitignore/);
	assert.doesNotMatch(report, /claim-docs-maintainers-stale-md-1/);
	assert.doesNotMatch(report, /This old maintainer-only claim should not appear/);
});
