# Scenario Proposal Input Packet Contract

`cautilus scenario propose` is the first standalone product surface for
turning host-normalized scenario signals into operator-reviewable proposal
packets.

This contract defines the exact input packet boundary that host repos must
produce before `Cautilus` ranks, merges, and emits draft scenario proposals.

## Scope

This contract owns:

- the checked-in or generated JSON packet consumed by
  `cautilus scenario propose`
- normalized proposal-candidate shape
- scenario registry and coverage payload shape at the CLI handoff boundary

This contract does not own:

- raw Slack, chat, or host-runtime logs
- host-specific heuristics that decide how to group activity into proposal
  candidates
- operator acceptance workflow after proposal generation

## Input Packet

The first input packet uses `cautilus.scenario_proposal_inputs.v1`.

Minimum shape:

```json
{
  "schemaVersion": "cautilus.scenario_proposal_inputs.v1",
  "windowDays": 14,
  "families": ["fast_regression"],
  "proposalCandidates": [
    {
      "proposalKey": "review-after-retro",
      "title": "Refresh review-after-retro scenario from recent activity",
      "family": "fast_regression",
      "name": "Review After Retro",
      "description": "The user pivots from retro back to review in one thread.",
      "brief": "Recent activity shows a retro turn followed by a review turn.",
      "simulatorTurns": ["retro 먼저 해주세요", "이제 review로 돌아가죠"],
      "evidence": [
        {
          "sourceKind": "human_conversation",
          "title": "review after retro",
          "threadKey": "thread-1",
          "observedAt": "2026-04-09T21:00:00.000Z",
          "messages": ["retro 먼저 해주세요", "이제 review로 돌아가죠"]
        }
      ]
    }
  ],
  "existingScenarioRegistry": [
    {
      "scenarioId": "review-after-retro",
      "scenarioKey": "review-after-retro",
      "family": "fast_regression"
    }
  ],
  "scenarioCoverage": [
    {
      "scenarioKey": "review-after-retro",
      "recentResultCount": 2
    }
  ],
  "now": "2026-04-11T00:00:00.000Z"
}
```

## Proposal Candidate Shape

Each entry in `proposalCandidates` must provide:

- stable `proposalKey`
- human-readable `title`
- benchmark `family`
- draftable `name`, `description`, and `brief`
- `evidence` array with at least one operator-reviewable signal

Optional fields currently supported by the product-owned draft builder:

- `intentProfile` using `cautilus.behavior_intent.v1`
  with product-owned `behaviorSurface` and dimension IDs
- `tags`
- `maxTurns`
- `simulatorTurns`
- `eventType`
- `conversationAuditScenario`

`Cautilus` may accept multiple candidates with the same `proposalKey`.
The product-owned merge step combines their evidence and keeps the newest
evidence first.

## Registry And Coverage Shape

`existingScenarioRegistry` carries the current checked-in scenario identity.
Only `scenarioKey` is required by the first standalone CLI surface, but host
repos should preserve `scenarioId` and `family` when they already have them.

`scenarioCoverage` carries recent execution counts by `scenarioKey`.
`recentResultCount` must be a non-negative number.

## Normalization Expectations

The host-owned normalization seam should:

- map raw activity into stable `proposalKey` buckets
- produce operator-reviewable evidence rather than opaque IDs alone
- keep host-private storage details out of the product packet unless they are
  needed for review context
- pass scenario registry and coverage as separate inputs so refresh decisions do
  not depend on guessed state

The product-owned `scenario propose` command then:

- validates the packet
- merges duplicate `proposalKey` entries
- ranks proposals
- emits `cautilus.scenario_proposals.v1`
- preserves `intentProfile` when the candidate already carries one
  and normalizes it against the shared behavior-intent catalog

## Fixed Decisions

- `cautilus scenario propose` reads a normalized packet, not raw host logs.
- Host repos own topic detection, blocked-run clustering, and other
  pattern-mining heuristics.
- Product-owned proposal generation starts at candidate merge and ranking.
- Registry presence and recent coverage remain separate inputs.
- `intentProfile` stays optional so non-intent-aware candidate miners do not
  have to invent fake dimensions.

## Probe Questions

- Should a later version support stdin in addition to `--input` files?
- Should host repos be encouraged to emit one candidate per evidence item, or
  pre-merge candidates before handing them to `Cautilus`?
- Should the product eventually validate richer candidate-family-specific
  fields, or keep the first packet schema loose?

## Deferred Decisions

- generic helpers, if any, for host-side normalization before the packet exists

## Source References

- [scenario-proposal-sources.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-sources.md)
- [scenario-proposal-normalization.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-normalization.md)
- [build-scenario-proposal-input.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/build-scenario-proposal-input.mjs)
- [generate-scenario-proposals.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/generate-scenario-proposals.mjs)
- [input.schema.json](/home/ubuntu/cautilus/fixtures/scenario-proposals/input.schema.json)
- [standalone-input.json](/home/ubuntu/cautilus/fixtures/scenario-proposals/standalone-input.json)
