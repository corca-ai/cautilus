import assert from "node:assert/strict";
import test from "node:test";

import { auditReviewToEvalFlowLogText } from "./audit-cautilus-review-to-eval-flow-log.mjs";

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

function toolOutput(output) {
	return {
		type: "response_item",
		payload: {
			type: "function_call_output",
			output,
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

test("passes when review result is applied, validated, and planned into evals", () => {
	const audit = auditReviewToEvalFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --max-clusters 1 --max-claims-per-cluster 1 --output .cautilus/review/review-input.json"),
		toolCall("node scripts/agent-runtime/run-claim-reviewer-smoke.mjs --review-input .cautilus/review/review-input.json --output .cautilus/review/review-result.json --backend auto --max-clusters 1 --max-claims 1"),
		toolOutput('{"reviewerExecuted":true,"backend":"codex_exec","output":".cautilus/review/review-result.json"}'),
		toolCall("./bin/cautilus claim review apply-result --claims .cautilus/claims/latest.json --review-result .cautilus/review/review-result.json --output .cautilus/review/reviewed-claims.json"),
		toolCall("./bin/cautilus claim validate --claims .cautilus/review/reviewed-claims.json --output .cautilus/review/validation.json"),
		toolOutput('{"valid":true,"issueCount":0}'),
		toolCall("./bin/cautilus claim plan-evals --claims .cautilus/review/reviewed-claims.json --output .cautilus/review/eval-plan.json"),
		assistant("The reviewer lane executed and produced a cautilus.claim_review_result.v1 review-result packet. I applied it with apply-result, claim validate returned valid true with issueCount 0, and claim plan-evals wrote an eval plan. I stopped before writing fixtures or editing product files."),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("fails when eval planning happens before validation", () => {
	const audit = auditReviewToEvalFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/review/review-input.json"),
		toolCall("node scripts/agent-runtime/run-claim-reviewer-smoke.mjs --review-input .cautilus/review/review-input.json --output .cautilus/review/review-result.json"),
		toolOutput('{"reviewerExecuted":true,"output":".cautilus/review/review-result.json"}'),
		toolCall("./bin/cautilus claim review apply-result --claims .cautilus/claims/latest.json --review-result .cautilus/review/review-result.json --output .cautilus/review/reviewed-claims.json"),
		toolCall("./bin/cautilus claim plan-evals --claims .cautilus/review/reviewed-claims.json --output .cautilus/review/eval-plan.json"),
		toolCall("./bin/cautilus claim validate --claims .cautilus/review/reviewed-claims.json --output .cautilus/review/validation.json"),
		assistant("The reviewer lane executed, produced a review-result packet, applied it, validated it, and made an eval plan. I stopped before writing fixtures."),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "wrong_command_order"));
});

test("fails when branch overruns into eval execution", () => {
	const audit = auditReviewToEvalFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/review/review-input.json"),
		toolCall("node scripts/agent-runtime/run-claim-reviewer-smoke.mjs --review-input .cautilus/review/review-input.json --output .cautilus/review/review-result.json"),
		toolOutput('{"reviewerExecuted":true,"output":".cautilus/review/review-result.json"}'),
		toolCall("./bin/cautilus claim review apply-result --claims .cautilus/claims/latest.json --review-result .cautilus/review/review-result.json --output .cautilus/review/reviewed-claims.json"),
		toolCall("./bin/cautilus claim validate --claims .cautilus/review/reviewed-claims.json --output .cautilus/review/validation.json"),
		toolCall("./bin/cautilus claim plan-evals --claims .cautilus/review/reviewed-claims.json --output .cautilus/review/eval-plan.json"),
		toolCall("./bin/cautilus eval test --fixture fixtures/eval/dev/skill/example.json"),
		assistant("The reviewer lane executed, produced a review-result packet, applied it, validated it, and made an eval plan. I stopped before writing fixtures."),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "forbidden_command:eval_test"));
});
