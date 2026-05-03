import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("render-claim-discovery-review creates a Markdown projection over claim packets", () => {
	const dir = mkdtempSync(join(tmpdir(), "cautilus-discovery-review-"));
	const claimsPath = join(dir, "claims.json");
	const statusPath = join(dir, "status.json");
	const outputPath = join(dir, "discovery-review.md");
	writeFileSync(
		claimsPath,
		JSON.stringify({
			schemaVersion: "cautilus.claim_proof_plan.v1",
			gitCommit: "abc123",
			sourceCount: 1,
			effectiveScanScope: {
				semanticGroups: [{ label: "Claim discovery and review" }],
			},
			claimCandidates: [
				{
					claimId: "claim-docs-example-md-1",
					summary: "Cautilus writes claim packets before readable worksheets.",
					claimAudience: "user",
					claimSemanticGroup: "Claim discovery and review",
					recommendedProof: "deterministic",
					verificationReadiness: "ready-to-verify",
					evidenceStatus: "unknown",
					nextAction: "Attach deterministic proof.",
					sourceRefs: [{ path: "README.md", line: 12, excerpt: "Cautilus writes claim packets before readable worksheets." }],
				},
			],
		}),
		"utf8",
	);
	writeFileSync(statusPath, JSON.stringify({ schemaVersion: "cautilus.claim_status_summary.v1" }), "utf8");

	execFileSync("node", [
		"scripts/agent-runtime/render-claim-discovery-review.mjs",
		"--claims",
		claimsPath,
		"--status",
		statusPath,
		"--output",
		outputPath,
	]);

	const markdown = readFileSync(outputPath, "utf8");
	assert.match(markdown, /# Claim Discovery Review Worksheet/);
	assert.match(markdown, /The JSON packet is the audit source/);
	assert.match(markdown, new RegExp(escapeRegExp(`- Claims packet: ${claimsPath}`)));
	assert.match(markdown, /- Candidate count: 1/);
	assert.match(markdown, /##### claim-docs-example-md-1/);
	assert.match(markdown, /- Human claim quality: \[ \] keep/);
});

function escapeRegExp(value) {
	return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
