import assert from "node:assert/strict";
import test from "node:test";

import { BEHAVIOR_DIMENSIONS } from "./behavior-intent.mjs";
import {
	DRAFT_SCENARIO_SCHEMA,
	SCENARIO_PROPOSALS_SCHEMA,
	buildDraftScenario,
	generateScenarioProposals,
	mergeProposalRecord,
} from "./scenario-proposals.mjs";

function createCandidate(overrides = {}) {
	return {
		proposalKey: "review-after-retro",
		title: "Refresh review-after-retro scenario from recent activity",
		family: "fast_regression",
		intentProfile: {
			schemaVersion: "cautilus.behavior_intent.v1",
			intentId: "intent-review-after-retro",
			summary: "The workflow should support pivoting from retro back to review in one thread.",
			behaviorSurface: "conversation_continuity",
			successDimensions: [
				{
					id: BEHAVIOR_DIMENSIONS.WORKFLOW_CONTINUITY,
					summary: "Carry the active workflow context cleanly into the next turn.",
				},
			],
			guardrailDimensions: [],
		},
		name: "Review After Retro",
		description: "The user pivots from retro back to review in one thread.",
		brief: "Recent activity shows a retro turn followed by a review turn.",
		tags: ["operational-log", "retro", "review"],
		maxTurns: 3,
		simulatorTurns: ["retro 먼저 해주세요", "이제 review로 돌아가죠"],
		evidence: [
			{
				sourceKind: "human_conversation",
				title: "review after retro",
				threadKey: "thread-1",
				observedAt: "2026-04-09T21:00:00.000Z",
				messages: ["retro 먼저 해주세요", "이제 review로 돌아가죠"],
			},
		],
		...overrides,
	};
}

test("mergeProposalRecord combines evidence and sorts newest first", () => {
	const merged = mergeProposalRecord(createCandidate(), createCandidate({
		evidence: [
			{
				sourceKind: "agent_run",
				title: "blocked run",
				runId: "run-1",
				threadKey: "thread-2",
				observedAt: "2026-04-10T21:00:00.000Z",
				textPreview: "go ahead",
				blockedReason: "ambiguous_confirmation_without_thread_context",
			},
		],
	}));
	assert.equal(merged.evidence.length, 2);
	assert.equal(merged.evidence[0].observedAt, "2026-04-10T21:00:00.000Z");
});

test("buildDraftScenario emits a product-owned normalized draft scenario", () => {
	const scenario = buildDraftScenario(createCandidate(), new Set(["review-after-retro"]));
	assert.equal(scenario.schemaVersion, DRAFT_SCENARIO_SCHEMA);
	assert.equal(scenario.scenarioId, "review-after-retro--ops-log-refresh");
	assert.equal(scenario.intentProfile.intentId, "intent-review-after-retro");
	assert.equal(scenario.benchmark.backend, "scripted");
	assert.equal(scenario.simulator.kind, "scripted");
});

test("generateScenarioProposals ranks merged candidates by evidence count and recency", () => {
	const result = generateScenarioProposals({
		proposalCandidates: [
			createCandidate(),
			createCandidate({
				proposalKey: "memory-preference-followup",
				title: "Refresh memory preference follow-up",
				intentProfile: {
					schemaVersion: "cautilus.behavior_intent.v1",
					intentId: "intent-memory-preference-followup",
					summary: "The workflow should remember a newly taught preference within the same thread.",
					behaviorSurface: "conversation_continuity",
					successDimensions: [
						{
							id: BEHAVIOR_DIMENSIONS.PREFERENCE_REUSE,
							summary: "Reuse the preference or constraint the user just established in-thread.",
						},
					],
					guardrailDimensions: [],
				},
				name: "Memory Preference Follow-Up",
				description: "The user teaches a preference and immediately reuses it.",
				brief: "Recent activity shows a preference turn followed by reuse.",
				evidence: [
					{
						sourceKind: "human_conversation",
						title: "memory preference",
						threadKey: "thread-3",
						observedAt: "2026-04-10T21:00:00.000Z",
						messages: ["앞으로 짧게 답해주세요", "그 기준으로 다시 답해주세요"],
					},
					{
						sourceKind: "human_conversation",
						title: "memory preference older",
						threadKey: "thread-4",
						observedAt: "2026-04-08T21:00:00.000Z",
						messages: ["앞으로 짧게 답해주세요"],
					},
				],
			}),
		],
		existingScenarioKeys: new Set(["review-after-retro"]),
		recentCoverage: new Map([
			["review-after-retro", 2],
			["memory-preference-followup", 0],
		]),
		now: new Date("2026-04-11T00:00:00.000Z"),
	});
	assert.equal(result.schemaVersion, SCENARIO_PROPOSALS_SCHEMA);
	assert.equal(result.proposals.length, 2);
	assert.equal(result.proposals[0].proposalKey, "memory-preference-followup");
	assert.equal(result.proposals[0].intentProfile.intentId, "intent-memory-preference-followup");
	assert.equal(result.proposals[1].action, "refresh_existing_scenario");
});

test("generateScenarioProposals filters families and limits output", () => {
	const result = generateScenarioProposals({
		proposalCandidates: [
			createCandidate(),
			createCandidate({
				proposalKey: "terminal-ci-wakeup",
				title: "Terminal wakeup",
				family: "terminal_realism",
				name: "Terminal Wakeup",
				description: "Wake up on terminal realism",
				brief: "Recent activity shows terminal realism follow-up.",
				evidence: [
					{
						sourceKind: "agent_run",
						title: "terminal realism",
						runId: "run-2",
						threadKey: "thread-5",
						observedAt: "2026-04-10T21:00:00.000Z",
						textPreview: "CI is broken",
						blockedReason: null,
					},
				],
			}),
		],
		families: ["terminal_realism"],
		limit: 1,
		now: new Date("2026-04-11T00:00:00.000Z"),
	});
	assert.deepEqual(result.families, ["terminal_realism"]);
	assert.equal(result.proposals.length, 1);
	assert.equal(result.proposals[0].family, "terminal_realism");
	assert.deepEqual(result.proposals[0].recommendedBackends, ["codex_exec", "claude_p"]);
	assert.equal(result.proposals[0].draftScenario.benchmark.backend, "persona_prompt");
	assert.equal(result.proposals[0].draftScenario.simulator.kind, "persona_prompt");
});
