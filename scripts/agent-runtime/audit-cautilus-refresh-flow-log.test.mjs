import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { auditRefreshFlowLogText } from "./audit-cautilus-refresh-flow-log.mjs";

function jsonl(events) {
	return events.map((event) => JSON.stringify(event)).join("\n");
}

function toolCall(index, command) {
	return {
		type: "response_item",
		payload: {
			type: "function_call",
			call_id: `call-${index}`,
			name: "exec_command",
			arguments: JSON.stringify({ cmd: command, workdir: "/repo" }),
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

test("passes a bounded two-turn refresh branch flow", () => {
	const audit = auditRefreshFlowLogText(jsonl([
		toolCall(1, "./bin/cautilus agent status --repo-root . --json"),
		assistant("1. Compare the saved claim map with recent repo changes (`refresh_claims_from_diff`)"),
		toolCall(2, "./bin/cautilus agent status --repo-root . --json"),
		toolCall(3, "./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/latest.json --refresh-plan --output .cautilus/claims/refresh-plan.json"),
		toolCall(4, "jq '.refreshSummary' .cautilus/claims/refresh-plan.json"),
		assistant("What I did: recorded a comparison for the saved claim map. What I did not do: did not update the saved claim map, review claims, or plan evals."),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("warns when the selected refresh branch skips rechecking status", () => {
	const audit = auditRefreshFlowLogText(jsonl([
		toolCall(1, "./bin/cautilus agent status --repo-root . --json"),
		toolCall(2, "./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/latest.json --refresh-plan --output .cautilus/claims/refresh-plan.json"),
		toolCall(3, "jq '.refreshSummary' .cautilus/claims/refresh-plan.json"),
		assistant("The saved claim map was not updated."),
	]));
	assert.equal(audit.status, "passed");
	assert(audit.findings.some((finding) => finding.id === "missing_branch_recheck"));
});

test("fails when branch labels start from internal ids or flow overruns", () => {
	const audit = auditRefreshFlowLogText(jsonl([
		toolCall(1, "./bin/cautilus agent status --repo-root . --json"),
		assistant("1. `refresh_claims_from_diff`\n2. `show_existing_claims`"),
		toolCall(2, "./bin/cautilus agent status --repo-root . --json"),
		toolCall(3, "./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/latest.json --refresh-plan --output .cautilus/claims/refresh-plan.json"),
		toolCall(4, "jq '.refreshSummary' .cautilus/claims/refresh-plan.json"),
		toolCall(5, "./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json"),
		assistant("Saved claim map was not updated."),
	]));
	assert.equal(audit.status, "failed");
	const ids = audit.findings.map((finding) => finding.id);
	assert(ids.includes("internal_branch_title"));
	assert(ids.includes("forbidden_command:claim_review_prepare"));
});

test("does not treat prose inside another shell command as an eval overrun", () => {
	const audit = auditRefreshFlowLogText(jsonl([
		toolCall(1, "./bin/cautilus agent status --repo-root . --json"),
		toolCall(2, "./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/latest.json --refresh-plan --output .cautilus/claims/refresh-plan.json"),
		toolCall(3, "jq '.refreshSummary' .cautilus/claims/refresh-plan.json"),
		toolCall(4, "perl -0pi -e 's/Create a host-owned repo\\/skill fixture and run it through cautilus eval test/Create a host-owned dev\\/skill fixture and run it through cautilus eval test/g' .cautilus/claims/latest.json"),
		assistant("The saved claim map was not updated."),
	]));
	assert.equal(audit.findings.some((finding) => finding.id === "forbidden_command:eval_test"), false);
});

test("still rejects an actual eval test command during the refresh branch", () => {
	const audit = auditRefreshFlowLogText(jsonl([
		toolCall(1, "./bin/cautilus agent status --repo-root . --json"),
		toolCall(2, "./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/latest.json --refresh-plan --output .cautilus/claims/refresh-plan.json"),
		toolCall(3, "jq '.refreshSummary' .cautilus/claims/refresh-plan.json"),
		toolCall(4, "./bin/cautilus eval test --repo-root ."),
		assistant("The saved claim map was not updated."),
	]));
	assert(audit.findings.some((finding) => finding.id === "forbidden_command:eval_test"));
});

test("accepts Korean wording that says the saved claim map was not refreshed", () => {
	const audit = auditRefreshFlowLogText(jsonl([
		toolCall(1, "./bin/cautilus agent status --repo-root . --json"),
		toolCall(2, "./bin/cautilus agent status --repo-root . --json"),
		toolCall(3, "./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/latest.json --refresh-plan --output .cautilus/claims/refresh-plan.json"),
		toolCall(4, "jq '.refreshSummary' .cautilus/claims/refresh-plan.json"),
		assistant("저장된 claim map은 아직 갱신되지 않았고, 새 claim 패킷을 쓰지 않았습니다."),
	]));
	assert.equal(audit.status, "passed");
});

test("cli writes nested refresh-flow audit output paths", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-refresh-flow-audit-"));
	const input = join(root, "log.jsonl");
	const output = join(root, "artifacts", "audit", "refresh-flow.json");
	writeFileSync(input, jsonl([
		toolCall(1, "cautilus agent status --repo-root . --json"),
		toolCall(2, "cautilus agent status --repo-root . --json"),
		toolCall(3, "cautilus claim discover --repo-root . --previous .cautilus/claims/latest.json --refresh-plan --output .cautilus/claims/refresh-plan.json"),
		toolCall(4, "jq '.refreshSummary' .cautilus/claims/refresh-plan.json"),
		assistant("The saved claim map was not updated."),
	]), "utf-8");

	const result = spawnSync("node", [
		join(process.cwd(), "scripts", "agent-runtime", "audit-cautilus-refresh-flow-log.mjs"),
		"--input",
		input,
		"--output",
		output,
	], { encoding: "utf-8" });

	assert.equal(result.status, 0, result.stderr);
	assert.equal(existsSync(output), true);
	assert.equal(JSON.parse(readFileSync(output, "utf-8")).schemaVersion, "cautilus.refresh_flow_audit.v1");
});
