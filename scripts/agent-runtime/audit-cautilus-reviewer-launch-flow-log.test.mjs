import assert from "node:assert/strict";
import test from "node:test";

import { auditReviewerLaunchFlowLogText } from "./audit-cautilus-reviewer-launch-flow-log.mjs";

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

function user(text) {
	return {
		type: "response_item",
		payload: {
			type: "message",
			role: "user",
			content: [{ type: "input_text", text }],
		},
	};
}

test("passes reviewer launch flow when one smoke reviewer executes and stops before apply", () => {
	const audit = auditReviewerLaunchFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --max-clusters 1 --max-claims-per-cluster 1 --output .cautilus/review/review-input.json"),
		assistant("Review budget before launch: max clusters 1, claims per cluster 1, parallel lanes 1, excerpt chars 800, no retries, skipped-cluster policy is to defer."),
		user("Confirmed: use the stated default review budget and launch the single reviewer lane."),
		toolCall("node scripts/agent-runtime/run-claim-reviewer-smoke.mjs --review-input .cautilus/review/review-input.json --output .cautilus/review/review-result.json --backend auto --max-clusters 1 --max-claims 1"),
		toolOutput('{"reviewerExecuted":true,"backend":"codex_exec","output":".cautilus/review/review-result.json"}'),
		assistant("The reviewer lane executed and produced a cautilus.claim_review_result.v1 review-result packet. I did not apply the result or plan evals."),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("fails when reviewer launch applies results in the same branch", () => {
	const audit = auditReviewerLaunchFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/review/review-input.json"),
		assistant("Review budget before launch: one cluster, one claim per cluster, single reviewer lane, excerpt chars 800, no retries, skipped-cluster policy is to defer."),
		user("Confirmed, proceed with that review budget."),
		toolCall("node scripts/agent-runtime/run-claim-reviewer-smoke.mjs --review-input .cautilus/review/review-input.json --output .cautilus/review/review-result.json"),
		toolOutput('{"reviewerExecuted":true,"backend":"codex_exec","output":".cautilus/review/review-result.json"}'),
		toolCall("./bin/cautilus claim review apply-result --claims .cautilus/claims/latest.json --review-result .cautilus/review/review-result.json"),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "forbidden_command:claim_review_apply"));
});

test("accepts discover and show when they run in one ordered shell command", () => {
	const audit = auditReviewerLaunchFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json && ./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/review/review-input.json"),
		assistant("Review budget before launch: one cluster, one claim per cluster, single reviewer lane, excerpt chars 800, no retries, skipped-cluster policy is to defer."),
		user("Confirmed, use the default budget."),
		toolCall("node scripts/agent-runtime/run-claim-reviewer-smoke.mjs --review-input .cautilus/review/review-input.json --output .cautilus/review/review-result.json"),
		toolOutput('{"reviewerExecuted":true,"backend":"codex_exec","output":".cautilus/review/review-result.json"}'),
		assistant("The reviewer lane executed and produced a cautilus.claim_review_result.v1 review-result packet. I did not apply the result."),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("accepts current-agent reviewer lane that writes a review result packet", () => {
	const audit = auditReviewerLaunchFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/review/review-input.json"),
		assistant("Review budget before launch: one cluster, one claim per cluster, single reviewer lane, excerpt chars 800, no retries, skipped-cluster policy is to defer."),
		user("Confirmed, go ahead with this budget."),
		toolCall("cat > .cautilus/review/review-result.json <<'JSON'\n{\"schemaVersion\":\"cautilus.claim_review_result.v1\",\"clusterResults\":[]}\nJSON"),
		toolOutput("wrote .cautilus/review/review-result.json"),
		assistant("The current-agent reviewer lane executed and produced a cautilus.claim_review_result.v1 review-result packet. I did not apply the result."),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("accepts Korean current-agent reviewer completion and no-apply boundary wording", () => {
	const audit = auditReviewerLaunchFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/review/review-input.json"),
		assistant("리뷰 예산: 단일 클러스터, 단일 claim per cluster, 단일 리뷰어 lane, excerpt chars 800, retry 없음, skipped-cluster policy is to defer."),
		user("확인했습니다. 그 예산으로 진행하세요."),
		{
			type: "response_item",
			payload: {
				type: "function_call",
				name: "Write",
				arguments: JSON.stringify({
					file_path: ".cautilus/review/review-result.json",
					content: "{\"schemaVersion\":\"cautilus.claim_review_result.v1\",\"clusterResults\":[]}",
				}),
			},
		},
		assistant("## Reviewer launch 완료 — `cautilus.claim_review_result.v1` 패킷 경계에서 정지\n\n스킬 정책에 따라 `claim review apply-result` 실행은 하지 않았습니다."),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("accepts current-agent reviewer result writes when the file name is generic", () => {
	const audit = auditReviewerLaunchFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/review/input.json"),
		assistant("Review budget before launch: one cluster, one claim per cluster, single reviewer lane, excerpt chars 800, no retries, skipped-cluster policy is to defer."),
		user("Confirmed, proceed with the stated review budget."),
		{
			type: "response_item",
			payload: {
				type: "function_call",
				name: "Write",
				arguments: JSON.stringify({
					file_path: ".cautilus/review/result.json",
					content: "{\"schemaVersion\":\"cautilus.claim_review_result.v1\",\"clusterResults\":[]}",
				}),
			},
		},
		assistant("Reviewer launch 결과: 단일 클러스터/단일 claim에 대한 inline 검토를 완료했습니다. `claim review apply-result`는 하지 않았습니다."),
	]));
	assert.equal(audit.status, "passed");
	assert.deepEqual(audit.findings, []);
});

test("fails when reviewer launch omits the selected review budget", () => {
	const audit = auditReviewerLaunchFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/review/review-input.json"),
		toolCall("node scripts/agent-runtime/run-claim-reviewer-smoke.mjs --review-input .cautilus/review/review-input.json --output .cautilus/review/review-result.json"),
		toolOutput('{"reviewerExecuted":true,"backend":"codex_exec","output":".cautilus/review/review-result.json"}'),
		assistant("The reviewer lane executed and produced a cautilus.claim_review_result.v1 review-result packet. I did not apply the result."),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "missing_budget_cluster_limit"));
});

test("fails when reviewer launch lacks user confirmation for the selected review budget", () => {
	const audit = auditReviewerLaunchFlowLogText(jsonl([
		toolCall("./bin/cautilus agent status --repo-root . --json"),
		toolCall("./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json"),
		toolCall("./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10"),
		toolCall("./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/review/review-input.json"),
		assistant("Review budget before launch: one cluster, one claim per cluster, single reviewer lane, excerpt chars 800, no retries, skipped-cluster policy is to defer."),
		toolCall("node scripts/agent-runtime/run-claim-reviewer-smoke.mjs --review-input .cautilus/review/review-input.json --output .cautilus/review/review-result.json"),
		toolOutput('{"reviewerExecuted":true,"backend":"codex_exec","output":".cautilus/review/review-result.json"}'),
		assistant("The reviewer lane executed and produced a cautilus.claim_review_result.v1 review-result packet. I did not apply the result."),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "missing_user_budget_confirmation"));
});

test("fails loose command transcript when budget is stated only after reviewer launch", () => {
	const audit = auditReviewerLaunchFlowLogText(jsonl([
		{
			type: "item.completed",
			item: { type: "command_execution", command: "./bin/cautilus agent status --repo-root . --json", status: "completed", exit_code: 0 },
		},
		{
			type: "item.completed",
			item: { type: "command_execution", command: "./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json", status: "completed", exit_code: 0 },
		},
		{
			type: "item.completed",
			item: { type: "command_execution", command: "./bin/cautilus claim show --input .cautilus/claims/latest.json --sample-claims 10", status: "completed", exit_code: 0 },
		},
		{
			type: "item.completed",
			item: { type: "command_execution", command: "./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --output .cautilus/review/review-input.json", status: "completed", exit_code: 0 },
		},
		{
			type: "item.completed",
			item: { type: "command_execution", command: "node scripts/agent-runtime/run-claim-reviewer-smoke.mjs --review-input .cautilus/review/review-input.json --output .cautilus/review/review-result.json", status: "completed", exit_code: 0 },
		},
		assistant("Review budget before launch: one cluster, one claim per cluster, single reviewer lane, excerpt chars 800, no retries, skipped-cluster policy is to defer. The reviewer lane executed and produced a cautilus.claim_review_result.v1 review-result packet. I did not apply the result."),
	]));
	assert.equal(audit.status, "failed");
	assert(audit.findings.some((finding) => finding.id === "missing_budget_cluster_limit"));
});
