#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
	const args = {
		claims: ".cautilus/claims/latest.json",
		status: ".cautilus/claims/status-summary.json",
		output: ".cautilus/claims/discovery-review.md",
	};
	for (let index = 2; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--claims") {
			args.claims = argv[++index];
		} else if (arg === "--status") {
			args.status = argv[++index];
		} else if (arg === "--output") {
			args.output = argv[++index];
		} else {
			throw new Error(`Unsupported argument: ${arg}`);
		}
	}
	return args;
}

function readJSON(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readOptionalJSON(filePath) {
	if (!filePath || !fs.existsSync(filePath)) {
		return {};
	}
	return readJSON(filePath);
}

function plainText(value) {
	return String(value ?? "")
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
		.replace(/\s+/g, " ")
		.trim();
}

function asArray(value) {
	return Array.isArray(value) ? value : [];
}

function audienceLabel(audience) {
	switch (audience) {
		case "user":
			return "User";
		case "developer":
			return "Developer";
		default:
			return "Unclear";
	}
}

function proofLabel(candidate) {
	const proof = candidate.recommendedProof || "unknown";
	if (proof === "cautilus-eval" && candidate.recommendedEvalSurface) {
		return `Cautilus eval / ${candidate.recommendedEvalSurface}`;
	}
	if (proof === "cautilus-eval") {
		return "Cautilus eval / surface undecided";
	}
	if (proof === "deterministic") {
		return "Deterministic gate";
	}
	if (proof === "human-auditable") {
		return "Human-auditable";
	}
	return proof;
}

function semanticGroup(candidate) {
	const haystack = [
		candidate.summary,
		candidate.nextAction,
		candidate.whyThisLayer,
		candidate.recommendedEvalSurface,
		...asArray(candidate.groupHints),
	]
		.join(" ")
		.toLowerCase();
	const rules = [
		["Evaluation surfaces", ["dev/repo", "dev/skill", "app/chat", "app/prompt", "eval", "scenario"]],
		["Claim discovery and review", ["claim discover", "claim-discovery", "claim review", "review input", "reviewer"]],
		["Improvement and optimization", ["optimize", "gepa", "improve", "search", "frontier"]],
		["Adapter and portability", ["adapter", "portable", "consumer", "host repo", "repo-specific"]],
		["Agent and skill workflow", ["skill", "agent", "no-input", "$cautilus", "codex", "claude"]],
		["Packets and reporting", ["packet", "report", "html", "artifact", "summary", "status"]],
		["Release and packaging", ["release", "plugin", "install", "publish", "version"]],
		["Quality gates", ["test", "verify", "lint", "quality", "doctor", "hook"]],
		["Documentation and contracts", ["readme", "contract", "spec", "document", "guide"]],
	];
	for (const [label, terms] of rules) {
		if (terms.some((term) => haystack.includes(term))) {
			return label;
		}
	}
	return "General product behavior";
}

function readinessLabel(candidate) {
	const readiness = candidate.verificationReadiness || "unknown";
	const evidence = candidate.evidenceStatus || "unknown";
	return `${proofLabel(candidate)} / ${readiness} / evidence ${evidence}`;
}

function countBy(values, keyFn) {
	const counts = new Map();
	for (const value of values) {
		const key = keyFn(value);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return [...counts.entries()].sort((left, right) => left[0].localeCompare(right[0]));
}

function groupCandidates(candidates) {
	const grouped = new Map();
	for (const candidate of candidates) {
		const audience = candidate.claimAudience || "unclear";
		const semantic = semanticGroup(candidate);
		const readiness = readinessLabel(candidate);
		if (!grouped.has(audience)) {
			grouped.set(audience, new Map());
		}
		const bySemantic = grouped.get(audience);
		if (!bySemantic.has(semantic)) {
			bySemantic.set(semantic, new Map());
		}
		const byReadiness = bySemantic.get(semantic);
		if (!byReadiness.has(readiness)) {
			byReadiness.set(readiness, []);
		}
		byReadiness.get(readiness).push(candidate);
	}
	return grouped;
}

function sortedMapEntries(map, preferred = []) {
	const preferredIndex = new Map(preferred.map((value, index) => [value, index]));
	return [...map.entries()].sort((left, right) => {
		const leftRank = preferredIndex.has(left[0]) ? preferredIndex.get(left[0]) : Number.MAX_SAFE_INTEGER;
		const rightRank = preferredIndex.has(right[0]) ? preferredIndex.get(right[0]) : Number.MAX_SAFE_INTEGER;
		if (leftRank !== rightRank) {
			return leftRank - rightRank;
		}
		return left[0].localeCompare(right[0]);
	});
}

function sourceTrace(candidate) {
	const refs = asArray(candidate.sourceRefs);
	if (refs.length === 0) {
		return "0 source refs";
	}
	const rendered = refs
		.slice(0, 4)
		.map((ref) => `${ref.path}:${ref.line}`)
		.join(", ");
	const suffix = refs.length > 4 ? `, plus ${refs.length - 4} more` : "";
	return `${refs.length} source ref${refs.length === 1 ? "" : "s"}; ${rendered}${suffix}`;
}

function renderCandidate(candidate) {
	const lines = [];
	lines.push(`##### ${candidate.claimId}`);
	lines.push("");
	lines.push(`- Summary: ${plainText(candidate.summary)}`);
	lines.push(`- Current labels: audience=${candidate.claimAudience || "unclear"}; proof=${candidate.recommendedProof || "unknown"}; surface=${candidate.recommendedEvalSurface || "none"}; readiness=${candidate.verificationReadiness || "unknown"}; evidence=${candidate.evidenceStatus || "unknown"}`);
	lines.push(`- Suggested next action: ${plainText(candidate.nextAction || "Review whether the claim is unique, product-relevant, and correctly labeled.")}`);
	lines.push("- Human claim quality: TODO");
	lines.push("- Human corrected audience: keep");
	lines.push("- Human corrected semantic group: keep");
	lines.push("- Human corrected proof: keep");
	lines.push("- Human corrected eval surface: keep");
	lines.push("- Human readiness: keep");
	lines.push("- Human priority: TODO");
	lines.push("- Human notes:");
	lines.push(`- Trace: ${sourceTrace(candidate)}`);
	lines.push("");
	return lines;
}

function renderGroupedCandidates(grouped) {
	const lines = [];
	const audienceOrder = ["user", "developer", "unclear"];
	for (const [audience, bySemantic] of sortedMapEntries(grouped, audienceOrder)) {
		lines.push(`## ${audienceLabel(audience)} Claims`);
		lines.push("");
		lines.push(...renderSemanticGroups(bySemantic));
	}
	return lines;
}

function renderSemanticGroups(bySemantic) {
	const lines = [];
	for (const [semantic, byReadiness] of sortedMapEntries(bySemantic)) {
		lines.push(`### ${semantic}`);
		lines.push("");
		for (const [readiness, groupCandidatesForReadiness] of sortedMapEntries(byReadiness)) {
			lines.push(...renderReadinessGroup(readiness, groupCandidatesForReadiness));
		}
	}
	return lines;
}

function renderReadinessGroup(readiness, candidates) {
	const lines = [];
	lines.push(`#### ${readiness}`);
	lines.push("");
	candidates.sort((left, right) => String(left.claimId).localeCompare(String(right.claimId)));
	for (const candidate of candidates) {
		lines.push(...renderCandidate(candidate));
	}
	return lines;
}

function renderReviewDocument(claimsPacket, statusPacket) {
	const candidates = asArray(claimsPacket.claimCandidates);
	const grouped = groupCandidates(candidates);
	const lines = [];
	lines.push("# Claim Discovery Review Worksheet");
	lines.push("");
	lines.push("This worksheet is for human review of the deterministic Cautilus claim-discovery packet.");
	lines.push("It is grouped by intended audience, semantic area, and verification shape instead of by source file.");
	lines.push("Source refs are kept only as trace data at the bottom of each item.");
	lines.push("");
	lines.push("## Packet Summary");
	lines.push("");
	lines.push(`- Claims packet: ${statusPacket.inputPath || ".cautilus/claims/latest.json"}`);
	lines.push(`- Git commit in packet: ${claimsPacket.gitCommit || "unknown"}`);
	lines.push(`- Candidate count: ${candidates.length}`);
	lines.push(`- Source count: ${claimsPacket.sourceCount ?? asArray(claimsPacket.sourceInventory).length}`);
	const audienceCounts = new Map(countBy(candidates, (candidate) => candidate.claimAudience || "unclear"));
	for (const audience of ["user", "developer", "unclear"]) {
		const count = audienceCounts.get(audience);
		if (count === undefined) {
			continue;
		}
		lines.push(`- ${audienceLabel(audience)} claims: ${count}`);
	}
	lines.push("");
	lines.push("## How To Review");
	lines.push("");
	lines.push("For each item, decide whether it is a real product or developer claim, a duplicate, a fragment, or noise.");
	lines.push("Use the correction fields to mark obvious relabeling without editing the JSON directly.");
	lines.push("");
	lines.push("Suggested values for `Human claim quality`: keep, merge, split, reword, drop, unsure.");
	lines.push("Suggested values for `Human corrected audience`: keep, user, developer, unclear.");
	lines.push("Suggested values for `Human corrected semantic group`: keep, or write a short replacement group.");
	lines.push("Suggested values for `Human corrected proof`: keep, human-auditable, deterministic, cautilus-eval.");
	lines.push("Suggested values for `Human corrected eval surface`: keep, none, dev/repo, dev/skill, app/chat, app/prompt.");
	lines.push("Suggested values for `Human readiness`: keep, ready-to-verify, needs-scenario, needs-alignment, blocked.");
	lines.push("Suggested values for `Human priority`: high, medium, low, later.");
	lines.push("");

	lines.push(...renderGroupedCandidates(grouped));
	return `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

function main() {
	const args = parseArgs(process.argv);
	const claimsPacket = readJSON(args.claims);
	const statusPacket = readOptionalJSON(args.status);
	const output = renderReviewDocument(claimsPacket, statusPacket);
	fs.mkdirSync(path.dirname(args.output), { recursive: true });
	fs.writeFileSync(args.output, output, "utf8");
	console.log(`wrote ${args.output}`);
}

main();
