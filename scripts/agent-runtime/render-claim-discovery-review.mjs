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
	if (candidate.claimSemanticGroup) {
		return String(candidate.claimSemanticGroup);
	}
	return "General product behavior";
}

function audienceCounts(candidates) {
	return new Map(countBy(candidates, (candidate) => candidate.claimAudience || "unclear"));
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

function sourceExcerpts(candidate) {
	const summary = plainText(candidate.summary);
	return asArray(candidate.sourceRefs)
		.map((ref) => plainText(ref.excerpt))
		.filter(Boolean)
		.filter((excerpt) => excerpt !== summary)
		.filter((excerpt, index, excerpts) => excerpts.indexOf(excerpt) === index)
		.slice(0, 2);
}

function checkboxOptions(label, options) {
	return `- ${label}: ${options.map((option) => `[ ] ${option}`).join(" ")}`;
}

function semanticGroupOptions(candidates, claimsPacket) {
	const declaredGroups = asArray(claimsPacket?.effectiveScanScope?.semanticGroups)
		.map((group) => plainText(group.label))
		.filter(Boolean);
	const observedGroups = candidates.map((candidate) => semanticGroup(candidate));
	const groups = [...new Set([...declaredGroups, ...observedGroups])].sort((left, right) => left.localeCompare(right));
	if (!groups.includes("General product behavior")) {
		groups.push("General product behavior");
	}
	groups.push("other:");
	return ["keep", ...groups];
}

function renderCandidate(candidate, semanticOptions) {
	const lines = [];
	lines.push(`##### ${candidate.claimId}`);
	lines.push("");
	lines.push(`- Summary: ${plainText(candidate.summary)}`);
	const currentLabels = [
		`audience=${candidate.claimAudience || "unclear"}`,
		`proof=${candidate.recommendedProof || "unknown"}`,
	];
	if (candidate.recommendedProof === "cautilus-eval") {
		currentLabels.push(`eval surface=${candidate.recommendedEvalSurface || "surface undecided"}`);
	}
	currentLabels.push(`readiness=${candidate.verificationReadiness || "unknown"}`);
	currentLabels.push(`evidence=${candidate.evidenceStatus || "unknown"}`);
	lines.push(`- Current labels: ${currentLabels.join("; ")}`);
	for (const excerpt of sourceExcerpts(candidate)) {
		lines.push(`- Source excerpt: ${excerpt}`);
	}
	lines.push(`- Suggested next action: ${plainText(candidate.nextAction || "Review whether the claim is unique, product-relevant, and correctly labeled.")}`);
	lines.push(checkboxOptions("Human claim quality", ["keep", "merge", "split", "reword", "drop", "unsure"]));
	lines.push(checkboxOptions("Human corrected audience", ["keep", "user", "developer", "unclear"]));
	lines.push(checkboxOptions("Human corrected semantic group", semanticOptions));
	lines.push(checkboxOptions("Human corrected proof", ["keep", "human-auditable", "deterministic", "cautilus-eval"]));
	if (candidate.recommendedProof === "cautilus-eval") {
		lines.push(checkboxOptions("Human corrected eval surface", ["keep", "dev/repo", "dev/skill", "app/chat", "app/prompt", "surface undecided"]));
	}
	lines.push(checkboxOptions("Human readiness", ["keep", "ready-to-verify", "needs-scenario", "needs-alignment", "blocked"]));
	lines.push(checkboxOptions("Human priority", ["high", "medium", "low", "later", "unsure"]));
	lines.push("- Human notes:");
	lines.push(`- Trace: ${sourceTrace(candidate)}`);
	lines.push("");
	return lines;
}

function renderGroupedCandidates(grouped, semanticOptions) {
	const lines = [];
	const audienceOrder = ["user", "developer", "unclear"];
	for (const [audience, bySemantic] of sortedMapEntries(grouped, audienceOrder)) {
		lines.push(`## ${audienceLabel(audience)} Claims (${countGroupedClaims(bySemantic)})`);
		lines.push("");
		lines.push(...renderSemanticGroups(bySemantic, semanticOptions));
	}
	return lines;
}

function renderSemanticGroups(bySemantic, semanticOptions) {
	const lines = [];
	for (const [semantic, byReadiness] of sortedMapEntries(bySemantic)) {
		lines.push(`### ${semantic} (${countGroupedClaims(byReadiness)})`);
		lines.push("");
		for (const [readiness, groupCandidatesForReadiness] of sortedMapEntries(byReadiness)) {
			lines.push(...renderReadinessGroup(readiness, groupCandidatesForReadiness, semanticOptions));
		}
	}
	return lines;
}

function renderReadinessGroup(readiness, candidates, semanticOptions) {
	const lines = [];
	lines.push(`#### ${readiness} (${candidates.length})`);
	lines.push("");
	candidates.sort((left, right) => String(left.claimId).localeCompare(String(right.claimId)));
	for (const candidate of candidates) {
		lines.push(...renderCandidate(candidate, semanticOptions));
	}
	return lines;
}

function countGroupedClaims(value) {
	if (Array.isArray(value)) {
		return value.length;
	}
	let total = 0;
	for (const child of value.values()) {
		total += countGroupedClaims(child);
	}
	return total;
}

function renderFirstPassPlan(lines, candidates) {
	const counts = audienceCounts(candidates);
	const unclear = counts.get("unclear") ?? 0;
	const developer = counts.get("developer") ?? 0;
	const user = counts.get("user") ?? 0;
	lines.push("## Recommended First Pass");
	lines.push("");
	if (unclear > 0) {
		lines.push(`1. Review all ` + "`Unclear Claims`" + ` first (${unclear} item${unclear === 1 ? "" : "s"}).`);
	} else {
		lines.push("1. No `Unclear Claims` are present in this packet.");
	}
	lines.push(`2. Review ` + "`User Claims`" + ` next (${user} item${user === 1 ? "" : "s"}) because these are closest to product promises.`);
	lines.push(`3. Spot-check ` + "`Developer Claims`" + ` last (${developer} item${developer === 1 ? "" : "s"}) to catch internal conventions that leaked into product promises.`);
	lines.push("Do not try to clear every claim in the first pass; mark duplicates, fragments, and obvious audience mistakes first.");
	lines.push("");
}

function renderReviewDocument(claimsPacket, statusPacket) {
	const candidates = asArray(claimsPacket.claimCandidates);
	const grouped = groupCandidates(candidates);
	const semanticOptions = semanticGroupOptions(candidates, claimsPacket);
	const lines = [];
	lines.push("# Claim Discovery Review Worksheet");
	lines.push("");
	lines.push("This worksheet is for human review of the deterministic Cautilus claim-discovery packet.");
	lines.push("It is grouped by intended audience, semantic area, and verification shape instead of by source file.");
	lines.push("Source excerpts are included for local judgment; source refs are trace data, not the primary grouping axis.");
	lines.push("");
	lines.push("## Packet Summary");
	lines.push("");
	lines.push(`- Claims packet: ${statusPacket.inputPath || ".cautilus/claims/latest.json"}`);
	lines.push(`- Git commit in packet: ${claimsPacket.gitCommit || "unknown"}`);
	lines.push(`- Candidate count: ${candidates.length}`);
	lines.push(`- Source count: ${claimsPacket.sourceCount ?? asArray(claimsPacket.sourceInventory).length}`);
	const counts = audienceCounts(candidates);
	for (const audience of ["user", "developer", "unclear"]) {
		const count = counts.get(audience);
		if (count === undefined) {
			continue;
		}
		lines.push(`- ${audienceLabel(audience)} claims: ${count}`);
	}
	lines.push("");
	lines.push("## How To Review");
	lines.push("");
	lines.push("This is a batching worksheet, not a demand to finish all candidates in one pass.");
	lines.push("For each reviewed item, decide whether it is a real product or developer claim, a duplicate, a fragment, or noise.");
	lines.push("Use the correction fields to mark obvious relabeling without editing the JSON directly.");
	lines.push("`ready-to-verify` means the claim is shaped enough to choose a proof path; it does not mean evidence already exists.");
	lines.push("`evidence unknown` means this deterministic pass has not reconciled tests, eval packets, or human review evidence yet.");
	lines.push("Semantic groups are batching hints, not final taxonomy.");
	lines.push("Each correction line lists its allowed values as checkboxes; mark the selected box with `[x]`.");
	lines.push("");
	lines.push("Only set an eval surface when the corrected proof is `cautilus-eval`; otherwise this field is not applicable.");
	lines.push("");

	renderFirstPassPlan(lines, candidates);
	lines.push(...renderGroupedCandidates(grouped, semanticOptions));
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
