#!/usr/bin/env node
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

import { renderCanonicalMapSection } from "./render-canonical-claim-map-section.mjs";

const DEFAULT_CLAIMS_DIR = ".cautilus/claims";
const DEFAULT_CLAIMS = `${DEFAULT_CLAIMS_DIR}/evidenced-typed-runners.json`;
const DEFAULT_STATUS = `${DEFAULT_CLAIMS_DIR}/status-summary.json`;
const DEFAULT_CANONICAL_MAP = `${DEFAULT_CLAIMS_DIR}/canonical-claim-map.json`;
const DEFAULT_OUTPUT = `${DEFAULT_CLAIMS_DIR}/claim-status-report.md`;

export function parseArgs(argv) {
	const args = {
		claims: DEFAULT_CLAIMS,
		status: DEFAULT_STATUS,
		canonicalMap: DEFAULT_CANONICAL_MAP,
		claimsDir: DEFAULT_CLAIMS_DIR,
		output: DEFAULT_OUTPUT,
		samplePerBucket: 5,
		reviewSample: 8,
	};
	for (let index = 2; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--claims") {
			args.claims = argv[++index];
		} else if (arg === "--status") {
			args.status = argv[++index];
		} else if (arg === "--canonical-map") {
			args.canonicalMap = argv[++index];
		} else if (arg === "--claims-dir") {
			args.claimsDir = argv[++index];
		} else if (arg === "--output") {
			args.output = argv[++index];
		} else if (arg === "--sample-per-bucket") {
			args.samplePerBucket = parsePositiveInteger(argv[++index], arg);
		} else if (arg === "--review-sample") {
			args.reviewSample = parsePositiveInteger(argv[++index], arg);
		} else {
			throw new Error(`Unsupported argument: ${arg}`);
		}
	}
	return args;
}

function parsePositiveInteger(value, flag) {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new Error(`${flag} expects a positive integer`);
	}
	return parsed;
}

function readJSON(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fileHash(filePath) {
	if (!filePath || !fs.existsSync(filePath)) {
		return null;
	}
	return `sha256:${crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex")}`;
}

function readOptionalJSON(filePath) {
	if (!filePath || !fs.existsSync(filePath)) {
		return null;
	}
	return readJSON(filePath);
}

function discoverJSONFiles(directory, prefix) {
	if (!directory || !fs.existsSync(directory)) {
		return [];
	}
	return fs
		.readdirSync(directory)
		.filter((name) => name.startsWith(prefix) && name.endsWith(".json"))
		.map((name) => path.join(directory, name))
		.sort((left, right) => left.localeCompare(right));
}

function compactText(value) {
	return String(value ?? "")
		.replace(/\s+/g, " ")
		.trim();
}

const asArray = (value) => (Array.isArray(value) ? value : []);

const asObject = (value) => (!value || Array.isArray(value) || typeof value !== "object" ? {} : value);

function countBy(values, keyFn) {
	const counts = new Map();
	for (const value of values) {
		const key = keyFn(value);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return Object.fromEntries([...counts.entries()].sort((left, right) => String(left[0]).localeCompare(String(right[0]))));
}

function formatCounts(counts) {
	const entries = Object.entries(asObject(counts));
	if (entries.length === 0) {
		return "-";
	}
	return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
}

function table(headers, rows) {
	const escapeCell = (value) => compactText(value).replaceAll("|", "\\|") || "-";
	const lines = [];
	lines.push(`| ${headers.map(escapeCell).join(" | ")} |`);
	lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
	for (const row of rows) {
		lines.push(`| ${row.map(escapeCell).join(" | ")} |`);
	}
	return lines;
}

function claimMap(claimsPacket) {
	return new Map(asArray(claimsPacket?.claimCandidates).map((candidate) => [candidate.claimId, candidate]));
}

function claimSummary(candidate) {
	return candidate ? compactText(candidate.summary) : "claim not found in selected packet";
}

function sourceLabel(candidate) {
	const ref = asArray(candidate?.sourceRefs)[0];
	return ref ? `${ref.path}:${ref.line ?? "?"}` : "-";
}

function bucketSampleRows(bucket, claimsById, limit) {
	return asArray(bucket.sampleClaimIds)
		.slice(0, limit)
		.map((claimId) => {
			const candidate = claimsById.get(claimId);
			return [
				claimId,
				sourceLabel(candidate),
				candidate?.recommendedProof ?? "-",
				candidate?.verificationReadiness ?? "-",
				candidate?.reviewStatus ?? "-",
				candidate?.evidenceStatus ?? "-",
				claimSummary(candidate),
			];
		});
}

function primaryBuckets(statusPacket) {
	return asArray(statusPacket?.actionSummary?.primaryBuckets);
}

function crossCuttingSignals(statusPacket) {
	return asArray(statusPacket?.actionSummary?.crossCuttingSignals);
}

function fallbackSummary(claimsPacket) {
	const candidates = asArray(claimsPacket?.claimCandidates);
	return {
		byEvidenceStatus: countBy(candidates, (candidate) => candidate.evidenceStatus ?? "unknown"),
		byReviewStatus: countBy(candidates, (candidate) => candidate.reviewStatus ?? "heuristic"),
		byRecommendedProof: countBy(candidates, (candidate) => candidate.recommendedProof ?? "unknown"),
		byVerificationReadiness: countBy(candidates, (candidate) => candidate.verificationReadiness ?? "unknown"),
	};
}

function summaryCounts(statusPacket, claimSummaryPacket, fallback, key) {
	return statusPacket?.[key] ?? claimSummaryPacket[key] ?? fallback[key];
}

function candidateCounts(claimsPacket, claimSummaryPacket, key, keyFn) {
	return claimSummaryPacket[key] ?? countBy(asArray(claimsPacket?.claimCandidates), keyFn);
}

function selectedSummary(claimsPacket, statusPacket) {
	const fallback = fallbackSummary(claimsPacket);
	const claimSummaryPacket = asObject(claimsPacket?.claimSummary);
	return {
		byEvidenceStatus: summaryCounts(statusPacket, claimSummaryPacket, fallback, "byEvidenceStatus"),
		byReviewStatus: summaryCounts(statusPacket, claimSummaryPacket, fallback, "byReviewStatus"),
		byRecommendedProof: summaryCounts(statusPacket, claimSummaryPacket, fallback, "byRecommendedProof"),
		byVerificationReadiness: summaryCounts(statusPacket, claimSummaryPacket, fallback, "byVerificationReadiness"),
		byClaimAudience: candidateCounts(claimsPacket, claimSummaryPacket, "byClaimAudience", (candidate) => candidate.claimAudience ?? "unclear"),
		byClaimSemanticGroup: candidateCounts(
			claimsPacket,
			claimSummaryPacket,
			"byClaimSemanticGroup",
			(candidate) => candidate.claimSemanticGroup ?? "General product behavior",
		),
	};
}

function reviewResultDigest(filePath) {
	const packet = readOptionalJSON(filePath);
	if (!packet) {
		return null;
	}
	const clusterResults = asArray(packet.clusterResults);
	const updates = clusterResults.flatMap((cluster) =>
		asArray(cluster.claimUpdates).map((update) => ({
			...update,
			clusterId: cluster.clusterId,
		})),
	);
	return {
		path: filePath,
		reviewRun: asObject(packet.reviewRun),
		clusterCount: clusterResults.length,
		updateCount: updates.length,
		byProof: countBy(updates, (update) => update.recommendedProof ?? "unchanged"),
		byReadiness: countBy(updates, (update) => update.verificationReadiness ?? "unchanged"),
		byEvidence: countBy(updates, (update) => update.evidenceStatus ?? "unchanged"),
		updates,
	};
}

function reviewResultsForClaims(reviewResults, claimsById) {
	const filtered = [];
	for (const digest of asArray(reviewResults)) {
		const updates = digest.updates.filter((update) => claimsById.has(update.claimId));
		if (updates.length === 0) {
			continue;
		}
		filtered.push({
			...digest,
			clusterCount: new Set(updates.map((update) => update.clusterId)).size,
			updateCount: updates.length,
			byProof: countBy(updates, (update) => update.recommendedProof ?? "unchanged"),
			byReadiness: countBy(updates, (update) => update.verificationReadiness ?? "unchanged"),
			byEvidence: countBy(updates, (update) => update.evidenceStatus ?? "unchanged"),
			updates,
		});
	}
	return filtered;
}

function validationDigest(filePath) {
	const packet = readOptionalJSON(filePath);
	if (!packet) {
		return null;
	}
	return {
		path: filePath,
		valid: packet.valid,
		issueCount: packet.issueCount ?? asArray(packet.issues).length,
		issues: asArray(packet.issues),
	};
}

function evalPlanDigest(filePath) {
	const packet = readOptionalJSON(filePath);
	if (!packet) {
		return null;
	}
	const planSummary = asObject(packet.planSummary);
	return {
		path: filePath,
		evalPlanCount: planSummary.evalPlanCount ?? asArray(packet.evalPlans).length,
		skippedClaimCount: planSummary.skippedClaimCount ?? asArray(packet.skippedClaims).length,
		zeroPlanReason: planSummary.zeroPlanReason ?? "",
		zeroPlanExpectation: planSummary.zeroPlanExpectation ?? "",
		skippedByReason: planSummary.skippedByReason ?? countBy(asArray(packet.skippedClaims), (claim) => claim.reason ?? "unknown"),
	};
}

function refreshPlanDigest(filePath) {
	const packet = readOptionalJSON(filePath);
	if (!packet) {
		return null;
	}
	const summary = asObject(packet.refreshSummary);
	return {
		path: filePath,
		mtimeMs: fs.statSync(filePath).mtimeMs,
		status: summary.status ?? "-",
		changedSourceCount: summary.changedSourceCount ?? 0,
		changedClaimCount: summary.changedClaimCount ?? 0,
		carriedForwardClaimCount: summary.carriedForwardClaimCount ?? 0,
		baseCommit: summary.baseCommit ?? "-",
		targetCommit: summary.targetCommit ?? "-",
		changedClaimSources: asArray(summary.changedClaimSources),
		nextActions: asArray(summary.nextActions),
		summary: summary.summary ?? "",
	};
}

function collectDigests(args) {
	return {
		reviewResults: discoverJSONFiles(args.claimsDir, "review-result-").map(reviewResultDigest).filter(Boolean),
		validationReports: discoverJSONFiles(args.claimsDir, "validation-").map(validationDigest).filter(Boolean),
		evalPlans: discoverJSONFiles(args.claimsDir, "eval-plan-").map(evalPlanDigest).filter(Boolean),
		refreshPlans: discoverJSONFiles(args.claimsDir, "refresh-plan").map(refreshPlanDigest).filter(Boolean),
	};
}

function packetCount(statusPacket, claimsPacket, key, fallbackCount) {
	return statusPacket?.[key] ?? claimsPacket?.[key] ?? fallbackCount;
}

function gitStateLines(gitState) {
	if (Object.keys(gitState).length === 0) {
		return [];
	}
	const lines = [`- Git state snapshot: ${gitState.comparisonStatus ?? "unknown"}; stale=${gitState.isStale === true ? "yes" : "no"}`];
	const changedFilesBasis = asObject(gitState.changedFilesBasis);
	if (changedFilesBasis.scope || gitState.workingTreePolicy) {
		lines.push(`- Changed-file scope: ${changedFilesBasis.scope ?? "unknown"}; working tree=${gitState.workingTreePolicy ?? changedFilesBasis.workingTreePolicy ?? "unknown"}`);
	}
	if (gitState.recommendedAction) {
		lines.push(`- Snapshot recommendation: ${gitState.recommendedAction}`);
	}
	return lines;
}

function renderHeader(lines, claimsPacket, statusPacket, args) {
	const candidates = asArray(claimsPacket?.claimCandidates);
	const gitState = asObject(statusPacket?.gitState);
	lines.push("# Cautilus Claim Status Report");
	lines.push("");
	lines.push("This is a human-readable projection over the current claim packet, status summary, review results, validation reports, and eval plans.");
	lines.push("Use the JSON packets as the audit source; use this report to decide what to inspect or do next.");
	lines.push("");
	lines.push("## Packet");
	lines.push("");
	lines.push(`- Claims packet: ${args.claims}`);
	lines.push(`- Status packet: ${args.status}`);
	lines.push(`- Candidate count: ${packetCount(statusPacket, claimsPacket, "candidateCount", candidates.length)}`);
	lines.push(`- Source count: ${packetCount(statusPacket, claimsPacket, "sourceCount", asArray(claimsPacket?.sourceInventory).length)}`);
	lines.push(`- Packet source commit: ${claimsPacket?.gitCommit ?? "unknown"}`);
	if (statusPacket?.gitStateSnapshotNotice) {
		lines.push(`- Snapshot notice: ${compactText(statusPacket.gitStateSnapshotNotice)}`);
	} else {
		lines.push("- Snapshot notice: git state is a generated status snapshot; rerun `cautilus claim show` for live checkout state.");
	}
	lines.push(...gitStateLines(gitState));
	lines.push("");
}

function renderDiscoveryBoundary(lines, claimsPacket) {
	const scope = asObject(claimsPacket?.effectiveScanScope);
	lines.push("## Discovery Boundary");
	lines.push("");
	lines.push(`- Entries: ${asArray(scope.entries).join(", ") || "-"}`);
	lines.push(`- Traversal: ${scope.traversal ?? "-"}; linked Markdown depth: ${scope.linkedMarkdownDepth ?? "-"}`);
	lines.push(`- Gitignore policy: ${scope.gitignorePolicy ?? "-"}`);
	lines.push(`- Explicit sources: ${scope.explicitSources === true ? "yes" : "no"}`);
	if (asArray(scope.exclude).length > 0) {
		lines.push(`- Excludes: ${asArray(scope.exclude).slice(0, 8).join(", ")}${scope.exclude.length > 8 ? ", ..." : ""}`);
	}
	lines.push("");
}

function renderScoreboard(lines, claimsPacket, statusPacket) {
	const summary = selectedSummary(claimsPacket, statusPacket);
	lines.push("## Scoreboard");
	lines.push("");
	lines.push(...table(["Dimension", "Counts"], [
		["Evidence", formatCounts(summary.byEvidenceStatus)],
		["Review", formatCounts(summary.byReviewStatus)],
		["Recommended proof", formatCounts(summary.byRecommendedProof)],
		["Verification readiness", formatCounts(summary.byVerificationReadiness)],
		["Audience", formatCounts(summary.byClaimAudience)],
	]));
	lines.push("");
	const readiness = asObject(statusPacket?.reviewReadinessSummary);
	if (Object.keys(readiness).length > 0) {
		lines.push(`Review readiness: ${formatCounts(readiness)}.`);
		lines.push("");
	}
}

function renderActionBuckets(lines, statusPacket, claimsById, sampleLimit) {
	lines.push("## Action Buckets");
	lines.push("");
	const bucketRows = primaryBuckets(statusPacket).map((bucket) => [
		bucket.id,
		bucket.recommendedActor ?? "-",
		bucket.count ?? 0,
		formatCounts(bucket.byReviewStatus),
		formatCounts(bucket.byEvidenceStatus),
		bucket.summary ?? "-",
	]);
	lines.push(...table(["Bucket", "Actor", "Count", "Review", "Evidence", "Meaning"], bucketRows));
	lines.push("");
	for (const signal of crossCuttingSignals(statusPacket)) {
		lines.push(`Cross-cutting signal: ${signal.id} (${signal.count ?? 0}) - ${compactText(signal.summary)}`);
		lines.push("");
	}
	const focusBucketIds = ["human-align-surfaces", "human-confirm-or-decompose", "split-or-defer", "agent-add-deterministic-proof", "agent-plan-cautilus-eval", "agent-design-scenario"];
	for (const bucket of primaryBuckets(statusPacket).filter((item) => focusBucketIds.includes(item.id))) {
		const sampleRows = bucketSampleRows(bucket, claimsById, sampleLimit);
		if (sampleRows.length === 0) {
			continue;
		}
		lines.push(`### ${bucket.id}`);
		lines.push("");
		lines.push(compactText(bucket.summary));
		lines.push("");
		lines.push(...table(["Claim", "Source", "Proof", "Readiness", "Review", "Evidence", "Summary"], sampleRows));
		lines.push("");
	}
}

function renderReviewResults(lines, digests, claimsById, sampleLimit) {
	lines.push("## Review Results");
	lines.push("");
	if (digests.length === 0) {
		lines.push("No review result packets were found.");
		lines.push("");
		return;
	}
	const rows = digests.map((digest) => [
		digest.path,
		digest.reviewRun.mode ?? digest.reviewRun.scope ?? "-",
		digest.reviewRun.reviewer ?? "-",
		digest.clusterCount,
		digest.updateCount,
		formatCounts(digest.byProof),
		formatCounts(digest.byReadiness),
	]);
	lines.push(...table(["Packet", "Mode", "Reviewer", "Clusters", "Updates", "Proof", "Readiness"], rows));
	lines.push("");
	for (const digest of prioritizedReviewDetails(digests).slice(0, 4)) {
		lines.push(`### ${digest.path}`);
		lines.push("");
		const updateRows = digest.updates.slice(0, sampleLimit).map((update) => {
			const candidate = claimsById.get(update.claimId);
			return [
				update.claimId,
				update.recommendedProof ?? "-",
				update.verificationReadiness ?? "-",
				update.evidenceStatus ?? "-",
				update.nextAction ?? candidate?.nextAction ?? "-",
			];
		});
		lines.push(...table(["Claim", "Proof", "Readiness", "Evidence", "Next action"], updateRows));
		lines.push("");
	}
}

function prioritizedReviewDetails(digests) {
	const importantPathFragments = [
		"human-align",
		"human-confirm",
		"evidence-review-to-eval",
		"deterministic-gates",
	];
	return digests
		.filter((item) => item.updateCount > 0)
		.map((digest, index) => ({
			digest,
			index,
			rank: importantPathFragments.findIndex((fragment) => digest.path.includes(fragment)),
		}))
		.sort((left, right) => {
			const leftRank = left.rank === -1 ? Number.MAX_SAFE_INTEGER : left.rank;
			const rightRank = right.rank === -1 ? Number.MAX_SAFE_INTEGER : right.rank;
			if (leftRank !== rightRank) {
				return leftRank - rightRank;
			}
			return right.index - left.index;
		})
		.map((item) => item.digest);
}

function renderValidation(lines, validationReports) {
	lines.push("## Validation");
	lines.push("");
	if (validationReports.length === 0) {
		lines.push("No validation packets were found.");
		lines.push("");
		return;
	}
	lines.push(...table(["Packet", "Valid", "Issues"], validationReports.map((digest) => [digest.path, digest.valid === true ? "yes" : "no", digest.issueCount ?? 0])));
	lines.push("");
	const failing = validationReports.filter((digest) => digest.valid !== true || Number(digest.issueCount ?? 0) > 0);
	if (failing.length > 0) {
		lines.push("Validation issues to inspect:");
		for (const digest of failing) {
			lines.push(`- ${digest.path}: ${digest.issueCount ?? 0} issue(s)`);
		}
		lines.push("");
	}
}

function renderEvalPlans(lines, evalPlans) {
	lines.push("## Eval Plans");
	lines.push("");
	if (evalPlans.length === 0) {
		lines.push("No eval-plan packets were found.");
		lines.push("");
		return;
	}
	lines.push(...table(["Packet", "Plans", "Skipped", "Skipped by reason", "Zero-plan reason"], evalPlans.map((digest) => [
		digest.path,
		digest.evalPlanCount,
		digest.skippedClaimCount,
		formatCounts(digest.skippedByReason),
		digest.zeroPlanReason || "-",
	])));
	lines.push("");
	const latestWithExpectation = [...evalPlans].reverse().find((digest) => digest.zeroPlanExpectation);
	if (latestWithExpectation) {
		lines.push(`Latest zero-plan expectation: ${compactText(latestWithExpectation.zeroPlanExpectation)}`);
		lines.push("");
	}
}

function refreshPlanMatchesCurrentPacket(refreshPlan, claimsPacket, statusPacket) {
	const packetCommit = claimsPacket?.gitCommit;
	const statusCommit = statusPacket?.gitCommit;
	const currentCommit = statusPacket?.gitState?.currentGitCommit;
	return [packetCommit, statusCommit, currentCommit].filter(Boolean).includes(refreshPlan.targetCommit);
}

function renderRefreshPlans(lines, refreshPlans, claimsPacket, statusPacket) {
	lines.push("## Refresh Plans");
	lines.push("");
	if (refreshPlans.length === 0) {
		lines.push("No refresh-plan packets were found.");
		lines.push("");
		return;
	}
	lines.push(...table(["Packet", "Status", "Changed sources", "Changed claims", "Carried forward"], refreshPlans.map((digest) => [
		digest.path,
		digest.status,
		digest.changedSourceCount,
		digest.changedClaimCount,
		digest.carriedForwardClaimCount,
	])));
	lines.push("");
	const latest = latestByMtime(refreshPlans);
	if (!latest) {
		return;
	}
	lines.push(`Latest refresh summary: ${compactText(latest.summary) || "-"}`);
	if (!refreshPlanMatchesCurrentPacket(latest, claimsPacket, statusPacket)) {
		lines.push("Latest refresh plan is historical for this status packet; its next actions are not the current review queue.");
		lines.push("");
		return;
	}
	if (latest.changedClaimSources.length > 0) {
		const sources = latest.changedClaimSources
			.slice(0, 5)
			.map((source) => `${source.path}: ${source.claimCount}`)
			.join(", ");
		lines.push(`Latest changed claim sources: ${sources}${latest.changedClaimSources.length > 5 ? ", ..." : ""}`);
	}
	for (const action of latest.nextActions.slice(0, 3)) {
		lines.push(`- ${action.label ?? action.id}: ${compactText(action.detail)}`);
	}
	lines.push("");
}

function latestByMtime(digests) {
	return [...digests].sort((left, right) => Number(right.mtimeMs ?? 0) - Number(left.mtimeMs ?? 0))[0];
}

function nextWorkLines(statusPacket) {
	const buckets = primaryBuckets(statusPacket);
	const byId = new Map(buckets.map((bucket) => [bucket.id, bucket]));
	const lines = [];
	const humanBuckets = ["human-align-surfaces", "human-confirm-or-decompose", "split-or-defer"]
		.map((id) => byId.get(id))
		.filter((bucket) => bucket && Number(bucket.count ?? 0) > 0);
	if (humanBuckets.length > 0) {
		lines.push(`Human review is still meaningful for ${humanBuckets.map((bucket) => `${bucket.id}=${bucket.count}`).join(", ")}.`);
	}
	const deterministic = byId.get("agent-add-deterministic-proof");
	if (deterministic && Number(deterministic.count ?? 0) > 0) {
		lines.push(`Agent next proof work: connect deterministic gates for ${deterministic.count} claim(s), starting with agent-reviewed items before heuristic items.`);
	}
	const evalBucket = byId.get("agent-plan-cautilus-eval");
	if (evalBucket && Number(evalBucket.count ?? 0) > 0) {
		lines.push(`Agent eval work: plan Cautilus eval scenarios for ${evalBucket.count} claim(s), after reviewing heuristic labels where needed.`);
	}
	const scenario = byId.get("agent-design-scenario");
	if (scenario && Number(scenario.count ?? 0) > 0) {
		lines.push(`Scenario design work remains for ${scenario.count} claim(s).`);
	}
	if (lines.length === 0) {
		lines.push("No primary next-work bucket is currently outstanding.");
	}
	return lines;
}

function renderNextWork(lines, statusPacket) {
	lines.push("## Next Work");
	lines.push("");
	for (const line of nextWorkLines(statusPacket)) {
		lines.push(`- ${line}`);
	}
	lines.push("");
}

export function renderStatusReport({ claimsPacket, statusPacket, digests, args }) {
	const lines = [];
	const claimsById = claimMap(claimsPacket);
	const currentReviewResults = reviewResultsForClaims(digests.reviewResults, claimsById);
	renderHeader(lines, claimsPacket, statusPacket, args);
	renderScoreboard(lines, claimsPacket, statusPacket);
	lines.push(...renderCanonicalMapSection({ canonicalMap: digests.canonicalMap, formatCounts, table }));
	renderNextWork(lines, statusPacket);
	renderActionBuckets(lines, statusPacket, claimsById, args.samplePerBucket);
	renderReviewResults(lines, currentReviewResults, claimsById, args.reviewSample);
	renderValidation(lines, digests.validationReports);
	renderEvalPlans(lines, digests.evalPlans);
	renderRefreshPlans(lines, digests.refreshPlans, claimsPacket, statusPacket);
	renderDiscoveryBoundary(lines, claimsPacket);
	return `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

export function buildStatusReport(args) {
	const claimsPacket = readJSON(args.claims);
	const statusPacket = readOptionalJSON(args.status) ?? {};
	const digests = collectDigests(args);
	digests.canonicalMap = readOptionalJSON(args.canonicalMap);
	if (digests.canonicalMap) {
		digests.canonicalMap.path = args.canonicalMap;
		digests.canonicalMap.inputStatus = canonicalMapInputStatus(digests.canonicalMap, args);
	}
	return renderStatusReport({ claimsPacket, statusPacket, digests, args });
}

function canonicalMapInputStatus(canonicalMap, args) {
	const claimsHash = canonicalMap?.inputs?.claims?.contentHash;
	if (!claimsHash) {
		return "unknown; canonical map does not record input hashes";
	}
	return claimsHash === fileHash(args.claims) ? "current" : "stale; claims packet hash differs";
}

function main() {
	const args = parseArgs(process.argv);
	const output = buildStatusReport(args);
	fs.mkdirSync(path.dirname(args.output), { recursive: true });
	fs.writeFileSync(args.output, output, "utf8");
	console.log(`wrote ${args.output}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
