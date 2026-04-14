import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";

import { loadAdapter } from "../resolve_adapter.mjs";

const TOOL_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
const BIN_PATH = join(TOOL_ROOT, "bin", "cautilus");
const REVIEW_STATUS_RANK = new Map([
	["pass", 0],
	["concern", 1],
	["blocker", 2],
]);

function readJson(path) {
	return JSON.parse(readFileSync(path, "utf-8"));
}

function checkpointEnv(env) {
	return {
		...env,
		CAUTILUS_RUN_DIR: undefined,
	};
}

function adapterPayload(packet) {
	const evaluationContext = packet.evaluationContext || {};
	return loadAdapter(packet.repoRoot, {
		adapter: evaluationContext.adapter || null,
		adapterName: evaluationContext.adapterName || null,
	});
}

function adapterArgs(packet) {
	const evaluationContext = packet.evaluationContext || {};
	return [
		...(evaluationContext.adapter ? ["--adapter", evaluationContext.adapter] : []),
		...(evaluationContext.adapterName ? ["--adapter-name", evaluationContext.adapterName] : []),
	];
}

function candidateWorkspace(packet, candidate) {
	return candidate.evaluationArtifacts?.worktreeRoot || packet.repoRoot;
}

function candidateReportFile(packet, candidate) {
	return candidate.evaluationArtifacts?.reportFile
		|| packet.evaluationFiles?.reportFile
		|| packet.optimizeInput?.reportFile
		|| null;
}

function reviewStatusFromVariant(variant) {
	if (variant?.status !== "passed") {
		return "blocker";
	}
	const verdict = typeof variant?.output?.verdict === "string" ? variant.output.verdict : "concern";
	return REVIEW_STATUS_RANK.has(verdict) ? verdict : "concern";
}

function reviewRejectionReasons(summary) {
	return (Array.isArray(summary?.variants) ? summary.variants : []).flatMap((variant) => {
		const status = reviewStatusFromVariant(variant);
		return status === "pass" ? [] : [`review:${variant.id || "variant"}:${status}`];
	});
}

function reviewFeedbackMessages(summary) {
	return (Array.isArray(summary?.variants) ? summary.variants : []).flatMap((variant) => {
		const findings = Array.isArray(variant?.output?.findings) ? variant.output.findings : [];
		const messages = findings
			.map((finding) => finding?.message)
			.filter((message) => typeof message === "string" && message.length > 0);
		if (messages.length > 0) {
			return messages;
		}
		if (typeof variant?.output?.summary === "string" && variant.output.summary.length > 0) {
			return [variant.output.summary];
		}
		return [];
	});
}

function normalizedReviewSeverity(value, fallback = "concern") {
	return REVIEW_STATUS_RANK.has(value) ? value : fallback;
}

function feedbackEntryFor(variant, message, severity) {
	if (typeof message !== "string" || message.length === 0) {
		return null;
	}
	const normalizedSeverity = normalizedReviewSeverity(severity, reviewStatusFromVariant(variant));
	return {
		message,
		severity: normalizedSeverity,
		rejectionReason: `review:${variant?.id || "variant"}:${normalizedSeverity}`,
	};
}

function findingFeedbackEntries(variant) {
	const findings = Array.isArray(variant?.output?.findings) ? variant.output.findings : [];
	return findings
		.map((finding) => feedbackEntryFor(variant, finding?.message, finding?.severity))
		.filter(Boolean);
}

function summaryFeedbackEntry(variant) {
	if (typeof variant?.output?.summary !== "string" || variant.output.summary.length === 0) {
		return null;
	}
	return feedbackEntryFor(variant, variant.output.summary, reviewStatusFromVariant(variant));
}

function reviewFeedbackEntries(summary) {
	return (Array.isArray(summary?.variants) ? summary.variants : []).flatMap((variant) => {
		const findings = findingFeedbackEntries(variant);
		if (findings.length > 0) {
			return findings;
		}
		const fallback = summaryFeedbackEntry(variant);
		return fallback ? [fallback] : [];
	});
}

function hasExecutorVariants(payload) {
	return Array.isArray(payload?.data?.executor_variants) && payload.data.executor_variants.length > 0;
}

function hasFullGateSurface(payload) {
	return Array.isArray(payload?.data?.full_gate_command_templates) && payload.data.full_gate_command_templates.length > 0;
}

function runCommand(args, env) {
	return spawnSync(BIN_PATH, args, {
		cwd: TOOL_ROOT,
		env: checkpointEnv(env),
		encoding: "utf-8",
	});
}

function skipOutcome(type, candidate, reason) {
	return {
		type,
		candidateId: candidate.id,
		status: "skipped",
		admissible: true,
		rejectionReasons: [],
		skipReason: reason,
	};
}

function reviewFailureOutcome(candidate, outputDir, summaryFile, result, reason) {
	return {
		type: "review",
		candidateId: candidate.id,
		status: "failed",
		admissible: false,
		rejectionReasons: [reason],
		outputDir,
		summaryFile,
		stdout: result.stdout || "",
		stderr: result.stderr || "",
	};
}

function reviewOutcomeForSelection(packet, artifactRoot, candidate, env) {
	if (packet.searchConfig?.reviewCheckpointPolicy === "frontier_promotions") {
		if (candidate.promotionReviewOutcome) {
			return {
				outcome: candidate.promotionReviewOutcome,
				executed: false,
			};
		}
		const outcome = runReviewCheckpoint(packet, artifactRoot, candidate, env);
		candidate.promotionReviewOutcome = outcome;
		return { outcome, executed: true };
	}
	return {
		outcome: runReviewCheckpoint(packet, artifactRoot, candidate, env),
		executed: true,
	};
}

export function runReviewCheckpoint(packet, artifactRoot, candidate, env) {
	const payload = adapterPayload(packet);
	if (!payload.found || !payload.valid || !hasExecutorVariants(payload)) {
		return skipOutcome("review", candidate, !payload.found ? "adapter_not_found" : "surface_unavailable");
	}
	const reportFile = candidateReportFile(packet, candidate);
	if (!reportFile || !existsSync(reportFile)) {
		return skipOutcome("review", candidate, "report_missing");
	}
	const outputDir = join(artifactRoot, "optimize-search-checkpoints", candidate.id, "review");
	mkdirSync(outputDir, { recursive: true });
	const result = runCommand([
		"review",
		"variants",
		"--repo-root",
		packet.repoRoot,
		"--workspace",
		candidateWorkspace(packet, candidate),
		"--report-file",
		reportFile,
		"--output-dir",
		outputDir,
		"--quiet",
		...adapterArgs(packet),
	], env);
	const summaryFile = join(outputDir, "review-summary.json");
	if (!existsSync(summaryFile)) {
		return reviewFailureOutcome(candidate, outputDir, summaryFile, result, "review:summary_missing");
	}
	const summary = readJson(summaryFile);
	const rejectionReasons = reviewRejectionReasons(summary);
	const feedbackEntries = reviewFeedbackEntries(summary);
	const feedbackMessages = reviewFeedbackMessages(summary);
	return {
		type: "review",
		candidateId: candidate.id,
		status: result.status === 0 ? "passed" : "failed",
		admissible: rejectionReasons.length === 0,
		rejectionReasons,
		feedbackEntries,
		feedbackMessages,
		outputDir,
		summaryFile,
		telemetry: summary.telemetry || null,
		variants: Array.isArray(summary.variants) ? summary.variants.map((variant) => ({
			id: variant.id,
			status: variant.status,
			verdict: variant.output?.verdict ?? null,
			findingsCount: Array.isArray(variant.output?.findings) ? variant.output.findings.length : 0,
			outputFile: variant.outputFile || null,
		})) : [],
	};
}

function fullGateArgs(packet, candidate, outputDir) {
	const evaluationContext = packet.evaluationContext || {};
	return [
		"mode",
		"evaluate",
		"--repo-root",
		packet.repoRoot,
		"--candidate-repo",
		candidateWorkspace(packet, candidate),
		"--mode",
		"full_gate",
		"--intent",
		evaluationContext.intent || packet.optimizeInput?.report?.intent || "Prompt candidate evaluation",
		"--baseline-ref",
		evaluationContext.baselineRef || packet.optimizeInput?.report?.baseline || "HEAD",
		"--output-dir",
		outputDir,
		"--quiet",
		...adapterArgs(packet),
		...(evaluationContext.profile ? ["--profile", evaluationContext.profile] : []),
		...(evaluationContext.split ? ["--split", evaluationContext.split] : []),
	];
}

export function runFullGateCheckpoint(packet, artifactRoot, candidate, env) {
	const payload = adapterPayload(packet);
	if (!payload.found || !payload.valid || !hasFullGateSurface(payload)) {
		return skipOutcome("full_gate", candidate, !payload.found ? "adapter_not_found" : "surface_unavailable");
	}
	const outputDir = join(artifactRoot, "optimize-search-checkpoints", candidate.id, "full-gate");
	mkdirSync(outputDir, { recursive: true });
	const result = runCommand(fullGateArgs(packet, candidate, outputDir), env);
	const reportFile = join(outputDir, "report.json");
	if (!existsSync(reportFile)) {
		return {
			type: "full_gate",
			candidateId: candidate.id,
			status: "failed",
			admissible: false,
			rejectionReasons: ["full_gate:report_missing"],
			outputDir,
			reportFile,
			stdout: result.stdout || "",
			stderr: result.stderr || "",
		};
	}
	const report = readJson(reportFile);
	const admissible = report.recommendation === "accept-now";
	return {
		type: "full_gate",
		candidateId: candidate.id,
		status: result.status === 0 ? "passed" : "failed",
		admissible,
		rejectionReasons: admissible ? [] : [`full_gate:${report.recommendation || "reject"}`],
		outputDir,
		reportFile,
		recommendation: report.recommendation || null,
	};
}

export function evaluateCandidateCheckpoints(packet, artifactRoot, candidate, env) {
	const reviewResult = reviewOutcomeForSelection(packet, artifactRoot, candidate, env);
	const review = reviewResult.outcome;
	if (!review.admissible) {
		return {
			admissible: false,
			rejectionReasons: review.rejectionReasons,
			review,
			fullGate: skipOutcome("full_gate", candidate, "review_rejected"),
			executed: {
				review: reviewResult.executed,
				fullGate: false,
			},
		};
	}
	const fullGate = packet.searchConfig?.fullGateCheckpointPolicy === "final_only"
		? runFullGateCheckpoint(packet, artifactRoot, candidate, env)
		: skipOutcome("full_gate", candidate, "policy_disabled");
	return {
		admissible: fullGate.admissible,
		rejectionReasons: [...review.rejectionReasons, ...fullGate.rejectionReasons],
		review,
		fullGate,
		executed: {
			review: reviewResult.executed,
			fullGate: fullGate.status !== "skipped",
		},
	};
}
