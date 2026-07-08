import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { auditClaimEvidenceHashes, parseArgs } from "./audit-claim-evidence-hashes.mjs";

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
			assert.equal(result.mode, "full");
			assert.equal(result.issueCount, 0);
			assert.equal(result.evidenceBundleCount, 1);
			assert.equal(result.checkedInEvidenceLookupCount, 1);
			assert.equal(result.checkedInEvidenceBatchCount, 1);
		} finally {
			rmSync(repoRoot, { recursive: true, force: true });
		}
	});

test("parseArgs recognizes active-only mode", () => {
	assert.equal(parseArgs(["--reference-scope", "active"]).referenceScope, "active");
	assert.equal(parseArgs(["--active-only"]).referenceScope, "active");
});

test("active-only audit scans current state refs and skips historical drift", () => {
	const { repoRoot, claimsDir, commit } = createRepoFixture();
	try {
		const currentEvidencePath = join(claimsDir, "evidence-current.json");
		writeJson(currentEvidencePath, {
			schemaVersion: "cautilus.claim_evidence_bundle.v1",
			repoCommit: commit,
			createdForClaimIds: ["claim-current"],
			checkedInEvidence: [
				{
					path: "source.txt",
					kind: "source",
					contentHash: sha256Buffer(Buffer.from("source v1\n")),
				},
			],
		});
		const historicalEvidencePath = join(claimsDir, "evidence-history.json");
		writeJson(historicalEvidencePath, {
			schemaVersion: "cautilus.claim_evidence_bundle.v1",
			repoCommit: commit,
			createdForClaimIds: ["claim-history"],
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
						claimId: "claim-current",
						evidenceRefs: [
							{
								path: ".cautilus/claims/evidence-current.json",
								contentHash: sha256File(currentEvidencePath),
								supportsClaimIds: ["claim-current"],
							},
						],
					},
				],
			},
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

		const activeOnly = auditClaimEvidenceHashes({ repoRoot, activeOnly: true });
		assert.equal(activeOnly.mode, "active-only");
		assert.equal(activeOnly.referenceScope, "active");
		assert.equal(activeOnly.status, "ok");
		assert.equal(activeOnly.issueCount, 0);
		assert.equal(activeOnly.warningCount, 0);
		assert.equal(activeOnly.evidenceBundleCount, 1);
		assert.equal(activeOnly.checkedInEvidenceBundleCount, 1);
		assert.equal(activeOnly.scannedReferenceFileCount, 1);
		assert.equal(activeOnly.skippedReferenceFileCount, 1);

		const full = auditClaimEvidenceHashes({ repoRoot });
		assert.equal(full.mode, "full");
		assert.equal(full.referenceScope, "full");
		assert.equal(full.status, "ok");
		assert.equal(full.issueCount, 0);
		assert.equal(full.warningCount, 2);
		assert.deepEqual(full.warningKindCounts, {
			"checked-in-evidence-content-hash-mismatch": 1,
			"evidence-ref-content-hash-mismatch": 1,
		});
	} finally {
		rmSync(repoRoot, { recursive: true, force: true });
	}
});

test("active-only audit fails stale refs in current state packets", () => {
	const { repoRoot, claimsDir } = createRepoFixture();
	try {
		const evidencePath = join(claimsDir, "evidence-current-stale.json");
		writeJson(evidencePath, {
			schemaVersion: "cautilus.claim_evidence_bundle.v1",
			createdForClaimIds: ["claim-current"],
		});
		writeJson(join(claimsDir, "status-summary.json"), {
			evidenceSatisfaction: {
				satisfiedClaims: [
					{
						claimId: "claim-current",
						evidenceRefs: [
							{
								path: ".cautilus/claims/evidence-current-stale.json",
								contentHash: "sha256:old-current-hash",
								supportsClaimIds: ["claim-current"],
							},
						],
					},
				],
			},
		});

		const result = auditClaimEvidenceHashes({ repoRoot, referenceScope: "active" });
		assert.equal(result.status, "failed");
		assert.equal(result.issueCount, 1);
		assert.equal(result.issues[0].kind, "evidence-ref-content-hash-mismatch");
		assert.equal(result.issues[0].observed, sha256File(evidencePath));
	} finally {
		rmSync(repoRoot, { recursive: true, force: true });
	}
});

test("active-only audit skips stale review results that full audit still checks", () => {
	const { repoRoot, claimsDir } = createRepoFixture();
	try {
		const evidencePath = join(claimsDir, "evidence-review-result.json");
		writeJson(evidencePath, {
			schemaVersion: "cautilus.claim_evidence_bundle.v1",
			createdForClaimIds: ["claim-history"],
		});
		writeJson(join(claimsDir, "status-summary.json"), {
			evidenceSatisfaction: {
				satisfiedClaims: [],
			},
		});
		writeJson(join(claimsDir, "review-result-history.json"), {
			clusterResults: [
				{
					claimUpdates: [
						{
							claimId: "claim-history",
							evidenceRefs: [
								{
									path: ".cautilus/claims/evidence-review-result.json",
									contentHash: "sha256:old-review-result-hash",
									supportsClaimIds: ["claim-history"],
								},
							],
						},
					],
				},
			],
		});

		const activeOnly = auditClaimEvidenceHashes({ repoRoot, referenceScope: "active" });
		assert.equal(activeOnly.status, "ok");
		assert.equal(activeOnly.issueCount, 0);
		assert.equal(activeOnly.warningCount, 0);
		assert.equal(activeOnly.evidenceBundleCount, 0);

		const full = auditClaimEvidenceHashes({ repoRoot });
		assert.equal(full.status, "failed");
		assert.equal(full.issueCount, 1);
		assert.equal(full.issues[0].kind, "evidence-ref-content-hash-mismatch");
		assert.equal(full.issues[0].observed, sha256File(evidencePath));
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

test("checked-in evidence lookup batching preserves duplicate unreadable findings", () => {
	const { repoRoot, claimsDir, commit } = createRepoFixture();
	try {
		const evidenceAPath = join(claimsDir, "evidence-missing-a.json");
		const evidenceBPath = join(claimsDir, "evidence-missing-b.json");
		const missingEntry = {
			path: "missing.txt",
			kind: "source",
			contentHash: "sha256:missing-source-hash",
		};
		writeJson(evidenceAPath, {
			schemaVersion: "cautilus.claim_evidence_bundle.v1",
			repoCommit: commit,
			createdForClaimIds: ["claim-a"],
			checkedInEvidence: [missingEntry],
		});
		writeJson(evidenceBPath, {
			schemaVersion: "cautilus.claim_evidence_bundle.v1",
			repoCommit: commit,
			createdForClaimIds: ["claim-b"],
			checkedInEvidence: [missingEntry],
		});
		writeJson(join(claimsDir, "status-summary.json"), {
			evidenceSatisfaction: {
				satisfiedClaims: [
					{
						claimId: "claim-a",
						evidenceRefs: [
							{
								path: ".cautilus/claims/evidence-missing-a.json",
								contentHash: sha256File(evidenceAPath),
								supportsClaimIds: ["claim-a"],
							},
						],
					},
					{
						claimId: "claim-b",
						evidenceRefs: [
							{
								path: ".cautilus/claims/evidence-missing-b.json",
								contentHash: sha256File(evidenceBPath),
								supportsClaimIds: ["claim-b"],
							},
						],
					},
				],
			},
		});

		const warnMode = auditClaimEvidenceHashes({ repoRoot, referenceScope: "active" });
		assert.equal(warnMode.status, "ok");
		assert.equal(warnMode.issueCount, 0);
		assert.equal(warnMode.warningCount, 2);
		assert.equal(warnMode.checkedInEvidenceLookupCount, 1);
		assert.equal(warnMode.checkedInEvidenceBatchCount, 1);
		assert.equal(warnMode.checkedInEvidenceFallbackLookupCount, 0);
		assert.deepEqual(warnMode.warnings.map((warning) => warning.file).sort(), [
			".cautilus/claims/evidence-missing-a.json",
			".cautilus/claims/evidence-missing-b.json",
		]);

		const strictMode = auditClaimEvidenceHashes({
			repoRoot,
			referenceScope: "active",
			strictCheckedInEvidence: true,
		});
		assert.equal(strictMode.status, "failed");
		assert.equal(strictMode.issueCount, 2);
		assert.equal(strictMode.warningCount, 0);
		assert.equal(strictMode.checkedInEvidenceLookupCount, 1);
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
