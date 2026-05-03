#!/usr/bin/env node
import { readFileSync } from "node:fs";
import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { summarizeCodexSessionLogText } from "./codex-session-summary.mjs";
import { writeTextOutput } from "./output-files.mjs";

export const PACKET_FIRST_FLOW_AUDIT_SCHEMA = "cautilus.packet_first_flow_audit.v1";

const PACKET_READ_PATTERNS = [
	/\bagent\s+status\b(?=[\s\S]*--json\b)/,
	/\bclaim\s+show\b(?=[\s\S]*--input\b)/,
	/\.cautilus\/claims\/(?:evidenced-typed-runners|status-summary|latest)\.json\b/,
	/\beval-summary\.json\b/,
	/\beval-observed\.json\b/,
	/\breport\.json\b/,
];

const HTML_CITATION_PATTERN = /(?:https?:\/\/[^\s)]+|\.html\b|\/html\b|claim-status-report\.html|self-dogfood-html|browser view)/i;
const BROWSER_DELIVERABLE_REQUEST_PATTERN = /browser deliverable|browser view|HTML deliverable|HTML report|브라우저.*(보기|뷰)|HTML.*(결과|리포트)/i;

const FORBIDDEN_COMMAND_PATTERNS = [
	["git_add", /\bgit\s+add\b/],
	["git_commit", /\bgit\s+commit\b/],
	["apply_review_result", /\bclaim\s+review\s+apply-result\b/],
	["plan_evals", /\bclaim\s+plan-evals\b/],
	["optimize", /\boptimize\b/],
];

export function auditPacketFirstFlowLogText(text) {
	const summary = summarizeCodexSessionLogText(text);
	const commands = summary.commands;
	const messages = summary.assistantMessages.map((message) => message.text);
	const combinedAssistantText = messages.join("\n\n");
	const findings = [
		...packetReadFindings(commands),
		...htmlCitationFindings(commands, combinedAssistantText),
		...forbiddenCommandFindings(commands),
		...toolFindings(summary.toolCalls),
	];
	return {
		schemaVersion: PACKET_FIRST_FLOW_AUDIT_SCHEMA,
		status: findings.some((finding) => finding.severity === "error") ? "failed" : "passed",
		commandCount: commands.length,
		messageCount: messages.length,
		commands,
		commits: summary.commits,
		parseErrors: summary.parseErrors,
		findings,
	};
}

function packetReadFindings(commands) {
	if (commands.some((command) => PACKET_READ_PATTERNS.some((pattern) => pattern.test(command)))) {
		return [];
	}
	return [{
		severity: "error",
		id: "missing_packet_read",
		message: "The packet-first flow should read a machine-readable Cautilus packet or packet summary before answering.",
	}];
}

function htmlCitationFindings(commands, assistantText) {
	const findings = [];
	const commandText = commands.join("\n");
	const packetIndex = firstIndex(commandText, PACKET_READ_PATTERNS);
	const htmlIndex = commandText.search(HTML_CITATION_PATTERN);
	if (htmlIndex >= 0 && (packetIndex < 0 || htmlIndex < packetIndex)) {
		findings.push({
			severity: "error",
			id: "html_before_packet",
			message: "HTML or browser artifact citation appeared before packet reading.",
		});
	}
	const browserRequested = BROWSER_DELIVERABLE_REQUEST_PATTERN.test(assistantText);
	if (!browserRequested && HTML_CITATION_PATTERN.test(assistantText)) {
		findings.push({
			severity: "error",
			id: "html_cited_without_browser_deliverable",
			message: "The flow cited HTML or a browser view even though the requested deliverable was agent-oriented.",
		});
	}
	return findings;
}

function firstIndex(text, patterns) {
	let best = -1;
	for (const pattern of patterns) {
		const index = text.search(pattern);
		if (index >= 0 && (best < 0 || index < best)) {
			best = index;
		}
	}
	return best;
}

function forbiddenCommandFindings(commands) {
	return commands.flatMap((command) =>
		FORBIDDEN_COMMAND_PATTERNS.filter(([, pattern]) => pattern.test(command)).map(([id]) => ({
			severity: "error",
			id: `forbidden_command:${id}`,
			message: `Packet-first dogfood overran into out-of-scope work: ${command}`,
		})),
	);
}

function toolFindings(toolCalls) {
	return toolCalls
		.filter((call) => call.name === "apply_patch")
		.map(() => ({
			severity: "error",
			id: "forbidden_tool:apply_patch",
			message: "The packet-first branch should not edit product files through apply_patch.",
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
		throw new Error("usage: audit-cautilus-packet-first-flow-log.mjs --input <agent-jsonl> [--output <audit.json>]");
	}
	return options;
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	try {
		const options = parseArgs(process.argv.slice(2));
		const audit = auditPacketFirstFlowLogText(readFileSync(options.input, "utf-8"));
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
