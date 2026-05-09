# Review Learning

`Cautilus` should learn which discovery and evaluation methods produced review-useful proposals.

The goal is not to import a research vocabulary or turn every review into an automated verdict.
The goal is to preserve source-bound review feedback from host repo workflows so a later maintainer can compare which methods helped reviewers make useful progress.

## Problem

`Cautilus` already keeps evaluation packets, reports, review packets, and optimization feedback reopenable.
Those artifacts answer what happened in one workflow.

They do not yet answer a higher-level product question:

- which claim-discovery or evaluation method produced a proposal
- how a human or host-owned review disposed of that proposal
- whether the method generated review-useful work across repeated runs

Without that loop, Cautilus can store evidence without improving the way it discovers and evaluates behavior promises.

## Product Promise

Cautilus Agent captures source-bound review feedback from host repo workflows and normalizes it into reusable learning evidence, so Cautilus can later compare which discovery or evaluation methods produced review-useful proposals.

## Current Slice

This slice establishes the first packet materializer.

- The reviewer or host workflow remains the authority for disposition.
- Cautilus Agent is responsible for routing post-review capture when it is installed in a host repo; an operator may also run the same packet builder directly.
- The binary owns packet validation for `cautilus.review_feedback.v1` through `cautilus review feedback build`.
- The first packet lives beside review artifacts as `review-feedback.json` when the operator or agent chooses that output path.
- Active-run defaults and report or CLI aggregation remain deferred.
- `eval-cases.json` provenance is supporting infrastructure, not the primary product promise.

## Fixed Decisions

- Review usefulness is not the same as an evaluation pass or fail.
- The normalized disposition must be source-bound to the review artifact, issue, PR comment, HITL chunk, or packet that justified it.
- Agent-authored summaries may normalize feedback, but they must not silently replace the source review decision.
- The learning record belongs to Cautilus-owned artifacts, not host-specific chat memory.
- The first durable surface is a standalone `review-feedback.json` packet.
- The first design target is claim-discovery and evaluation methods.
  Optimization search already has a more specific checkpoint-feedback reinjection loop.

## Proposed Record

The first packet preserves:

- `schemaVersion`
- `generatedAt`
- `sourceReview`
  - source kind, such as `hitl`, `issue`, `pull_request_review`, `review_packet`, or `review_summary`
  - source reference, such as URL, artifact path, or packet id
- `proposal`
  - proposal id or source claim id when available
  - source refs that grounded the proposal
- `method`
  - method family, such as `claim_discovery`, `evaluation`, or `manual_seed`
  - method id when available
  - source scope or evidence route when available
- `disposition`
  - `accepted`
  - `narrowed`
  - `reframed`
  - `rejected`
  - `missing_critical`
- `reviewNote`
- `normalization`
  - producer, currently `cautilus.review.feedback.build`
  - basis, currently `source_review`
- optional `followUpRefs`

The disposition set is deliberately about review usefulness.
It should not be reused as a generic test status enum.
For `accepted`, `narrowed`, `reframed`, and `rejected`, the packet builder requires either a proposal id or proposal source ref so a later reader can tell what was reviewed.
`missing_critical` may omit proposal evidence because it records that a method failed to surface a proposal reviewers needed.
The first packet validates source-review references as supplied refs; it does not dereference or prove URLs, issue ids, or host artifact paths.

## HITL Rubric

Before or during HITL over the promise specs, reviewers should ask:

> Does this spec leave a clear place for Cautilus Agent to capture source-bound review feedback and turn it into reusable evidence about which discovery or evaluation methods produced review-useful proposals?

This is a design-readiness question, not a requirement that the current spec already ship the packet.

## Deferred Decisions

- how Cautilus aggregates review-learning records across active runs
- whether `review feedback build` should default to `review-feedback.json` inside an active run
- whether the learned method ids become public product vocabulary
- whether review-learning records should later feed claim-discovery heuristics automatically
- how to represent reviewer disagreement or multi-reviewer outcomes

## Non-Goals

- importing Engelbart language into Cautilus user-facing specs
- adding five philosophy-derived shared concerns directly to `docs/specs/concerns/`
- treating Cautilus Agent as the final review authority
- making `eval-cases.json` carry all review outcome history
- implementing automatic heuristic ranking in the first slice

## Acceptance Signals

The first implementation slice is useful when:

- one host workflow can produce a source-bound review-learning record through `cautilus review feedback build`
- the record preserves the source review ref separately from normalized fields and records the normalization basis
- the record names the method that produced the proposal
- the record records review-useful disposition without collapsing into pass/fail
- a later report or CLI view can count dispositions by method family

The first four signals are implemented by the initial packet builder.
The aggregation signal remains deferred.

## Related Contracts

- [Claim Discovery Workflow](claim-discovery-workflow.md)
- [Review Packet](review-packet.md)
- [Scenario Results](scenario-results.md)
- [Optimization Search](optimization-search.md)
- [Active Run](active-run.md)
