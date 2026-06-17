import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	buildProposal,
	buildReport,
	entryAgentLabels,
	main,
	primarySourceRef,
	proposalEntry,
	PROPOSAL_SCHEMA,
	VERDICT_DEFINITIONS,
} from "./build-gold-set-proposal.mjs";

function captureStdout(fn) {
	const orig = process.stdout.write;
	let buf = "";
	process.stdout.write = (chunk) => {
		buf += chunk;
		return true;
	};
	try {
		fn();
	} finally {
		process.stdout.write = orig;
	}
	return buf;
}

function candidate(id, over = {}) {
	return {
		claimId: id,
		claimFingerprint: `sha256:${id}`,
		summary: `summary for ${id}`,
		recommendedProof: "human-auditable",
		verificationReadiness: "ready-for-proof",
		claimAudience: "user",
		claimSemanticGroup: "product-scope",
		primaryEpic: "APEX",
		supportingEpics: ["APEX"],
		multiEpic: false,
		whyThisLayer: "readable from source",
		unresolvedQuestions: [],
		sourceRefs: [{ excerpt: "x", line: 3, path: "README.md", primary: true }],
		...over,
	};
}

function proofPlan(candidates, over = {}) {
	return {
		schemaVersion: "cautilus.claim_proof_plan.v1",
		gitCommit: "deadbeef",
		extractionMode: "agent",
		extractionAudit: { templateVersion: "v2", templateHash: "sha256:abc" },
		claimCandidates: candidates,
		...over,
	};
}

test("primarySourceRef picks the primary excerpt, falling back to first", () => {
	assert.equal(
		primarySourceRef({
			sourceRefs: [
				{ path: "a.md", line: 1, primary: false },
				{ path: "b.md", line: 9, primary: true },
			],
		}),
		"b.md:9",
	);
	assert.equal(
		primarySourceRef({ sourceRefs: [{ path: "a.md", line: 2 }] }),
		"a.md:2",
	);
	assert.equal(primarySourceRef({ sourceRefs: [] }), null);
});

test("entryAgentLabels emits eval surface and edgeRationale only when present", () => {
	const plain = entryAgentLabels(candidate("a"));
	assert.equal("recommendedEvalSurface" in plain, false);
	assert.equal("edgeRationale" in plain, false);
	assert.equal(plain.multiEpic, false);

	const rich = entryAgentLabels(
		candidate("b", {
			recommendedProof: "cautilus-eval",
			recommendedEvalSurface: "dev/repo",
			multiEpic: true,
			supportingEpics: ["APEX", "D1-discovery"],
			edgeRationale: "supports discovery too",
		}),
	);
	assert.equal(rich.recommendedEvalSurface, "dev/repo");
	assert.equal(rich.edgeRationale, "supports discovery too");
	assert.equal(rich.multiEpic, true);
	assert.deepEqual(rich.supportingEpics, ["APEX", "D1-discovery"]);
});

test("proposalEntry shapes a v1-superset entry with pending verdict", () => {
	const e = proposalEntry(candidate("a"));
	assert.equal(e.claimId, "a");
	assert.equal(e.sourceRef, "README.md:3");
	assert.equal(e.maintainerVerdict, "pending");
	assert.equal(e.heuristicMatch, null);
	assert.equal(e.note, "");
	assert.equal(e.proofRationale, "readable from source");
	assert.equal(e.agentLabels.primaryEpic, "APEX");
});

test("buildProposal preserves candidate order and carries R1-R15", () => {
	const plan = proofPlan([candidate("a"), candidate("b"), candidate("c")]);
	const proposal = buildProposal(plan, { sourcePacket: "p.json" });
	assert.equal(proposal.schemaVersion, PROPOSAL_SCHEMA);
	assert.equal(proposal.packetGitCommit, "deadbeef");
	assert.equal(proposal.templateVersion, "v2");
	assert.equal(proposal.templateHash, "sha256:abc");
	assert.equal(proposal.sourcePacket, "p.json");
	assert.deepEqual(
		proposal.entries.map((x) => x.claimId),
		["a", "b", "c"],
	);
	assert.deepEqual(proposal.carriedForwardRules, [
		"R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8",
		"R9", "R10", "R11", "R12", "R13", "R14", "R15",
	]);
	assert.deepEqual(proposal.verdictDefinitions, VERDICT_DEFINITIONS);
});

test("buildReport passes on a clean 1:1 lossless transform", () => {
	const plan = proofPlan([candidate("a"), candidate("b")]);
	const proposal = buildProposal(plan);
	const report = buildReport(plan, proposal);
	assert.equal(report.candidateCount, 2);
	assert.equal(report.entryCount, 2);
	assert.equal(report.orderPreserved, true);
	assert.equal(report.noDuplication, true);
	assert.equal(report.allPending, true);
	assert.equal(report.pass, true);
});

test("determinism: repeated builds are byte-identical", () => {
	const plan = proofPlan([candidate("a"), candidate("b")]);
	assert.equal(
		JSON.stringify(buildProposal(plan)),
		JSON.stringify(buildProposal(plan)),
	);
});

test("main runs the CLI round-trip and writes a pending proposal", () => {
	const dir = mkdtempSync(join(tmpdir(), "gsp-main-"));
	const inputPath = join(dir, "claims-agent.json");
	const outputPath = join(dir, "gold-set-proposal.json");
	writeFileSync(
		inputPath,
		JSON.stringify(proofPlan([candidate("a"), candidate("b", { claimAudience: "developer" })])),
	);
	const origArgv = process.argv;
	process.argv = ["node", "x", "--input", inputPath, "--output", outputPath];
	let out;
	try {
		out = captureStdout(() => main());
	} finally {
		process.argv = origArgv;
	}
	assert.match(out, /Built 2 entries/);
	assert.ok(existsSync(outputPath));
	const parsed = JSON.parse(readFileSync(outputPath, "utf8"));
	assert.equal(parsed.entries.length, 2);
	assert.ok(parsed.entries.every((e) => e.maintainerVerdict === "pending"));
});

test("main rejects a non-proof-plan input", () => {
	const dir = mkdtempSync(join(tmpdir(), "gsp-bad-"));
	const inputPath = join(dir, "claims-agent.json");
	const outputPath = join(dir, "out.json");
	writeFileSync(inputPath, JSON.stringify({ schemaVersion: "wrong" }));
	const origArgv = process.argv;
	const origExit = process.exit;
	const origErr = process.stderr.write;
	let exitCode = null;
	process.argv = ["node", "x", "--input", inputPath, "--output", outputPath];
	process.exit = (code) => {
		exitCode = code;
		throw new Error("exit");
	};
	process.stderr.write = () => true;
	try {
		main();
	} catch {
		// expected: main exits via thrown stub
	} finally {
		process.argv = origArgv;
		process.exit = origExit;
		process.stderr.write = origErr;
	}
	assert.equal(exitCode, 1);
	assert.ok(!existsSync(outputPath));
});
