# Scenario Proposal Source Contract

`Cautilus` should eventually propose new or refreshed evaluation scenarios from
recent operator activity and recent runtime outcomes, but the product boundary
must stay independent from any one host repo's storage layout.

This contract defines the source ports and output payload that a scenario
proposal engine can rely on before `Cautilus` imports any Ceal-specific log
mining code.

## Scope

This contract owns:

- normalized source-port inputs for recent human activity, recent agent runs,
  existing scenario registry, and recent scenario coverage
- proposal payload shape for operator review
- evidence and ranking expectations

This contract does not yet own:

- Slack-specific storage or event ingestion
- prompt text used to draft proposals
- the final scenario store file path
- UI workflow for accepting or rejecting proposals
- raw host-specific heuristics that convert activity logs into normalized
  proposal candidates

## Source Ports

The proposal engine should read from four source ports.

### Human Activity Port

Recent human conversations or operator-visible threads that may reveal new
scenario patterns.

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

Recent runtime summaries that expose blocked reasons, weak follow-up handling,
or recurring failure modes.

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

The current checked-in scenario set so the engine can decide between
`add_new_scenario` and `refresh_existing_scenario`.

Minimum shape:

```json
{
  "scenarioId": "review-after-retro",
  "scenarioKey": "review-after-retro",
  "family": "fast_regression"
}
```

### Scenario Coverage Port

Recent execution counts for each scenario key so proposals can prioritize weakly
covered patterns.

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

Evidence should preserve where the suggestion came from without forcing one host
repo's storage model on the product.

Allowed source kinds:

- `human_conversation`
- `agent_run`

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

## Draft Scenario Expectations

The draft scenario embedded in each proposal should be normalized enough for a
human to accept, edit, or reject it without re-deriving the context.

Minimum expectations:

- stable `scenarioId`
- human-readable `name`, `description`, and `brief`
- benchmark family and scenario key
- suggested backend family
- enough simulator or runner input to reproduce the pattern
- optional conversation-evaluation expectations when the source pattern is
  conversational

## Ranking Rules

The first generic ranking pass should prefer:

1. more evidence matches
2. more recent evidence
3. low recent coverage on the existing scenario key

The engine should cap output with an explicit `limit` instead of dumping every
possible pattern.

## Fixed Decisions

- Proposal generation should depend on normalized source ports, not direct host
  repo file traversal baked into `Cautilus`.
- The first standalone CLI surface starts after host-specific mining and reads a
  normalized proposal-candidate packet plus scenario registry and coverage.
- Existing scenario registry and recent scenario coverage are separate inputs.
  One says whether a key exists; the other says whether it is exercised enough.
- Proposal output should embed a draft scenario, not only a prose suggestion.
- Evidence should stay attached to each proposal so operator review is grounded.
- The first product-owned payload uses `cautilus.scenario_proposals.v1`.
- The first product-owned draft scenario payload uses `cautilus.scenario.v1`.

## Probe Questions

- Should `recommendedBackends` stay proposal-engine output, or be derived later
  from benchmark family defaults?
- Should the product distinguish `refresh_existing_scenario` from
  `raise_coverage_only`, or is one refresh action enough for the first version?
- Should blocked-run proposals and human-conversation proposals share one
  ranking queue, or should they be ranked per source kind first?

## Deferred Decisions

- operator acceptance workflow and persistence path
- host-specific heuristics for detecting topic shift, clarification, memory
  preference, or event-triggered wake-up patterns

## Source References

- `/home/ubuntu/ceal/scripts/agent-runtime/propose-audit-scenarios.mjs`
- `/home/ubuntu/ceal/docs/troubleshooting.md`
