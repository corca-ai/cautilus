import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { run } from "./render-claim-evidence-state.mjs";

function tempDir() {
	return fs.mkdtempSync(path.join(os.tmpdir(), "cautilus-claim-evidence-state-"));
}

function writeJSON(filePath, value) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function fixturePackets(root) {
	const claims = path.join(root, "claims.json");
	const status = path.join(root, "status.json");
	const outputJson = path.join(root, "evidence-state.json");
	const outputMd = path.join(root, "evidence-state.md");
	writeJSON(claims, {
		schemaVersion: "cautilus.claim_candidates.v1",
		candidateCount: 4,
		sourceCount: 3,
		claimSummary: {
			byEvidenceStatus: { satisfied: 1, unknown: 3 },
			byRecommendedProof: { "cautilus-eval": 3, deterministic: 1 },
			byVerificationReadiness: { "ready-to-verify": 2, "needs-scenario": 1, satisfied: 1 },
			byReviewStatus: { accepted: 1, unreviewed: 3 },
		},
		claimCandidates: [
			{
				claimId: "claim.ready.repo",
				recommendedProof: "cautilus-eval",
				evidenceStatus: "unknown",
				verificationReadiness: "ready-to-verify",
				recommendedEvalSurface: "dev/repo",
				reviewStatus: "unreviewed",
				summary: "Repo behavior needs eval proof.",
				sourceRefs: [{ path: "docs/example.md", line: 12 }],
			},
			{
				claimId: "claim.ready.skill",
				recommendedProof: "cautilus-eval",
				evidenceStatus: "unknown",
				verificationReadiness: "ready-to-verify",
				recommendedEvalSurface: "dev/skill",
				reviewStatus: "unreviewed",
				summary: "Skill behavior needs eval proof.",
				sourceRefs: [{ path: "skills/example/SKILL.md", line: 3 }],
			},
			{
				claimId: "claim.scenario",
				recommendedProof: "cautilus-eval",
				evidenceStatus: "unknown",
				verificationReadiness: "needs-scenario",
				recommendedEvalSurface: "app/prompt",
				reviewStatus: "unreviewed",
				summary: "Prompt behavior needs a scenario first.",
				sourceRefs: [{ path: "docs/prompt.md", line: 8 }],
			},
			{
				claimId: "claim.done",
				recommendedProof: "deterministic",
				evidenceStatus: "satisfied",
				verificationReadiness: "satisfied",
				reviewStatus: "accepted",
				summary: "Already proven.",
				sourceRefs: [{ path: "scripts/example.mjs", line: 1 }],
			},
		],
	});
	writeJSON(status, {
		schemaVersion: "cautilus.claim_status_summary.v1",
		candidateCount: 4,
		sourceCount: 3,
		gitStateSnapshotNotice: "fixture status snapshot",
		gitState: {
			comparisonStatus: "packet-current",
			isStale: false,
			currentGitCommit: "abc123",
			packetGitCommit: "abc123",
			changedSourceCount: 0,
		},
		claimSummary: {
			byEvidenceStatus: { satisfied: 1, unknown: 3 },
			byRecommendedProof: { "cautilus-eval": 3, deterministic: 1 },
			byVerificationReadiness: { "ready-to-verify": 2, "needs-scenario": 1, satisfied: 1 },
			byReviewStatus: { accepted: 1, unreviewed: 3 },
		},
		actionSummary: {
			primaryBuckets: [
				{
					id: "agent-plan-cautilus-eval",
					count: 2,
					recommendedActor: "agent",
					byEvidenceStatus: { unknown: 2 },
					byReviewStatus: { unreviewed: 2 },
					summary: "Ready eval work.",
				},
			],
			crossCuttingSignals: [
				{
					id: "heuristic-review-needed",
					count: 2,
					recommendedActor: "human",
					summary: "Review heuristic labels before proof.",
					sampleClaimIds: ["claim.ready.repo", "claim.ready.skill"],
				},
			],
		},
	});
	return { claims, status, outputJson, outputMd };
}

function writeFixtureCautilus(root, statusPacket) {
	const bin = path.join(root, "cautilus-fixture.mjs");
	fs.writeFileSync(
		bin,
		[
			"#!/usr/bin/env node",
			`process.stdout.write(${JSON.stringify(`${JSON.stringify(statusPacket, null, 2)}\n`)});`,
		].join("\n"),
	);
	fs.chmodSync(bin, 0o755);
	return bin;
}

test("render claim evidence state from claim packet and status snapshot", () => {
	const root = tempDir();
	const paths = fixturePackets(root);
	const result = run({ ...paths, check: false, refreshStatus: false, cautilusBin: "./bin/cautilus" });
	const projection = JSON.parse(fs.readFileSync(paths.outputJson, "utf8"));
	const markdown = fs.readFileSync(paths.outputMd, "utf8");

	assert.equal(result.checked, false);
	assert.equal(projection.schemaVersion, "cautilus.claim_evidence_state.v1");
	assert.equal(projection.sourceOfTruth.sourceRoles.claimsPacket, "audit source for candidates, labels, evidence status, and count totals");
	assert.equal(projection.openCautilusEval.total, 3);
	assert.equal(projection.openCautilusEval.readyToVerify, 2);
	assert.equal(projection.openCautilusEval.needsScenario, 1);
	assert.deepEqual(projection.openCautilusEval.bySurface, {
		"app/prompt": 1,
		"dev/repo": 1,
		"dev/skill": 1,
	});
	assert.match(markdown, /Do not edit it by hand\./);
	assert.match(markdown, /open Cautilus eval claims/);
	assert.match(markdown, /claim\.ready\.repo/);
});

test("render fails when status summary diverges from claim packet summary", () => {
	const root = tempDir();
	const paths = fixturePackets(root);
	const status = JSON.parse(fs.readFileSync(paths.status, "utf8"));
	status.claimSummary.byEvidenceStatus.unknown = 999;
	writeJSON(paths.status, status);

	assert.throws(
		() => run({ ...paths, check: false, refreshStatus: false, cautilusBin: "./bin/cautilus" }),
		/status summary does not match the claim packet summary/,
	);
});

test("check mode detects stale generated evidence state", () => {
	const root = tempDir();
	const paths = fixturePackets(root);

	assert.throws(
		() => run({ ...paths, check: true, refreshStatus: false, cautilusBin: "./bin/cautilus" }),
		/evidence-state\.json is missing; run npm run claims:evidence-state/,
	);

	run({ ...paths, check: false, refreshStatus: false, cautilusBin: "./bin/cautilus" });
	assert.equal(run({ ...paths, check: true, refreshStatus: false, cautilusBin: "./bin/cautilus" }).checked, true);

	fs.appendFileSync(paths.outputMd, "\nmanual drift\n");
	assert.throws(
		() => run({ ...paths, check: true, refreshStatus: false, cautilusBin: "./bin/cautilus" }),
		/evidence-state\.md is stale; run npm run claims:evidence-state/,
	);
});

test("refresh check mode detects stale checked-in status snapshot", () => {
	const root = tempDir();
	const paths = fixturePackets(root);
	run({ ...paths, check: false, refreshStatus: false, cautilusBin: "./bin/cautilus" });

	const refreshedStatus = JSON.parse(fs.readFileSync(paths.status, "utf8"));
	refreshedStatus.gitState = {
		comparisonStatus: "stale",
		isStale: true,
		currentGitCommit: "def456",
		packetGitCommit: "abc123",
		changedSourceCount: 1,
	};
	const fixtureBin = writeFixtureCautilus(root, refreshedStatus);

	assert.throws(
		() => run({ ...paths, check: true, refreshStatus: true, cautilusBin: fixtureBin }),
		/status\.json is stale; run npm run claims:evidence-state/,
	);
});
