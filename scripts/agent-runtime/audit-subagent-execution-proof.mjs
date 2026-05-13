#!/usr/bin/env node
import { readFileSync } from "node:fs";
import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { writeTextOutput } from "./output-files.mjs";

export const SUBAGENT_EXECUTION_PROOF_AUDIT_SCHEMA = "cautilus.subagent_execution_proof_audit.v1";

export function auditSubagentExecutionProofText(text) {
	const parsed = parseJsonLines(text);
	const proofs = [
		...codexCollabProofs(parsed.events),
		...claudeAgentResultProofs(parsed.events),
		...claudeHookProofs(text),
		...codexFanoutCsvProofs(parsed.events),
	];
	const findings = [
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
		parseErrors: parsed.parseErrors,
		findings,
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
	return records.flatMap(({ index, event }) => {
		const result = event?.tool_use_result;
		if (!result || result.status !== "completed" || !result.agentId) {
			return [];
		}
		const resultText = claudeToolResultText(result.content);
		if (!resultText) {
			return [];
		}
		return [{
			backend: "claude_code",
			kind: "agent_tool_result",
			status: "completed",
			resultEventIndex: index,
			agentId: result.agentId,
			agentType: result.agentType ?? null,
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
		["collab_spawn", "collab_wait_result", "agent_tool_result", "subagent_stop_hook", "fanout_csv_result"].includes(proof.kind),
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
