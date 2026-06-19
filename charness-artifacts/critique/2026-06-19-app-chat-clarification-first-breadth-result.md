# App Chat Clarification-First Breadth Critique
Date: 2026-06-19

## Execution

Subagent critique completed for the app/chat clarification-first breadth slice.
Two bounded angle reviewers and one separate counterweight reviewer ran through the host subagent surface.

## Fresh-Eye Satisfaction

parent-delegated

## Packet Consumed

`charness-artifacts/critique/2026-06-19-083659-packet.md`

## Target

`code-critique`

## Change

Review of the private external chat product replay fixture expansion, blind Sonnet clarification-first verdicts, app/chat proof tests, user/apex spec sync, handoff refresh, and clarification-first evidence artifact.

## Angles

- Proof honesty and spec/truth-surface synchronization
- Runtime test coupling and fixture data integrity
- Counterweight triage for remaining concerns

## Findings

- The handoff initially said the remaining Proof Debt was `app/chat liveness, app/prompt` without the local app-surface qualifier, while it also preserved unresolved dev natural-unsound work.
  Fixed by narrowing the handoff wording to `남은 app-surface Proof Debt` at `docs/internal/handoff.md:8`.
- The clarification-first test initially bound the scenario by `proposalKey`, behavior surface, and success dimension, but did not assert that the scenario's simulator/evidence text matched the captured user request.
  Fixed by asserting `scenario.simulatorTurns[0]` and `scenario.evidence[0].messages[0]` equal `clarificationEvaluation.userRequest` at `scripts/on-demand/app-chat-replay-proof.test.mjs:127` and `scripts/on-demand/app-chat-replay-proof.test.mjs:128`.
- The broad `Behavior Evaluation — proven` badge could look inconsistent with app-surface proof debt at first glance, but the apex convention is carried by proven dev surfaces and the same section explicitly names app/chat liveness and app/prompt debt at `docs/specs/index.spec.md:40` and `docs/specs/index.spec.md:83`.

## Counterweight Triage

### Act Before Ship

- none

### Bundle Anyway

- strong: qualify handoff Proof Debt as app-surface debt.
  Done.
- strong: bind the clarification-first scenario simulator/evidence text directly to the captured request.
  Done.

### Over-Worry

- moderate: changing the apex `Behavior Evaluation — proven` badge is not warranted in this slice.
  The existing badge convention is explicit in the same section and table, and app-surface debt remains visible.

### Valid but Defer

- none

## Deliberately Not Doing

This slice does not close app/chat liveness, app/prompt proof debt, or dev-surface natural-unsound proof.
It also does not claim that private external chat product will always clarify every future missing-location weather request; it records and gates this owner-confirmed production-log replay.

## Next Move

Run the full repo gates, commit the source/proof/critique/debug changes, refresh claims because claim-source specs changed, and then choose between app/chat liveness, app/prompt proof debt, or dev natural-unsound harvest.

## Structured Findings

- F1 | bin: bundle-anyway | evidence: strong | ref: docs/internal/handoff.md:8 | action: fix | note: qualify remaining proof debt as app-surface debt so unresolved dev natural-unsound is not hidden
- F2 | bin: bundle-anyway | evidence: strong | ref: scripts/on-demand/app-chat-replay-proof.test.mjs:127 | action: fix | note: bind clarification scenario simulator/evidence text to the captured user request
- F3 | bin: over-worry | evidence: moderate | ref: docs/specs/index.spec.md:35 | action: document | note: apex proven badge remains consistent with the existing convention because app-surface debt is explicit in the same section and table

## Reviewer Tier Evidence

- Requested tier: high-leverage
- Requested spawn fields: host default subagent fields; no explicit model, reasoning effort, or service tier override was sent
- Host exposure state: host-defaulted
- Application state: host returned subagent ids `019edf07-0e10-70e2-86e0-771387c1648b`, `019edf07-26c6-74b3-b1e9-e3e3895574d0`, and `019edf0a-5bf2-7181-8e52-01983519a3c2` with completed final messages
