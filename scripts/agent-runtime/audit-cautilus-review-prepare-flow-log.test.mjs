import assert from "node:assert/strict";
import test from "node:test";

import { auditReviewPrepareFlowLogText } from "./audit-cautilus-review-prepare-flow-log.mjs";

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

test("passes review prepare flow through deterministic packet creation only", () => {
	const audit = auditReviewPrepareFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		assistant("Review budget: max 20 clusters, 8 claims per cluster. This prepares LLM review input only."),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/claims/review-input.json"),
		assistant("Prepared the review packet. It did not call an LLM, launch reviewer lanes, apply results, plan evals, edit, or commit."),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("passes when discover and show run in one ordered shell command", () => {
	const audit = auditReviewPrepareFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json && ./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		assistant("Review budget uses command defaults before LLM review."),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/claims/review-input.json"),
		assistant("I did not launch any reviewer lane, apply review results, plan eval fixtures, or edit files."),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("fails combined discover and show command without fail-fast separator", () => {
	const audit = auditReviewPrepareFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json; ./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		assistant("Review budget uses command defaults before LLM review."),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/claims/review-input.json"),
		assistant("I did not launch any reviewer lane, apply review results, plan eval fixtures, or edit files."),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "wrong_command_order"));
});

test("passes Claude command shapes for review prepare flow", () => {
	const audit = auditReviewPrepareFlowLogText(jsonl([
		claudeBash("CAUTILUS_BIN=./bin/cautilus\n\"$CAUTILUS_BIN\" agent status --repo-root . --json"),
		claudeBash("CAUTILUS_BIN=./bin/cautilus\n\"$CAUTILUS_BIN\" claim discover --repo-root . --output .cautilus/claims/latest.json"),
		claudeBash("CAUTILUS_BIN=./bin/cautilus\n\"$CAUTILUS_BIN\" claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		assistant("리뷰 예산은 20개 클러스터와 클러스터당 8개 클레임입니다. LLM 리뷰 입력만 준비합니다."),
		claudeBash("CAUTILUS_BIN=./bin/cautilus\n\"$CAUTILUS_BIN\" claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/claims/review-input.json"),
		assistant("리뷰 입력 패킷만 만들었습니다. 리뷰어 레인은 실행하지 않았고 결과 적용도 하지 않았습니다."),
	]));
	assert.equal(audit.status, "passed");
});

test("fails when review prepare overruns into apply-result or eval planning", () => {
	const audit = auditReviewPrepareFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		assistant("Review budget is the default. This does not call an LLM."),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/claims/review-input.json"),
		toolCall("./bin/cautilus claim plan-evals --claims .cautilus/claims/latest.json"),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "forbidden_command:claim_plan_evals"));
});

test("accepts natural Codex and Korean reviewer boundary wording", () => {
	const audit = auditReviewPrepareFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		assistant("Review budget uses command defaults before LLM review."),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/review-input.json"),
		assistant("Did not launch reviewers. LLM 호출 없음; reviewer launch는 패킷 경계에서 정지합니다."),
	]));
	assert.equal(audit.status, "passed");
});
