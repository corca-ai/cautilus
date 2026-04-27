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
		assistant("The scan scope is README.md, AGENTS.md, CLAUDE.md with linked Markdown depth 3. LLM review needs a separate review budget."),
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
		assistant("스캔 범위는 README.md, AGENTS.md, CLAUDE.md와 링크 깊이 3입니다. LLM 리뷰는 별도 리뷰 예산이 필요합니다."),
		claudeBash("CAUTILUS_BIN=./bin/cautilus\n\"$CAUTILUS_BIN\" claim discover --repo-root . --output .cautilus/claims/latest.json"),
		claudeBash("CAUTILUS_BIN=./bin/cautilus\n\"$CAUTILUS_BIN\" claim show --input .cautilus/claims/latest.json --sample-claims 10"),
	]));
	assert.equal(audit.status, "passed");
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
