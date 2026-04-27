import assert from "node:assert/strict";
import test from "node:test";
import { auditNoInputLogText } from "./audit-cautilus-no-input-log.mjs";

function jsonl(events) {
	return events.map((event) => JSON.stringify(event)).join("\n");
}

test("passes a no-input run that reads agent status and reports branch choices", () => {
	const audit = auditNoInputLogText(
		jsonl([
			{ type: "command_execution", command: "./bin/cautilus agent status --repo-root . --json" },
			{
				type: "agent_message",
				text: "Cautilus orientation is ready. Claim state is missing, so the next branch is run_first_claim_scan or stop.",
			},
		]),
	);
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("fails when no-input execution runs discovery, debug artifacts, or commits", () => {
	const audit = auditNoInputLogText(
		jsonl([
			{ type: "command_execution", command: "./bin/cautilus claim discover --repo-root . --output /tmp/claims.json" },
			{ type: "command_execution", command: "git commit -m 'Record debug finding'" },
			{ type: "command_execution", command: "node scripts/validate_debug_artifact.mjs charness-artifacts/debug/x.md" },
			{ type: "agent_message", text: "I created a debug artifact and committed it." },
		]),
	);
	assert.equal(audit.status, "failed");
	const ids = audit.findings.map((finding) => finding.id);
	assert(ids.includes("missing_agent_status"));
	assert(ids.includes("forbidden_command:claim_discover"));
	assert(ids.includes("forbidden_command:git_commit"));
	assert(ids.includes("forbidden_command:debug_artifact"));
	assert(ids.includes("forbidden_message:debug_artifact"));
});

test("fails when tool calls edit files", () => {
	const audit = auditNoInputLogText(
		jsonl([
			{ type: "command_execution", command: "cautilus agent status --repo-root . --json" },
			{ type: "function_call", name: "apply_patch", arguments: "*** Begin Patch" },
		]),
	);
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "forbidden_tool:apply_patch"));
});
