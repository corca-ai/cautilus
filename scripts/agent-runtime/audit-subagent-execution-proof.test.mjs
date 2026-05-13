import assert from "node:assert/strict";
import test from "node:test";

import {
	auditSubagentExecutionProofText,
	formatSubagentExecutionProofFailure,
} from "./audit-subagent-execution-proof.mjs";

function jsonl(events) {
	return events.map((event) => JSON.stringify(event)).join("\n");
}

test("passes Codex collab spawn and wait result evidence", () => {
	const audit = auditSubagentExecutionProofText(jsonl([
		{
			type: "item.completed",
			item: {
				type: "collab_tool_call",
				tool: "spawn_agent",
				status: "completed",
				sender_thread_id: "parent",
				receiver_thread_ids: ["child-1"],
				agents_states: { "child-1": { status: "pending_init", message: null } },
			},
		},
		{
			type: "item.completed",
			item: {
				type: "collab_tool_call",
				tool: "wait",
				status: "completed",
				sender_thread_id: "parent",
				receiver_thread_ids: ["child-1"],
				agents_states: { "child-1": { status: "completed", message: "TINY_AUDITOR_MARKER verified" } },
			},
		},
	]));
	assert.equal(audit.status, "passed");
	assert.equal(audit.proofs[0].kind, "collab_wait_result");
	assert.equal(audit.proofs[0].resultText, "TINY_AUDITOR_MARKER verified");
});

test("fails Codex collab spawn without completed child result", () => {
	const audit = auditSubagentExecutionProofText(jsonl([
		{
			type: "item.completed",
			item: {
				type: "collab_tool_call",
				tool: "spawn_agent",
				status: "completed",
				receiver_thread_ids: ["child-1"],
			},
		},
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "missing_completed_result_evidence"));
});

test("passes Claude Agent tool result evidence", () => {
	const audit = auditSubagentExecutionProofText(jsonl([
		{
			type: "assistant",
			message: {
				role: "assistant",
				content: [{
					type: "tool_use",
					name: "Agent",
					input: { subagent_type: "tiny-auditor" },
				}],
			},
		},
		{
			type: "user",
			tool_use_result: {
				status: "completed",
				agentId: "agent-1",
				agentType: "tiny-auditor",
				content: [{ type: "text", text: "SUBAGENT_RESULT: PASS" }],
			},
		},
	]));
	assert.equal(audit.status, "passed");
	assert.equal(audit.proofs[0].kind, "agent_tool_result");
	assert.equal(audit.proofs[0].agentType, "tiny-auditor");
});

test("passes Claude Task tool_result evidence without agentId", () => {
	const audit = auditSubagentExecutionProofText(jsonl([
		{
			type: "assistant",
			message: {
				content: [{
					type: "tool_use",
					id: "toolu-task-1",
					name: "Task",
					input: { subagent_type: "Explore" },
				}],
			},
		},
		{
			type: "user",
			message: {
				content: [{
					type: "tool_result",
					tool_use_id: "toolu-task-1",
					content: [{ type: "text", text: "CAUTILUS_SUBAGENT_PROOF_OK from Task" }],
				}],
			},
		},
	]));
	assert.equal(audit.status, "passed");
	assert.equal(audit.proofs[0].kind, "task_tool_result");
	assert.equal(audit.proofs[0].agentType, "Explore");
	assert.equal(audit.proofs[0].resultText, "CAUTILUS_SUBAGENT_PROOF_OK from Task");
});

test("ignores non-subagent Claude tool_result evidence", () => {
	const audit = auditSubagentExecutionProofText(jsonl([
		{
			type: "assistant",
			message: {
				content: [{
					type: "tool_use",
					id: "toolu-bash-1",
					name: "Bash",
					input: { command: "ls" },
				}],
			},
		},
		{
			type: "user",
			message: {
				content: [{
					type: "tool_result",
					tool_use_id: "toolu-bash-1",
					content: "CAUTILUS_SUBAGENT_PROOF_OK from shell",
				}],
			},
		},
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "missing_spawn_evidence"));
});

test("passes Claude SubagentStop hook evidence with transcript path", () => {
	const audit = auditSubagentExecutionProofText([
		"SubagentStart\t{\"agent_id\":\"agent-1\",\"agent_type\":\"tiny-auditor\"}",
		"SubagentStop\t{\"agent_id\":\"agent-1\",\"agent_type\":\"tiny-auditor\",\"agent_transcript_path\":\"/tmp/subagents/agent-1.jsonl\",\"last_assistant_message\":\"SUBAGENT_RESULT: PASS\"}",
	].join("\n"));
	assert.equal(audit.status, "passed");
	assert.equal(audit.proofs[0].kind, "subagent_stop_hook");
	assert.equal(audit.proofs[0].agentTranscriptPath, "/tmp/subagents/agent-1.jsonl");
});

test("fails Claude Agent tool use without result", () => {
	const audit = auditSubagentExecutionProofText(jsonl([
		{
			type: "assistant",
			message: {
				role: "assistant",
				content: [{
					type: "tool_use",
					name: "Agent",
					input: { subagent_type: "tiny-auditor" },
				}],
			},
		},
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "missing_completed_result_evidence"));
});

test("passes Codex fanout CSV result evidence", () => {
	const output = [
		"id,claim,job_id,item_id,row_index,source_id,status,attempt_count,last_error,result_json,reported_at,completed_at",
		"c1,2 + 2 = 4,job-1,c1,0,c1,completed,1,,\"{\"\"verdict\"\":\"\"true\"\"}\",2026-05-12T23:23:18+00:00,2026-05-12T23:23:18+00:00",
	].join("\n");
	const audit = auditSubagentExecutionProofText(jsonl([
		{
			type: "item.completed",
			item: {
				type: "command_execution",
				command: "sed -n '1,5p' fanout-results.csv",
				aggregated_output: output,
				exit_code: 0,
				status: "completed",
			},
		},
	]));
	assert.equal(audit.status, "passed");
	assert.equal(audit.proofs[0].kind, "fanout_csv_result");
	assert.equal(audit.proofs[0].jobId, "job-1");
});

test("rejects direct result CSV without fanout metadata", () => {
	const output = [
		"id,status,result_json",
		"c1,completed,\"{\"\"verdict\"\":\"\"PASS\"\"}\"",
	].join("\n");
	const audit = auditSubagentExecutionProofText(jsonl([
		{
			type: "item.completed",
			item: {
				type: "command_execution",
				command: "sed -n '1,5p' results.csv",
				aggregated_output: output,
				exit_code: 0,
				status: "completed",
			},
		},
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "missing_spawn_evidence"));
});

test("reports failed custom Codex agent spawn", () => {
	const audit = auditSubagentExecutionProofText([
		JSON.stringify({
			type: "item.started",
			item: { type: "collab_tool_call", tool: "spawn_agent", status: "in_progress" },
		}),
		"2026-05-12T23:22:19Z ERROR codex_core::tools::router: error=unknown agent_type 'tiny_auditor'",
	].join("\n"));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "spawn_failed"));
	assert(audit.diagnostics.some((diagnostic) => diagnostic.id === "codex_agent_type_unavailable"));
});

test("diagnoses Claude subagent tool policy failures", () => {
	const audit = auditSubagentExecutionProofText("Error: Tool Agent is not allowed by --allowedTools");
	assert.equal(audit.status, "failed");
	assert(audit.diagnostics.some((diagnostic) => diagnostic.id === "claude_subagent_tool_unavailable"));
	assert(audit.findings.some((finding) => finding.nextAction?.includes("--claude-allowed-tools")));
});

test("does not diagnose Claude metadata as unavailable subagent tool", () => {
	const audit = auditSubagentExecutionProofText(jsonl([
		{
			type: "system",
			subtype: "init",
			tools: ["Task", "Agent", "Bash"],
			apiKeySource: "none",
			usage: { cache_creation_input_tokens: 6401, inference_geo: "not_available" },
		},
		{
			type: "assistant",
			message: {
					content: [{
						type: "tool_use",
						id: "toolu-agent-1",
						name: "Agent",
						input: { subagent_type: "Explore" },
					}],
				},
			},
			{
				type: "user",
				message: {
					content: [{
						type: "tool_result",
						tool_use_id: "toolu-agent-1",
						content: [{ type: "text", text: "CAUTILUS_SUBAGENT_PROOF_OK" }],
					}],
				},
			},
	]));
	assert.equal(audit.status, "passed");
	assert(!audit.diagnostics.some((diagnostic) => diagnostic.id === "claude_subagent_tool_unavailable"));
});

test("does not fail completed proof because diagnostic words appear in child text", () => {
	const audit = auditSubagentExecutionProofText(jsonl([
		{
			type: "item.completed",
			item: {
				type: "collab_tool_call",
				tool: "spawn_agent",
				status: "completed",
				receiver_thread_ids: ["child-1"],
			},
		},
		{
			type: "item.completed",
			item: {
				type: "collab_tool_call",
				tool: "wait",
				status: "completed",
				agents_states: {
					"child-1": {
						status: "completed",
						message: "The docs mention not logged in recovery, but this child completed.",
					},
				},
			},
		},
	]));
	assert.equal(audit.status, "passed");
	assert(audit.findings.some((finding) =>
		finding.id === "runtime_auth_unavailable" && finding.severity === "warning",
	));
});

test("formats runner failure diagnostics for auth and missing CLIs", () => {
	const auth = formatSubagentExecutionProofFailure({
		backend: "codex_exec",
		status: 1,
		stdout: "",
		stderr: "not logged in; run codex login",
	});
	assert.match(auth, /runtime_auth_unavailable/);

	const missing = formatSubagentExecutionProofFailure({
		backend: "claude_code",
		status: null,
		error: { code: "ENOENT" },
	});
	assert.match(missing, /runtime_cli_missing/);
	assert.match(missing, /Claude Code/);
});
