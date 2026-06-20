import assert from "node:assert/strict";
import test from "node:test";

import { auditRunnerReadinessFlowLogText } from "./audit-cautilus-runner-readiness-flow-log.mjs";

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

const GOOD_GUIDANCE = [
	"Runner readiness orients from doctor status: read runnerReadiness state and the next branches to clear the first blocker.",
	"The selected app/chat claim's requiredRunnerCapability is headless-product-chat-runner per evaluate claims plan.",
	"Build a headless product runner that reuses the real product path instead of a prompt-only mock.",
	"Then produce a cautilus.runner_assessment.v1 at the binary-named scaffold path with an honest proofClass, the assessedRequirement, knownGaps, and a ready-for-selected-surface recommendation.",
	"Freshness is checked against the adapter hash and the listed runner file hashes, so a stale assessment is flagged.",
	"Only in-process-product-runner or live-product-runner with a ready-for-selected-surface assessment may back an app behavior-change claim; stop improve when proof is missing, stale, or smoke-only.",
	"Stop before evaluate fixture, improve, edits, or commits.",
].join(" ");

test("passes when the flow orients readiness and helps build and assess a runner", () => {
	const audit = auditRunnerReadinessFlowLogText(jsonl([
		toolCall("./bin/cautilus doctor status --repo-root . --json"),
		toolCall("./bin/cautilus evaluate claims plan --claims .cautilus/claims/latest.json"),
		assistant(GOOD_GUIDANCE),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("fails when the flow orients but never helps build or assess a runner", () => {
	const audit = auditRunnerReadinessFlowLogText(jsonl([
		toolCall("./bin/cautilus doctor status --repo-root . --json"),
		toolCall("./bin/cautilus evaluate claims plan --claims .cautilus/claims/latest.json"),
		assistant("Runner readiness is shown in runnerReadiness. The required runner capability is listed. We are done."),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "missing_headless_runner_build"));
	assert(audit.findings.some((finding) => finding.id === "missing_runner_assessment"));
	assert(audit.findings.some((finding) => finding.id === "missing_proof_class"));
	assert(audit.findings.some((finding) => finding.id === "missing_recommendation_or_gaps"));
	assert(audit.findings.some((finding) => finding.id === "missing_freshness"));
	assert(audit.findings.some((finding) => finding.id === "missing_stop_improve_boundary"));
	assert(audit.findings.some((finding) => finding.id === "missing_stop_boundary"));
});

test("fails when the flow never orients from doctor status or claims plan", () => {
	const audit = auditRunnerReadinessFlowLogText(jsonl([
		assistant(GOOD_GUIDANCE),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "missing_doctor_status"));
	assert(audit.findings.some((finding) => finding.id === "missing_claims_plan"));
});

test("fails when the runner readiness flow overruns into eval, improve, or commits", () => {
	const audit = auditRunnerReadinessFlowLogText(jsonl([
		toolCall("./bin/cautilus doctor status --repo-root . --json"),
		toolCall("./bin/cautilus evaluate claims plan --claims .cautilus/claims/latest.json"),
		assistant(GOOD_GUIDANCE),
		toolCall("./bin/cautilus evaluate fixture --repo-root . --adapter-name demo"),
		toolCall("./bin/cautilus improve search --repo-root ."),
		toolCall("git commit -m wip"),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "forbidden_command:eval_fixture"));
	assert(audit.findings.some((finding) => finding.id === "forbidden_command:improve"));
	assert(audit.findings.some((finding) => finding.id === "forbidden_command:git_commit"));
});
