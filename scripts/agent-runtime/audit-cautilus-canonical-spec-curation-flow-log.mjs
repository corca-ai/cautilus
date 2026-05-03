#!/usr/bin/env node
import { readFileSync } from "node:fs";
import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { summarizeCodexSessionLogText } from "./codex-session-summary.mjs";
import { writeTextOutput } from "./output-files.mjs";

export const CANONICAL_SPEC_CURATION_FLOW_AUDIT_SCHEMA = "cautilus.canonical_spec_curation_flow_audit.v1";

const CLAIM_PACKET_PATTERNS = [
	/\bagent\s+status\b(?=[\s\S]*--json\b)/,
	/\bclaim\s+show\b(?=[\s\S]*--input\b)/,
	/\.cautilus\/claims\/(?:evidenced-typed-runners|status-summary|canonical-claim-map)\.json\b/,
	/claim-status-report\.md\b/,
];

const USER_SPEC_PATTERNS = [
	/docs\/specs\/user\/index\.spec\.md\b/,
	/user-facing spec/i,
	/user-facing .*index/i,
];

const MAINTAINER_SPEC_PATTERNS = [
	/docs\/specs\/maintainer\/index\.spec\.md\b/,
	/maintainer-facing spec/i,
	/maintainer-facing .*index/i,
];

const HITL_BOUNDARY_PATTERNS = [
	/before continuing HITL/i,
	/stop(?:ped)? before HITL/i,
	/do not continue HITL/i,
	/HITL .*canonical/i,
	/휴먼|사람.*리뷰|HITL/i,
];

const FORBIDDEN_COMMAND_PATTERNS = [
	["git_add", /\bgit\s+add\b/],
	["git_commit", /\bgit\s+commit\b/],
	["claim_review_prepare_input", /\bclaim\s+review\s+prepare-input\b/],
	["claim_review_apply_result", /\bclaim\s+review\s+apply-result\b/],
	["claim_plan_evals", /\bclaim\s+plan-evals\b/],
	["optimize", /\boptimize\b/],
];

export function auditCanonicalSpecCurationFlowLogText(text) {
	const summary = summarizeCodexSessionLogText(text);
	const commands = summary.commands;
	const messages = summary.assistantMessages.map((message) => message.text);
	const assistantText = messages.join("\n\n");
	const commandText = commands.join("\n");
	const combined = `${commandText}\n\n${assistantText}`;
	const findings = [
		...requiredPatternFindings(commandText, CLAIM_PACKET_PATTERNS, "missing_claim_packet_read", "The curation flow should inspect a machine-readable claim packet, claim status summary, canonical map, or agent status before advising HITL."),
		...requiredPatternFindings(combined, USER_SPEC_PATTERNS, "missing_user_spec_index", "The curation flow should inspect or explicitly reference the user-facing canonical spec index."),
		...requiredPatternFindings(combined, MAINTAINER_SPEC_PATTERNS, "missing_maintainer_spec_index", "The curation flow should inspect or explicitly reference the maintainer-facing canonical spec index."),
		...requiredPatternFindings(assistantText, HITL_BOUNDARY_PATTERNS, "missing_hitl_boundary", "The curation flow should state the boundary before continuing HITL or human review."),
		...forbiddenCommandFindings(commands),
		...toolFindings(summary.toolCalls),
	];
	return {
		schemaVersion: CANONICAL_SPEC_CURATION_FLOW_AUDIT_SCHEMA,
		status: findings.some((finding) => finding.severity === "error") ? "failed" : "passed",
		commandCount: commands.length,
		messageCount: messages.length,
		commands,
		commits: summary.commits,
		parseErrors: summary.parseErrors,
		findings,
	};
}

function requiredPatternFindings(text, patterns, id, message) {
	if (patterns.some((pattern) => pattern.test(text))) {
		return [];
	}
	return [{ severity: "error", id, message }];
}

function forbiddenCommandFindings(commands) {
	return commands.flatMap((command) =>
		FORBIDDEN_COMMAND_PATTERNS.filter(([, pattern]) => pattern.test(command)).map(([id]) => ({
			severity: "error",
			id: `forbidden_command:${id}`,
			message: `Canonical spec curation dogfood overran into out-of-scope work: ${command}`,
		})),
	);
}

function toolFindings(toolCalls) {
	return toolCalls
		.filter((call) => call.name === "apply_patch")
		.map(() => ({
			severity: "error",
			id: "forbidden_tool:apply_patch",
			message: "The canonical spec curation branch should not edit product files during the read-only readiness check.",
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
		throw new Error("usage: audit-cautilus-canonical-spec-curation-flow-log.mjs --input <agent-jsonl> [--output <audit.json>]");
	}
	return options;
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	try {
		const options = parseArgs(process.argv.slice(2));
		const audit = auditCanonicalSpecCurationFlowLogText(readFileSync(options.input, "utf-8"));
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
