import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { readActiveRunDir } from "./active-run.mjs";
import { buildBehaviorIntentProfile } from "./behavior-intent.mjs";
import {
	OPTIMIZE_INPUTS_SCHEMA,
	OPTIMIZE_PROPOSAL_SCHEMA,
	OPTIMIZE_SEARCH_RESULT_SCHEMA,
} from "./contract-versions.mjs";

const OPTIMIZER_KINDS = ["repair", "reflection", "history_followup"];
const OPTIMIZER_BUDGETS = {
	light: {
		evidenceLimit: 3,
		suggestedChangeLimit: 2,
		reviewVariantLimit: 1,
		historySignalLimit: 1,
	},
	medium: {
		evidenceLimit: 5,
		suggestedChangeLimit: 3,
		reviewVariantLimit: 2,
		historySignalLimit: 2,
	},
	heavy: {
		evidenceLimit: 8,
		suggestedChangeLimit: 4,
		reviewVariantLimit: 3,
		historySignalLimit: 4,
	},
};
const OPTIMIZER_SOURCE_PRIORITY = {
	repair: ["report.regressed", "review.finding", "report.noisy", "scenario_history", "report.improved"],
	reflection: ["review.finding", "report.noisy", "report.regressed", "scenario_history", "report.improved"],
	history_followup: ["scenario_history", "report.regressed", "review.finding", "report.noisy", "report.improved"],
};
const SEVERITY_PRIORITY = {
	blocker: 0,
	high: 1,
	medium: 2,
	concern: 2,
	low: 3,
};

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/generate-optimize-proposal.mjs --input <file> [--output <file>]",
		"",
		"Output packet:",
		`  schemaVersion: ${OPTIMIZE_PROPOSAL_SCHEMA}`,
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index];
	if (!value) {
		fail(`Missing value for ${option}`);
	}
	return value;
}

function parseArgs(argv) {
	const options = {
		input: null,
		fromSearch: null,
		output: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		const field = {
			"--input": "input",
			"--from-search": "fromSearch",
			"--output": "output",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		options[field] = readRequiredValue(argv, index + 1, arg);
		index += 1;
	}
	if (options.input && options.fromSearch) {
		fail("Use either --input or --from-search, not both");
	}
	return options;
}

function resolveCommandOptions(options, { env = process.env } = {}) {
	const activeRunDir = readActiveRunDir({ env });
	const resolved = {
		...options,
		input: options.input,
		output: options.output,
	};
	if (!resolved.input && activeRunDir) {
		resolved.input = join(activeRunDir, "optimize-input.json");
	}
	if (!resolved.input && !resolved.fromSearch) {
		fail("Use one of --input or --from-search");
	}
	if (!resolved.output && activeRunDir) {
		resolved.output = join(activeRunDir, "optimize-proposal.json");
	}
	return resolved;
}

function parseInputFile(path) {
	const resolved = resolve(path);
	if (!existsSync(resolved)) {
		fail(`optimize input not found: ${resolved}`);
	}
	const parsed = JSON.parse(readFileSync(resolved, "utf-8"));
	if (parsed?.schemaVersion !== OPTIMIZE_INPUTS_SCHEMA) {
		fail(`optimize input must use schemaVersion ${OPTIMIZE_INPUTS_SCHEMA}`);
	}
	return { path: resolved, packet: parsed };
}

function parseSearchResultFile(path) {
	const resolved = resolve(path);
	if (!existsSync(resolved)) {
		fail(`search result not found: ${resolved}`);
	}
	const parsed = JSON.parse(readFileSync(resolved, "utf-8"));
	if (parsed?.schemaVersion !== OPTIMIZE_SEARCH_RESULT_SCHEMA) {
		fail(`search result must use schemaVersion ${OPTIMIZE_SEARCH_RESULT_SCHEMA}`);
	}
	return { path: resolved, packet: parsed };
}

function normalizeSeverity(value) {
	return typeof value === "string" ? value.toLowerCase() : "concern";
}

function normalizeOptimizer(inputOptimizer) {
	const kind = OPTIMIZER_KINDS.includes(inputOptimizer?.kind) ? inputOptimizer.kind : "repair";
	const budget = Object.prototype.hasOwnProperty.call(OPTIMIZER_BUDGETS, inputOptimizer?.budget)
		? inputOptimizer.budget
		: "medium";
	const plan = {
		...OPTIMIZER_BUDGETS[budget],
		...(inputOptimizer?.plan && typeof inputOptimizer.plan === "object" ? inputOptimizer.plan : {}),
	};
	return { kind, budget, plan };
}

function gatherReviewFindings(reviewSummary, reviewVariantLimit) {
	if (!reviewSummary || !Array.isArray(reviewSummary.variants)) {
		return [];
	}
	return reviewSummary.variants.slice(0, reviewVariantLimit).flatMap((variant) => {
		const findings = Array.isArray(variant?.output?.findings) ? variant.output.findings : [];
		return findings
			.filter((finding) => typeof finding?.message === "string" && finding.message.length > 0)
			.map((finding, index) => ({
				source: "review.finding",
				key: `${variant.id || "variant"}:${finding.path || index}`,
				severity: normalizeSeverity(finding.severity),
				summary: `${variant.id || "variant"} ${normalizeSeverity(finding.severity)}: ${finding.message}`,
				message: finding.message,
				path: finding.path || null,
				variantId: variant.id || null,
				provenance: {
					packet: "reviewSummary",
					locator: `variants.${variant.id || "variant"}.findings.${finding.path || index}`,
				},
			}));
	});
}

function gatherHistorySignals(scenarioHistory, historySignalLimit) {
	if (!scenarioHistory || typeof scenarioHistory !== "object" || scenarioHistory === null) {
		return [];
	}
	return Object.entries(scenarioHistory.scenarioStats || {}).flatMap(([scenarioId, stats]) => {
		const latest = Array.isArray(stats?.recentTrainResults) ? stats.recentTrainResults[0] : null;
		if (!latest) {
			return [];
		}
		const imperfect =
			latest.status !== "passed" || latest.overallScore !== 100 || latest.passRate !== 1;
		if (!imperfect) {
			return [];
		}
		return [
			{
				source: "scenario_history",
				key: scenarioId,
				severity: "medium",
				summary: `${scenarioId} remains unstable in recent train history`,
				message: `${scenarioId} last train result was ${latest.status || "unknown"} with score ${latest.overallScore ?? "n/a"}.`,
				provenance: {
					packet: "scenarioHistory",
					locator: `scenarioStats.${scenarioId}`,
				},
			},
		];
	}).slice(0, historySignalLimit);
}

function buildEvidenceUniverse(packet, optimizer) {
	const report = packet.report || {};
	const regressed = Array.isArray(report.regressed) ? report.regressed : [];
	const noisy = Array.isArray(report.noisy) ? report.noisy : [];
	const reviewFindings = gatherReviewFindings(packet.reviewSummary, optimizer.plan.reviewVariantLimit);
	const historySignals = gatherHistorySignals(packet.scenarioHistory, optimizer.plan.historySignalLimit);
	return [
		...regressed.map((scenarioId) => ({
			source: "report.regressed",
			key: scenarioId,
			severity: "high",
			summary: `Regressed scenario: ${scenarioId}`,
			message: `${scenarioId} regressed in the current report.`,
			provenance: {
				packet: "report",
				locator: `regressed.${scenarioId}`,
			},
		})),
		...reviewFindings,
		...noisy.map((scenarioId) => ({
			source: "report.noisy",
			key: scenarioId,
			severity: "medium",
			summary: `Noisy scenario: ${scenarioId}`,
			message: `${scenarioId} needs more signal before calling the change better.`,
			provenance: {
				packet: "report",
				locator: `noisy.${scenarioId}`,
			},
		})),
		...historySignals,
	];
}

function rankEvidence(evidence, optimizerKind) {
	const sourcePriority = OPTIMIZER_SOURCE_PRIORITY[optimizerKind] || OPTIMIZER_SOURCE_PRIORITY.repair;
	return [...evidence].sort((left, right) => {
		const leftSourceRank = sourcePriority.indexOf(left.source);
		const rightSourceRank = sourcePriority.indexOf(right.source);
		if (leftSourceRank !== rightSourceRank) {
			return leftSourceRank - rightSourceRank;
		}
		const leftSeverity = SEVERITY_PRIORITY[left.severity] ?? SEVERITY_PRIORITY.concern;
		const rightSeverity = SEVERITY_PRIORITY[right.severity] ?? SEVERITY_PRIORITY.concern;
		if (leftSeverity !== rightSeverity) {
			return leftSeverity - rightSeverity;
		}
		return left.summary.localeCompare(right.summary);
	});
}

function buildPrioritizedEvidence(packet, optimizer) {
	const evidenceUniverse = buildEvidenceUniverse(packet, optimizer);
	if (evidenceUniverse.length === 0) {
		const improved = Array.isArray(packet.report?.improved) ? packet.report.improved : [];
		if (improved.length > 0) {
			evidenceUniverse.push({
				source: "report.improved",
				key: improved[0],
				severity: "low",
				summary: `Improved scenario: ${improved[0]}`,
				message: `${improved[0]} improved, and no blocking evidence was surfaced.`,
				provenance: {
					packet: "report",
					locator: `improved.${improved[0]}`,
				},
			});
		}
	}
	return {
		evidenceUniverse,
		prioritizedEvidence: rankEvidence(evidenceUniverse, optimizer.kind).slice(0, optimizer.plan.evidenceLimit),
	};
}

function buildSourceCounts(evidenceUniverse) {
	return evidenceUniverse.reduce(
		(counts, item) => {
			if (item.source === "report.regressed") {
				counts.regressed += 1;
			}
			if (item.source === "review.finding") {
				counts.reviewFindings += 1;
			}
			if (item.source === "report.noisy") {
				counts.noisy += 1;
			}
			if (item.source === "scenario_history") {
				counts.historySignals += 1;
			}
			if (item.source === "report.improved") {
				counts.improved += 1;
			}
			return counts;
		},
		{
			regressed: 0,
			reviewFindings: 0,
			noisy: 0,
			historySignals: 0,
			improved: 0,
		},
	);
}

function buildTrialTelemetry(optimizer, evidenceUniverse, prioritizedEvidence, suggestedChanges) {
	return {
		evidenceItemsSeen: evidenceUniverse.length,
		prioritizedEvidenceCount: prioritizedEvidence.length,
		highSignalEvidenceCount: countHighSignalEvidence(prioritizedEvidence),
		suggestedChangeCount: suggestedChanges.length,
		sourceCounts: buildSourceCounts(evidenceUniverse),
		plan: {
			evidenceLimit: optimizer.plan.evidenceLimit,
			suggestedChangeLimit: optimizer.plan.suggestedChangeLimit,
			reviewVariantLimit: optimizer.plan.reviewVariantLimit,
			historySignalLimit: optimizer.plan.historySignalLimit,
		},
	};
}

function buildFallbackEvidence(packet) {
	const improved = Array.isArray(packet.report?.improved) ? packet.report.improved : [];
	if (improved.length > 0) {
		return [{
			source: "report.improved",
			key: improved[0],
			severity: "low",
			summary: `Improved scenario: ${improved[0]}`,
			message: `${improved[0]} improved, and no blocking evidence was surfaced.`,
			provenance: {
				packet: "report",
				locator: `improved.${improved[0]}`,
			},
		}];
	}
	return [];
}

function countHighSignalEvidence(evidence) {
	return evidence.filter((item) => item.severity === "high" || item.severity === "blocker").length;
}

function buildPrimaryChange(packet, evidence) {
	const regressed = evidence.filter((item) => item.source === "report.regressed");
	const reviewSignals = evidence.filter((item) => item.source === "review.finding");
	const target = packet.optimizationTarget;
	const changeKind = target === "adapter" ? "adapter_revision" : "prompt_revision";
	const summary = target === "adapter"
		? "Tighten the adapter surface around the failing evidence before widening the workflow."
		: "Revise the prompt to repair the cited failures before widening scope.";
	const evidenceItems = [...regressed, ...reviewSignals].slice(0, 3);
	if (evidenceItems.length === 0 && packet.report?.recommendation === "accept-now") {
		return null;
	}
	return {
		id: "repair-known-failures",
		changeKind,
		target,
		summary,
		rationale:
			`${regressed.length} regressed scenario(s) and ${reviewSignals.length} review finding(s) currently bound the next revision.`,
		evidence: evidenceItems.map((item) => ({
			source: item.source,
			key: item.key,
			summary: item.summary,
		})),
	};
}

function buildSamplingChange(evidence) {
	const noisySignals = evidence.filter((item) => item.source === "report.noisy");
	if (noisySignals.length === 0) {
		return null;
	}
	return {
		id: "increase-signal",
		changeKind: "sampling_increase",
		target: "adapter",
		summary: "Increase signal on noisy scenarios before calling the candidate better.",
		rationale: `${noisySignals.length} scenario(s) are still noisy.`,
		evidence: noisySignals.map((item) => ({
			source: item.source,
			key: item.key,
			summary: item.summary,
		})),
	};
}

function buildHistoryChange(evidence) {
	const historySignals = evidence.filter((item) => item.source === "scenario_history");
	if (historySignals.length === 0) {
		return null;
	}
	return {
		id: "focus-unstable-history",
		changeKind: "history_followup",
		target: "workflow",
		summary: "Use recent scenario-history misses to choose the next bounded probe.",
		rationale: `${historySignals.length} scenario(s) still look unstable in recent train history.`,
		evidence: historySignals.slice(0, 3).map((item) => ({
			source: item.source,
			key: item.key,
			summary: item.summary,
		})),
	};
}

function buildSuggestedChanges(packet, evidence) {
	return [
		buildPrimaryChange(packet, evidence),
		buildSamplingChange(evidence),
		buildHistoryChange(evidence),
	].filter(Boolean);
}

function buildDecision(packet, evidence) {
	if (packet.report?.recommendation === "accept-now" && evidence.every((item) => item.severity === "low")) {
		return "hold";
	}
	if (evidence.length === 0) {
		return "investigate";
	}
	return "revise";
}

function buildRevisionBrief(packet, decision, evidence, suggestedChanges) {
	if (decision === "hold") {
		return "No bounded revision is recommended. Keep the current candidate as the shipping baseline.";
	}
	if (decision === "investigate") {
		return "Evidence is too thin for a revision proposal. Gather one explicit report, review summary, or history signal before changing the target.";
	}
	const targetLabel = packet.optimizationTarget === "adapter" ? "adapter" : "prompt";
	const keyEvidence = evidence.slice(0, 3).map((item) => item.summary).join("; ");
	const primaryChange = suggestedChanges[0]?.summary || `Revise the ${targetLabel} conservatively.`;
	const intentSummary = packet.intentProfile?.summary || packet.report?.intent || "the stated behavior intent";
	return `Revise the ${targetLabel} in one bounded pass for "${intentSummary}". ${primaryChange} Evidence: ${keyEvidence}. Do not weaken held-out, comparison, or review gates.`;
}

function resolveProposalIntentProfile(packet) {
	return buildBehaviorIntentProfile({
		intent: packet.report?.intent ?? packet.intentProfile?.summary,
		intentProfile: packet.intentProfile ?? packet.report?.intentProfile,
		defaultGuardrailDimensions: packet.objective?.constraints ?? [],
	});
}

function buildProposalRationale(decision, optimizer, evidence) {
	return decision === "hold"
		? "Current evidence does not justify another bounded revision."
		: `The next revision is bounded by ${countHighSignalEvidence(evidence)} high-signal issue(s) selected under the ${optimizer.budget} ${optimizer.kind} plan.`;
}

function buildProposalFollowUpChecks(decision) {
	return decision === "hold"
		? ["Preserve the current candidate as the next baseline."]
		: [
			"Rerun the bounded iterate probe on the cited surfaces first.",
			"Rerun held-out before accepting the revision.",
			"Rerun comparison and review variants when those surfaces exist for the target repo.",
		];
}

export function generateOptimizeProposal(packet, { now = new Date(), inputFile = null } = {}) {
	const optimizer = normalizeOptimizer(packet.optimizer);
	const intentProfile = resolveProposalIntentProfile(packet);
	const { evidenceUniverse, prioritizedEvidence } = buildPrioritizedEvidence(packet, optimizer);
	const evidence = prioritizedEvidence.length > 0 ? prioritizedEvidence : buildFallbackEvidence(packet);
	const suggestedChanges = buildSuggestedChanges(packet, evidence).slice(0, optimizer.plan.suggestedChangeLimit);
	const decision = buildDecision(packet, evidence);
	const reportRecommendation = packet.report?.recommendation || "defer";
	const trialTelemetry = buildTrialTelemetry(optimizer, evidenceUniverse, evidence, suggestedChanges);
	return {
		schemaVersion: OPTIMIZE_PROPOSAL_SCHEMA,
		generatedAt: now.toISOString(),
		...(inputFile ? { inputFile } : {}),
		optimizationTarget: packet.optimizationTarget,
		intentProfile,
		optimizer,
		...(packet.targetFile ? { targetFile: packet.targetFile } : {}),
		reportRecommendation,
		decision,
		rationale: buildProposalRationale(decision, optimizer, evidence),
		prioritizedEvidence: evidence,
		suggestedChanges,
		revisionBrief: buildRevisionBrief(packet, decision, evidence, suggestedChanges),
		trialTelemetry,
		stopConditions: [
			"Stop after one bounded revision.",
			"Do not weaken held-out, comparison, or structured review gates to make the candidate pass.",
			"If the cited evidence still regresses after the next bounded revision, defer instead of retrying indefinitely.",
		],
		followUpChecks: buildProposalFollowUpChecks(decision),
	};
}

export function generateOptimizeProposalFromSearch(searchResult, optimizeInput, {
	now = new Date(),
	inputFile = null,
	searchResultFile = null,
} = {}) {
	const proposal = generateOptimizeProposal(optimizeInput, { now, inputFile });
	const selectedTargetFile = resolveSelectedTargetFile(searchResult);
	const selectedCandidateId = resolveSelectedCandidateId(searchResult);
	return {
		...proposal,
		...(searchResultFile ? { searchResultFile } : {}),
		...(selectedTargetFile ? { targetFile: selectedTargetFile } : {}),
		rationale: `${proposal.rationale} Selected candidate: ${selectedCandidateId}.`,
	};
}

function resolveSelectedTargetFile(searchResult) {
	return searchResult?.proposalBridge?.selectedTargetFile || null;
}

function resolveSelectedCandidateId(searchResult) {
	return searchResult?.proposalBridge?.selectedCandidateId || searchResult?.selectedCandidateId || "unknown";
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = resolveCommandOptions(parseArgs(argv));
		let proposal;
		if (options.fromSearch) {
			const searchResult = parseSearchResultFile(options.fromSearch);
			if (searchResult.packet.status !== "completed") {
				fail("search result must be completed before generating a proposal from it");
			}
			const optimizeInputFile = searchResult.packet.proposalBridge?.optimizeInputFile || searchResult.packet.optimizeInputFile;
			if (typeof optimizeInputFile !== "string" || optimizeInputFile.length === 0) {
				fail("search result must carry proposalBridge.optimizeInputFile");
			}
			const input = parseInputFile(optimizeInputFile);
			proposal = generateOptimizeProposalFromSearch(searchResult.packet, input.packet, {
				now: new Date(),
				inputFile: input.path,
				searchResultFile: searchResult.path,
			});
		} else {
			const input = parseInputFile(options.input);
			proposal = generateOptimizeProposal(input.packet, {
				now: new Date(),
				inputFile: input.path,
			});
		}
		const text = `${JSON.stringify(proposal, null, 2)}\n`;
		if (options.output) {
			writeFileSync(resolve(options.output), text, "utf-8");
			return;
		}
		process.stdout.write(text);
	} catch (error) {
		if (error instanceof Error) {
			process.stderr.write(`${error.message}\n`);
		} else {
			process.stderr.write(`${String(error)}\n`);
		}
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
