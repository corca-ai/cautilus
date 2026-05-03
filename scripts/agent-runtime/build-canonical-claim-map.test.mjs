import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { buildCanonicalClaimMap, parseMaintainerCatalog, parseUserCatalog } from "./build-canonical-claim-map.mjs";

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

test("parseUserCatalog reads only same-directory claim pages from spec index", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-canonical-spec-tree-"));
	try {
		const userDir = join(root, "docs", "specs", "user");
		const maintainerDir = join(root, "docs", "specs", "maintainer");
		mkdirSync(userDir, { recursive: true });
		mkdirSync(maintainerDir, { recursive: true });
		writeFileSync(join(root, "docs", "specs", "index.spec.md"), "# Root Report\n", "utf-8");
		writeFileSync(join(maintainerDir, "index.spec.md"), "# Maintainer Index\n", "utf-8");
		writeFileSync(join(userDir, "claim-discovery.spec.md"), "# Claim Discovery\n", "utf-8");
		writeFileSync(join(userDir, "evaluation.spec.md"), "# Evaluation\n", "utf-8");
		const indexPath = join(userDir, "index.spec.md");
		const indexMarkdown = [
			"# User Index",
			"",
			"- [Claim Discovery](claim-discovery.spec.md)",
			"- [Evaluation](evaluation.spec.md)",
			"- [Maintainer](../maintainer/index.spec.md)",
			"- [Root](../index.spec.md)",
			"",
		].join("\n");

		const catalog = parseUserCatalog(indexMarkdown, indexPath);

		assert.deepEqual(
			catalog.map((claim) => [claim.id, claim.title]),
			[
				["U1", "Claim Discovery"],
				["U2", "Evaluation"],
			],
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("parseMaintainerCatalog keeps bullet-index keywords scoped to each claim area", () => {
	const catalog = parseMaintainerCatalog(
		[
			"# Maintainer Index",
			"",
			"## Maintainer Claim Areas",
			"",
			"- Claim discovery workflow and raw-claim curation.",
			"- Eval surfaces, fixtures, and runner readiness.",
			"",
		].join("\n"),
		"docs/specs/maintainer/index.spec.md",
	);

	assert.equal(catalog.length, 2);
	assert.deepEqual(catalog[0].keywords, ["curation", "discovery", "raw-claim", "workflow"]);
	assert.deepEqual(catalog[1].keywords, ["eval", "fixture", "readines", "runner", "surface"]);
});

test("parseMaintainerCatalog reads same-directory maintainer spec pages", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-maintainer-spec-tree-"));
	try {
		const maintainerDir = join(root, "docs", "specs", "maintainer");
		mkdirSync(maintainerDir, { recursive: true });
		writeFileSync(
			join(maintainerDir, "claim-discovery.spec.md"),
			[
				"# Claim Discovery Workflow",
				"",
				"Aligned user claims: U1, U7.",
				"Proof route: deterministic.",
				"Current evidence status: proof-planning.",
				"Next action: connect discovery fixtures.",
				"Absorbs: source inventory, review packet, duplicate handling.",
				"",
			].join("\n"),
			"utf-8",
		);
		writeFileSync(join(maintainerDir, "index.spec.md"), "# Maintainer\n", "utf-8");

		const catalog = parseMaintainerCatalog(
			[
				"# Maintainer Index",
				"",
				"- [Claim Discovery Workflow](claim-discovery.spec.md)",
				"- [User](../user/index.spec.md)",
				"",
			].join("\n"),
			join(maintainerDir, "index.spec.md"),
		);

		assert.equal(catalog.length, 1);
		assert.equal(catalog[0].id, "M1");
		assert.equal(catalog[0].title, "Claim Discovery Workflow");
		assert.deepEqual(catalog[0].alignedUserClaimIds, ["U1", "U7"]);
		assert.equal(catalog[0].proofRoute, "deterministic.");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
