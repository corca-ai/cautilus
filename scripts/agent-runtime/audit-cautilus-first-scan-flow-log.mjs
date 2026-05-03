#!/usr/bin/env node
import { readFileSync } from "node:fs";
import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { summarizeCodexSessionLogText } from "./codex-session-summary.mjs";
import { writeTextOutput } from "./output-files.mjs";

export const FIRST_SCAN_FLOW_AUDIT_SCHEMA = "cautilus.first_scan_flow_audit.v1";

const CAUTILUS_COMMAND_PATTERN = /(?:\b(?:\.\/bin\/)?cautilus\b|\$CAUTILUS_BIN)/;
const AGENT_STATUS_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bagent\\s+status\\b`);
const FIRST_DISCOVER_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+discover\\b(?=[\\s\\S]*--repo-root\\b)(?![\\s\\S]*--previous\\b)(?![\\s\\S]*--refresh-plan\\b)`);
const CLAIM_SHOW_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+show\\b(?=[\\s\\S]*--sample-claims\\b)`);

const FORBIDDEN_COMMAND_PATTERNS = [
	["claim_review_prepare", /\bclaim\s+review\s+prepare-input\b/],
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

export function auditFirstScanFlowLogText(text) {
	const summary = summarizeCodexSessionLogText(text);
	const commands = summary.commands;
	const messages = summary.assistantMessages.map((message) => message.text);
	const firstDiscoverIndex = firstCommandEventIndex(summary.toolCalls, FIRST_DISCOVER_PATTERN) ?? firstRawCommandEventIndex(text, FIRST_DISCOVER_PATTERN);
	const findings = [
		...requiredCommandFindings(commands),
		...commandOrderFindings(commands),
		...forbiddenCommandFindings(commands),
		...messageFindings(summary.assistantMessages, messages, firstDiscoverIndex),
		...toolFindings(summary.toolCalls),
	];
	return {
		schemaVersion: FIRST_SCAN_FLOW_AUDIT_SCHEMA,
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
		["missing_agent_status", AGENT_STATUS_PATTERN, "The first-scan flow should start from agent status."],
		["missing_first_discover", FIRST_DISCOVER_PATTERN, "The selected branch should run claim discover without --previous or --refresh-plan."],
		["missing_claim_show", CLAIM_SHOW_PATTERN, "After first discovery, the agent should summarize the saved claim map with claim show --sample-claims."],
	];
	return requirements
		.filter(([, pattern]) => !commands.some((command) => pattern.test(command)))
		.map(([id, , message]) => ({ severity: "error", id, message }));
}

function commandOrderFindings(commands) {
	const statusIndex = commands.findIndex((command) => AGENT_STATUS_PATTERN.test(command));
	const discoverIndex = commands.findIndex((command) => FIRST_DISCOVER_PATTERN.test(command));
	const showIndex = commands.findIndex((command) => CLAIM_SHOW_PATTERN.test(command));
	if (statusIndex < 0 || discoverIndex < 0 || showIndex < 0) {
		return [];
	}
	if (statusIndex < discoverIndex && discoverIndex < showIndex) {
		return [];
	}
	return [{
		severity: "error",
		id: "wrong_command_order",
		message: "Expected agent status before first claim discover, and claim show after discovery.",
	}];
}

function forbiddenCommandFindings(commands) {
	return commands.flatMap((command) =>
		FORBIDDEN_COMMAND_PATTERNS.filter(([, pattern]) => pattern.test(command)).map(([id]) => ({
			severity: "error",
			id: `forbidden_command:${id}`,
			message: `First-scan dogfood overran into out-of-scope work: ${command}`,
		})),
	);
}

function firstCommandEventIndex(toolCalls, pattern) {
	const call = toolCalls.find((toolCall) => pattern.test(toolCall.command ?? ""));
	return typeof call?.index === "number" ? call.index : null;
}

function firstRawCommandEventIndex(text, pattern) {
	for (const [index, line] of text.split(/\r?\n/).entries()) {
		if (!line.trim()) {
			continue;
		}
		try {
			const event = JSON.parse(line);
			if (eventContainsCommand(event, pattern)) {
				return index;
			}
		} catch {
			continue;
		}
	}
	return null;
}

function eventContainsCommand(value, pattern) {
	if (value == null) {
		return false;
	}
	if (Array.isArray(value)) {
		return value.some((item) => eventContainsCommand(item, pattern));
	}
	if (typeof value !== "object") {
		return false;
	}
	if (typeof value.command === "string" && pattern.test(value.command)) {
		return true;
	}
	if (typeof value.cmd === "string" && pattern.test(value.cmd)) {
		return true;
	}
	return Object.values(value).some((child) => eventContainsCommand(child, pattern));
}

function messageFindings(messageRecords, messages, firstDiscoverIndex) {
	const joined = messages.join("\n\n");
	const beforeDiscover = firstDiscoverIndex === null
		? ""
		: messageRecords
			.filter((message) => message.role === "assistant" && typeof message.index === "number" && message.index < firstDiscoverIndex)
			.map((message) => message.text)
			.join("\n\n");
	const findings = [];
	if (!/scan (?:entries|scope)|스캔 (?:범위|엔트리)|README\.md|AGENTS\.md|CLAUDE\.md/i.test(joined)) {
		findings.push({
			severity: "error",
			id: "missing_scan_scope_language",
			message: "The first-scan flow should explain the bounded scan scope.",
		});
	}
	if (!/scan (?:entries|scope)|스캔 (?:범위|엔트리)|README\.md|AGENTS\.md|CLAUDE\.md/i.test(beforeDiscover) || !/(?:linked Markdown )?depth|깊이/i.test(beforeDiscover)) {
		findings.push({
			severity: "error",
			id: "missing_pre_discover_entries_and_depth",
			message: "Before first claim discover, the skill should state the scan entries and linked Markdown depth.",
		});
	}
	if (!/(?:confirm|확인).*(?:scope|범위)|(?:adjust|조정).*(?:scope|범위)|(?:scope|범위).*(?:confirm|확인|adjust|조정)|narrower explicit source set|명시.*소스/i.test(beforeDiscover)) {
		findings.push({
			severity: "error",
			id: "missing_pre_discover_scope_confirmation",
			message: "Before first claim discover, the skill should ask the user to confirm or adjust the scan scope.",
		});
	}
	if (!/review budget|LLM review|리뷰 예산|LLM 리뷰|리뷰를 .*하지|리뷰.*별도/i.test(joined)) {
		findings.push({
			severity: "error",
			id: "missing_review_budget_boundary",
			message: "The first-scan flow should keep LLM review as a separate branch after deterministic discovery.",
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
			message: "The first-scan branch should not edit product files through apply_patch.",
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
		throw new Error("usage: audit-cautilus-first-scan-flow-log.mjs --input <agent-jsonl> [--output <audit.json>]");
	}
	return options;
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	try {
		const options = parseArgs(process.argv.slice(2));
		const audit = auditFirstScanFlowLogText(readFileSync(options.input, "utf-8"));
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
