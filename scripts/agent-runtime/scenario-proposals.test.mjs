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

test("generateScenarioProposals validates optional evidence provenance enums", () => {
	const valid = generateScenarioProposals({
		proposalCandidates: [createCandidate({
			evidence: [
				{
					sourceKind: "agent_run",
					origin: "replayed",
					title: "valid replay provenance",
					observedAt: "2026-04-09T21:00:00.000Z",
					activityProvenance: {
						activityId: "session-1",
						taskKey: "review-after-retro",
						recurrenceKey: "review-after-retro",
						replayId: "replay-1",
						split: "review",
						score: 0.8,
					},
				},
			],
		})],
		now: new Date("2026-04-11T00:00:00.000Z"),
	});
	assert.equal(valid.proposals[0].evidence[0].activityProvenance.replayId, "replay-1");

	assert.throws(
		() => generateScenarioProposals({
			proposalCandidates: [createCandidate({
				evidence: [
					{
						sourceKind: "human_conversation",
						origin: "dreamed",
						title: "invalid origin",
						observedAt: "2026-04-09T21:00:00.000Z",
					},
				],
			})],
		}),
		/proposalCandidates\[0\]\.evidence\[0\]\.origin must be one of/,
	);
	assert.throws(
		() => generateScenarioProposals({
			proposalCandidates: [createCandidate({
				evidence: [
					{
						sourceKind: "human_conversation",
						origin: 12,
						title: "invalid origin type",
						observedAt: "2026-04-09T21:00:00.000Z",
					},
				],
			})],
		}),
		/proposalCandidates\[0\]\.evidence\[0\]\.origin must be a non-empty string/,
	);
	assert.throws(
		() => generateScenarioProposals({
			proposalCandidates: [createCandidate({
				evidence: [
					{
						sourceKind: "human_conversation",
						origin: null,
						title: "null origin",
						observedAt: "2026-04-09T21:00:00.000Z",
					},
				],
			})],
		}),
		/proposalCandidates\[0\]\.evidence\[0\]\.origin must be a non-empty string/,
	);
	assert.throws(
		() => generateScenarioProposals({
			proposalCandidates: [createCandidate({
				evidence: [
					{
						sourceKind: "agent_run",
						origin: "replayed",
						title: "bad provenance object",
						observedAt: "2026-04-09T21:00:00.000Z",
						activityProvenance: null,
					},
				],
			})],
		}),
		/proposalCandidates\[0\]\.evidence\[0\]\.activityProvenance must be an object/,
	);
	assert.throws(
		() => generateScenarioProposals({
			proposalCandidates: [createCandidate({
				evidence: [
					{
						sourceKind: "agent_run",
						origin: "replayed",
						title: "invalid task key",
						observedAt: "2026-04-09T21:00:00.000Z",
						activityProvenance: { taskKey: 12 },
					},
				],
			})],
		}),
		/proposalCandidates\[0\]\.evidence\[0\]\.activityProvenance\.taskKey must be a non-empty string/,
	);
	assert.throws(
		() => generateScenarioProposals({
			proposalCandidates: [createCandidate({
				evidence: [
					{
						sourceKind: "agent_run",
						origin: "replayed",
						title: "invalid split",
						observedAt: "2026-04-09T21:00:00.000Z",
						activityProvenance: { split: "acceptance" },
					},
				],
			})],
		}),
		/proposalCandidates\[0\]\.evidence\[0\]\.activityProvenance\.split must be one of proposal, train, review/,
	);
	assert.throws(
		() => generateScenarioProposals({
			proposalCandidates: [createCandidate({
				evidence: [
					{
						sourceKind: "agent_run",
						origin: "replayed",
						title: "invalid split type",
						observedAt: "2026-04-09T21:00:00.000Z",
						activityProvenance: { split: 12 },
					},
				],
			})],
		}),
		/proposalCandidates\[0\]\.evidence\[0\]\.activityProvenance\.split must be a non-empty string/,
	);
	assert.throws(
		() => generateScenarioProposals({
			proposalCandidates: [createCandidate({
				evidence: [
					{
						sourceKind: "agent_run",
						origin: "replayed",
						title: "null split",
						observedAt: "2026-04-09T21:00:00.000Z",
						activityProvenance: { split: null },
					},
				],
			})],
		}),
		/proposalCandidates\[0\]\.evidence\[0\]\.activityProvenance\.split must be a non-empty string/,
	);
	assert.throws(
		() => generateScenarioProposals({
			proposalCandidates: [createCandidate({
				evidence: [
					{
						sourceKind: "agent_run",
						origin: "replayed",
						title: "invalid score",
						observedAt: "2026-04-09T21:00:00.000Z",
						activityProvenance: { score: "0.8" },
					},
				],
			})],
		}),
		/proposalCandidates\[0\]\.evidence\[0\]\.activityProvenance\.score must be a number/,
	);
	assert.throws(
		() => generateScenarioProposals({
			proposalCandidates: [createCandidate({
				evidence: [
					{
						sourceKind: "agent_run",
						origin: "replayed",
						title: "score above range",
						observedAt: "2026-04-09T21:00:00.000Z",
						activityProvenance: { replayId: "replay-1", score: 1.1 },
					},
				],
			})],
		}),
		/proposalCandidates\[0\]\.evidence\[0\]\.activityProvenance\.score must be between 0 and 1/,
	);
	assert.throws(
		() => generateScenarioProposals({
			proposalCandidates: [createCandidate({
				evidence: [
					{
						sourceKind: "agent_run",
						origin: "replayed",
						title: "missing replay id",
						observedAt: "2026-04-09T21:00:00.000Z",
						activityProvenance: { split: "review" },
					},
				],
			})],
		}),
		/proposalCandidates\[0\]\.evidence\[0\]\.activityProvenance\.replayId is required when origin is replayed/,
	);
	assert.throws(
		() => generateScenarioProposals({
			proposalCandidates: [createCandidate({
				evidence: [
					{
						sourceKind: "agent_run",
						origin: "real",
						title: "mismatched replay id",
						observedAt: "2026-04-09T21:00:00.000Z",
						activityProvenance: { replayId: "replay-1" },
					},
				],
			})],
		}),
		/proposalCandidates\[0\]\.evidence\[0\]\.origin must be replayed when activityProvenance\.replayId is present/,
	);
	assert.throws(
		() => generateScenarioProposals({
			proposalCandidates: [createCandidate({
				evidence: [
					{
						sourceKind: "agent_run",
						origin: "replayed",
						title: "unsupported field",
						observedAt: "2026-04-09T21:00:00.000Z",
						activityProvenance: { logPath: "/tmp/raw.log" },
					},
				],
			})],
		}),
		/proposalCandidates\[0\]\.evidence\[0\]\.activityProvenance\.logPath is not supported/,
	);
});

test("generateScenarioProposals summarizes evidence provenance for review", () => {
	const result = generateScenarioProposals({
		proposalCandidates: [createCandidate({
			evidence: [
				{
					sourceKind: "human_conversation",
					origin: "real",
					title: "real conversation",
					observedAt: "2026-04-09T21:00:00.000Z",
					activityProvenance: { activityId: "session-1", split: "proposal" },
				},
				{
					sourceKind: "agent_run",
					origin: "replayed",
					title: "replay",
					observedAt: "2026-04-10T21:00:00.000Z",
					activityProvenance: { replayId: "replay-1", split: "review", score: 0.82 },
				},
			],
		})],
	});
	assert.deepEqual(result.proposals[0].provenanceSummary.originCounts, { real: 1, replayed: 1 });
	assert.deepEqual(result.proposals[0].provenanceSummary.splitCounts, { proposal: 1, review: 1 });
	assert.equal(result.proposals[0].provenanceSummary.replayEvidenceCount, 1);
	assert.equal(result.proposals[0].provenanceSummary.scoredEvidenceCount, 1);
	assert.equal(result.proposals[0].provenanceSummary.maxScore, 0.82);
});

test("generateScenarioProposals summarizes full evidence even when output evidence is truncated", () => {
	const result = generateScenarioProposals({
		proposalCandidates: [createCandidate({
			evidence: [
				{
					sourceKind: "human_conversation",
					origin: "real",
					title: "newest real",
					observedAt: "2026-04-12T21:00:00.000Z",
					activityProvenance: { split: "proposal" },
				},
				{
					sourceKind: "agent_run",
					origin: "replayed",
					title: "review replay",
					observedAt: "2026-04-11T21:00:00.000Z",
					activityProvenance: { replayId: "replay-1", split: "review", score: 0.7 },
				},
				{
					sourceKind: "skill_evaluation",
					origin: "synthetic",
					title: "train synthetic",
					observedAt: "2026-04-10T21:00:00.000Z",
					activityProvenance: { split: "train", score: 0.9 },
				},
				{
					sourceKind: "workflow_run",
					origin: "operator_authored",
					title: "old operator authored",
					observedAt: "2026-04-09T21:00:00.000Z",
					activityProvenance: { split: "review" },
				},
			],
		})],
	});
	assert.equal(result.proposals[0].evidence.length, 3);
	assert.deepEqual(result.proposals[0].provenanceSummary.originCounts, {
		real: 1,
		replayed: 1,
		synthetic: 1,
		operator_authored: 1,
	});
	assert.deepEqual(result.proposals[0].provenanceSummary.splitCounts, { proposal: 1, review: 2, train: 1 });
	assert.equal(result.proposals[0].provenanceSummary.maxScore, 0.9);
});

test("generateScenarioProposals rejects candidates without evidence signals", () => {
	assert.throws(
		() => generateScenarioProposals({
			proposalCandidates: [createCandidate({ evidence: [] })],
		}),
		/proposalCandidates\[0\]\.evidence must contain at least one item/,
	);
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
