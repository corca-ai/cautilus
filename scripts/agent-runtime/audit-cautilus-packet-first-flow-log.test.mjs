import assert from "node:assert/strict";
import test from "node:test";

import { auditPacketFirstFlowLogText } from "./audit-cautilus-packet-first-flow-log.mjs";

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

test("passes packet-first flow without browser citations", () => {
	const audit = auditPacketFirstFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/evidenced-typed-runners.json --sample-claims 5"),
		assistant("The evidenced claim map is ready. Satisfied claims are explicit, and remaining work is grouped by action bucket."),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("fails when the flow cites HTML before reading packets", () => {
	const audit = auditPacketFirstFlowLogText(jsonl([
		toolCall("open artifacts/self-dogfood-html/index.html"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/evidenced-typed-runners.json --sample-claims 5"),
		assistant("I used the packet after the HTML report."),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "html_before_packet"));
});

test("fails when non-browser deliverable cites HTML in the answer", () => {
	const audit = auditPacketFirstFlowLogText(jsonl([
		toolCall("./bin/cautilus claim show --input .cautilus/claims/evidenced-typed-runners.json --sample-claims 5"),
		assistant("Read artifacts/self-dogfood-html/index.html for the answer."),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "html_cited_without_browser_deliverable"));
});
