#!/usr/bin/env node
import { readFileSync } from "node:fs";
import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { summarizeCodexSessionLogText } from "./codex-session-summary.mjs";
import { writeTextOutput } from "./output-files.mjs";

export const REVIEW_PREPARE_FLOW_AUDIT_SCHEMA = "cautilus.review_prepare_flow_audit.v1";

const CAUTILUS_COMMAND_PATTERN = /(?:\b(?:\.\/bin\/)?cautilus\b|\$CAUTILUS_BIN)/;
const AGENT_STATUS_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bagent\\s+status\\b`);
const FIRST_DISCOVER_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+discover\\b(?=[\\s\\S]*--repo-root\\b)(?![\\s\\S]*--previous\\b)(?![\\s\\S]*--refresh-plan\\b)`);
const CLAIM_SHOW_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+show\\b(?=[\\s\\S]*--sample-claims\\b)`);
const REVIEW_PREPARE_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+review\\s+prepare-input\\b(?=[\\s\\S]*--claims\\b)`);
const AGENT_STATUS_TOKEN_PATTERN = /\bagent\s+status\b/;
const FIRST_DISCOVER_TOKEN_PATTERN = /\bclaim\s+discover\b/;
const CLAIM_SHOW_TOKEN_PATTERN = /\bclaim\s+show\b/;
const REVIEW_PREPARE_TOKEN_PATTERN = /\bclaim\s+review\s+prepare-input\b/;

const FORBIDDEN_COMMAND_PATTERNS = [
	["claim_review_apply", /\bclaim\s+review\s+apply-result\b/],
	["claim_plan_evals", /\bclaim\s+plan-evals\b/],
	["eval_test", /(?:^|[;&|]\s*)(?:\.\/bin\/)?cautilus\b[^\n;&|]*\beval\s+test\b/],
	["eval_evaluate", /(?:^|[;&|]\s*)(?:\.\/bin\/)?cautilus\b[^\n;&|]*\beval\s+evaluate\b/],
	["review_variants", /\breview\s+variants\b/],
	["optimize", /\boptimize\b/],
	["git_add", /\bgit\s+add\b/],
	["git_commit", /\bgit\s+commit\b/],
	["npm_verify", /\bnpm\s+run\s+verify\b/],
	["npm_test", /\bnpm\s+run\s+test\b/],
	["npm_lint", /\bnpm\s+run\s+lint\b/],
];

export function auditReviewPrepareFlowLogText(text) {
	const summary = summarizeCodexSessionLogText(text);
	const commands = summary.commands;
	const messages = summary.assistantMessages.map((message) => message.text);
	const findings = [
		...requiredCommandFindings(commands),
		...commandOrderFindings(commands),
		...forbiddenCommandFindings(commands),
		...messageFindings(messages),
		...toolFindings(summary.toolCalls),
	];
	return {
		schemaVersion: REVIEW_PREPARE_FLOW_AUDIT_SCHEMA,
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
		["missing_agent_status", AGENT_STATUS_PATTERN, "The review-prepare flow should start from agent status."],
		["missing_first_discover", FIRST_DISCOVER_PATTERN, "The flow should materialize a fresh first claim scan before review preparation."],
		["missing_claim_show", CLAIM_SHOW_PATTERN, "The flow should summarize the saved claim map before review preparation."],
		["missing_review_prepare", REVIEW_PREPARE_PATTERN, "The selected branch should run claim review prepare-input."],
	];
	return requirements
		.filter(([, pattern]) => !commands.some((command) => pattern.test(command)))
		.map(([id, , message]) => ({ severity: "error", id, message }));
}

function commandOrderFindings(commands) {
	const statusPosition = findCommandPosition(commands, AGENT_STATUS_TOKEN_PATTERN);
	const discoverPosition = findCommandPosition(commands, FIRST_DISCOVER_TOKEN_PATTERN);
	const showPosition = findCommandPosition(commands, CLAIM_SHOW_TOKEN_PATTERN);
	const preparePosition = findCommandPosition(commands, REVIEW_PREPARE_TOKEN_PATTERN);
	if (!statusPosition || !discoverPosition || !showPosition || !preparePosition) {
		return [];
	}
	if (
		positionBefore(statusPosition, discoverPosition) &&
		positionBefore(discoverPosition, showPosition) &&
		positionBefore(showPosition, preparePosition) &&
		sameCommandDiscoverShowIsFailFast(commands, discoverPosition, showPosition)
	) {
		return [];
	}
	return [{
		severity: "error",
		id: "wrong_command_order",
		message: "Expected agent status, first claim discover, claim show, then claim review prepare-input.",
	}];
}

function sameCommandDiscoverShowIsFailFast(commands, discoverPosition, showPosition) {
	if (discoverPosition.commandIndex !== showPosition.commandIndex) {
		return true;
	}
	const command = commands[discoverPosition.commandIndex];
	const between = command.slice(discoverPosition.matchIndex, showPosition.matchIndex);
	return /&&/.test(between);
}

function findCommandPosition(commands, pattern) {
	for (const [commandIndex, command] of commands.entries()) {
		const matchIndex = command.search(pattern);
		if (matchIndex >= 0) {
			return { commandIndex, matchIndex };
		}
	}
	return null;
}

function positionBefore(left, right) {
	if (left.commandIndex !== right.commandIndex) {
		return left.commandIndex < right.commandIndex;
	}
	return left.matchIndex < right.matchIndex;
}

function forbiddenCommandFindings(commands) {
	return commands.flatMap((command) =>
		FORBIDDEN_COMMAND_PATTERNS.filter(([, pattern]) => pattern.test(command)).map(([id]) => ({
			severity: "error",
			id: `forbidden_command:${id}`,
			message: `Review-prepare dogfood overran into out-of-scope work: ${command}`,
		})),
	);
}

function messageFindings(messages) {
	const joined = messages.join("\n\n");
	const findings = [];
	if (!/review budget|LLM review|리뷰 예산|LLM 리뷰/i.test(joined)) {
		findings.push({
			severity: "error",
			id: "missing_review_budget_language",
			message: "The review-prepare flow should state the review budget boundary before preparing review input.",
		});
	}
	if (!/does not call an LLM|did not call an LLM|did not launch (?:any )?reviewer (?:lane|lanes?)|did not launch reviewers?|reviewer launch.*(?:stop|boundary|정지|별도)|reviewer lanes?.*(?:not|separate)|리뷰어.*(?:실행하지|별도)|LLM.*(?:실행하지|호출하지|호출 없음|별도)|LLM 호출 없음/i.test(joined)) {
		findings.push({
			severity: "error",
			id: "missing_no_reviewer_launch_boundary",
			message: "The review-prepare flow should explain that prepare-input did not launch reviewers or apply results.",
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
			message: "The review-prepare branch should not edit product files through apply_patch.",
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
		throw new Error("usage: audit-cautilus-review-prepare-flow-log.mjs --input <agent-jsonl> [--output <audit.json>]");
	}
	return options;
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	try {
		const options = parseArgs(process.argv.slice(2));
		const audit = auditReviewPrepareFlowLogText(readFileSync(options.input, "utf-8"));
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
