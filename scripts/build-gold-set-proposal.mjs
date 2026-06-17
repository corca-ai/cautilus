#!/usr/bin/env node
// Deterministic transform: a `cautilus.claim_proof_plan.v1` packet (agent
// extraction output, `claimCandidates[]`) -> a `cautilus.gold_set_proposal.v2`
// answer-key proposal (`entries[]` with `maintainerVerdict: pending`).
//
// This is NOT a new product seam: it shapes an eval-trust artifact (the blind
// agent proof-plan) into the HITL-ratifiable answer key, the same shape the
// audience segmenter and HITL consume. It is deterministic (candidate order
// preserved, no model calls) and lossless on count (one entry per candidate).
//
// The v2-head proposal is a superset of the v1 gold-set entry: it carries the
// epic facets (primaryEpic/supportingEpics/edgeRationale/multiEpic) so the HITL
// can ratify R14/R15 epic assignment, plus the proof-route rationale so the R10
// decision card can show the agent's "why this layer" reasoning.

import { readFileSync, writeFileSync } from "node:fs";

export const PROPOSAL_SCHEMA = "cautilus.gold_set_proposal.v2";
export const PROOF_PLAN_SCHEMA = "cautilus.claim_proof_plan.v1";

export const VERDICT_DEFINITIONS = {
	accept: "claim correctly extracted and all agent labels correct",
	relabel:
		"claim correctly extracted but one or more labels corrected (proof route, audience, epic, etc.; correction in note)",
	"not-a-claim": "text should not have been extracted as a behavior claim",
	"badly-bounded":
		"real claim but wrong excerpt boundary, wrong merge, or duplicate (detail in note)",
	pending: "not yet reviewed",
};

// Pick the primary excerpt's "path:line" as the entry's stable sourceRef.
// Falls back to the first excerpt when no excerpt is flagged primary so a
// malformed candidate still anchors somewhere instead of throwing.
export function primarySourceRef(candidate) {
	const refs = Array.isArray(candidate.sourceRefs) ? candidate.sourceRefs : [];
	const primary = refs.find((r) => r && r.primary) || refs[0];
	if (!primary) return null;
	return `${primary.path}:${primary.line}`;
}

// Build the per-entry agentLabels block. recommendedEvalSurface and edgeRationale
// are only emitted when the candidate carries them, matching the v1 entry shape.
export function entryAgentLabels(candidate) {
	const labels = {
		recommendedProof: candidate.recommendedProof,
	};
	if (candidate.recommendedEvalSurface) {
		labels.recommendedEvalSurface = candidate.recommendedEvalSurface;
	}
	labels.verificationReadiness = candidate.verificationReadiness;
	labels.claimAudience = candidate.claimAudience;
	labels.claimSemanticGroup = candidate.claimSemanticGroup;
	labels.primaryEpic = candidate.primaryEpic;
	labels.supportingEpics = Array.isArray(candidate.supportingEpics)
		? candidate.supportingEpics
		: [];
	if (candidate.multiEpic && candidate.edgeRationale) {
		labels.edgeRationale = candidate.edgeRationale;
	}
	labels.multiEpic = Boolean(candidate.multiEpic);
	return labels;
}

// One proof-plan candidate -> one gold-set proposal entry. Pure.
export function proposalEntry(candidate) {
	return {
		claimId: candidate.claimId,
		claimFingerprint: candidate.claimFingerprint,
		sourceRef: primarySourceRef(candidate),
		summary: candidate.summary,
		agentLabels: entryAgentLabels(candidate),
		proofRationale: candidate.whyThisLayer || "",
		unresolvedQuestions: Array.isArray(candidate.unresolvedQuestions)
			? candidate.unresolvedQuestions
			: [],
		heuristicMatch: null,
		maintainerVerdict: "pending",
		note: "",
	};
}

// Full proof-plan packet -> full gold-set proposal. Candidate order preserved.
export function buildProposal(proofPlan, meta = {}) {
	const candidates = Array.isArray(proofPlan.claimCandidates)
		? proofPlan.claimCandidates
		: [];
	const entries = candidates.map(proposalEntry);
	return {
		schemaVersion: PROPOSAL_SCHEMA,
		purpose:
			meta.purpose ||
			"Fresh gold set: maintainer-ratified answer key over blind agent extraction (template v2, faceted) at current HEAD; supersedes the 0205b0d v1 proposal.",
		sourcePacket: meta.sourcePacket || null,
		packetGitCommit: proofPlan.gitCommit || meta.packetGitCommit || null,
		extractionMode: proofPlan.extractionMode || "agent",
		templateVersion:
			(proofPlan.extractionAudit && proofPlan.extractionAudit.templateVersion) ||
			meta.templateVersion ||
			null,
		templateHash:
			(proofPlan.extractionAudit && proofPlan.extractionAudit.templateHash) ||
			meta.templateHash ||
			null,
		verdictDefinitions: VERDICT_DEFINITIONS,
		carriedForwardRules: meta.carriedForwardRules || [
			"R1",
			"R2",
			"R3",
			"R4",
			"R5",
			"R6",
			"R7",
			"R8",
			"R9",
			"R10",
			"R11",
			"R12",
			"R13",
			"R14",
			"R15",
		],
		entries,
	};
}

// Acceptance: one entry per candidate, order preserved, no claimId loss/dup.
export function buildReport(proofPlan, proposal) {
	const candidateIds = (proofPlan.claimCandidates || []).map((c) => c.claimId);
	const entryIds = proposal.entries.map((e) => e.claimId);
	const entryIdSet = new Set(entryIds);
	const orderPreserved =
		candidateIds.length === entryIds.length &&
		candidateIds.every((id, i) => id === entryIds[i]);
	return {
		candidateCount: candidateIds.length,
		entryCount: entryIds.length,
		noDuplication: entryIds.length === entryIdSet.size,
		orderPreserved,
		allPending: proposal.entries.every((e) => e.maintainerVerdict === "pending"),
		pass:
			orderPreserved &&
			entryIds.length === entryIdSet.size &&
			candidateIds.length === entryIds.length,
	};
}

function parseArgs(argv) {
	const args = { input: null, output: null, sourcePacket: null, purpose: null };
	for (let i = 0; i < argv.length; i += 1) {
		const a = argv[i];
		if (a === "--input") args.input = argv[(i += 1)];
		else if (a === "--output") args.output = argv[(i += 1)];
		else if (a === "--source-packet") args.sourcePacket = argv[(i += 1)];
		else if (a === "--purpose") args.purpose = argv[(i += 1)];
	}
	return args;
}

export function main() {
	const args = parseArgs(process.argv.slice(2));
	if (!args.input || !args.output) {
		process.stderr.write(
			"usage: build-gold-set-proposal.mjs --input <claims-agent.json> --output <gold-set-proposal.json> [--source-packet <path>] [--purpose <text>]\n",
		);
		process.exit(2);
	}
	const proofPlan = JSON.parse(readFileSync(args.input, "utf8"));
	if (proofPlan.schemaVersion !== PROOF_PLAN_SCHEMA) {
		process.stderr.write(
			`FAIL: expected ${PROOF_PLAN_SCHEMA}, got ${proofPlan.schemaVersion}\n`,
		);
		process.exit(1);
	}
	const proposal = buildProposal(proofPlan, {
		sourcePacket: args.sourcePacket || args.input,
		purpose: args.purpose,
	});
	const report = buildReport(proofPlan, proposal);
	writeFileSync(args.output, `${JSON.stringify(proposal, null, 2)}\n`);
	process.stdout.write(
		`Built ${proposal.entries.length} entries -> ${args.output}\n` +
			`  candidates=${report.candidateCount} entries=${report.entryCount} ` +
			`orderPreserved=${report.orderPreserved} noDup=${report.noDuplication} allPending=${report.allPending}\n`,
	);
	if (!report.pass) {
		process.stderr.write("FAIL: proposal acceptance checks did not pass\n");
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
