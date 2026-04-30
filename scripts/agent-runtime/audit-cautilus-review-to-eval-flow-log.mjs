#!/usr/bin/env node
import { readFileSync } from "node:fs";
import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { summarizeCodexSessionLogText } from "./codex-session-summary.mjs";
import { writeTextOutput } from "./output-files.mjs";

export const REVIEW_TO_EVAL_FLOW_AUDIT_SCHEMA = "cautilus.review_to_eval_flow_audit.v1";

const CAUTILUS_COMMAND_PATTERN = /(?:\b(?:\.\/bin\/)?cautilus\b|\$CAUTILUS_BIN)/;
const AGENT_STATUS_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bagent\\s+status\\b`);
const FIRST_DISCOVER_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+discover\\b(?=[\\s\\S]*--repo-root\\b)(?![\\s\\S]*--previous\\b)(?![\\s\\S]*--refresh-plan\\b)`);
const CLAIM_SHOW_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+show\\b(?=[\\s\\S]*--sample-claims\\b)`);
const REVIEW_PREPARE_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+review\\s+prepare-input\\b(?=[\\s\\S]*(?:--claims\\b|--input\\b))`);
const REVIEW_APPLY_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+review\\s+apply-result\\b(?=[\\s\\S]*--claims\\b)(?=[\\s\\S]*--review-result\\b)`);
const CLAIM_VALIDATE_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+validate\\b(?=[\\s\\S]*--claims\\b)`);
const CLAIM_PLAN_EVALS_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+plan-evals\\b(?=[\\s\\S]*--claims\\b)`);
const REVIEWER_SMOKE_PATTERN = /\bnode\b[\s\S]*\bscripts\/agent-runtime\/run-claim-reviewer-smoke\.mjs\b(?=[\s\S]*--review-input\b)(?=[\s\S]*--output\b)/;
const REVIEWER_RESULT_WRITE_PATTERN = /(?:claim_review_result\.v1|review-result\.json|review_result\.json)/;

const FORBIDDEN_COMMAND_PATTERNS = [
	["eval_test", /(?:^|[;&|]\s*)(?:\.\/bin\/)?cautilus\b[^\n;&|]*\beval\s+test\b/],
	["eval_evaluate", /(?:^|[;&|]\s*)(?:\.\/bin\/)?cautilus\b[^\n;&|]*\beval\s+evaluate\b/],
	["review_variants", /\breview\s+variants\b/],
	["optimize", /\boptimize\b/],
	["git_add", /\bgit\s+add\b/],
	["git_commit", /\bgit\s+commit\b/],
	["apply_patch", /\bapply_patch\b/],
];

export function auditReviewToEvalFlowLogText(text) {
	const summary = summarizeCodexSessionLogText(text);
	const commands = summary.commands;
	const messages = summary.assistantMessages.map((message) => message.text);
	const outputText = summary.commandOutputs.map((output) => output.output).join("\n\n");
	const findings = [
		...requiredCommandFindings(commands, text),
		...commandOrderFindings(commands),
		...forbiddenCommandFindings(commands),
		...messageFindings(messages, outputText, text),
		...toolFindings(summary.toolCalls),
	];
	return {
		schemaVersion: REVIEW_TO_EVAL_FLOW_AUDIT_SCHEMA,
		status: findings.some((finding) => finding.severity === "error") ? "failed" : "passed",
		commandCount: commands.length,
		messageCount: messages.length,
		commands,
		commits: summary.commits,
		parseErrors: summary.parseErrors,
		findings,
	};
}

function requiredCommandFindings(commands, rawText) {
	const fileChangeReviewResult = /"type":"file_change"[\s\S]*(?:review-result\.json|cautilus\.claim_review_result\.v1)/.test(rawText);
	const writeToolReviewResult = /"name":"Write"[\s\S]*(?:review-result\.json|cautilus\.claim_review_result\.v1)/.test(rawText);
	const requirements = [
		["missing_agent_status", AGENT_STATUS_PATTERN, "The review-to-eval flow should start from agent status."],
		["missing_first_discover", FIRST_DISCOVER_PATTERN, "The flow should materialize a fresh first claim scan before review."],
		["missing_claim_show", CLAIM_SHOW_PATTERN, "The flow should summarize the saved claim map before review."],
		["missing_review_prepare", REVIEW_PREPARE_PATTERN, "The flow should prepare deterministic review input before reviewer launch."],
		["missing_reviewer_launch", (command) => fileChangeReviewResult || writeToolReviewResult || REVIEWER_SMOKE_PATTERN.test(command) || REVIEWER_RESULT_WRITE_PATTERN.test(command), "The flow should launch one bounded reviewer lane or write its review result packet."],
		["missing_review_apply", REVIEW_APPLY_PATTERN, "The flow should apply the reviewer result packet."],
		["missing_claim_validate", CLAIM_VALIDATE_PATTERN, "The flow should validate the reviewed claim packet."],
		["missing_plan_evals", CLAIM_PLAN_EVALS_PATTERN, "The flow should plan evals from the reviewed claim packet."],
	];
	return requirements
		.filter(([, pattern]) => !commands.some((command) => typeof pattern === "function" ? pattern(command) : pattern.test(command)))
		.map(([id, , message]) => ({ severity: "error", id, message }));
}

function commandOrderFindings(commands) {
	const indexes = [
		AGENT_STATUS_PATTERN,
		FIRST_DISCOVER_PATTERN,
		CLAIM_SHOW_PATTERN,
		REVIEW_PREPARE_PATTERN,
		(command) => REVIEWER_SMOKE_PATTERN.test(command) || REVIEWER_RESULT_WRITE_PATTERN.test(command),
		REVIEW_APPLY_PATTERN,
		CLAIM_VALIDATE_PATTERN,
		CLAIM_PLAN_EVALS_PATTERN,
	].map((pattern) => commands.findIndex((command) => typeof pattern === "function" ? pattern(command) : pattern.test(command)));
	if (indexes.some((index) => index < 0)) {
		return [];
	}
	if (indexes.every((index, position) => position === 0 || indexes[position - 1] <= index)) {
		return [];
	}
	return [{
		severity: "error",
		id: "wrong_command_order",
		message: "Expected status, first discover, claim show, review prepare-input, reviewer result, apply-result, validate, then plan-evals.",
	}];
}

function forbiddenCommandFindings(commands) {
	return commands.flatMap((command) =>
		FORBIDDEN_COMMAND_PATTERNS.filter(([, pattern]) => pattern.test(command)).map(([id]) => ({
			severity: "error",
			id: `forbidden_command:${id}`,
			message: `Review-to-eval dogfood overran into out-of-scope work: ${command}`,
		})),
	);
}

function messageFindings(messages, outputText, rawText) {
	const joined = messages.join("\n\n");
	const combined = `${joined}\n\n${outputText}\n\n${rawText}`;
	const findings = [];
	if (!/reviewerExecuted["']?\s*:\s*true|reviewer (?:lane|smoke).*(?:executed|complete|완료)|reviewer.*(?:launched|완료|결과)|current-agent reviewer lane.*(?:executed|complete)|본 에이전트.*reviewer|리뷰어.*(?:실행|호출|완료)|reviewer lane.*완결|리뷰.*완결|inline 검토|단일.*claim.*검토/i.test(combined)) {
		findings.push({
			severity: "error",
			id: "missing_actual_reviewer_execution",
			message: "The review-to-eval flow should show that a real reviewer lane executed.",
		});
	}
	if (!/claim_review_result\.v1|review result|review-result|리뷰 결과/i.test(combined)) {
		findings.push({
			severity: "error",
			id: "missing_review_result_packet",
			message: "The flow should produce a claim review result packet.",
		});
	}
	if (!/apply-result|applied|reviewed claim packet|리뷰 결과.*적용|결과 적용/i.test(combined)) {
		findings.push({
			severity: "error",
			id: "missing_apply_result_summary",
			message: "The flow should report that the review result was applied.",
		});
	}
	if (!/claim validate|validated|valid["']?\s*:\s*true|issueCount["']?\s*:\s*0|검증.*통과|validate.*통과/i.test(combined)) {
		findings.push({
			severity: "error",
			id: "missing_validation_summary",
			message: "The flow should report validation of the reviewed claim packet.",
		});
	}
	if (!/plan-evals|eval plan|claim_eval_plan|평가 계획|eval.*계획/i.test(combined)) {
		findings.push({
			severity: "error",
			id: "missing_eval_plan_summary",
			message: "The flow should report eval planning from the reviewed claim packet.",
		});
	}
	if (!/stop before (?:writing|creating).*fixtures|did not (?:write|create).*fixtures|fixture.*(?:not|separate|별도|작성하지)|제품 파일.*(?:편집하지|수정하지)|(?:editing|edit|edited).*product files|product files.*(?:not edited|unchanged|not changed)|여기서 멈/i.test(combined)) {
		findings.push({
			severity: "error",
			id: "missing_stop_boundary",
			message: "The flow should stop before fixture authoring, product edits, eval execution, or commits.",
		});
	}
	return findings;
}

function toolFindings(toolCalls) {
	return toolCalls
		.filter((call) => call.name === "apply_patch")
		.map(() => ({
			severity: "error",
			id: "forbidden_tool:apply_patch",
			message: "The review-to-eval branch should not edit product files through apply_patch.",
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
		throw new Error("usage: audit-cautilus-review-to-eval-flow-log.mjs --input <agent-jsonl> [--output <audit.json>]");
	}
	return options;
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	try {
		const options = parseArgs(process.argv.slice(2));
		const audit = auditReviewToEvalFlowLogText(readFileSync(options.input, "utf-8"));
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
