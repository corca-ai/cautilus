#!/usr/bin/env node
import { readFileSync } from "node:fs";
import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { summarizeCodexSessionLogText } from "./codex-session-summary.mjs";
import { writeTextOutput } from "./output-files.mjs";

export const RUNNER_READINESS_FLOW_AUDIT_SCHEMA = "cautilus.runner_readiness_flow_audit.v1";

const CAUTILUS_COMMAND_PATTERN = /(?:\b(?:\.\/bin\/)?cautilus\b|\$CAUTILUS_BIN)/;
const DOCTOR_STATUS_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bdoctor\\s+status\\b`);
const CLAIMS_PLAN_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bevaluate\\s+claims\\s+plan\\b`);

// The runner-readiness flow stays read-only orientation: it must not execute an
// eval, run improve, or edit/commit product files while only helping build and
// assess a runner.
const FORBIDDEN_COMMAND_PATTERNS = [
	["eval_fixture", /(?:^|[;&|]\s*)(?:\.\/bin\/)?cautilus\b[^\n;&|]*\bevaluate\s+fixture\b/],
	["eval_observation", /(?:^|[;&|]\s*)(?:\.\/bin\/)?cautilus\b[^\n;&|]*\bevaluate\s+observation\b/],
	["improve", /\bimprove\s+search\b|(?:^|[;&|]\s*)(?:\.\/bin\/)?cautilus\b[^\n;&|]*\bimprove\b/],
	["git_add", /\bgit\s+add\b/],
	["git_commit", /\bgit\s+commit\b/],
	["apply_patch", /\bapply_patch\b/],
];

const RUNNER_READINESS_PATTERN = /runnerReadiness|runner[- ]readiness|runner readiness|런너 준비|러너 준비/i;
const REQUIRED_CAPABILITY_PATTERN = /requiredRunnerCapability|required runner capability|runner capability|런너 능력|러너 역량/i;
const HEADLESS_RUNNER_PATTERN = /headless (?:product )?runner|product[- ]?path reuse|reuse.*product path|reuses? the (?:real )?product|not a (?:prompt[- ]only )?mock|instead of (?:a )?(?:prompt[- ]only )?mock|프로덕트 경로|목 대신/i;
const ASSESSMENT_PATTERN = /runner_assessment\.v1|runner assessment|assessment packet|assessment scaffold|어세스먼트|평가 패킷/i;
const PROOF_CLASS_PATTERN = /proof[- ]?class|proofClass|in-process-product-runner|live-product-runner|coding-agent-messaging|fixture-smoke|증명 클래스/i;
const RECOMMENDATION_PATTERN = /ready-for-selected-surface|recommendation|knownGaps|known gaps|권고|알려진 한계/i;
const FRESHNESS_PATTERN = /stale|freshness|adapter hash|runner file hash|file hashes|adapterHash|신선도|해시/i;
const STOP_IMPROVE_PATTERN = /stop (?:improve|개선)|improve (?:must|should) (?:stop|block)|block(?:s|ed)? improve|improve.*(?:missing|stale|smoke)|smoke[- ]only|개선.*멈/i;
const STOP_BOUNDARY_PATTERN = /stop|stopped|before (?:eval|improve|edits|commit|HITL)|do not (?:run|edit|commit)|eval.*전|커밋.*전|멈/i;

export function auditRunnerReadinessFlowLogText(text) {
	const summary = summarizeCodexSessionLogText(text);
	const commands = summary.commands;
	const messages = summary.assistantMessages.map((message) => message.text);
	const assistantText = messages.join("\n\n");
	const commandText = commands.join("\n");
	const combined = `${commandText}\n\n${assistantText}`;
	const findings = [
		...requiredCommandFindings(commands),
		...requiredTextFindings(combined, RUNNER_READINESS_PATTERN, "missing_runner_readiness_orientation", "The flow should orient from doctor status runnerReadiness and its next branches."),
		...requiredTextFindings(combined, REQUIRED_CAPABILITY_PATTERN, "missing_required_capability", "The flow should read the runner capability the selected claim requires."),
		...requiredTextFindings(combined, HEADLESS_RUNNER_PATTERN, "missing_headless_runner_build", "The flow should help build a headless product runner that reuses the real product path instead of a prompt-only mock."),
		...requiredTextFindings(combined, ASSESSMENT_PATTERN, "missing_runner_assessment", "The flow should help produce a cautilus.runner_assessment.v1 packet at the binary-named scaffold path."),
		...requiredTextFindings(combined, PROOF_CLASS_PATTERN, "missing_proof_class", "The flow should name the proof class and which classes can back an app behavior-change claim."),
		...requiredTextFindings(combined, RECOMMENDATION_PATTERN, "missing_recommendation_or_gaps", "The flow should record the assessment recommendation and known gaps."),
		...requiredTextFindings(combined, FRESHNESS_PATTERN, "missing_freshness", "The flow should explain assessment freshness against the adapter and runner file hashes."),
		...requiredTextFindings(assistantText, STOP_IMPROVE_PATTERN, "missing_stop_improve_boundary", "The flow should stop improve when runner-backed proof is missing, stale, or smoke-only."),
		...requiredTextFindings(assistantText, STOP_BOUNDARY_PATTERN, "missing_stop_boundary", "The flow should stop before eval execution, improve, edits, or commits."),
		...forbiddenCommandFindings(commands),
		...toolFindings(summary.toolCalls),
	];
	return {
		schemaVersion: RUNNER_READINESS_FLOW_AUDIT_SCHEMA,
		status: findings.some((finding) => finding.severity === "error") ? "failed" : "passed",
		commandCount: commands.length,
		messageCount: messages.length,
		commands,
		commits: summary.commits,
		parseErrors: summary.parseErrors,
		findings,
	};
}

function requiredCommandFindings(commands) {
	const requirements = [
		["missing_doctor_status", DOCTOR_STATUS_PATTERN, "The flow should orient from doctor status."],
		["missing_claims_plan", CLAIMS_PLAN_PATTERN, "The flow should read the required runner capability from evaluate claims plan."],
	];
	return requirements
		.filter(([, pattern]) => !commands.some((command) => pattern.test(command)))
		.map(([id, , message]) => ({ severity: "error", id, message }));
}

function requiredTextFindings(text, pattern, id, message) {
	if (pattern.test(text)) {
		return [];
	}
	return [{ severity: "error", id, message }];
}

function forbiddenCommandFindings(commands) {
	return commands.flatMap((command) =>
		FORBIDDEN_COMMAND_PATTERNS.filter(([, pattern]) => pattern.test(command)).map(([id]) => ({
			severity: "error",
			id: `forbidden_command:${id}`,
			message: `Runner readiness dogfood overran into out-of-scope work: ${command}`,
		})),
	);
}

function toolFindings(toolCalls) {
	return toolCalls
		.filter((call) => call.name === "apply_patch")
		.map(() => ({
			severity: "error",
			id: "forbidden_tool:apply_patch",
			message: "The runner readiness branch should not edit product files through apply_patch.",
		}));
}

function parseArgs(argv) {
	const options = { input: null, output: null };
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		switch (arg) {
			case "--input":
				options.input = argv[++index];
				break;
			case "--output":
				options.output = argv[++index];
				break;
			default:
				throw new Error(`unknown argument: ${arg}`);
		}
	}
	if (!options.input) {
		throw new Error("usage: audit-cautilus-runner-readiness-flow-log.mjs --input <agent-jsonl> [--output <audit.json>]");
	}
	return options;
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	try {
		const options = parseArgs(process.argv.slice(2));
		const audit = auditRunnerReadinessFlowLogText(readFileSync(options.input, "utf-8"));
		const body = `${JSON.stringify(audit, null, 2)}\n`;
		if (options.output) {
			writeTextOutput(options.output, body);
		} else {
			process.stdout.write(body);
		}
		process.exitCode = audit.status === "passed" ? 0 : 1;
	} catch (error) {
		console.error(error.message);
		process.exitCode = 1;
	}
}
