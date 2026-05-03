#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

export function parseArgs(argv) {
	const args = {
		input: "",
		output: "",
	};
	for (let index = 2; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--input") {
			args.input = argv[++index];
		} else if (arg === "--output") {
			args.output = argv[++index];
		} else {
			throw new Error(`Unsupported argument: ${arg}`);
		}
	}
	if (!args.input) {
		throw new Error("Missing required --input <review-input.json>; refusing to guess the latest packet by filesystem time");
	}
	if (!args.output) {
		args.output = args.input.replace(/\.json$/u, ".md");
	}
	return args;
}

function readJSON(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const asArray = (value) => (Array.isArray(value) ? value : []);

function compactText(value) {
	return String(value ?? "")
		.replace(/\s+/g, " ")
		.trim();
}

function countBy(values, keyFn) {
	const counts = new Map();
	for (const value of values) {
		const key = keyFn(value);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return [...counts.entries()].sort((left, right) => String(left[0]).localeCompare(String(right[0])));
}

function formatCounts(entries) {
	if (entries.length === 0) {
		return "-";
	}
	return entries.map(([key, count]) => `${key}: ${count}`).join(", ");
}

function sourceLabel(candidate) {
	const ref = asArray(candidate.sourceRefs)[0];
	if (!ref) {
		return "source unavailable";
	}
	return `${ref.path}:${ref.line ?? "?"}`;
}

function sourceExcerpt(candidate) {
	const ref = asArray(candidate.sourceRefs)[0];
	return compactText(ref?.excerpt || candidate.summary);
}

function displayPath(filePath) {
	if (!filePath) {
		return "unknown";
	}
	if (path.isAbsolute(filePath)) {
		return path.relative(process.cwd(), filePath) || ".";
	}
	return filePath;
}

function evidenceRefCount(candidate) {
	return asArray(candidate.evidenceRefs).length + asArray(candidate.possibleEvidenceRefs).length;
}

function currentLabel(candidate, field, fallback = "unknown") {
	const labels = candidate.currentLabels && typeof candidate.currentLabels === "object" ? candidate.currentLabels : {};
	return labels[field] ?? candidate[field] ?? fallback;
}

function candidateLabelLine(candidate) {
	return [
		`audience=${currentLabel(candidate, "claimAudience", "unclear")}`,
		`proof=${currentLabel(candidate, "recommendedProof")}`,
		`surface=${currentLabel(candidate, "recommendedEvalSurface", "none")}`,
		`readiness=${currentLabel(candidate, "verificationReadiness")}`,
		`evidence=${currentLabel(candidate, "evidenceStatus")}`,
	].join("; ");
}

function clusterSort(left, right) {
	const leftPriority = Number(left.priority ?? Number.MAX_SAFE_INTEGER);
	const rightPriority = Number(right.priority ?? Number.MAX_SAFE_INTEGER);
	if (leftPriority !== rightPriority) {
		return leftPriority - rightPriority;
	}
	const leftCount = Number(left.claimCount ?? asArray(left.candidates).length);
	const rightCount = Number(right.claimCount ?? asArray(right.candidates).length);
	if (leftCount !== rightCount) {
		return rightCount - leftCount;
	}
	return String(left.clusterId).localeCompare(String(right.clusterId));
}

function clusterTitle(cluster, index) {
	const group = compactText(cluster.claimSemanticGroup || "General product behavior");
	const surface = compactText(cluster.recommendedEvalSurface || "surface undecided");
	return `${index + 1}. ${group} / ${surface}`;
}

function renderCandidate(lines, candidate) {
	const summary = compactText(candidate.summary);
	const excerpt = sourceExcerpt(candidate);
	const refCount = evidenceRefCount(candidate);
	lines.push(`- ${candidate.claimId}`);
	lines.push(`  - Claim: ${summary}`);
	lines.push(`  - Source: ${sourceLabel(candidate)}`);
	if (excerpt && excerpt !== summary) {
		lines.push(`  - Excerpt: ${excerpt}`);
	}
	lines.push(`  - Current labels: ${candidateLabelLine(candidate)}`);
	lines.push(`  - Reviewer decision: keep as eval claim, merge/drop as duplicate or fragment, or relabel before any fixture work.`);
	lines.push(`  - Next action if kept: ${compactText(candidate.nextAction || "Select or draft a Cautilus eval scenario.")}`);
	if (refCount > 0) {
		lines.push(`  - Possible evidence hints: ${refCount}; reviewer must verify before marking evidence satisfied.`);
	}
}

function renderCluster(lines, cluster, index) {
	const candidates = asArray(cluster.candidates);
	lines.push(`## ${clusterTitle(cluster, index)}`);
	lines.push("");
	lines.push(`- Cluster id: ${cluster.clusterId}`);
	lines.push(`- Candidate claims: ${candidates.length}`);
	lines.push(`- Audience: ${cluster.claimAudience || "unclear"}`);
	lines.push(`- Reason queued: ${compactText(cluster.reason || "Evaluator-dependent claims need review before scenario drafting.")}`);
	lines.push(`- Review outcome needed: decide whether this cluster should become eval fixture work, deterministic proof work, alignment work, or no work.`);
	lines.push(`- Suggested reviewer focus: duplicates/fragments first, then eval-surface correctness, then fixture authoring priority.`);
	lines.push("");
	lines.push("Claims:");
	for (const candidate of candidates) {
		renderCandidate(lines, candidate);
	}
	lines.push("");
}

function renderSkipped(lines, packet) {
	const skippedClaims = asArray(packet.skippedClaims);
	const skippedClusters = asArray(packet.skippedClusters);
	lines.push("## Skipped Work");
	lines.push("");
	lines.push(`- Skipped claims: ${skippedClaims.length}`);
	lines.push(`- Skipped clusters: ${skippedClusters.length}`);
	lines.push(`- Skipped claim reasons: ${formatCounts(countBy(skippedClaims, (claim) => claim.reason || "unknown"))}`);
	lines.push(`- Skipped cluster reasons: ${formatCounts(countBy(skippedClusters, (cluster) => cluster.reason || "unknown"))}`);
	if (skippedClusters.length > 0) {
		lines.push("- First skipped clusters:");
		for (const cluster of skippedClusters.slice(0, 5)) {
			lines.push(`  - ${cluster.clusterId}: ${cluster.claimCount ?? "?"} claim(s), reason=${cluster.reason || "unknown"}`);
		}
	}
	lines.push("");
}

function renderBudget(lines, packet) {
	const budget = packet.reviewBudget ?? {};
	lines.push("## Reviewer Budget Boundary");
	lines.push("");
	lines.push("This document is deterministic review input only.");
	lines.push("Launching an LLM or subagent reviewer is a separate budgeted branch.");
	lines.push("");
	lines.push(`- maximum clusters: ${budget.maxClusters ?? "unspecified"}`);
	lines.push(`- claims per cluster: ${budget.maxClaimsPerCluster ?? "unspecified"}`);
	lines.push("- parallel lanes: not selected by this packet");
	lines.push(`- excerpt chars: ${budget.excerptChars ?? "unspecified"}`);
	lines.push("- retry policy: not selected by this packet");
	lines.push("- skipped-cluster policy: keep skipped clusters visible; do not review them unless a new budget includes them");
	lines.push("");
	lines.push("Recommended next launch, if approved: one reviewer lane, one cluster, no retries, starting with the first cluster below.");
	lines.push("");
}

function sourceClaimPacketMeta(packet) {
	const sourceClaimPacket = packet.sourceClaimPacket && typeof packet.sourceClaimPacket === "object" ? packet.sourceClaimPacket : {};
	return {
		inputPath: displayPath(packet.inputPath || (typeof packet.sourceClaimPacket === "string" ? packet.sourceClaimPacket : "")),
		schemaVersion: sourceClaimPacket.schemaVersion || "unknown",
		gitCommit: sourceClaimPacket.gitCommit || "unknown",
		candidateCount: sourceClaimPacket.candidateCount ?? "unknown",
	};
}

function packetActionBucket(packet) {
	return packet.reviewBudget?.actionBucket || packet.selectionPolicy?.actionBucket || "all";
}

function selectedCountLine(candidates, label, keyFn) {
	return `- ${label}: ${formatCounts(countBy(candidates, keyFn))}`;
}

function renderEvidencePreflightLine(lines, evidencePreflight) {
	if (!evidencePreflight) {
		return;
	}
	lines.push(`- Evidence preflight: ${evidencePreflight.status || "unknown"}; matched refs=${evidencePreflight.matchedRefCount ?? 0}; scanned files=${evidencePreflight.scannedFileCount ?? 0}`);
}

function renderHeader(lines, packet, inputPath) {
	const clusters = asArray(packet.clusters);
	const candidates = clusters.flatMap((cluster) => asArray(cluster.candidates));
	const source = sourceClaimPacketMeta(packet);
	lines.push("# Claim Review Input Summary");
	lines.push("");
	lines.push("This is a readable projection of a deterministic `cautilus.claim_review_input.v1` packet.");
	lines.push("Use it to choose reviewer budget and launch order; use the JSON packet as the audit source.");
	lines.push("It does not discover, refresh, or select claim packets; the caller must pass the intended review-input packet explicitly.");
	lines.push("");
	lines.push("## Packet");
	lines.push("");
	lines.push(`- Input: ${inputPath}`);
	lines.push(`- Schema: ${packet.schemaVersion || "unknown"}`);
	lines.push(`- Source claim packet: ${source.inputPath}`);
	lines.push(`- Source claim packet schema: ${source.schemaVersion}`);
	lines.push(`- Source claim packet commit: ${source.gitCommit}`);
	lines.push(`- Source claim count: ${source.candidateCount}`);
	lines.push(`- Source root: ${packet.sourceRoot || "unknown"}`);
	lines.push(`- Packet notice: ${compactText(packet.packetNotice || "No packet notice recorded.")}`);
	lines.push(`- Action bucket: ${packetActionBucket(packet)}`);
	lines.push(`- Selected clusters: ${clusters.length}`);
	lines.push(`- Selected claims: ${candidates.length}`);
	lines.push(selectedCountLine(candidates, "Selected eval surfaces", (candidate) => currentLabel(candidate, "recommendedEvalSurface", "none")));
	lines.push(selectedCountLine(candidates, "Selected semantic groups", (candidate) => currentLabel(candidate, "claimSemanticGroup", "General product behavior")));
	renderEvidencePreflightLine(lines, packet.evidencePreflight);
	lines.push("");
}

export function renderReviewInputSummary({ packet, inputPath }) {
	const lines = [];
	const clusters = asArray(packet.clusters).slice().sort(clusterSort);
	renderHeader(lines, packet, inputPath);
	renderBudget(lines, packet);
	lines.push("## Launch Order");
	lines.push("");
	if (clusters.length === 0) {
		lines.push("No clusters were selected.");
		lines.push("");
	} else {
		clusters.forEach((cluster, index) => renderCluster(lines, cluster, index));
	}
	renderSkipped(lines, packet);
	return `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

export function buildReviewInputSummary(args) {
	const packet = readJSON(args.input);
	return renderReviewInputSummary({ packet, inputPath: args.input });
}

function main() {
	const args = parseArgs(process.argv);
	const output = buildReviewInputSummary(args);
	fs.mkdirSync(path.dirname(args.output), { recursive: true });
	fs.writeFileSync(args.output, output, "utf8");
	console.log(`wrote ${args.output}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
