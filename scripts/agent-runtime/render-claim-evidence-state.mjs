#!/usr/bin/env node
import fs from "node:fs";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const DEFAULT_CLAIMS = ".cautilus/claims/evidenced-typed-runners.json";
const DEFAULT_STATUS = ".cautilus/claims/status-summary.json";
const DEFAULT_OUTPUT_JSON = ".cautilus/claims/evidence-state.json";
const DEFAULT_OUTPUT_MD = "docs/specs/evidence/claim-evidence-state.md";

const asArray = (value) => (Array.isArray(value) ? value : []);
const asObject = (value) => (!value || Array.isArray(value) || typeof value !== "object" ? {} : value);

export function parseArgs(argv) {
	const args = {
		claims: DEFAULT_CLAIMS,
		status: DEFAULT_STATUS,
		outputJson: DEFAULT_OUTPUT_JSON,
		outputMd: DEFAULT_OUTPUT_MD,
		check: false,
		refreshStatus: false,
		cautilusBin: "./bin/cautilus",
	};
	for (let index = 2; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--claims") {
			args.claims = argv[++index];
		} else if (arg === "--status") {
			args.status = argv[++index];
		} else if (arg === "--output-json") {
			args.outputJson = argv[++index];
		} else if (arg === "--output-md") {
			args.outputMd = argv[++index];
		} else if (arg === "--check") {
			args.check = true;
		} else if (arg === "--refresh-status") {
			args.refreshStatus = true;
		} else if (arg === "--cautilus-bin") {
			args.cautilusBin = argv[++index];
		} else {
			throw new Error(`Unsupported argument: ${arg}`);
		}
	}
	return args;
}

function readJSON(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function canonicalJSON(value) {
	return `${JSON.stringify(value, null, 2)}\n`;
}

function fileHash(filePath) {
	return `sha256:${crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex")}`;
}

function writeFile(filePath, content) {
	fs.mkdirSync(filePath.split("/").slice(0, -1).join("/") || ".", { recursive: true });
	fs.writeFileSync(filePath, content);
}

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
	return Object.fromEntries([...counts.entries()].sort((left, right) => String(left[0]).localeCompare(String(right[0]))));
}

function countEntries(counts) {
	return Object.entries(asObject(counts)).map(([value, count]) => ({ value, count }));
}

function readinessLabel(value) {
	switch (value) {
		case "ready-for-proof":
			return "ready for proof";
		case "needs-scenario":
			return "needs scenario";
		case "needs-alignment":
			return "needs alignment";
		default:
			return String(value ?? "unknown");
	}
}

function readinessDisplayCounts(counts) {
	return Object.fromEntries(Object.entries(asObject(counts)).map(([key, count]) => [readinessLabel(key), count]));
}

function selectedClaimSummary(claimsPacket) {
	const candidates = asArray(claimsPacket.claimCandidates);
	const summary = asObject(claimsPacket.claimSummary);
	if (Object.keys(summary).length > 0) {
		return summary;
	}
	return {
		byEvidenceStatus: countBy(candidates, (candidate) => candidate.evidenceStatus ?? "unknown"),
		byRecommendedProof: countBy(candidates, (candidate) => candidate.recommendedProof ?? "unknown"),
		byVerificationReadiness: countBy(candidates, (candidate) => candidate.verificationReadiness ?? "unknown"),
		byReviewStatus: countBy(candidates, (candidate) => candidate.reviewStatus ?? "unknown"),
	};
}

function canonicalValue(value) {
	if (Array.isArray(value)) {
		return value.map(canonicalValue);
	}
	if (!value || typeof value !== "object") {
		return value;
	}
	return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, canonicalValue(child)]));
}

function sameCanonicalValue(left, right) {
	return JSON.stringify(canonicalValue(left)) === JSON.stringify(canonicalValue(right));
}

function normalizeStatusForGeneratedArtifactDrift(value) {
	const normalized = canonicalValue(value);
	const gitState = asObject(normalized.gitState);
	if (Object.keys(gitState).length === 0) {
		return normalized;
	}
	delete gitState.currentGitCommit;
	delete gitState.headDrift;
	delete gitState.changedFileCount;
	delete gitState.changedFiles;
	delete gitState.changedSources;
	delete gitState.comparisonStatus;
	delete gitState.recommendedAction;
	normalized.gitState = gitState;
	return normalized;
}

function normalizeProjectionForGeneratedArtifactDrift(value) {
	const normalized = canonicalValue(value);
	if (normalized.sourceOfTruth) {
		delete normalized.sourceOfTruth.statusHash;
	}
	if (normalized.gitState) {
		delete normalized.gitState.currentGitCommit;
		delete normalized.gitState.headDrift;
		delete normalized.gitState.changedFileCount;
		delete normalized.gitState.changedFiles;
		delete normalized.gitState.changedSources;
		delete normalized.gitState.comparisonStatus;
		delete normalized.gitState.recommendedAction;
	}
	return normalized;
}

function normalizeMarkdownForGeneratedArtifactDrift(value) {
	return String(value)
		.replace(/^- Status hash: sha256:[a-f0-9]+$/m, "- Status hash: <generated-artifact-commit-drift>")
		.replace(/^- Git state: [^;]+; stale=no$/m, "- Git state: <generated-artifact-commit-drift>; stale=no")
		.replace(/^- Snapshot current commit: [0-9a-f]+$/m, "- Snapshot current commit: <generated-artifact-commit-drift>");
}

function generatedArtifactCommitDriftOnly(checkedStatus, refreshedStatus) {
	const checkedGitState = asObject(checkedStatus?.gitState);
	const refreshedGitState = asObject(refreshedStatus?.gitState);
	if (checkedGitState.isStale === true || refreshedGitState.isStale === true) {
		return false;
	}
	if ((checkedGitState.changedSourceCount ?? 0) !== 0 || (refreshedGitState.changedSourceCount ?? 0) !== 0) {
		return false;
	}
	if (checkedGitState.packetGitCommit !== refreshedGitState.packetGitCommit) {
		return false;
	}
	return sameCanonicalValue(
		normalizeStatusForGeneratedArtifactDrift(checkedStatus),
		normalizeStatusForGeneratedArtifactDrift(refreshedStatus),
	);
}

function assertStatusSummaryMatchesClaimPacket(claimsPacket, statusPacket) {
	const claimSummary = selectedClaimSummary(claimsPacket);
	const statusSummary = asObject(statusPacket.claimSummary);
	if (Object.keys(statusSummary).length === 0) {
		return;
	}
	if (!sameCanonicalValue(claimSummary, statusSummary)) {
		throw new Error("status summary does not match the claim packet summary; regenerate status from the selected claims packet before rendering Evidence State");
	}
}

function firstSourceRef(candidate) {
	const ref = asArray(candidate.sourceRefs)[0];
	if (!ref) return "-";
	return `${ref.path}:${ref.line ?? "?"}`;
}

function sampleRows(candidates, limit = 8) {
	return candidates.slice(0, limit).map((candidate) => ({
		claimId: candidate.claimId,
		source: firstSourceRef(candidate),
		surface: candidate.recommendedEvalSurface ?? "surface undecided",
		readiness: readinessLabel(candidate.verificationReadiness),
		rawReadiness: candidate.verificationReadiness ?? "unknown",
		review: candidate.reviewStatus ?? "unknown",
		summary: compactText(candidate.summary),
	}));
}

function bucketRows(statusPacket) {
	return asArray(statusPacket?.actionSummary?.primaryBuckets).map((bucket) => ({
		id: bucket.id,
		count: bucket.count ?? 0,
		actor: bucket.recommendedActor ?? "-",
		evidence: asObject(bucket.byEvidenceStatus),
		review: asObject(bucket.byReviewStatus),
		summary:
			bucket.id === "agent-plan-cautilus-eval"
				? "Draft or select Cautilus eval scenarios for proof-ready eval claims."
				: compactText(bucket.summary),
	}));
}

function buildProjection({ claimsPacket, statusPacket, claimsPath, statusPath, claimsHash, statusHash }) {
	assertStatusSummaryMatchesClaimPacket(claimsPacket, statusPacket);
	const candidates = asArray(claimsPacket.claimCandidates);
	const openEval = candidates.filter((candidate) => candidate.recommendedProof === "cautilus-eval" && candidate.evidenceStatus !== "satisfied");
	const readyEval = openEval.filter((candidate) => candidate.verificationReadiness === "ready-for-proof");
	const needsScenario = openEval.filter((candidate) => candidate.verificationReadiness === "needs-scenario");
	const summary = selectedClaimSummary(claimsPacket);
	return {
		schemaVersion: "cautilus.claim_evidence_state.v1",
		sourceOfTruth: {
			claimsPacket: claimsPath,
			claimsHash,
			statusSnapshot: statusPath,
			statusHash,
			statusSnapshotNotice: statusPacket.gitStateSnapshotNotice ?? "git state is computed when the status packet is generated",
			sourceRoles: {
				claimsPacket: "audit source for candidates, labels, evidence status, and count totals",
				statusSnapshot: "derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet",
			},
		},
		gitState: asObject(statusPacket.gitState),
		totals: {
			candidateCount: claimsPacket.candidateCount ?? candidates.length,
			sourceCount: claimsPacket.sourceCount ?? statusPacket.sourceCount ?? 0,
			byEvidenceStatus: asObject(summary.byEvidenceStatus),
			byRecommendedProof: asObject(summary.byRecommendedProof),
			byVerificationReadiness: asObject(summary.byVerificationReadiness),
			byReviewStatus: asObject(summary.byReviewStatus),
		},
		openCautilusEval: {
			total: openEval.length,
			readyForProof: readyEval.length,
			needsScenario: needsScenario.length,
			bySurface: countBy(openEval, (candidate) => candidate.recommendedEvalSurface ?? "(none)"),
			byReadiness: readinessDisplayCounts(countBy(openEval, (candidate) => candidate.verificationReadiness ?? "unknown")),
			rawByReadiness: countBy(openEval, (candidate) => candidate.verificationReadiness ?? "unknown"),
			proofReadySamples: sampleRows(readyEval),
			scenarioSamples: sampleRows(needsScenario),
		},
		actionBuckets: bucketRows(statusPacket),
		crossCuttingSignals: asArray(statusPacket?.actionSummary?.crossCuttingSignals).map((signal) => ({
			id: signal.id,
			count: signal.count ?? 0,
			actor: signal.recommendedActor ?? "-",
			summary: compactText(signal.summary),
			sampleClaimIds: asArray(signal.sampleClaimIds).slice(0, 8),
		})),
	};
}

function table(headers, rows) {
	const escape = (value) =>
		compactText(value)
			.replaceAll("](", "] (")
			.replaceAll("\\", "\\\\")
			.replaceAll("|", "\\|")
			.replaceAll("[", "\\[")
			.replaceAll("]", "\\]") || "-";
	const lines = [`| ${headers.map(escape).join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`];
	for (const row of rows) {
		lines.push(`| ${row.map(escape).join(" | ")} |`);
	}
	return lines;
}

function formatCounts(counts) {
	const entries = Object.entries(asObject(counts));
	if (entries.length === 0) return "-";
	return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
}

export function renderMarkdown(projection) {
	const lines = [
		"# Claim Evidence State",
		"",
		"This file is generated from the claim packet and status snapshot.",
		"Do not edit it by hand.",
		"Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.",
		"",
		"## Source Of Truth",
		"",
		`- Claims packet: ${projection.sourceOfTruth.claimsPacket}`,
		`- Claims hash: ${projection.sourceOfTruth.claimsHash}`,
		`- Status snapshot: ${projection.sourceOfTruth.statusSnapshot}`,
		`- Status hash: ${projection.sourceOfTruth.statusHash}`,
		`- Git state: ${projection.gitState.comparisonStatus ?? "unknown"}; stale=${projection.gitState.isStale === true ? "yes" : "no"}`,
		`- Snapshot current commit: ${projection.gitState.currentGitCommit ?? "-"}`,
		`- Packet commit: ${projection.gitState.packetGitCommit ?? "-"}`,
		`- Changed claim sources: ${projection.gitState.changedSourceCount ?? 0}`,
		`- Claims packet role: ${projection.sourceOfTruth.sourceRoles.claimsPacket}`,
		`- Status snapshot role: ${projection.sourceOfTruth.sourceRoles.statusSnapshot}`,
		"",
		"## Scoreboard",
		"",
		...table(
			["Dimension", "Counts"],
			[
				["Evidence", formatCounts(projection.totals.byEvidenceStatus)],
				["Recommended proof", formatCounts(projection.totals.byRecommendedProof)],
				["Proof readiness", formatCounts(readinessDisplayCounts(projection.totals.byVerificationReadiness))],
				["Review", formatCounts(projection.totals.byReviewStatus)],
			],
		),
		"",
		"## Cautilus Eval Backlog",
		"",
		...table(
			["Queue", "Count"],
			[
				["open Cautilus eval claims", projection.openCautilusEval.total],
				["ready for proof", projection.openCautilusEval.readyForProof],
				["needs scenario", projection.openCautilusEval.needsScenario],
			],
		),
		"",
		"Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.",
		"Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.",
		"",
		"### By Surface",
		"",
		...table(["Surface", "Count"], countEntries(projection.openCautilusEval.bySurface).map((entry) => [entry.value, entry.count])),
		"",
		"### Proof-Ready Samples",
		"",
		...table(
			["Claim", "Source", "Surface", "Readiness", "Review", "Summary"],
			projection.openCautilusEval.proofReadySamples.map((row) => [row.claimId, row.source, row.surface, row.readiness, row.review, row.summary]),
		),
		"",
		"### Scenario Samples",
		"",
		...table(
			["Claim", "Source", "Surface", "Readiness", "Review", "Summary"],
			projection.openCautilusEval.scenarioSamples.map((row) => [row.claimId, row.source, row.surface, row.readiness, row.review, row.summary]),
		),
		"",
		"## Action Buckets",
		"",
		...table(
			["Bucket", "Actor", "Count", "Evidence", "Review", "Meaning"],
			projection.actionBuckets.map((bucket) => [
				bucket.id,
				bucket.actor,
				bucket.count,
				formatCounts(bucket.evidence),
				formatCounts(bucket.review),
				bucket.summary,
			]),
		),
		"",
		"## Cross-Cutting Signals",
		"",
		...table(
			["Signal", "Actor", "Count", "Meaning"],
			projection.crossCuttingSignals.map((signal) => [signal.id, signal.actor, signal.count, signal.summary]),
		),
		"",
		"## How This Avoids A Split SOT",
		"",
		"- The claim packet is the audit source.",
		"- The status snapshot is regenerated from that packet before this projection is rendered.",
		"- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.",
		"- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.",
		"",
	];
	return `${lines.join("\n")}\n`;
}

function refreshedStatus(args) {
	const result = spawnSync(args.cautilusBin, ["discover", "claims", "status", "--input", args.claims, "--sample-claims", "1"], {
		encoding: "utf8",
	});
	if (result.status !== 0) {
		throw new Error(`failed to refresh claim status with ${args.cautilusBin}: ${result.stderr || result.stdout}`);
	}
	return JSON.parse(result.stdout);
}

function readInputs(args) {
	const claimsPacket = readJSON(args.claims);
	let statusPacket;
	if (args.refreshStatus) {
		statusPacket = refreshedStatus(args);
	} else {
		statusPacket = readJSON(args.status);
	}
	return { claimsPacket, statusPacket };
}

function compareFile(path, expected, { equivalent } = {}) {
	if (!fs.existsSync(path)) {
		throw new Error(`${path} is missing; run npm run claims:evidence-state`);
	}
	const actual = fs.readFileSync(path, "utf8");
	if (actual !== expected) {
		if (equivalent?.(actual, expected) === true) {
			return;
		}
		throw new Error(`${path} is stale; run npm run claims:evidence-state`);
	}
}

export function run(args) {
	const { claimsPacket, statusPacket } = readInputs(args);
	const checkedStatusPacket = args.refreshStatus && args.check && fs.existsSync(args.status) ? readJSON(args.status) : null;
	const allowGeneratedArtifactCommitDrift =
		checkedStatusPacket && generatedArtifactCommitDriftOnly(checkedStatusPacket, statusPacket);
	if (args.refreshStatus && !args.check) {
		writeFile(args.status, canonicalJSON(statusPacket));
	}
	const statusHash = args.refreshStatus && args.check ? `sha256:${crypto.createHash("sha256").update(canonicalJSON(statusPacket)).digest("hex")}` : fileHash(args.status);
	const projection = buildProjection({
		claimsPacket,
		statusPacket,
		claimsPath: args.claims,
		statusPath: args.status,
		claimsHash: fileHash(args.claims),
		statusHash,
	});
	const json = canonicalJSON(projection);
	const markdown = renderMarkdown(projection);
	if (args.check) {
		if (args.refreshStatus) {
			compareFile(args.status, canonicalJSON(statusPacket), {
				equivalent: (actual) =>
					allowGeneratedArtifactCommitDrift &&
					sameCanonicalValue(
						normalizeStatusForGeneratedArtifactDrift(JSON.parse(actual)),
						normalizeStatusForGeneratedArtifactDrift(statusPacket),
					),
			});
		}
		compareFile(args.outputJson, json, {
			equivalent: (actual) =>
				allowGeneratedArtifactCommitDrift &&
				sameCanonicalValue(
					normalizeProjectionForGeneratedArtifactDrift(JSON.parse(actual)),
					normalizeProjectionForGeneratedArtifactDrift(projection),
				),
		});
		compareFile(args.outputMd, markdown, {
			equivalent: (actual, expected) =>
				allowGeneratedArtifactCommitDrift &&
				normalizeMarkdownForGeneratedArtifactDrift(actual) === normalizeMarkdownForGeneratedArtifactDrift(expected),
		});
		return { projection, checked: true };
	}
	writeFile(args.outputJson, json);
	writeFile(args.outputMd, markdown);
	return { projection, checked: false };
}

function main() {
	try {
		run(parseArgs(process.argv));
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
