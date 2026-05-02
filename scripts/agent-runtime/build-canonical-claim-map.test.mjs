import assert from "node:assert/strict";
import test from "node:test";

import { buildCanonicalClaimMap } from "./build-canonical-claim-map.mjs";

const userCatalogMarkdown = `# User Claims

## U1. Cautilus Finds Declared Behavior Claims

**Promise.**
Cautilus helps a repo list the important behavior it already promises, then shows what still needs proof.

**Source anchors.**
README.md, docs/contracts/claim-discovery-workflow.md.

## U2. Cautilus Records Behavior Checks

**Promise.**
Cautilus records behavior checks in files that another person or agent can reopen.

**Source anchors.**
README.md, docs/specs/evaluation-surfaces.spec.md.
`;

const maintainerCatalogMarkdown = `# Maintainer Claims

## M1. Claim Discovery Is High-Recall, Not A Verdict

Aligned user claims: U1.

Proof route: deterministic.
Current evidence status: proof-planning.
Next action: keep discovery source-scope tests connected to U1.
Absorbs: raw claims about source inventory, entry-doc discovery, duplicate handling, and proof-debt visibility.

Source anchors: docs/contracts/claim-discovery-workflow.md.

## M2. Evaluation Packets Stay Reopenable

Aligned user claims: U2.

Proof route: deterministic plus eval.
Current evidence status: proof-planning.
Next action: keep packet boundary tests connected to U2.
Absorbs: raw claims about eval cases, observed behavior, summaries, and durable packets.

Source anchors: docs/specs/evaluation-surfaces.spec.md.
`;

test("buildCanonicalClaimMap maps raw user and maintainer claims to canonical catalogs", () => {
	const packet = buildCanonicalClaimMap({
		args: {
			userCatalog: "docs/claims/user-facing.md",
			maintainerCatalog: "docs/claims/maintainer-facing.md",
		},
		userCatalogMarkdown,
		maintainerCatalogMarkdown,
		claimsPacket: {
			schemaVersion: "cautilus.claim_proof_plan.v1",
			gitCommit: "abc123",
			claimCandidates: [
				{
					claimId: "claim-readme-md-1",
					claimFingerprint: "sha256:user",
					claimAudience: "user",
					summary: "Cautilus helps a repo list behavior it promises and shows proof debt.",
					sourceRefs: [{ path: "README.md", line: 1 }],
					recommendedProof: "deterministic",
					verificationReadiness: "ready-to-verify",
					evidenceStatus: "unknown",
					reviewStatus: "heuristic",
				},
				{
					claimId: "claim-contract-md-1",
					claimAudience: "developer",
					summary: "Discovery should preserve source inventory and duplicate handling.",
					sourceRefs: [{ path: "docs/contracts/claim-discovery-workflow.md", line: 10 }],
					recommendedProof: "deterministic",
					verificationReadiness: "ready-to-verify",
					evidenceStatus: "unknown",
					reviewStatus: "agent-reviewed",
				},
			],
		},
	});

	assert.equal(packet.schemaVersion, "cautilus.canonical_claim_map.v1");
	assert.equal(packet.coverageSummary.userRawClaimCount, 1);
	assert.equal(packet.coverageSummary.userMappedToCanonicalCount, 1);
	assert.equal(packet.coverageSummary.byUserCanonicalClaimId.U1, 1);
	assert.equal(packet.coverageSummary.byMaintainerCanonicalClaimId.M1, 1);
	assert.equal(packet.mappings[0].canonicalClaimId, "U1");
	assert.equal(packet.mappings[0].claimFingerprint, "sha256:user");
	assert.equal(packet.mappings[1].canonicalClaimId, "M1");
	assert.deepEqual(packet.mappings[1].alignedUserClaimIds, ["U1"]);
	assert.equal(packet.userCoverage[0].absorbedRawClaims[0].claimFingerprint, "sha256:user");
});

test("buildCanonicalClaimMap leaves low-confidence claims for review", () => {
	const packet = buildCanonicalClaimMap({
		args: {
			userCatalog: "docs/claims/user-facing.md",
			maintainerCatalog: "docs/claims/maintainer-facing.md",
		},
		userCatalogMarkdown,
		maintainerCatalogMarkdown,
		claimsPacket: {
			claimCandidates: [
				{
					claimId: "claim-unclear-md-1",
					claimAudience: "user",
					summary: "This unrelated promise has no overlapping language.",
					sourceRefs: [{ path: "docs/unknown.md", line: 1 }],
					recommendedProof: "human-auditable",
					verificationReadiness: "blocked",
					evidenceStatus: "unknown",
					reviewStatus: "heuristic",
				},
			],
		},
	});

	assert.equal(packet.coverageSummary.userMappedToCanonicalCount, 0);
	assert.equal(packet.coverageSummary.userUnmappedCount, 1);
	assert.equal(packet.mappings[0].disposition, "user-review-needed");
	assert.deepEqual(packet.coverageSummary.reviewNeededClaimIds, ["claim-unclear-md-1"]);
});
