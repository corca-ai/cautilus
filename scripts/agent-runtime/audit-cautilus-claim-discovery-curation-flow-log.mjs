#!/usr/bin/env node
import { readFileSync } from "node:fs";
import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { summarizeCodexSessionLogText } from "./codex-session-summary.mjs";
import { writeTextOutput } from "./output-files.mjs";

export const CLAIM_DISCOVERY_CURATION_FLOW_AUDIT_SCHEMA = "cautilus.claim_discovery_curation_flow_audit.v1";

const CAUTILUS_COMMAND_PATTERN = /(?:\b(?:\.\/bin\/)?cautilus\b|\$CAUTILUS_BIN)/;
const AGENT_STATUS_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bagent\\s+status\\b`);
const FIRST_DISCOVER_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+discover\\b(?=[\\s\\S]*--repo-root\\b)(?![\\s\\S]*--previous\\b)(?![\\s\\S]*--refresh-plan\\b)`);
const CLAIM_SHOW_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+show\\b(?=[\\s\\S]*--sample-claims\\b)`);

const POSITION_PATTERNS = {
	agentStatus: /(?:\b(?:\.\/bin\/)?cautilus\b|\$CAUTILUS_BIN)[^;&|\n]*\bagent\s+status\b/g,
	firstDiscover: /(?:\b(?:\.\/bin\/)?cautilus\b|\$CAUTILUS_BIN)[^;&|\n]*\bclaim\s+discover\b(?=[^;&|\n]*--repo-root\b)(?![^;&|\n]*--previous\b)(?![^;&|\n]*--refresh-plan\b)/g,
	claimShow: /(?:\b(?:\.\/bin\/)?cautilus\b|\$CAUTILUS_BIN)[^;&|\n]*\bclaim\s+show\b(?=[^;&|\n]*--sample-claims\b)/g,
};

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
	["apply_patch", /\bapply_patch\b/],
];

const SCAN_SCOPE_PATTERN = /scan (?:entries|scope)|스캔 (?:범위|엔트리)|README\.md|AGENTS\.md|CLAUDE\.md/i;
const SCOPE_CONFIRM_PATTERN = /(?:confirm|확인).*(?:scope|범위)|(?:adjust|조정).*(?:scope|범위)|(?:scope|범위).*(?:confirm|확인|adjust|조정)|narrower explicit source set|명시.*소스/i;
const EXTRACTION_SIGNAL_PATTERN = /extraction|extract|heuristic|signal|source[- ]?ref|sourceRefs|heading|imperative|promise|엔트리|추출|신호|휴리스틱/i;
const DEDUPE_PATTERN = /dedup|de[- ]?dup|duplicate|fingerprint|claimFingerprint|merge|중복|핑거프린트|병합/i;
const CURATION_PATTERN = /actionSummary|bucket|next[- ]?work|agent-plan-cautilus-eval|human-confirm-or-decompose|split-or-defer|group|curat|분류|큐레이션|다음 작업/i;
const STOP_BOUNDARY_PATTERN = /stop|stopped|before (?:review|eval|edits|HITL)|do not (?:launch|run|edit)|리뷰.*전|eval.*전|멈/i;

export function auditClaimDiscoveryCurationFlowLogText(text) {
	const summary = summarizeCodexSessionLogText(text);
	const commands = summary.commands;
	const messages = summary.assistantMessages.map((message) => message.text);
	const assistantText = messages.join("\n\n");
	const commandText = commands.join("\n");
	const combined = `${commandText}\n\n${assistantText}`;
	const firstDiscoverIndex = firstCommandEventIndex(summary.toolCalls, FIRST_DISCOVER_PATTERN) ?? firstRawCommandEventIndex(text, FIRST_DISCOVER_PATTERN);
	const findings = [
		...requiredCommandFindings(commands),
		...commandOrderFindings(commands),
		...preDiscoverScopeFindings(summary.assistantMessages, firstDiscoverIndex),
		...requiredTextFindings(combined, EXTRACTION_SIGNAL_PATTERN, "missing_extraction_heuristics", "The curation flow should discuss extraction signals or source-ref heuristics, not only run discovery."),
		...requiredTextFindings(combined, DEDUPE_PATTERN, "missing_dedupe_or_fingerprint", "The curation flow should account for duplicate handling or claim fingerprints."),
		...requiredTextFindings(combined, CURATION_PATTERN, "missing_next_work_curation", "The curation flow should classify discovered claims into reviewable next-work groups."),
		...requiredTextFindings(assistantText, STOP_BOUNDARY_PATTERN, "missing_stop_boundary", "The curation flow should stop before review launch, eval execution, or product edits."),
		...forbiddenCommandFindings(commands),
		...toolFindings(summary.toolCalls),
	];
	return {
		schemaVersion: CLAIM_DISCOVERY_CURATION_FLOW_AUDIT_SCHEMA,
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
		["missing_agent_status", AGENT_STATUS_PATTERN, "The flow should start from agent status."],
		["missing_claim_discover", FIRST_DISCOVER_PATTERN, "The skill should run first claim discovery."],
		["missing_claim_show", CLAIM_SHOW_PATTERN, "The skill should inspect the saved claim map with claim show --sample-claims."],
	];
	return requirements
		.filter(([, pattern]) => !commands.some((command) => pattern.test(command)))
		.map(([id, , message]) => ({ severity: "error", id, message }));
}

function commandOrderFindings(commands) {
	const statusPosition = firstCommandPosition(commands, POSITION_PATTERNS.agentStatus);
	const discoverPosition = firstCommandPosition(commands, POSITION_PATTERNS.firstDiscover);
	const showPosition = firstCommandPosition(commands, POSITION_PATTERNS.claimShow);
	if (!statusPosition || !discoverPosition || !showPosition) {
		return [];
	}
	if (compareCommandPositions(statusPosition, discoverPosition) < 0 && compareCommandPositions(discoverPosition, showPosition) < 0) {
		return [];
	}
	return [{
		severity: "error",
		id: "wrong_command_order",
		message: "Expected agent status before first claim discover, and claim show after discovery.",
	}];
}

function firstCommandPosition(commands, pattern) {
	for (const [commandIndex, command] of commands.entries()) {
		pattern.lastIndex = 0;
		const match = pattern.exec(command);
		if (match) {
			return { commandIndex, charIndex: match.index };
		}
	}
	return null;
}

function compareCommandPositions(left, right) {
	if (left.commandIndex !== right.commandIndex) {
		return left.commandIndex - right.commandIndex;
	}
	return left.charIndex - right.charIndex;
}

function preDiscoverScopeFindings(messageRecords, firstDiscoverIndex) {
	const beforeDiscover = firstDiscoverIndex === null
		? ""
		: messageRecords
			.filter((message) => message.role === "assistant" && typeof message.index === "number" && message.index < firstDiscoverIndex)
			.map((message) => message.text)
			.join("\n\n");
	const findings = [];
	if (!SCAN_SCOPE_PATTERN.test(beforeDiscover) || !/(?:linked Markdown )?depth|깊이/i.test(beforeDiscover)) {
		findings.push({
			severity: "error",
			id: "missing_pre_discover_entries_and_depth",
			message: "Before first claim discover, the skill should state the scan entries and linked Markdown depth.",
		});
	}
	if (!SCOPE_CONFIRM_PATTERN.test(beforeDiscover)) {
		findings.push({
			severity: "error",
			id: "missing_pre_discover_scope_confirmation",
			message: "Before first claim discover, the skill should ask the user to confirm or adjust the scan scope.",
		});
	}
	return findings;
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
			message: `Claim discovery curation dogfood overran into out-of-scope work: ${command}`,
		})),
	);
}

function toolFindings(toolCalls) {
	return toolCalls
		.filter((call) => call.name === "apply_patch")
		.map(() => ({
			severity: "error",
			id: "forbidden_tool:apply_patch",
			message: "The claim discovery curation branch should not edit product files through apply_patch.",
		}));
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
		throw new Error("usage: audit-cautilus-claim-discovery-curation-flow-log.mjs --input <agent-jsonl> [--output <audit.json>]");
	}
	return options;
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	try {
		const options = parseArgs(process.argv.slice(2));
		const audit = auditClaimDiscoveryCurationFlowLogText(readFileSync(options.input, "utf-8"));
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
