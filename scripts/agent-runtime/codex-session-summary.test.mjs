import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	CODEX_SESSION_SUMMARY_SCHEMA,
	summarizeCodexSessionLogText,
} from "./codex-session-summary.mjs";

function jsonl(events) {
	return events.map((event) => JSON.stringify(event)).join("\n");
}

test("summarizes Codex rollout messages, tool calls, outputs, and commit signals", () => {
	const text = jsonl([
		{
			timestamp: "2026-04-27T01:45:25.907Z",
			type: "response_item",
			payload: {
				type: "message",
				role: "user",
				content: [{ type: "input_text", text: "1" }],
			},
		},
		{
			timestamp: "2026-04-27T01:45:32.390Z",
			type: "response_item",
			payload: {
				type: "message",
				role: "assistant",
				content: [{ type: "output_text", text: "첫 bounded claim scan을 실행하겠습니다." }],
			},
		},
		{
			timestamp: "2026-04-27T01:45:33.467Z",
			type: "response_item",
			payload: {
				type: "function_call",
				call_id: "call-1",
				name: "exec_command",
				arguments: JSON.stringify({
					cmd: "./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json",
					workdir: "/repo",
				}),
			},
		},
		{
			timestamp: "2026-04-27T01:47:17.455Z",
			type: "response_item",
			payload: {
				type: "function_call_output",
				call_id: "call-1",
				output: "Process exited with code 0\nOutput:\n[main 9a39ccd] Refresh Cautilus claim scan pointer\n",
			},
		},
	]);

	const summary = summarizeCodexSessionLogText(text, { inputPath: "/repo/session.jsonl" });
	assert.equal(summary.schemaVersion, CODEX_SESSION_SUMMARY_SCHEMA);
	assert.equal(summary.userMessages[0].text, "1");
	assert.equal(summary.assistantMessages[0].text, "첫 bounded claim scan을 실행하겠습니다.");
	assert.equal(summary.commands[0], "./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json");
	assert.equal(summary.toolCalls[0].workdir, "/repo");
	assert.equal(summary.commandOutputs[0].exitCode, 0);
	assert.equal(summary.commandOutputs[0].toolCall.command, summary.commands[0]);
	assert.equal(summary.commits[0].commit, "9a39ccd");
});

test("summarizes codex exec json item.completed command events", () => {
	const text = jsonl([
		{
			type: "thread.started",
			thread_id: "019dcd80-623b-78f1-baf7-eb780d7f87c2",
		},
		{
			type: "item.completed",
			item: {
				id: "item_1",
				type: "command_execution",
				command: "/usr/bin/zsh -lc './bin/cautilus agent status --repo-root . --json'",
				aggregated_output: "{}",
				exit_code: 0,
				status: "completed",
			},
		},
		{
			type: "item.completed",
			item: {
				id: "item_2",
				type: "agent_message",
				text: "상태를 읽었습니다.",
			},
		},
	]);

	const summary = summarizeCodexSessionLogText(text);
	assert.equal(summary.commands[0], "/usr/bin/zsh -lc './bin/cautilus agent status --repo-root . --json'");
	assert.equal(summary.assistantMessages[0].text, "상태를 읽었습니다.");
});

test("cli writes a nested session summary artifact", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-session-summary-"));
	const input = join(root, "session.jsonl");
	const output = join(root, "artifacts", "summary", "session.json");
	writeFileSync(input, jsonl([{ type: "command_execution", command: "cautilus agent status --repo-root . --json" }]), "utf-8");

	const result = spawnSync("node", [
		join(process.cwd(), "scripts", "agent-runtime", "summarize-codex-session-log.mjs"),
		"--input",
		input,
		"--output",
		output,
	], { encoding: "utf-8" });

	assert.equal(result.status, 0, result.stderr);
	assert.equal(existsSync(output), true);
	assert.equal(JSON.parse(readFileSync(output, "utf-8")).commands[0], "cautilus agent status --repo-root . --json");
});
