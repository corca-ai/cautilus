# Chatbot Scenario Normalization Contract

`Cautilus` should support a first-class `chatbot` normalization helper that
turns already-summarized conversational activity into scenario proposal
candidates.

This helper exists because conversational consumers such as Ceal repeatedly
need the same layer:

- continuity pivots across turns
- clarification vs approval boundaries
- event-triggered wake-up and follow-up handling
- blocked run follow-ups that reveal missing thread context

The helper should own this use-case-specific normalization layer without
crossing into source-reader ownership.

## Problem

Raw conversation logs are too host-shaped to make `Cautilus` portable, but
fully consumer-owned candidate shaping would duplicate the same conversational
patterns in every chatbot repo.

The product boundary should therefore start after storage-specific ingestion
and before generic proposal ranking:

`host log reader -> chatbot normalization helper -> proposalCandidates -> scenario prepare-input -> scenario propose`

## Current Slice

The first `chatbot` normalization helper now exists as:

- [chatbot-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/chatbot-proposal-candidates.mjs)
- [normalize-chatbot-proposals.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/normalize-chatbot-proposals.mjs)

This slice fixes the initial contract that turns normalized conversation/run
summaries into `proposalCandidates`.

## Representative Consumers

- `ceal`
  - recent human thread summaries and blocked run summaries already drive
    candidate shaping in
    [/home/ubuntu/ceal/scripts/agent-runtime/propose-audit-scenarios.mjs](/home/ubuntu/ceal/scripts/agent-runtime/propose-audit-scenarios.mjs)
- future chatbot consumers
  - should be able to reuse the same normalization helper as long as they can
    produce generic conversation and run-summary packets

## Input Boundary

The helper should consume file-based normalized records, not raw transport
events.

Minimum input classes:

- `conversationSummaries`
  - `threadKey`
  - `lastObservedAt`
  - `records[]` with normalized `actorKind`, `text`, and optional `eventType`
- `runSummaries`
  - `runId`
  - `threadKey`
  - `startedAt`
  - `textPreview`
  - `blockedReason`

This input is intentionally downstream of source ingestion.

The helper must not:

- read Slack APIs
- traverse Ceal audit storage directly
- discover host file paths implicitly

## Output Boundary

The helper must emit `proposalCandidates` compatible with
[scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md).

Required output properties remain:

- `proposalKey`
- `title`
- `family`
- `name`
- `description`
- `brief`
- `evidence`

Optional conversational fields that the first helper may populate:

- `simulatorTurns`
- `eventType`
- `maxTurns`
- `tags`
- `conversationAuditScenario`

`conversationAuditScenario` must stay optional and opaque. `Cautilus` may pass
it through, but the helper must not depend on one consumer's audit schema for
its core value.

## Pattern Classes In Scope

The first `chatbot` helper should cover patterns already proven in Ceal-like
conversation logs:

- workflow pivot follow-ups
  - example: retro followed by repo review
- clarification boundaries
  - example: review request followed by repo-target clarification
- approval boundaries
  - example: review request followed by explicit implementation approval
- preference reuse
  - example: user teaches a formatting preference and reuses it
- event-triggered wake-up
  - example: app mention wake-up followed by plain thread follow-up
- blocked follow-up context gaps
  - example: ambiguous confirmation without thread context
- blocked commitment floor
  - example: bare follow-up on top of active pending state

## Fixed Decisions

- `chatbot` normalization is product-owned; source ingestion stays
  consumer-owned.
- The helper operates on file-based normalized packets for determinism and
  replayability.
- The helper owns conversational pattern grouping and candidate shaping, not
  ranking or registry/coverage merge.
- The helper may populate consumer-specific audit hints only as optional
  extension fields.
- The first helper targets `fast_regression`-style conversational continuity
  cases. `terminal_realism` remains a later extension, not a design blocker.

## Probe Questions

- Should the first helper support one mixed packet, or separate files for
  conversations and blocked runs?
- Should conversational audit hints remain opaque extensions, or should
  `Cautilus` later define a generic conversation-eval hint contract?
- Does `terminal_realism` deserve a separate chatbot normalization helper once
  multiple repos actually need it?

## Deferred Decisions

- fixture directory and schema names for chatbot-normalization packets

## Non-Goals

- raw chat-event ingestion
- Slack-specific thread identity rules
- transport adapters
- operator acceptance workflow after proposals are generated

## Constraints

- no hidden repo traversal
- no network requirements
- input/output must stay deterministic and file-based
- output must remain compatible with existing `scenario prepare-input` and
  `scenario propose` surfaces

## Success Criteria

- A Ceal-like consumer can replace bespoke conversational candidate shaping
  with the helper without giving `Cautilus` Slack storage ownership.
- The helper output is reusable by another chatbot repo that has different
  storage but the same conversational patterns.
- The helper does not require consumer-specific audit schemas to be present.

## Acceptance Checks

- fixture: review clarification follow-up from two normalized user turns
- fixture: event-triggered follow-up from one wake-up turn plus one plain turn
- fixture: blocked ambiguous confirmation from a run summary with
  `blockedReason`
- fixture: helper output feeds directly into `scenario prepare-input` or
  `scenario propose` without ad-hoc field rewriting

## Canonical Artifact

- [chatbot-normalization.md](/home/ubuntu/cautilus/docs/contracts/chatbot-normalization.md)

## First Implementation Slice

- keep the first checked-in fixture and helper aligned
- widen beyond the initial Ceal-proven patterns only when another chatbot
  consumer needs the added surface
- add a dedicated checked-in input schema artifact once both `chatbot` and
  `skill` helper packet shapes settle

## Source References

- [scenario-proposal-sources.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-sources.md)
- [scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md)
- [/home/ubuntu/ceal/scripts/agent-runtime/propose-audit-scenarios.mjs](/home/ubuntu/ceal/scripts/agent-runtime/propose-audit-scenarios.mjs)
