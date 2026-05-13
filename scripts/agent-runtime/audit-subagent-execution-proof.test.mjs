import assert from "node:assert/strict";
import test from "node:test";

import { auditSubagentExecutionProofText } from "./audit-subagent-execution-proof.mjs";

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
});
