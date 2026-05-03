import assert from "node:assert/strict";
import test from "node:test";

import { auditFirstScanFlowLogText } from "./audit-cautilus-first-scan-flow-log.mjs";

function jsonl(events) {
	return events.map((event) => JSON.stringify(event)).join("\n");
}

function toolCall(command) {
	return {
		type: "response_item",
		payload: {
			type: "function_call",
			name: "exec_command",
			arguments: JSON.stringify({ cmd: command }),
		},
	};
}

function assistant(text) {
	return {
		type: "response_item",
		payload: {
			type: "message",
			role: "assistant",
			content: [{ type: "output_text", text }],
		},
	};
}

function commandExecution(command) {
	return {
		type: "item.completed",
		item: {
			type: "command_execution",
			command,
			status: "completed",
			exit_code: 0,
		},
	};
}

function claudeBash(command) {
	return {
		type: "assistant",
		message: {
			role: "assistant",
			content: [
				{
					type: "tool_use",
					id: `toolu-${command.length}`,
					name: "Bash",
					input: { command },
				},
			],
		},
	};
}

test("passes first scan flow with discovery followed by claim show", () => {
	const audit = auditFirstScanFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		assistant("The scan scope is README.md, AGENTS.md, CLAUDE.md with linked Markdown depth 3. Please confirm this scope or tell me a narrower explicit source set before I run discovery. LLM review needs a separate review budget."),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		assistant("Deterministic discovery is done; LLM review is separate and was not run."),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("passes Claude command shapes for first scan flow", () => {
	const audit = auditFirstScanFlowLogText(jsonl([
		claudeBash("CAUTILUS_BIN=./bin/cautilus\n\"$CAUTILUS_BIN\" agent status --repo-root . --json"),
		assistant("스캔 범위는 README.md, AGENTS.md, CLAUDE.md와 링크 깊이 3입니다. 이 범위를 확인하거나 조정해 주세요. LLM 리뷰는 별도 리뷰 예산이 필요합니다."),
		claudeBash("CAUTILUS_BIN=./bin/cautilus\n\"$CAUTILUS_BIN\" claim discover --repo-root . --output .cautilus/claims/latest.json"),
		claudeBash("CAUTILUS_BIN=./bin/cautilus\n\"$CAUTILUS_BIN\" claim show --input .cautilus/claims/latest.json --sample-claims 10"),
	]));
	assert.equal(audit.status, "passed");
});

test("passes loose command execution transcript shape with pre-discover confirmation", () => {
	const audit = auditFirstScanFlowLogText(jsonl([
		commandExecution("./bin/cautilus agent status --repo-root . --json"),
		{
			type: "item.completed",
			item: {
				type: "agent_message",
				text: "Scan scope: entries are README.md, AGENTS.md, and CLAUDE.md, with linked Markdown depth 3. Confirm this scan scope or adjust it before I run discovery. LLM review needs a separate review budget.",
			},
		},
		commandExecution("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		commandExecution("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("passes when claim discover and claim show are chained in one shell command", () => {
	const audit = auditFirstScanFlowLogText(jsonl([
		commandExecution("pwd && ./bin/cautilus agent status --repo-root . --json"),
		{
			type: "item.completed",
			item: {
				type: "agent_message",
				text: "Scan scope: entries are README.md, AGENTS.md, and CLAUDE.md, with linked Markdown depth 3. Confirm this scan scope or adjust it before I run discovery.",
			},
		},
		commandExecution("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json && ./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		assistant("Next safe branch: prepare bounded LLM claim review with a separate budget."),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("passes budgeted LLM claim review wording as review boundary", () => {
	const audit = auditFirstScanFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		assistant("The scan scope is README.md, AGENTS.md, CLAUDE.md with linked Markdown depth 3. Confirm this scan scope or adjust it before I run discovery."),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		assistant("The next branch is budgeted claim review; do not launch it from this first scan."),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("fails when first scan overruns into review or eval planning", () => {
	const audit = auditFirstScanFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		assistant("The scan scope is README.md and LLM review needs a separate review budget."),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json"),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "forbidden_command:claim_review_prepare"));
});

test("fails when first scan scope confirmation appears only after discovery", () => {
	const audit = auditFirstScanFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		assistant("I will run discovery now. LLM review needs a separate review budget."),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		assistant("The scan scope was README.md, AGENTS.md, CLAUDE.md with linked Markdown depth 3. Please confirm or adjust it next time."),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "missing_pre_discover_entries_and_depth"));
	assert(audit.findings.some((finding) => finding.id === "missing_pre_discover_scope_confirmation"));
});
