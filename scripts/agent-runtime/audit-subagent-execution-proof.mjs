#!/usr/bin/env node
import { readFileSync } from "node:fs";
import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { writeTextOutput } from "./output-files.mjs";

export const SUBAGENT_EXECUTION_PROOF_AUDIT_SCHEMA = "cautilus.subagent_execution_proof_audit.v1";

const DIAGNOSTIC_RULES = [
	{
		id: "codex_agent_type_unavailable",
		backend: "codex_exec",
		pattern: /unknown agent_type|Agent type '[^']+' not found|could not spawn/i,
		message: "Codex reported that the requested subagent type could not be spawned.",
		nextAction: "Run from a git workspace with a Codex CLI version and project agent configuration that expose the requested agent type.",
	},
	{
		id: "codex_git_workspace_required",
		backend: "codex_exec",
		pattern: /not a git repository|must be run inside a git repository|outside a git repository/i,
		message: "Codex did not treat the workspace as a git-backed project.",
		nextAction: "Run the fixture from a git checkout or pass the appropriate Codex repo-check override only when the fixture is designed for it.",
	},
	{
		id: "claude_subagent_tool_unavailable",
		backend: "claude_code",
		pattern: /Unknown tool|tool[^.\n]{0,80}not available|(?:Agent|Task)(?:\s+tool)?\s+(?:is\s+)?not\s+available|not allowed[^.\n]{0,80}(?:Agent|Task)|(?:Agent|Task)[^.\n]{0,80}not allowed/i,
		message: "Claude did not expose or allow the subagent tool needed by the fixture.",
		nextAction: "Check the installed Claude Code version and the adapter's --claude-allowed-tools policy; allow Task or Agent for this fixture.",
	},
	{
		id: "runtime_auth_unavailable",
		backend: null,
		pattern: /not logged in|authentication(?:\s+failed)?|authenticate(?:\s+(?:first|with|before|required))?|api key(?:\s+(?:missing|invalid|required|not found))?|unauthorized|invalid api key|\b401\b|oauth(?:\s+(?:error|failed|token|required))?/i,
		message: "The selected coding-agent runtime appears unauthenticated.",
		nextAction: "Authenticate the selected CLI or configure the provider credentials before running live subagent dogfood.",
	},
	{
		id: "runtime_model_unavailable",
		backend: null,
		pattern: /unknown model|model .*not found|model .*not available|invalid model/i,
		message: "The selected model was rejected by the runtime or provider.",
		nextAction: "Use a model available on this machine/provider or remove the adapter's model pin.",
	},
	{
		id: "runtime_quota_or_rate_limit",
		backend: null,
		pattern: /rate limit|quota|insufficient_quota|billing|credits/i,
		message: "The provider refused the run because of quota, billing, or rate limits.",
		nextAction: "Retry after provider capacity recovers or use a configured account with available quota.",
	},
];

export function auditSubagentExecutionProofText(text) {
	const parsed = parseJsonLines(text);
	const proofs = [
		...codexCollabProofs(parsed.events),
		...claudeAgentResultProofs(parsed.events),
		...claudeHookProofs(text),
		...codexFanoutCsvProofs(parsed.events),
	];
	const diagnostics = diagnoseSubagentExecutionProofText(text);
	const findings = [
		...diagnostics.map((diagnostic) => diagnosticFinding(diagnostic, proofs)),
		...spawnFailureFindings(text, parsed.events),
		...proofCoverageFindings(proofs),
	];
	return {
		schemaVersion: SUBAGENT_EXECUTION_PROOF_AUDIT_SCHEMA,
		status: findings.some((finding) => finding.severity === "error") ? "failed" : "passed",
		commandCount: proofs.length,
		commands: [],
		proofCount: proofs.length,
		proofs,
		diagnostics,
		parseErrors: parsed.parseErrors,
		findings,
	};
}

export function diagnoseSubagentExecutionProofText(text, backend = null) {
	const haystack = String(text ?? "");
	const diagnostics = [];
	for (const rule of DIAGNOSTIC_RULES) {
		if (rule.backend && backend && rule.backend !== backend) {
			continue;
		}
		if (rule.pattern.test(haystack)) {
			diagnostics.push({
				id: rule.id,
				backend: rule.backend ?? backend,
				message: rule.message,
				nextAction: rule.nextAction,
			});
		}
	}
	return diagnostics;
}

export function formatSubagentExecutionProofFailure({ backend, stdout, stderr, error, status }) {
	const diagnostics = [
		...diagnoseProcessError(error, backend),
		...diagnoseSubagentExecutionProofText(`${stdout ?? ""}\n${stderr ?? ""}`, backend),
	];
	if (diagnostics.length === 0) {
		return "";
	}
	const summary = diagnostics
		.map((diagnostic) => `${diagnostic.id}: ${diagnostic.nextAction}`)
		.join(" ");
	return ` Subagent readiness diagnostics for ${backend} status ${status ?? "unknown"}: ${summary}`;
}

function diagnoseProcessError(error, backend) {
	if (error?.code !== "ENOENT") {
		return [];
	}
	return [{
		id: "runtime_cli_missing",
		backend,
		message: "The selected coding-agent CLI was not found on PATH.",
		nextAction: `Install ${backend === "claude_code" ? "Claude Code" : "Codex CLI"} or adjust PATH before running this live fixture.`,
	}];
}

function diagnosticFinding(diagnostic, proofs) {
	const hasCompletedProof = proofs.some((proof) => proof.status === "completed" && proof.resultText?.trim());
	return {
		severity: hasCompletedProof ? "warning" : "error",
		id: diagnostic.id,
		message: diagnostic.message,
		nextAction: diagnostic.nextAction,
	};
}

function parseJsonLines(text) {
	const events = [];
	const parseErrors = [];
	for (const [index, line] of String(text ?? "").split(/\r?\n/).entries()) {
		if (!line.trim()) {
			continue;
		}
		try {
			events.push({ index, event: JSON.parse(line) });
		} catch (error) {
			if (!line.startsWith("SubagentStart\t") && !line.startsWith("SubagentStop\t")) {
				parseErrors.push({ line: index + 1, error: error.message });
			}
		}
	}
	return { events, parseErrors };
}

function codexCollabProofs(records) {
	const spawns = records
		.map(({ index, event }) => ({ index, item: event?.item }))
		.filter(({ item }) =>
			item?.type === "collab_tool_call"
			&& item.tool === "spawn_agent"
			&& item.status === "completed"
			&& Array.isArray(item.receiver_thread_ids)
			&& item.receiver_thread_ids.length > 0,
		);
	const waits = records
		.map(({ index, event }) => ({ index, item: event?.item }))
		.filter(({ item }) =>
			item?.type === "collab_tool_call"
			&& item.tool === "wait"
			&& item.status === "completed",
		);
	return spawns.flatMap((spawn) => {
		const receiverIds = spawn.item.receiver_thread_ids;
		const wait = waits.find(({ item }) =>
			receiverIds.some((threadId) => completedAgentMessage(item.agents_states?.[threadId])),
		);
		if (!wait) {
			return [{
				backend: "codex_exec",
				kind: "collab_spawn",
				status: "spawned",
				spawnEventIndex: spawn.index,
				receiverThreadIds: receiverIds,
			}];
		}
		const completed = receiverIds
			.map((threadId) => ({ threadId, state: wait.item.agents_states?.[threadId] }))
			.filter(({ state }) => completedAgentMessage(state));
		return completed.map(({ threadId, state }) => ({
			backend: "codex_exec",
			kind: "collab_wait_result",
			status: "completed",
			spawnEventIndex: spawn.index,
			resultEventIndex: wait.index,
			threadId,
			resultText: state.message,
		}));
	});
}

function completedAgentMessage(state) {
	return state?.status === "completed" && typeof state.message === "string" && state.message.trim();
}

function claudeAgentResultProofs(records) {
	const subagentToolUses = claudeSubagentToolUses(records);
	return records.flatMap(({ index, event }) => {
		const runtimeProof = claudeAgentRuntimeProof(index, event?.tool_use_result);
		if (runtimeProof) {
			return [runtimeProof];
		}
		return claudeMessageToolResultProofs(index, event, subagentToolUses);
	});
}

function claudeSubagentToolUses(records) {
	const toolUses = new Map();
	for (const { index, event } of records) {
		for (const entry of event?.message?.content ?? []) {
			if (entry?.type !== "tool_use" || !["Agent", "Task"].includes(entry.name) || !entry.id) {
				continue;
			}
			toolUses.set(entry.id, {
				index,
				toolName: entry.name,
				agentType: entry.input?.subagent_type ?? null,
			});
		}
	}
	return toolUses;
}

function claudeAgentRuntimeProof(index, result) {
	if (!result || result.status !== "completed" || !result.agentId) {
		return null;
	}
	const resultText = claudeToolResultText(result.content);
	if (!resultText) {
		return null;
	}
	return {
		backend: "claude_code",
		kind: "agent_tool_result",
		status: "completed",
		resultEventIndex: index,
		agentId: result.agentId,
		agentType: result.agentType ?? null,
		resultText,
	};
}

function claudeMessageToolResultProofs(index, event, subagentToolUses) {
	return (event?.message?.content ?? []).flatMap((entry) => {
		if (entry?.type !== "tool_result" || entry.is_error === true) {
			return [];
		}
		const toolUse = subagentToolUses.get(entry.tool_use_id);
		const resultText = claudeToolResultText(entry.content);
		if (!toolUse || !resultText) {
			return [];
		}
		return [{
			backend: "claude_code",
			kind: toolUse.toolName === "Task" ? "task_tool_result" : "agent_tool_result",
			status: "completed",
			spawnEventIndex: toolUse.index,
			resultEventIndex: index,
			toolUseId: entry.tool_use_id,
			agentId: null,
			agentType: toolUse.agentType,
			resultText,
		}];
	});
}

function claudeToolResultText(content) {
	if (typeof content === "string") {
		return content.trim();
	}
	if (!Array.isArray(content)) {
		return "";
	}
	return content
		.map((entry) => typeof entry === "string" ? entry : entry?.text ?? "")
		.filter(Boolean)
		.join("\n")
		.trim();
}

function claudeHookProofs(text) {
	return String(text ?? "").split(/\r?\n/).flatMap((line, index) => {
		if (!line.startsWith("SubagentStop\t")) {
			return [];
		}
		try {
			const payload = JSON.parse(line.slice("SubagentStop\t".length));
			if (!payload.last_assistant_message?.trim()) {
				return [];
			}
			return [{
				backend: "claude_code",
				kind: "subagent_stop_hook",
				status: "completed",
				resultEventIndex: index,
				agentId: payload.agent_id ?? null,
				agentType: payload.agent_type ?? null,
				agentTranscriptPath: payload.agent_transcript_path ?? null,
				resultText: payload.last_assistant_message,
			}];
		} catch {
			return [];
		}
	});
}

function codexFanoutCsvProofs(records) {
	return records.flatMap(({ index, event }) => {
		const output = event?.item?.aggregated_output;
		if (typeof output !== "string" || !isFanoutCsv(output)) {
			return [];
		}
		return fanoutRows(output).map((row) => ({
			backend: "codex_exec",
			kind: "fanout_csv_result",
			status: row.status,
			resultEventIndex: index,
			jobId: row.job_id ?? null,
			itemId: row.item_id ?? null,
			sourceId: row.source_id ?? null,
			resultText: row.result_json ?? "",
		}));
	});
}

function isFanoutCsv(text) {
	const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
	return ["job_id", "item_id", "status", "attempt_count", "result_json", "completed_at"]
		.every((column) => firstLine.includes(column));
}

function fanoutRows(text) {
	const lines = text.split(/\r?\n/).filter((line) => line.trim());
	if (lines.length < 2) {
		return [];
	}
	const headers = parseCsvLine(lines[0]);
	return lines.slice(1).map((line) => {
		const values = parseCsvLine(line);
		return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
	}).filter((row) => row.status === "completed" && row.result_json?.trim());
}

function parseCsvLine(line) {
	const values = [];
	let current = "";
	let quoted = false;
	for (let index = 0; index < line.length; index += 1) {
		const char = line[index];
		const next = line[index + 1];
		if (char === "\"" && quoted && next === "\"") {
			current += "\"";
			index += 1;
			continue;
		}
		if (char === "\"") {
			quoted = !quoted;
			continue;
		}
		if (char === "," && !quoted) {
			values.push(current);
			current = "";
			continue;
		}
		current += char;
	}
	values.push(current);
	return values;
}

function spawnFailureFindings(text, records) {
	const findings = [];
	if (/unknown agent_type|Agent type '[^']+' not found|could not spawn/i.test(text)) {
		findings.push({
			severity: "error",
			id: "spawn_failed",
			message: "The log shows a subagent spawn failure.",
		});
	}
	const incompleteSpawns = records.filter(({ event }) =>
		event?.item?.type === "collab_tool_call"
		&& event.item.tool === "spawn_agent"
		&& event.item.status === "in_progress",
	);
	if (incompleteSpawns.length > 0 && !records.some(({ event }) =>
		event?.item?.type === "collab_tool_call"
		&& event.item.tool === "spawn_agent"
		&& event.item.status === "completed",
	)) {
		findings.push({
			severity: "error",
			id: "spawn_incomplete",
			message: "The log started a subagent spawn call but did not show a completed spawn.",
		});
	}
	return findings;
}

function proofCoverageFindings(proofs) {
	const hasSpawn = proofs.some((proof) =>
		["collab_spawn", "collab_wait_result", "agent_tool_result", "task_tool_result", "subagent_stop_hook", "fanout_csv_result"].includes(proof.kind),
	);
	const hasCompletedResult = proofs.some((proof) => proof.status === "completed" && proof.resultText?.trim());
	const findings = [];
	if (!hasSpawn) {
		findings.push({
			severity: "error",
			id: "missing_spawn_evidence",
			message: "Expected auditable evidence that a subagent or fanout worker was spawned.",
		});
	}
	if (!hasCompletedResult) {
		findings.push({
			severity: "error",
			id: "missing_completed_result_evidence",
			message: "Expected auditable evidence of the subagent's completed result, not only an attempted spawn.",
		});
	}
	return findings;
}

function usage() {
	throw new Error("usage: audit-subagent-execution-proof.mjs --input <agent-jsonl> [--output <audit.json>]");
}

function parseArgs(argv) {
	const options = { input: null, output: null };
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--input") {
			options.input = resolve(argv[index + 1] ?? usage());
			index += 1;
		} else if (arg === "--output") {
			options.output = resolve(argv[index + 1] ?? usage());
			index += 1;
		} else {
			usage();
		}
	}
	if (!options.input) {
		usage();
	}
	return options;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	try {
		const options = parseArgs(process.argv.slice(2));
		const audit = auditSubagentExecutionProofText(readFileSync(options.input, "utf-8"));
		writeTextOutput(options.output, `${JSON.stringify(audit, null, 2)}\n`);
		if (audit.status !== "passed") {
			process.exitCode = 1;
		}
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}
