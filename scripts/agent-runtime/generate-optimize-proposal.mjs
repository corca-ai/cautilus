import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
	OPTIMIZE_INPUTS_SCHEMA,
	OPTIMIZE_PROPOSAL_SCHEMA,
} from "./contract-versions.mjs";

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
		output: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		const field = {
			"--input": "input",
			"--output": "output",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		options[field] = readRequiredValue(argv, index + 1, arg);
		index += 1;
	}
	if (!options.input) {
		fail("--input is required");
	}
	return options;
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

function normalizeSeverity(value) {
	return typeof value === "string" ? value.toLowerCase() : "concern";
}

function gatherReviewFindings(reviewSummary) {
	if (!reviewSummary || !Array.isArray(reviewSummary.variants)) {
		return [];
	}
	return reviewSummary.variants.flatMap((variant) => {
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
			}));
	});
}

function gatherHistorySignals(scenarioHistory) {
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
			},
		];
	});
}

function buildEvidence(packet) {
	const report = packet.report || {};
	const regressed = Array.isArray(report.regressed) ? report.regressed : [];
	const noisy = Array.isArray(report.noisy) ? report.noisy : [];
	const improved = Array.isArray(report.improved) ? report.improved : [];
	const reviewFindings = gatherReviewFindings(packet.reviewSummary);
	const historySignals = gatherHistorySignals(packet.scenarioHistory);
	const evidence = [
		...regressed.map((scenarioId) => ({
			source: "report.regressed",
			key: scenarioId,
			severity: "high",
			summary: `Regressed scenario: ${scenarioId}`,
			message: `${scenarioId} regressed in the current report.`,
		})),
		...reviewFindings,
		...noisy.map((scenarioId) => ({
			source: "report.noisy",
			key: scenarioId,
			severity: "medium",
			summary: `Noisy scenario: ${scenarioId}`,
			message: `${scenarioId} needs more signal before calling the change better.`,
		})),
		...historySignals,
	];
	if (evidence.length === 0 && improved.length > 0) {
		evidence.push({
			source: "report.improved",
			key: improved[0],
			severity: "low",
			summary: `Improved scenario: ${improved[0]}`,
			message: `${improved[0]} improved, and no blocking evidence was surfaced.`,
		});
	}
	return evidence;
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
	return `Revise the ${targetLabel} in one bounded pass. ${primaryChange} Evidence: ${keyEvidence}. Do not weaken held-out, comparison, or review gates.`;
}

export function generateOptimizeProposal(packet, { now = new Date(), inputFile = null } = {}) {
	const evidence = buildEvidence(packet);
	const suggestedChanges = buildSuggestedChanges(packet, evidence);
	const decision = buildDecision(packet, evidence);
	const reportRecommendation = packet.report?.recommendation || "defer";
	return {
		schemaVersion: OPTIMIZE_PROPOSAL_SCHEMA,
		generatedAt: now.toISOString(),
		...(inputFile ? { inputFile } : {}),
		optimizationTarget: packet.optimizationTarget,
		...(packet.targetFile ? { targetFile: packet.targetFile } : {}),
		reportRecommendation,
		decision,
		rationale:
			decision === "hold"
				? "Current evidence does not justify another bounded revision."
				: `The next revision is bounded by ${countHighSignalEvidence(evidence)} high-signal issue(s) and ${evidence.length} total evidence item(s).`,
		prioritizedEvidence: evidence,
		suggestedChanges,
		revisionBrief: buildRevisionBrief(packet, decision, evidence, suggestedChanges),
		stopConditions: [
			"Stop after one bounded revision.",
			"Do not weaken held-out, comparison, or structured review gates to make the candidate pass.",
			"If the cited evidence still regresses after the next bounded revision, defer instead of retrying indefinitely.",
		],
		followUpChecks:
			decision === "hold"
				? ["Preserve the current candidate as the next baseline."]
				: [
					"Rerun the bounded iterate probe on the cited surfaces first.",
					"Rerun held-out before accepting the revision.",
					"Rerun comparison and review variants when those surfaces exist for the target repo.",
				],
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const input = parseInputFile(options.input);
		const proposal = generateOptimizeProposal(input.packet, {
			now: new Date(),
			inputFile: input.path,
		});
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
