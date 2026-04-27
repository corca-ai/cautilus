#!/usr/bin/env node
import { readFileSync } from "node:fs";
import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { summarizeCodexSessionLogText } from "./codex-session-summary.mjs";
import { writeTextOutput } from "./output-files.mjs";

export const REVIEWER_LAUNCH_FLOW_AUDIT_SCHEMA = "cautilus.reviewer_launch_flow_audit.v1";

const CAUTILUS_COMMAND_PATTERN = /(?:\b(?:\.\/bin\/)?cautilus\b|\$CAUTILUS_BIN)/;
const AGENT_STATUS_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bagent\\s+status\\b`);
const FIRST_DISCOVER_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+discover\\b(?=[\\s\\S]*--repo-root\\b)(?![\\s\\S]*--previous\\b)(?![\\s\\S]*--refresh-plan\\b)`);
const CLAIM_SHOW_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+show\\b(?=[\\s\\S]*--sample-claims\\b)`);
const REVIEW_PREPARE_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+review\\s+prepare-input\\b(?=[\\s\\S]*(?:--claims\\b|--input\\b))`);
const REVIEWER_SMOKE_PATTERN = /\bnode\b[\s\S]*\bscripts\/agent-runtime\/run-claim-reviewer-smoke\.mjs\b(?=[\s\S]*--review-input\b)(?=[\s\S]*--output\b)/;
const REVIEWER_RESULT_WRITE_PATTERN = /(?:claim_review_result\.v1|review-result\.json|review_result\.json)/;

const FORBIDDEN_COMMAND_PATTERNS = [
	["claim_review_apply", /\bclaim\s+review\s+apply-result\b(?=[\s\S]*--claims\b)(?=[\s\S]*--review-result\b)/],
	["claim_plan_evals", /\bclaim\s+plan-evals\b/],
	["eval_test", /(?:^|[;&|]\s*)(?:\.\/bin\/)?cautilus\b[^\n;&|]*\beval\s+test\b/],
	["eval_evaluate", /(?:^|[;&|]\s*)(?:\.\/bin\/)?cautilus\b[^\n;&|]*\beval\s+evaluate\b/],
	["review_variants", /\breview\s+variants\b/],
	["optimize", /\boptimize\b/],
	["git_add", /\bgit\s+add\b/],
	["git_commit", /\bgit\s+commit\b/],
	["apply_patch", /\bapply_patch\b/],
];

export function auditReviewerLaunchFlowLogText(text) {
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
		schemaVersion: REVIEWER_LAUNCH_FLOW_AUDIT_SCHEMA,
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
		["missing_agent_status", AGENT_STATUS_PATTERN, "The reviewer-launch flow should start from agent status."],
		["missing_first_discover", FIRST_DISCOVER_PATTERN, "The flow should materialize a fresh first claim scan before reviewer launch."],
		["missing_claim_show", CLAIM_SHOW_PATTERN, "The flow should summarize the saved claim map before reviewer launch."],
		["missing_review_prepare", REVIEW_PREPARE_PATTERN, "The flow should prepare deterministic review input before reviewer launch."],
		["missing_reviewer_launch", (command) => fileChangeReviewResult || writeToolReviewResult || REVIEWER_SMOKE_PATTERN.test(command) || REVIEWER_RESULT_WRITE_PATTERN.test(command), "The selected branch should launch one bounded reviewer lane or write its review result packet."],
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
		message: "Expected status, first discover, claim show, review prepare-input, then reviewer smoke launch.",
	}];
}

function forbiddenCommandFindings(commands) {
	return commands.flatMap((command) =>
		FORBIDDEN_COMMAND_PATTERNS.filter(([, pattern]) => pattern.test(command)).map(([id]) => ({
			severity: "error",
			id: `forbidden_command:${id}`,
			message: `Reviewer-launch dogfood overran into out-of-scope work: ${command}`,
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
			message: "The reviewer-launch flow should show that a real reviewer lane executed.",
		});
	}
	if (!/claim_review_result\.v1|review result|review-result|리뷰 결과/i.test(combined)) {
		findings.push({
			severity: "error",
			id: "missing_review_result_packet",
			message: "The reviewer-launch flow should produce a claim review result packet.",
		});
	}
	if (!/did not apply|not apply|did not run[\s\S]*apply-result|apply-result.*(?:not|separate|하지 않았습니다|진행하지 않습니다|별도)|적용하지|결과 적용.*(?:안|별도)|별도 위임|진행하지 않습니다|하지 않았습니다/i.test(joined)) {
		findings.push({
			severity: "error",
			id: "missing_no_apply_boundary",
			message: "The reviewer-launch flow should stop before applying review results.",
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
			message: "The reviewer-launch branch should not edit product files through apply_patch.",
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
		throw new Error("usage: audit-cautilus-reviewer-launch-flow-log.mjs --input <agent-jsonl> [--output <audit.json>]");
	}
	return options;
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	try {
		const options = parseArgs(process.argv.slice(2));
		const audit = auditReviewerLaunchFlowLogText(readFileSync(options.input, "utf-8"));
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
