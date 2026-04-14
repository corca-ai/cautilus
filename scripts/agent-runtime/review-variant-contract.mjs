import {
	REVIEW_SUMMARY_SCHEMA,
	REVIEW_VARIANT_RESULT_SCHEMA,
} from "./contract-versions.mjs";

const EXECUTION_STATUS_MAP = {
	"": "passed",
	passed: "passed",
	completed: "passed",
	success: "passed",
	ok: "passed",
	blocked: "blocked",
	abort: "blocked",
	aborted: "blocked",
	skipped: "blocked",
	failed: "failed",
	error: "failed",
};

function sumTelemetryField(variants, field) {
	let seen = false;
	let total = 0;
	for (const variant of variants) {
		const value = variant.telemetry && typeof variant.telemetry[field] === "number"
			? variant.telemetry[field]
			: null;
		if (value === null) {
			continue;
		}
		seen = true;
		total += value;
	}
	return seen ? total : null;
}

function normalizeReviewSeverity(value) {
	if (value === "blocker" || value === "concern" || value === "pass") {
		return value;
	}
	return null;
}

function normalizeReviewVerdict(value) {
	return normalizeReviewSeverity(value);
}

function normalizeReasonCodes(value) {
	const items = Array.isArray(value) ? value : [];
	return Array.from(new Set(items.filter((item) => typeof item === "string" && item.trim().length > 0)));
}

function firstNonEmptyString(...values) {
	for (const value of values) {
		if (typeof value === "string" && value.trim().length > 0) {
			return value.trim();
		}
	}
	return "";
}

function normalizeVariantFindings(value, variantId) {
	const items = Array.isArray(value) ? value : [];
	return items
		.map((item, index) => {
			const message = typeof item?.message === "string" ? item.message.trim() : "";
			if (!message) {
				return null;
			}
			return {
				severity: normalizeReviewSeverity(item?.severity) || "concern",
				message,
				path: typeof item?.path === "string" && item.path.trim().length > 0
					? item.path.trim()
					: `variant/${variantId}/${index}`,
			};
		})
		.filter(Boolean);
}

function normalizeExecutionStatus(value) {
	const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
	return EXECUTION_STATUS_MAP[normalized] || "passed";
}

function withFallbackReasonCodes(reasonCodes, fallback) {
	return reasonCodes.length > 0 ? reasonCodes : [fallback];
}

function commandFailureDetails(result, output, reasonCodes) {
	return {
		status: "failed",
		reason: firstNonEmptyString(
			output?.reason,
			output?.message,
			result.stderr,
			result.stdout,
			"review variant command failed",
		),
		reasonCodes: withFallbackReasonCodes(reasonCodes, "command_failed"),
	};
}

function outputErrorDetails(outputError, reasonCodes) {
	return {
		status: "failed",
		reason: outputError.message,
		reasonCodes: withFallbackReasonCodes(reasonCodes, "invalid_output_json"),
	};
}

function missingOutputDetails(reasonCodes) {
	return {
		status: "failed",
		reason: "review variant did not produce a JSON object",
		reasonCodes: withFallbackReasonCodes(reasonCodes, "missing_output"),
	};
}

function blockedOutputDetails(output, reasonCodes) {
	return {
		status: "blocked",
		reason: firstNonEmptyString(
			output?.reason,
			output?.abortReason,
			output?.message,
			output?.summary,
			"review variant blocked without a reason",
		),
		reasonCodes: withFallbackReasonCodes(reasonCodes, "variant_blocked"),
	};
}

function failedOutputDetails(output, reasonCodes) {
	return {
		status: "failed",
		reason: firstNonEmptyString(
			output?.reason,
			output?.message,
			output?.summary,
			"review variant reported a failure",
		),
		reasonCodes: withFallbackReasonCodes(reasonCodes, "variant_failed"),
	};
}

function reportedOutputDetails(output, reasonCodes) {
	if (normalizeExecutionStatus(output?.status) === "blocked") {
		return blockedOutputDetails(output, reasonCodes);
	}
	if (normalizeExecutionStatus(output?.status) === "failed") {
		return failedOutputDetails(output, reasonCodes);
	}
	return {
		status: "passed",
		reason: "",
		reasonCodes,
	};
}

function buildFailureDetails(result, output, outputError, reasonCodes) {
	if (result.status !== "passed") {
		return commandFailureDetails(result, output, reasonCodes);
	}
	if (outputError) {
		return outputErrorDetails(outputError, reasonCodes);
	}
	if (output === null) {
		return missingOutputDetails(reasonCodes);
	}
	return reportedOutputDetails(output, reasonCodes);
}

function buildBaseVariantPacket(result, output) {
	const packet = {
		schemaVersion: REVIEW_VARIANT_RESULT_SCHEMA,
		variantId: result.id,
		tool: result.tool,
		status: "passed",
		findings: [],
	};
	if (!output || typeof output !== "object" || Array.isArray(output)) {
		return packet;
	}
	packet.rawOutput = output;
	if (output.telemetry && typeof output.telemetry === "object" && !Array.isArray(output.telemetry)) {
		packet.telemetry = output.telemetry;
	}
	if (normalizeReviewVerdict(output.verdict)) {
		packet.verdict = output.verdict;
	}
	if (typeof output.summary === "string" && output.summary.trim().length > 0) {
		packet.summary = output.summary.trim();
	}
	return packet;
}

function ensureFailureFinding(packet, findings, resultId, reason) {
	if (packet.status === "passed" || findings.length > 0) {
		return findings;
	}
	return [{
		severity: "blocker",
		message: firstNonEmptyString(packet.summary, reason, "review variant failed without details"),
		path: `variant/${resultId}`,
	}];
}

function ensureVariantSummary(packet, findings, resultId) {
	if (packet.summary) {
		return;
	}
	if (findings.length > 0) {
		packet.summary = findings[0].message;
		return;
	}
	if (typeof packet.verdict === "string") {
		packet.summary = `${resultId} review completed with verdict ${packet.verdict}.`;
		return;
	}
	packet.summary = `${resultId} review completed.`;
}

export function normalizeReviewVariantResult(result, output, outputError = null) {
	const packet = buildBaseVariantPacket(result, output);
	let findings = normalizeVariantFindings(output?.findings, result.id);
	const failureDetails = buildFailureDetails(
		result,
		output,
		outputError,
		normalizeReasonCodes(output?.reasonCodes),
	);
	packet.status = failureDetails.status;
	if (packet.status !== "passed") {
		packet.reason = failureDetails.reason;
		packet.reasonCodes = failureDetails.reasonCodes;
		if (!packet.summary) {
			packet.summary = failureDetails.reason;
		}
	}
	findings = ensureFailureFinding(packet, findings, result.id, failureDetails.reason);
	ensureVariantSummary(packet, findings, result.id);
	packet.findings = findings;
	return packet;
}

export function summarizeReviewVariantTelemetry(variants) {
	if (variants.length === 0) {
		return null;
	}
	const providers = Array.from(
		new Set(
			variants
				.map((variant) => variant.telemetry && variant.telemetry.provider)
				.filter((value) => typeof value === "string" && value.length > 0),
		),
	);
	const models = Array.from(
		new Set(
			variants
				.map((variant) => variant.telemetry && variant.telemetry.model)
				.filter((value) => typeof value === "string" && value.length > 0),
		),
	);
	const summary = {
		startedAt: variants[0].startedAt,
		completedAt: variants[variants.length - 1].completedAt,
		durationMs: variants.reduce((total, variant) => total + variant.durationMs, 0),
		averageVariantDurationMs:
			variants.reduce((total, variant) => total + variant.durationMs, 0) / variants.length,
		variantCount: variants.length,
		passedVariantCount: variants.filter((variant) => variant.status === "passed").length,
		blockedVariantCount: variants.filter((variant) => variant.status === "blocked").length,
		failedVariantCount: variants.filter((variant) => variant.status === "failed").length,
	};
	if (providers.length > 0) {
		summary.providers = providers;
	}
	if (models.length > 0) {
		summary.models = models;
	}
	for (const field of [
		"prompt_tokens",
		"completion_tokens",
		"total_tokens",
		"cost_usd",
	]) {
		const total = sumTelemetryField(variants, field);
		if (total !== null) {
			summary[field] = total;
		}
	}
	return summary;
}

export function overallReviewExecutionStatus(variants) {
	if (variants.some((variant) => variant.status === "failed")) {
		return "failed";
	}
	if (variants.some((variant) => variant.status === "blocked")) {
		return "blocked";
	}
	return "passed";
}

function reviewVerdictPriority(verdict) {
	switch (verdict) {
		case "blocker":
			return 2;
		case "concern":
			return 1;
		default:
			return 0;
	}
}

export function overallReviewVerdict(variants) {
	let verdict = "pass";
	for (const variant of variants) {
		if (variant.status !== "passed") {
			verdict = "blocker";
			continue;
		}
		const current = normalizeReviewVerdict(variant.output?.verdict);
		if (current && reviewVerdictPriority(current) > reviewVerdictPriority(verdict)) {
			verdict = current;
		}
	}
	return verdict;
}

export function collectReviewReasonCodes(variants) {
	return Array.from(new Set(variants.flatMap((variant) =>
		Array.isArray(variant.reasonCodes) ? variant.reasonCodes : [])));
}

export function flattenReviewFindings(variants) {
	return variants.flatMap((variant) => {
		const findings = Array.isArray(variant.output?.findings) ? variant.output.findings : [];
		return findings
			.filter((finding) => typeof finding?.message === "string" && finding.message.length > 0)
			.map((finding) => ({
				severity: normalizeReviewSeverity(finding.severity) || "concern",
				message: finding.message,
				...(typeof finding.path === "string" && finding.path.length > 0 ? { path: finding.path } : {}),
				...(variant.id ? { variantId: variant.id } : {}),
			}));
	});
}

export function buildReviewSummaryPacket({
	repoRoot,
	adapterPath,
	workspace,
	promptFile,
	reviewPacketFile,
	reviewPromptInputFile,
	schemaFile,
	outputDir,
	variants,
	now = new Date(),
}) {
	const humanReviewFindings = flattenReviewFindings(variants);
	return {
		schemaVersion: REVIEW_SUMMARY_SCHEMA,
		generatedAt: now.toISOString(),
		repoRoot,
		adapterPath,
		workspace,
		promptFile,
		reviewPacketFile,
		reviewPromptInputFile,
		schemaFile,
		outputDir,
		status: overallReviewExecutionStatus(variants),
		reviewVerdict: overallReviewVerdict(variants),
		reasonCodes: collectReviewReasonCodes(variants),
		humanReviewFindings,
		findingsCount: humanReviewFindings.length,
		telemetry: summarizeReviewVariantTelemetry(variants),
		variants,
	};
}
