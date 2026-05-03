import assert from "node:assert/strict";
import test from "node:test";

import { auditCanonicalSpecCurationFlowLogText } from "./audit-cautilus-canonical-spec-curation-flow-log.mjs";

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

test("passes when packet and both canonical spec indexes are inspected before HITL", () => {
	const audit = auditCanonicalSpecCurationFlowLogText(jsonl([
		toolCall("./bin/cautilus claim show --input .cautilus/claims/evidenced-typed-runners.json --sample-claims 8"),
		toolCall("sed -n '1,120p' docs/specs/user/index.spec.md"),
		toolCall("sed -n '1,120p' docs/specs/maintainer/index.spec.md"),
		assistant("The raw candidates are too granular. The user-facing spec index and maintainer-facing spec index are the canonical curation surface before continuing HITL."),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("fails when the flow skips the maintainer-facing index", () => {
	const audit = auditCanonicalSpecCurationFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("sed -n '1,120p' docs/specs/user/index.spec.md"),
		assistant("The user-facing spec index is ready before continuing HITL."),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "missing_maintainer_spec_index"));
});

test("fails when the flow launches claim review before the curation boundary", () => {
	const audit = auditCanonicalSpecCurationFlowLogText(jsonl([
		toolCall("./bin/cautilus claim show --input .cautilus/claims/evidenced-typed-runners.json --sample-claims 8"),
		toolCall("sed -n '1,120p' docs/specs/user/index.spec.md"),
		toolCall("sed -n '1,120p' docs/specs/maintainer/index.spec.md"),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/evidenced-typed-runners.json --output /tmp/review-input.json"),
		assistant("The user-facing and maintainer-facing indexes were checked before continuing HITL."),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "forbidden_command:claim_review_prepare_input"));
});
