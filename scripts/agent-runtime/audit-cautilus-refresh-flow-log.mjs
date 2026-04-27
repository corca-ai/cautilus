#!/usr/bin/env node
import { readFileSync } from "node:fs";
import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { summarizeCodexSessionLogText } from "./codex-session-summary.mjs";
import { writeTextOutput } from "./output-files.mjs";

export const REFRESH_FLOW_AUDIT_SCHEMA = "cautilus.refresh_flow_audit.v1";

const CAUTILUS_COMMAND_PATTERN = /(?:\b(?:\.\/bin\/)?cautilus\b|\$CAUTILUS_BIN)/;
const AGENT_STATUS_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bagent\\s+status\\b`);
const REFRESH_DISCOVER_PATTERN = new RegExp(`${CAUTILUS_COMMAND_PATTERN.source}[\\s\\S]*\\bclaim\\s+discover\\b(?=[\\s\\S]*--previous\\b)(?=[\\s\\S]*--refresh-plan\\b)`);
const REFRESH_SUMMARY_PATTERN = /\brefreshSummary\b/;

const FORBIDDEN_COMMAND_PATTERNS = [
	["claim_review_prepare", /\bclaim\s+review\s+prepare-input\b/],
	["claim_review_apply", /\bclaim\s+review\s+apply-result\b/],
	["claim_plan_evals", /\bclaim\s+plan-evals\b/],
	["claim_validate", /\bclaim\s+validate\b/],
	["eval_test", /(?:^|[;&|]\s*)(?:\.\/bin\/)?cautilus\b[^\n;&|]*\beval\s+test\b/],
	["eval_evaluate", /(?:^|[;&|]\s*)(?:\.\/bin\/)?cautilus\b[^\n;&|]*\beval\s+evaluate\b/],
	["review_variants", /\breview\s+variants\b/],
	["optimize", /\boptimize\b/],
	["npm_verify", /\bnpm\s+run\s+verify\b/],
	["npm_test", /\bnpm\s+run\s+test\b/],
	["npm_lint", /\bnpm\s+run\s+lint\b/],
];

const INTERNAL_BRANCH_TITLE_PATTERN = /(?:^|\n)\s*\d+\.\s+`?(?:refresh_claims_from_diff|show_existing_claims|run_first_claim_scan|prepare-claim-review)`?/;

export function auditRefreshFlowLogText(text) {
	const summary = summarizeCodexSessionLogText(text);
	const commandRecords = commandRecordsFromSummary(summary);
	const assistantMessages = summary.assistantMessages.map((message) => message.text);
	const findings = [
		...requiredCommandFindings(commandRecords),
		...commandOrderFindings(commandRecords),
		...forbiddenCommandFindings(commandRecords),
		...messageFindings(assistantMessages),
		...toolFindings(summary.toolCalls),
	];
	return {
		schemaVersion: REFRESH_FLOW_AUDIT_SCHEMA,
		status: findings.some((finding) => finding.severity === "error") ? "failed" : "passed",
		commandCount: summary.commands.length,
		messageCount: assistantMessages.length,
		commands: summary.commands,
		commits: summary.commits,
		parseErrors: summary.parseErrors,
		findings,
	};
}

function commandRecordsFromSummary(summary) {
	const records = [];
	for (const call of summary.toolCalls) {
		if (call.command) {
			records.push({ index: call.index, command: call.command });
		}
	}
	for (const [index, command] of summary.commands.entries()) {
		if (!records.some((record) => record.command === command)) {
			records.push({ index: 1_000_000 + index, command });
		}
	}
	return records.sort((left, right) => left.index - right.index);
}

function requiredCommandFindings(commandRecords) {
	const findings = [];
	if (!commandRecords.some((record) => AGENT_STATUS_PATTERN.test(record.command))) {
		findings.push({
			severity: "error",
			id: "missing_agent_status",
			message: "The refresh flow should start from the binary-owned agent status packet.",
		});
	}
	if (!commandRecords.some((record) => REFRESH_DISCOVER_PATTERN.test(record.command))) {
		findings.push({
			severity: "error",
			id: "missing_refresh_plan",
			message: "The selected branch should produce a refresh plan with claim discover --previous --refresh-plan.",
		});
	}
	if (!commandRecords.some((record) => REFRESH_SUMMARY_PATTERN.test(record.command))) {
		findings.push({
			severity: "error",
			id: "missing_refresh_summary_read",
			message: "The agent should read refreshSummary instead of reconstructing the refresh-plan meaning from raw packet fields.",
		});
	}
	return findings;
}

function commandOrderFindings(commandRecords) {
	const refreshIndex = commandRecords.findIndex((record) => REFRESH_DISCOVER_PATTERN.test(record.command));
	if (refreshIndex < 0) {
		return [];
	}
	const agentStatusBeforeRefresh = commandRecords
		.slice(0, refreshIndex)
		.filter((record) => AGENT_STATUS_PATTERN.test(record.command));
	if (agentStatusBeforeRefresh.length < 2) {
		return [{
			severity: "warning",
			id: "missing_branch_recheck",
			message: "The refresh branch ran from the previous orientation without a second agent status. This is acceptable for refresh-plan-only work when the agent does not claim it rechecked.",
		}];
	}
	return [];
}

function forbiddenCommandFindings(commandRecords) {
	return commandRecords.flatMap((record) =>
		FORBIDDEN_COMMAND_PATTERNS.filter(([, pattern]) => pattern.test(record.command)).map(([id]) => ({
			severity: "error",
			id: `forbidden_command:${id}`,
			message: `Refresh-branch dogfood overran into out-of-scope work: ${record.command}`,
		})),
	);
}

function messageFindings(messages) {
	const joined = messages.join("\n\n");
	const findings = [];
	if (INTERNAL_BRANCH_TITLE_PATTERN.test(joined)) {
		findings.push({
			severity: "error",
			id: "internal_branch_title",
			message: "Branch options should present coordinator-facing labels before internal branch ids.",
		});
	}
	if (!/saved claim map|저장된 (?:claim|클레임) (?:map|맵)/i.test(joined)) {
		findings.push({
			severity: "error",
			id: "missing_saved_claim_map_language",
			message: "The refresh flow should explain the state as a saved claim map, not only as a packet or branch id.",
		});
	}
	if (!/did not update|not update|아직 .*업데이트|업데이트하지|갱신되지|갱신하지|갱신 안 함|그대로 두|변경되지|쓰지 않았/.test(joined)) {
		findings.push({
			severity: "error",
			id: "missing_not_updated_boundary",
			message: "The final response should say the saved claim map was not updated by the refresh plan.",
		});
	}
	if (/다시 확인|재확인|rerun agent status|recheck/i.test(joined) && !messages.some((message) => /agent status/.test(message))) {
		findings.push({
			severity: "warning",
			id: "claimed_recheck_needs_command_review",
			message: "The agent mentioned rechecking; inspect commands if this warning appears with missing_branch_recheck.",
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
			message: "The refresh branch should not edit product files through apply_patch.",
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
		throw new Error("usage: audit-cautilus-refresh-flow-log.mjs --input <codex-jsonl> [--output <audit.json>]");
	}
	return options;
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	try {
		const options = parseArgs(process.argv.slice(2));
		const audit = auditRefreshFlowLogText(readFileSync(options.input, "utf-8"));
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
