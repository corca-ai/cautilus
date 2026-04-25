# Scenario Proposal Source Contract

`Cautilus` should eventually propose new or refreshed evaluation scenarios from recent operator activity and recent runtime outcomes, but the product boundary must stay independent from any one host repo's storage layout.

This contract defines the source ports and output payload that a scenario proposal engine can rely on before `Cautilus` imports any host-specific log mining code.

## Scope

This contract owns:

- normalized source-port inputs for recent human activity, recent agent runs, existing scenario registry, and recent scenario coverage
- proposal payload shape for operator review
- evidence and ranking expectations

This contract does not yet own:

- Slack-specific storage or event ingestion
- prompt text used to draft proposals
- the final scenario store file path
- UI workflow for accepting or rejecting proposals
- raw host-specific heuristics that convert activity logs into normalized proposal candidates

Two use-case-specific normalization helpers are now in scope as product-owned layers:

- `chatbot`
- `skill`

Those helpers should sit between source-port ingestion and proposal packet generation.
They are product-owned only at the normalized-helper layer, not at the storage-reader layer.

The first checked-in helper entrypoints now exist as:

- `cautilus eval test` (any surface/preset combo, including `repo/skill`)
- `cautilus eval evaluate`
- `cautilus scenario normalize chatbot`
- `cautilus scenario normalize skill`

## Source Ports

The proposal engine should read from four source ports.

### Human Activity Port

Recent human conversations or operator-visible threads that may reveal new scenario patterns.

Minimum shape:

```json
{
  "threadKey": "thread-123",
  "lastObservedAt": "2026-04-09T21:00:00.000Z",
  "records": [
    {
      "kind": "message_posted",
      "actorKind": "user",
      "text": "Please review the repo first.",
      "eventType": "message"
    }
  ]
}
```

### Agent Run Port

Recent runtime summaries that expose blocked reasons, weak follow-up handling, or recurring failure modes.

Minimum shape:

```json
{
  "runId": "run_123",
  "threadKey": "thread-123",
  "startedAt": "2026-04-09T21:00:00.000Z",
  "textPreview": "네, 그대로 진행해주세요.",
  "blockedReason": "ambiguous_confirmation_without_thread_context"
}
```

### Existing Scenario Registry Port

The current checked-in scenario set so the engine can decide between `add_new_scenario` and `refresh_existing_scenario`.

Minimum shape:

```json
{
  "scenarioId": "review-after-retro",
  "scenarioKey": "review-after-retro",
  "family": "fast_regression"
}
```

### Scenario Coverage Port

Recent execution counts for each scenario key so proposals can prioritize weakly covered patterns.

Minimum shape:

```json
{
  "scenarioKey": "review-after-retro",
  "recentResultCount": 2
}
```

## Proposal Payload

The proposal engine should emit an operator-reviewable payload like this:

```json
{
  "schemaVersion": "cautilus.scenario_proposals.v1",
  "generatedAt": "2026-04-09T21:00:00.000Z",
  "windowDays": 14,
  "families": ["fast_regression"],
  "proposalTelemetry": {
    "mergedCandidateCount": 12,
    "returnedProposalCount": 12
  },
  "attentionView": {
    "ruleVersion": "v1",
    "proposalKeys": ["review-after-retro"],
    "reasonCodesByProposalKey": {
      "review-after-retro": ["low_recent_coverage"]
    },
    "matchedRuleCount": 1,
    "selectedCount": 1,
    "fallbackUsed": false,
    "truncated": false
  },
  "proposals": [
    {
      "proposalKey": "review-after-retro",
      "title": "Refresh review-after-retro scenario from recent activity",
      "action": "refresh_existing_scenario",
      "family": "fast_regression",
      "recommendedBackends": ["scripted"],
      "existingCoverage": {
        "scenarioKeyExists": true,
        "recentResultCount": 2
      },
      "rationale": "2 recent log match(es) suggested this pattern.",
      "evidence": [],
      "draftScenario": {}
    }
  ]
}
```

## Evidence Shape

Evidence should preserve where the suggestion came from without forcing one host repo's storage model on the product.

Allowed source kinds:

- `human_conversation`
- `agent_run`
- `skill_evaluation`
- `workflow_run`

Recommended evidence payloads:

```json
{
  "sourceKind": "human_conversation",
  "title": "review after retro",
  "threadKey": "thread-123",
  "observedAt": "2026-04-09T21:00:00.000Z",
  "messages": ["retro 먼저 해주세요", "이제 repo review로 돌아가죠"]
}
```

```json
{
  "sourceKind": "agent_run",
  "title": "ambiguous confirmation blocked run",
  "runId": "run_123",
  "threadKey": "thread-123",
  "observedAt": "2026-04-09T21:00:00.000Z",
  "textPreview": "네, 그대로 진행해주세요.",
  "blockedReason": "ambiguous_confirmation_without_thread_context"
}
```

Proposal candidates and draft scenarios may also carry an optional `intentProfile` when the normalized source already knows the intended behavior behind the reusable scenario.

```json
{
  "sourceKind": "skill_evaluation",
  "title": "smoke scenario regression",
  "targetKind": "public_skill",
  "targetId": "impl",
  "surface": "smoke_scenario",
  "status": "failed",
  "observedAt": "2026-04-11T00:00:00.000Z",
  "summary": "The impl smoke scenario stopped producing a bounded execution plan."
}
```

```json
{
  "sourceKind": "workflow_run",
  "title": "replay seed recovery regression",
  "targetKind": "cli_workflow",
  "targetId": "scan-settings-seed",
  "surface": "replay_seed",
  "status": "blocked",
  "observedAt": "2026-04-11T01:00:00.000Z",
  "summary": "Replay seed stalled on the same settings screen after two retries.",
  "blockerKind": "repeated_screen_no_progress"
}
```

## Draft Scenario Expectations

The draft scenario embedded in each proposal should be normalized enough for a human to accept, edit, or reject it without re-deriving the context.

Minimum expectations:

- stable `scenarioId`
- human-readable `name`, `description`, and `brief`
- benchmark family and scenario key
- suggested backend family
- enough simulator or runner input to reproduce the pattern
- optional conversation-evaluation expectations when the source pattern is conversational

## Ranking Rules

The first generic ranking pass should prefer:

1. more evidence matches
2. more recent evidence
3. low recent coverage on the existing scenario key

The canonical machine-readable output should preserve the full ranked proposal list.
Human-facing views may derive a smaller attention set, but they should not hide the full ranked result from agents.

## Fixed Decisions

- Proposal generation should depend on normalized source ports, not direct host repo file traversal baked into `Cautilus`.
- The first standalone CLI surface starts after host-specific mining and reads a normalized proposal-candidate packet plus scenario registry and coverage.
- If `Cautilus` grows pre-candidate helpers, they should be use-case-specific normalization helpers such as `chatbot` or `skill`, not raw source readers.
- Existing scenario registry and recent scenario coverage are separate inputs.
  One says whether a key exists; the other says whether it is exercised enough.
- Proposal output should embed a draft scenario, not only a prose suggestion.
- Evidence should stay attached to each proposal so operator review is grounded.
- The first product-owned payload uses `cautilus.scenario_proposals.v1`.
- The first product-owned draft scenario payload uses `cautilus.scenario.v1`.

## Probe Questions

- Should `recommendedBackends` stay proposal-engine output, or be derived later from benchmark family defaults?
- Should the product distinguish `refresh_existing_scenario` from `raise_coverage_only`, or is one refresh action enough for the first version?
- Should blocked-run proposals and human-conversation proposals share one ranking queue, or should they be ranked per source kind first?

## Deferred Decisions

- operator acceptance workflow and persistence path
- host-specific heuristics for detecting topic shift, clarification, memory preference, or event-triggered wake-up patterns

## Source References

- [chatbot-normalization.md](./chatbot-normalization.md)
- [skill-normalization.md](./skill-normalization.md)
