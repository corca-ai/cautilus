#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

export const NO_INPUT_AUDIT_SCHEMA = "cautilus.no_input_audit.v1";

const REQUIRED_COMMAND_PATTERNS = [
	{
		id: "agent_status",
		pattern: /\bcautilus\b.*\bagent\s+status\b|\b\.\/bin\/cautilus\b.*\bagent\s+status\b/,
		message: "No-input Cautilus runs should read the binary-owned orientation packet.",
	},
];

const FORBIDDEN_COMMAND_PATTERNS = [
	["claim_discover", /\bclaim\s+discover\b/],
	["eval_test", /\beval\s+test\b/],
	["eval_evaluate", /\beval\s+evaluate\b/],
	["review_variants", /\breview\s+variants\b/],
	["optimize", /\boptimize\b/],
	["scenario_propose", /\bscenario\s+propose\b/],
	["scenarios_catalog", /\bscenarios\s+--json\b/],
	["doctor_next_action", /\bdoctor\b.*--next-action\b/],
	["repo_doctor", /\bdoctor\b(?=.*--repo-root)(?!.*--scope\s+agent-surface)/],
	["git_add", /\bgit\s+add\b/],
	["git_commit", /\bgit\s+commit\b/],
	["npm_verify", /\bnpm\s+run\s+verify\b/],
	["npm_test", /\bnpm\s+run\s+test\b/],
	["npm_lint", /\bnpm\s+run\s+lint\b/],
	["debug_artifact", /\bcharness-artifacts\/debug\b|validate_debug_artifact|scaffold_debug_artifact/],
];

const FORBIDDEN_MESSAGE_PATTERNS = [
	["eval_readiness", /eval readiness|bounded run|first_bounded_run/i],
	["eval_command", /\beval\s+test\b/i],
	["debug_artifact", /debug artifact|charness-artifacts\/debug/i],
	["commit", /\bgit\s+commit\b|\bcommitted\b/i],
];

export function parseCodexJsonl(text) {
	const commands = [];
	const messages = [];
	const toolCalls = [];
	const parseErrors = [];
	for (const [index, line] of text.split(/\r?\n/).entries()) {
		const trimmed = line.trim();
		if (!trimmed) {
			continue;
		}
		let event;
		try {
			event = JSON.parse(trimmed);
		} catch (error) {
			parseErrors.push({ line: index + 1, error: error.message });
			continue;
		}
		collectFromValue(event, { commands, messages, toolCalls });
	}
	return { commands: unique(commands), messages, toolCalls, parseErrors };
}

export function auditNoInputLogText(text) {
	const parsed = parseCodexJsonl(text);
	const findings = [
		...missingRequiredCommandFindings(parsed.commands),
		...forbiddenCommandFindings(parsed.commands),
		...forbiddenMessageFindings(parsed.messages),
		...forbiddenToolFindings(parsed.toolCalls),
	];
	return {
		schemaVersion: NO_INPUT_AUDIT_SCHEMA,
		status: findings.some((finding) => finding.severity === "error") ? "failed" : "passed",
		commandCount: parsed.commands.length,
		messageCount: parsed.messages.length,
		commands: parsed.commands,
		toolCalls: parsed.toolCalls,
		parseErrors: parsed.parseErrors,
		findings,
	};
}

function missingRequiredCommandFindings(commands) {
	return REQUIRED_COMMAND_PATTERNS
		.filter((requirement) => !commands.some((command) => requirement.pattern.test(command)))
		.map((requirement) => ({
			severity: "error",
			id: `missing_${requirement.id}`,
			message: requirement.message,
		}));
}

function forbiddenCommandFindings(commands) {
	return commands.flatMap((command) =>
		FORBIDDEN_COMMAND_PATTERNS.filter(([, pattern]) => pattern.test(command)).map(([id]) => ({
			severity: "error",
			id: `forbidden_command:${id}`,
			message: `No-input run executed or prepared an out-of-scope command: ${command}`,
		})),
	);
}

function forbiddenMessageFindings(messages) {
	return messages.flatMap((message) =>
		FORBIDDEN_MESSAGE_PATTERNS.filter(([, pattern]) => pattern.test(message)).map(([id]) => ({
			severity: "error",
			id: `forbidden_message:${id}`,
			message: `No-input response drifted into an out-of-scope branch: ${trimForFinding(message)}`,
		})),
	);
}

function forbiddenToolFindings(toolCalls) {
	return toolCalls
		.filter((call) => call.name === "apply_patch")
		.map(() => ({
			severity: "error",
			id: "forbidden_tool:apply_patch",
			message: "No-input Cautilus run edited files.",
		}));
}

function collectFromValue(value, result) {
	if (value == null) {
		return;
	}
	if (Array.isArray(value)) {
		for (const item of value) {
			collectFromValue(item, result);
		}
		return;
	}
	if (typeof value !== "object") {
		return;
	}
	collectCommand(value, result.commands);
	collectMessage(value, result.messages);
	collectToolCall(value, result.toolCalls);
	for (const nested of Object.values(value)) {
		if (nested && typeof nested === "object") {
			collectFromValue(nested, result);
		}
	}
}

function collectCommand(value, commands) {
	const type = stringField(value.type);
	const command = commandText(value.command);
	if (command && commandLooksExecutable(type, value)) {
		commands.push(command);
	}
	if (value.cmd && typeof value.cmd === "string") {
		commands.push(value.cmd);
	}
}

function collectMessage(value, messages) {
	const type = stringField(value.type);
	const text = stringField(value.text) || stringField(value.message);
	if (text && /agent_message|assistant|message|response/.test(type)) {
		messages.push(text);
	}
}

function collectToolCall(value, toolCalls) {
	const name = stringField(value.name) || stringField(value.tool_name);
	const type = stringField(value.type);
	if (!name || !/function_call|tool_call|tool/.test(type)) {
		return;
	}
	toolCalls.push({ name, arguments: value.arguments ?? value.args ?? null });
}

function commandLooksExecutable(type, value) {
	if (/command|exec|shell/.test(type)) {
		return true;
	}
	return value.cmd != null || value.exit_code != null || value.output != null;
}

function commandText(value) {
	if (typeof value === "string") {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map((part) => String(part)).join(" ");
	}
	return "";
}

function stringField(value) {
	return typeof value === "string" ? value : "";
}

function trimForFinding(text) {
	const oneLine = text.replace(/\s+/g, " ").trim();
	return oneLine.length > 180 ? `${oneLine.slice(0, 177)}...` : oneLine;
}

function unique(values) {
	return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
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
		throw new Error("usage: audit-cautilus-no-input-log.mjs --input <codex-jsonl> [--output <audit.json>]");
	}
	return options;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	try {
		const options = parseArgs(process.argv.slice(2));
		const audit = auditNoInputLogText(readFileSync(options.input, "utf-8"));
		const body = `${JSON.stringify(audit, null, 2)}\n`;
		if (options.output) {
			writeFileSync(options.output, body);
		} else {
			process.stdout.write(body);
		}
		process.exitCode = audit.status === "passed" ? 0 : 1;
	} catch (error) {
		console.error(error.message);
		process.exitCode = 1;
	}
}
