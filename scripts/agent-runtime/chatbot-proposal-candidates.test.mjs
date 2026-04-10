import assert from "node:assert/strict";
import test from "node:test";

import { normalizeChatbotProposalCandidates } from "./chatbot-proposal-candidates.mjs";

test("normalizeChatbotProposalCandidates emits review clarification candidate from normalized user turns", () => {
	const candidates = normalizeChatbotProposalCandidates({
		conversationSummaries: [
			{
				threadKey: "thread-1",
				lastObservedAt: "2026-04-11T00:00:00.000Z",
				records: [
					{ actorKind: "user", text: "repo review 해주세요" },
					{ actorKind: "user", text: "지금 이 저장소 기준으로 봐주세요" },
				],
			},
		],
	});
	assert.equal(candidates.length, 1);
	assert.equal(candidates[0].proposalKey, "repo-review-needs-target-clarification");
	assert.equal(candidates[0].family, "fast_regression");
	assert.equal(candidates[0].intentProfile.behaviorSurface, "workflow_conversation");
	assert.equal(candidates[0].evidence[0].sourceKind, "human_conversation");
});

test("normalizeChatbotProposalCandidates emits event-triggered follow-up candidate", () => {
	const candidates = normalizeChatbotProposalCandidates({
		conversationSummaries: [
			{
				threadKey: "thread-2",
				lastObservedAt: "2026-04-11T00:00:00.000Z",
				records: [
					{ actorKind: "user", text: "CI 깨졌어요", eventType: "app_mention" },
					{ actorKind: "user", text: "그대로 이어서 진행해줘요" },
				],
			},
		],
	});
	assert.equal(candidates.length, 1);
	assert.equal(candidates[0].proposalKey, "event-triggered-followup");
	assert.equal(candidates[0].intentProfile.behaviorSurface, "thread_followup");
	assert.equal(candidates[0].simulatorTurns[0].eventType, "app_mention");
});

test("normalizeChatbotProposalCandidates emits blocked-run candidate for ambiguous confirmation", () => {
	const candidates = normalizeChatbotProposalCandidates({
		runSummaries: [
			{
				runId: "run-1",
				threadKey: "thread-3",
				startedAt: "2026-04-11T00:00:00.000Z",
				textPreview: "네, 그대로 진행해주세요.",
				blockedReason: "ambiguous_confirmation_without_thread_context",
			},
		],
	});
	assert.equal(candidates.length, 1);
	assert.equal(candidates[0].proposalKey, "ambiguous-confirmation-needs-context");
	assert.equal(candidates[0].intentProfile.behaviorSurface, "thread_context_recovery");
	assert.equal(candidates[0].evidence[0].sourceKind, "agent_run");
});

test("normalizeChatbotProposalCandidates merges duplicate proposal keys and keeps newest evidence first", () => {
	const candidates = normalizeChatbotProposalCandidates({
		runSummaries: [
			{
				runId: "run-older",
				threadKey: "thread-3",
				startedAt: "2026-04-10T00:00:00.000Z",
				textPreview: "좋아요, 진행해주세요.",
				blockedReason: "ambiguous_confirmation_without_thread_context",
			},
			{
				runId: "run-newer",
				threadKey: "thread-4",
				startedAt: "2026-04-11T00:00:00.000Z",
				textPreview: "그대로 진행해줘요.",
				blockedReason: "ambiguous_confirmation_without_thread_context",
			},
		],
	});
	assert.equal(candidates.length, 1);
	assert.equal(candidates[0].evidence.length, 2);
	assert.equal(candidates[0].intentProfile.behaviorSurface, "thread_context_recovery");
	assert.equal(candidates[0].evidence[0].runId, "run-newer");
});
