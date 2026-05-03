import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { auditClaimEvidenceHashes } from "./audit-claim-evidence-hashes.mjs";

function writeJson(path, value) {
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sha256Buffer(buffer) {
	return `sha256:${createHash("sha256").update(buffer).digest("hex")}`;
}

function sha256File(path) {
	return sha256Buffer(readFileSync(path));
}

function git(repoRoot, args) {
	return execFileSync("git", ["-C", repoRoot, ...args], { encoding: "utf8" }).trim();
}

function createRepoFixture() {
	const repoRoot = mkdtempSync(join(tmpdir(), "cautilus-evidence-audit-"));
	git(repoRoot, ["init"]);
	git(repoRoot, ["config", "user.email", "test@example.com"]);
	git(repoRoot, ["config", "user.name", "Test"]);
	writeFileSync(join(repoRoot, "source.txt"), "source v1\n", "utf8");
	git(repoRoot, ["add", "source.txt"]);
	git(repoRoot, ["commit", "-m", "initial"]);
	const commit = git(repoRoot, ["rev-parse", "HEAD"]);
	const claimsDir = join(repoRoot, ".cautilus", "claims");
	mkdirSync(claimsDir, { recursive: true });
	return { repoRoot, claimsDir, commit };
}

test("auditClaimEvidenceHashes accepts current bundle refs and commit-relative checked-in evidence", () => {
	const { repoRoot, claimsDir, commit } = createRepoFixture();
	try {
		const evidencePath = join(claimsDir, "evidence-good.json");
		writeJson(evidencePath, {
			schemaVersion: "cautilus.claim_evidence_bundle.v1",
			repoCommit: commit,
			createdForClaimIds: ["claim-good"],
			checkedInEvidence: [
				{
					path: "source.txt",
					kind: "source",
					contentHash: sha256Buffer(Buffer.from("source v1\n")),
				},
			],
		});
		writeJson(join(claimsDir, "review-result-good.json"), {
			clusterResults: [
				{
					claimUpdates: [
						{
							claimId: "claim-good",
							evidenceRefs: [
								{
									path: ".cautilus/claims/evidence-good.json",
									contentHash: sha256File(evidencePath),
									supportsClaimIds: ["claim-good"],
								},
							],
						},
					],
				},
			],
		});
		const result = auditClaimEvidenceHashes({ repoRoot });
		assert.equal(result.status, "ok");
		assert.equal(result.issueCount, 0);
		assert.equal(result.evidenceBundleCount, 1);
	} finally {
		rmSync(repoRoot, { recursive: true, force: true });
	}
});

test("auditClaimEvidenceHashes reports stale refs and warns on checked-in evidence drift by default", () => {
	const { repoRoot, claimsDir, commit } = createRepoFixture();
	try {
		const evidencePath = join(claimsDir, "evidence-bad.json");
		writeJson(evidencePath, {
			schemaVersion: "cautilus.claim_evidence_bundle.v1",
			repoCommit: commit,
			createdForClaimIds: ["claim-bad"],
			checkedInEvidence: [
				{
					path: "source.txt",
					kind: "source",
					contentHash: "sha256:not-the-source-hash",
				},
			],
		});
		writeJson(join(claimsDir, "status-summary.json"), {
			evidenceSatisfaction: {
				satisfiedClaims: [
					{
						claimId: "claim-bad",
						evidenceRefs: [
							{
								path: ".cautilus/claims/evidence-bad.json",
								contentHash: "sha256:not-the-bundle-hash",
								supportsClaimIds: ["claim-bad"],
							},
						],
					},
				],
			},
		});
		const result = auditClaimEvidenceHashes({ repoRoot });
		assert.equal(result.status, "failed");
		assert.deepEqual(result.issues.map((issue) => issue.kind), ["evidence-ref-content-hash-mismatch"]);
		assert.deepEqual(result.warnings.map((warning) => warning.kind), ["checked-in-evidence-content-hash-mismatch"]);
		assert.equal(result.issues.find((issue) => issue.kind === "evidence-ref-content-hash-mismatch").observed, sha256File(evidencePath));
	} finally {
		rmSync(repoRoot, { recursive: true, force: true });
	}
});

test("auditClaimEvidenceHashes can fail on checked-in evidence drift in strict mode", () => {
	const { repoRoot, claimsDir, commit } = createRepoFixture();
	try {
		writeJson(join(claimsDir, "evidence-strict.json"), {
			schemaVersion: "cautilus.claim_evidence_bundle.v1",
			repoCommit: commit,
			createdForClaimIds: ["claim-strict"],
			checkedInEvidence: [
				{
					path: "source.txt",
					kind: "source",
					contentHash: "sha256:not-the-source-hash",
				},
			],
		});
		const result = auditClaimEvidenceHashes({ repoRoot, strictCheckedInEvidence: true });
		assert.equal(result.status, "failed");
		assert.equal(result.issues[0].kind, "checked-in-evidence-content-hash-mismatch");
		assert.equal(result.checkedInEvidencePolicy, "strict");
	} finally {
		rmSync(repoRoot, { recursive: true, force: true });
	}
});

test("auditClaimEvidenceHashes warns on stale evidence refs in historical review inputs", () => {
	const { repoRoot, claimsDir } = createRepoFixture();
	try {
		const evidencePath = join(claimsDir, "evidence-history.json");
		writeJson(evidencePath, {
			schemaVersion: "cautilus.claim_evidence_bundle.v1",
			createdForClaimIds: ["claim-history"],
		});
		writeJson(join(claimsDir, "review-input-history.json"), {
			clusters: [
				{
					claims: [
						{
							claimId: "claim-history",
							evidenceRefs: [
								{
									path: ".cautilus/claims/evidence-history.json",
									contentHash: "sha256:old-history-hash",
									supportsClaimIds: ["claim-history"],
								},
							],
						},
					],
				},
			],
		});
		const result = auditClaimEvidenceHashes({ repoRoot });
		assert.equal(result.status, "ok");
		assert.equal(result.issueCount, 0);
		assert.equal(result.warningCount, 1);
		assert.equal(result.warnings[0].kind, "evidence-ref-content-hash-mismatch");
		assert.equal(result.warnings[0].observed, sha256File(evidencePath));
	} finally {
		rmSync(repoRoot, { recursive: true, force: true });
	}
});
