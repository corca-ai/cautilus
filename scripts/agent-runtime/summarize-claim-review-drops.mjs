#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import { selectDroppedUpdateSamples } from "./drop-sample-selection.mjs";

const DEFAULT_CLAIMS = ".cautilus/claims/evidenced-typed-runners.json";
const DEFAULT_OUTPUT = ".cautilus/claims/review-drops-summary.json";
const DEFAULT_MARKDOWN = ".cautilus/claims/review-drops-summary.md";

export function parseArgs(argv) {
	const args = {
		claims: DEFAULT_CLAIMS,
		output: DEFAULT_OUTPUT,
		markdown: DEFAULT_MARKDOWN,
		sampleLimit: 20,
		check: false,
	};
	for (let index = 2; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--claims") {
			args.claims = argv[++index];
		} else if (arg === "--output") {
			args.output = argv[++index];
		} else if (arg === "--markdown") {
			args.markdown = argv[++index];
		} else if (arg === "--sample-limit") {
			args.sampleLimit = parsePositiveInteger(argv[++index], arg);
		} else if (arg === "--check") {
			args.check = true;
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

function writeText(filePath, value) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, value, "utf8");
}

function compactText(value) {
	return String(value ?? "")
		.replace(/\s+/g, " ")
		.trim();
}

const asArray = (value) => (Array.isArray(value) ? value : []);

const asObject = (value) => (!value || Array.isArray(value) || typeof value !== "object" ? {} : value);

function countEntries(counts) {
	return Object.entries(asObject(counts)).sort((left, right) => String(left[0]).localeCompare(String(right[0])));
}

function mergeReasonCounts(samples) {
	const counts = {};
	for (const sample of samples) {
		const reason = sample.reason || "unknown";
		counts[reason] = (counts[reason] || 0) + 1;
	}
	return counts;
}

function actionClassForReason(reason) {
	if (reason === "missing-fingerprint") {
		return {
			actionClass: "unrecoverable",
			recommendedAction: "Do not infer-match this update; regenerate or re-review against the current claim packet so the update carries claimFingerprint.",
			queueHint: "Prepare fresh review-input for the currently live claims instead of carrying the stale update forward.",
		};
	}
	if (reason === "missing-live-fingerprint") {
		return {
			actionClass: "stale-fingerprint",
			recommendedAction: "Treat this as stale review debt; inspect whether the source claim was removed, rewritten, or should be reviewed again in the current packet.",
			queueHint: "Use the reviewResultPath and claimFingerprint to decide whether a focused review-input queue is warranted.",
		};
	}
	return {
		actionClass: "unknown",
		recommendedAction: "Inspect the dropped update reason before acting.",
		queueHint: "No automatic queue hint is available for this reason.",
	};
}

function sampleCoverage(reasonCounts, sampleReasonCounts) {
	return countEntries(reasonCounts).map(([reason, count]) => {
		const recordedSampleCount = sampleReasonCounts[reason] || 0;
		return {
			reason,
			count,
			recordedSampleCount,
			sampleStatus: recordedSampleCount > 0 ? "represented" : "not-represented",
		};
	});
}

function actionClassForCoverage(coverage) {
	const action = actionClassForReason(coverage.reason);
	if (coverage.sampleStatus === "not-represented") {
		return {
			reason: coverage.reason,
			count: coverage.count,
			recordedSampleCount: coverage.recordedSampleCount,
			sampleStatus: coverage.sampleStatus,
			actionClass: action.actionClass,
			recommendedAction: `This packet proves ${coverage.count} count-level dropped update(s) for this reason but records no samples; run a reason-targeted diagnostic or improve upstream sampling before selecting a focused re-review queue.`,
			queueHint: "No bounded queue can be selected from this packet for this reason because no dropped samples were recorded.",
		};
	}
	return {
		reason: coverage.reason,
		count: coverage.count,
		recordedSampleCount: coverage.recordedSampleCount,
		sampleStatus: coverage.sampleStatus,
		...action,
	};
}

function actionClasses(coverage) {
	return coverage.map(actionClassForCoverage);
}

function nextActions(actions) {
	if (actions.length === 0) {
		return ["No dropped update reason counts were recorded."];
	}
	return actions.map((action) => {
		if (action.sampleStatus === "not-represented") {
			return `${action.reason}: Treat ${action.count} dropped update(s) as count-level review debt only; run reason-targeted diagnostics or improve replay sampling before selecting a queue.`;
		}
		if (action.reason === "missing-fingerprint") {
			return "missing-fingerprint: Regenerate or re-review current live claims so new updates carry claimFingerprint; do not infer-match fingerprintless drops.";
		}
		if (action.reason === "missing-live-fingerprint") {
			return "missing-live-fingerprint: Inspect represented samples' reviewResultPath and claimFingerprint before deciding whether a focused current-packet re-review is warranted.";
		}
		return `${action.reason}: Inspect represented samples before acting.`;
	});
}

function bucketSamples(samples) {
	const buckets = new Map();
	for (const sample of samples) {
		const key = sample.reviewResultPath || "unknown";
		if (!buckets.has(key)) {
			buckets.set(key, {
				reviewResultPath: key,
				droppedSampleCount: 0,
				reasonCounts: {},
				sampleClaimIds: [],
			});
		}
		const bucket = buckets.get(key);
		bucket.droppedSampleCount += 1;
		const reason = sample.reason || "unknown";
		bucket.reasonCounts[reason] = (bucket.reasonCounts[reason] || 0) + 1;
		if (bucket.sampleClaimIds.length < 5) {
			bucket.sampleClaimIds.push(sample.claimId || "<no claimId>");
		}
	}
	return [...buckets.values()].sort((left, right) => {
		if (left.droppedSampleCount !== right.droppedSampleCount) {
			return right.droppedSampleCount - left.droppedSampleCount;
		}
		return left.reviewResultPath.localeCompare(right.reviewResultPath);
	});
}

function normalizeSamples(samples, sampleLimit) {
	return selectDroppedUpdateSamples(samples, sampleLimit).map((sample) => {
		const reason = sample.reason || "unknown";
		const action = actionClassForReason(reason);
		return {
			reviewResultPath: sample.reviewResultPath || "unknown",
			claimId: sample.claimId || "",
			claimFingerprint: sample.claimFingerprint || "",
			reason,
			actionClass: action.actionClass,
		};
	});
}

function sourcePacketMeta(claimsPacket, claimsPath) {
	return {
		path: claimsPath,
		schemaVersion: claimsPacket?.schemaVersion || "unknown",
		gitCommit: claimsPacket?.gitCommit || "unknown",
		candidateCount: Array.isArray(claimsPacket?.claimCandidates) ? claimsPacket.claimCandidates.length : 0,
	};
}

export function buildReviewDropSummary({ claimsPacket, claimsPath = DEFAULT_CLAIMS, sampleLimit = 20 }) {
	const reviewApplication = asObject(claimsPacket?.reviewApplication);
	const reasonCounts = asObject(reviewApplication.droppedUpdateReasonCounts);
	const rawSamples = asArray(reviewApplication.droppedUpdateSamples);
	const sourceSamplePolicy = asObject(reviewApplication.droppedUpdateSamplePolicy);
	validateSourceSamplePolicy({
		droppedUpdateCount: reviewApplication.droppedUpdateCount ?? 0,
		rawSamples,
		sourceSamplePolicy,
	});
	const samples = normalizeSamples(rawSamples, sampleLimit);
	const sampleReasonCounts = mergeReasonCounts(samples);
	const coverage = sampleCoverage(reasonCounts, sampleReasonCounts);
	const actions = actionClasses(coverage);
	return {
		schemaVersion: "cautilus.claim_review_drop_summary.v1",
		packetNotice: "Diagnostic projection over aggregate review replay drops; this packet does not recover or infer-match dropped updates.",
		sourceClaimPacket: sourcePacketMeta(claimsPacket, claimsPath),
		samplePolicy: {
			selection: "bounded-reason-representation",
			maxRecordedSamples: sampleLimit,
			sourceRecordedSampleCount: rawSamples.length,
			selectedSampleCount: samples.length,
			preservesSourceSampleReasonRepresentationWhenCapAllows: true,
			proportionalSampling: false,
			sourceReviewApplicationSamplePolicy: Object.keys(sourceSamplePolicy).length > 0 ? sourceSamplePolicy : null,
		},
		replaySummary: {
			appliedResultCount: reviewApplication.appliedResultCount ?? 0,
			skippedResultCount: reviewApplication.skippedResultCount ?? 0,
			keptUpdateCount: reviewApplication.keptUpdateCount ?? 0,
			rewrittenUpdateCount: reviewApplication.rewrittenUpdateCount ?? 0,
			droppedUpdateCount: reviewApplication.droppedUpdateCount ?? 0,
			droppedUpdateReasonCounts: reasonCounts,
			recordedSampleCount: samples.length,
			recordedSampleReasonCounts: sampleReasonCounts,
		},
		sampleCoverage: coverage,
		actionClasses: actions,
		reviewResultBuckets: bucketSamples(samples),
		droppedUpdateSamples: samples,
		nextAction: "Use represented dropped-update samples only when selecting a bounded re-review queue; treat unsampled reason classes as count-level diagnostic debt.",
		nextActions: nextActions(actions),
	};
}

function validateSourceSamplePolicy({ droppedUpdateCount, rawSamples, sourceSamplePolicy }) {
	const hasPolicy = Object.keys(sourceSamplePolicy).length > 0;
	if (droppedUpdateCount > 0 && !hasPolicy) {
		throw new Error("reviewApplication.droppedUpdateSamplePolicy is required when droppedUpdateCount is greater than zero");
	}
	if (!hasPolicy) {
		return;
	}
	const sourceDroppedUpdateCount = sourceSamplePolicy.sourceDroppedUpdateCount;
	if (sourceDroppedUpdateCount !== droppedUpdateCount) {
		throw new Error(
			`reviewApplication.droppedUpdateSamplePolicy.sourceDroppedUpdateCount ${sourceDroppedUpdateCount} does not match droppedUpdateCount ${droppedUpdateCount}`,
		);
	}
	const selectedSampleCount = sourceSamplePolicy.selectedSampleCount;
	if (selectedSampleCount !== rawSamples.length) {
		throw new Error(
			`reviewApplication.droppedUpdateSamplePolicy.selectedSampleCount ${selectedSampleCount} does not match droppedUpdateSamples length ${rawSamples.length}`,
		);
	}
	const maxRecordedSamples = sourceSamplePolicy.maxRecordedSamples;
	if (typeof maxRecordedSamples !== "number" || maxRecordedSamples < rawSamples.length) {
		throw new Error(
			`reviewApplication.droppedUpdateSamplePolicy.maxRecordedSamples ${maxRecordedSamples} is lower than droppedUpdateSamples length ${rawSamples.length}`,
		);
	}
}

function formatCounts(counts) {
	const entries = countEntries(counts);
	if (entries.length === 0) {
		return "-";
	}
	return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
}

function renderActionClasses(lines, summary) {
	lines.push("## Action Classes");
	lines.push("");
	if (summary.actionClasses.length === 0) {
		lines.push("No dropped update reason counts were recorded.");
		lines.push("");
		return;
	}
	for (const action of summary.actionClasses) {
		lines.push(`- ${action.reason}: ${action.count} update(s)`);
		lines.push(`  - Class: ${action.actionClass}`);
		lines.push(`  - Sample coverage: ${action.recordedSampleCount}/${action.count}; ${action.sampleStatus}`);
		lines.push(`  - Action: ${action.recommendedAction}`);
		lines.push(`  - Queue hint: ${action.queueHint}`);
	}
	lines.push("");
}

function renderReviewResultBuckets(lines, summary) {
	lines.push("## Review Result Samples");
	lines.push("");
	if (summary.reviewResultBuckets.length === 0) {
		lines.push("No dropped update samples were recorded.");
		lines.push("");
		return;
	}
	for (const bucket of summary.reviewResultBuckets.slice(0, 10)) {
		lines.push(`- ${bucket.reviewResultPath}`);
		lines.push(`  - Recorded sample drops: ${bucket.droppedSampleCount}`);
		lines.push(`  - Reasons: ${formatCounts(bucket.reasonCounts)}`);
		lines.push(`  - Sample claim ids: ${bucket.sampleClaimIds.join(", ")}`);
	}
	lines.push("");
}

function renderSampleCoverage(lines, summary) {
	lines.push("## Sample Coverage");
	lines.push("");
	if (!summary.sampleCoverage || summary.sampleCoverage.length === 0) {
		lines.push("No dropped update reason counts were recorded.");
		lines.push("");
		return;
	}
	for (const coverage of summary.sampleCoverage) {
		lines.push(`- ${coverage.reason}: ${coverage.recordedSampleCount}/${coverage.count} recorded sample(s); ${coverage.sampleStatus}`);
	}
	lines.push("");
}

function renderSamples(lines, summary) {
	lines.push("## Bounded Samples");
	lines.push("");
	if (summary.droppedUpdateSamples.length === 0) {
		lines.push("No bounded samples were recorded.");
		lines.push("");
		return;
	}
	for (const sample of summary.droppedUpdateSamples) {
		const fingerprint = sample.claimFingerprint ? ` @ ${sample.claimFingerprint}` : "";
		lines.push(`- ${sample.claimId || "<no claimId>"}${fingerprint}`);
		lines.push(`  - Review result: ${sample.reviewResultPath}`);
		lines.push(`  - Reason: ${sample.reason}`);
		lines.push(`  - Action class: ${sample.actionClass}`);
	}
	lines.push("");
}

export function renderReviewDropSummary(summary) {
	const lines = [];
	lines.push("# Claim Review Drop Summary");
	lines.push("");
	lines.push("This is a readable projection of aggregate claim review replay drops.");
	lines.push("Use the JSON packet as the audit source; this document does not recover stale updates or infer identity.");
	lines.push("");
	lines.push("## Packet");
	lines.push("");
	lines.push(`- Source claim packet: ${summary.sourceClaimPacket.path}`);
	lines.push(`- Source claim packet commit: ${summary.sourceClaimPacket.gitCommit}`);
	lines.push(`- Source claim count: ${summary.sourceClaimPacket.candidateCount}`);
	lines.push(`- Applied review results: ${summary.replaySummary.appliedResultCount}`);
	lines.push(`- Skipped review results: ${summary.replaySummary.skippedResultCount}`);
	lines.push(`- Kept updates: ${summary.replaySummary.keptUpdateCount}`);
	lines.push(`- Rewritten updates: ${summary.replaySummary.rewrittenUpdateCount}`);
	lines.push(`- Dropped updates: ${summary.replaySummary.droppedUpdateCount}`);
	lines.push(`- Drop reasons: ${formatCounts(summary.replaySummary.droppedUpdateReasonCounts)}`);
	lines.push(`- Recorded samples: ${summary.replaySummary.recordedSampleCount}`);
	if (summary.samplePolicy) {
		lines.push(`- Sample policy: ${summary.samplePolicy.selection}`);
		lines.push(`- Sample cap: ${summary.samplePolicy.maxRecordedSamples}`);
		lines.push(`- Source recorded samples: ${summary.samplePolicy.sourceRecordedSampleCount}`);
		lines.push(`- Selected samples: ${summary.samplePolicy.selectedSampleCount}`);
		lines.push(`- Proportional sampling: ${summary.samplePolicy.proportionalSampling ? "yes" : "no"}`);
		if (summary.samplePolicy.sourceReviewApplicationSamplePolicy) {
			lines.push(`- Source replay sample policy: ${summary.samplePolicy.sourceReviewApplicationSamplePolicy.selection}`);
		}
	}
	lines.push("");
	renderActionClasses(lines, summary);
	renderSampleCoverage(lines, summary);
	renderReviewResultBuckets(lines, summary);
	renderSamples(lines, summary);
	lines.push("## Next Action");
	lines.push("");
	if (Array.isArray(summary.nextActions) && summary.nextActions.length > 0) {
		for (const action of summary.nextActions) {
			lines.push(`- ${compactText(action)}`);
		}
	} else {
		lines.push(`- ${compactText(summary.nextAction)}`);
	}
	lines.push("");
	return `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

export function buildReviewDropSummaryFromArgs(args) {
	const claimsPacket = readJSON(args.claims);
	return buildReviewDropSummary({ claimsPacket, claimsPath: args.claims, sampleLimit: args.sampleLimit });
}

function stableJSON(value) {
	return `${JSON.stringify(value, null, 2)}\n`;
}

function assertCurrent(filePath, expected, command) {
	if (!fs.existsSync(filePath)) {
		throw new Error(`${filePath} is missing; run ${command}`);
	}
	const actual = fs.readFileSync(filePath, "utf8");
	if (actual !== expected) {
		throw new Error(`${filePath} is stale; run ${command}`);
	}
}

function main() {
	const args = parseArgs(process.argv);
	const summary = buildReviewDropSummaryFromArgs(args);
	const jsonOutput = stableJSON(summary);
	const markdownOutput = renderReviewDropSummary(summary);
	if (args.check) {
		assertCurrent(args.output, jsonOutput, "npm run claims:review-drops");
		assertCurrent(args.markdown, markdownOutput, "npm run claims:review-drops");
		return;
	}
	writeText(args.output, jsonOutput);
	writeText(args.markdown, markdownOutput);
	console.log(`wrote ${args.output}`);
	console.log(`wrote ${args.markdown}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
