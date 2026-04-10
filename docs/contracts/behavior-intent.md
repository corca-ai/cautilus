# Behavior Intent

`Cautilus` should keep one small behavior-intent contract above raw prompt or
adapter mechanics.

Use `cautilus.behavior_intent.v1` for that object.

The point is not to freeze one prompt verbatim.
The point is to make the evaluated behavior explicit enough that `report`,
`review`, `optimize`, `revision artifact`, and `scenario proposal` packets can
point at the same intent without re-deriving it from prose.

## Contents

The object should include:

- `intentId`: a stable packet-local identifier for the behavior being judged
- `summary`: one short human-readable statement of the behavior intent
- `behaviorSurface`: the product-owned surface under evaluation
- `successDimensions`: the primary ways the candidate should get better
- `guardrailDimensions`: the primary ways the candidate must not get worse

Each dimension stays thin:

- `id`
- `summary`

## Behavior Surface Catalog

Current product-owned catalog:

- `operator_behavior`
  generic fallback when the seam knows the behavior is operator-facing but does
  not know a narrower product-owned class yet
- `operator_cli`
  operator-visible CLI guidance or behavior contract
- `workflow_conversation`
  multi-turn workflow continuity in a conversation
- `thread_followup`
  follow-up continuity inside an already active thread
- `thread_context_recovery`
  clarification or recovery when the thread context is insufficient
- `skill_validation`
  deterministic skill, profile, or integration validation surface
- `operator_workflow_recovery`
  durable workflow recovery or resumability surface
- `review_variant_workflow`
  review prompt or executor-variant workflow surface

## Dimension Catalog

Dimensions are now product-owned catalog entries, not free-form host IDs.
The runtime rejects unknown IDs, wrong dimension kinds, and dimensions that do
not apply to the declared `behaviorSurface`.

Current success-dimension catalog:

- `operator_guidance_clarity`
  Keep the operator-facing guidance explicit and easy to follow.
- `failure_cause_clarity`
  Explain the concrete failure cause or missing prerequisite.
- `recovery_next_step`
  Make the next safe recovery step explicit without operator guesswork.
- `contract_integrity`
  Preserve the expected exit, output, and side-effect contract.
- `workflow_continuity`
  Carry the active workflow context cleanly into the next turn.
- `target_clarification`
  Ask for the minimum concrete target or missing context before acting.
- `preference_reuse`
  Reuse the preference or constraint the user just established in-thread.
- `validation_integrity`
  Keep the declared validation surface passing and legible.
- `workflow_recovery`
  Recover the workflow cleanly when the known blocker reappears.
- `review_evidence_legibility`
  Keep review evidence and verdict framing legible to a human reviewer.

Current guardrail-dimension catalog:

- `operator_state_truthfulness`
  Do not imply success, configuration, or completion state that has not
  happened.
- `repair_explicit_regressions_first`
  Prefer repairing explicit regressions over widening scope.
- `review_findings_binding`
  Treat review findings as first-class evidence, not optional commentary.
- `history_focuses_next_probe`
  Use scenario history only to focus the next bounded probe, not to justify
  overfitting.
- `rerun_relevant_gates`
  Stop after one bounded revision and rerun the relevant gates.

## Ownership

Two acquisition modes are allowed in the current product.

### Host-Declared Profile

The host or normalization helper provides an explicit `intentProfile`.

Current rule:

- host-declared profiles must use product-owned `behaviorSurface` values
- host-declared dimensions must use product-owned dimension IDs
- summaries are canonicalized to the product-owned catalog summary

### Default-Derived Profile

The product derives a minimal profile from a plain `intent` string plus seam
context.

Current derivation rules:

- `intentId` is slug-derived from the summary
- `summary` copies the explicit intent text
- `behaviorSurface` falls back to one product-owned default for the seam
- `successDimensions` fall back to one product-owned default set for that seam
  or surface
- `guardrailDimensions` stay empty unless the seam has explicit product-owned
  defaults, such as optimize guardrails

## Current Default Sets

Current seam-level defaults:

- report/review generic fallback
  - `operator_behavior`
  - `operator_guidance_clarity`
- cli guidance candidate
  - `operator_cli`
  - `operator_guidance_clarity`
  - `recovery_next_step`
- cli behavior-contract candidate
  - `operator_cli`
  - `contract_integrity`
- chatbot clarification candidate
  - `workflow_conversation`
  - `target_clarification`
- chatbot follow-up candidate
  - `thread_followup`
  - `workflow_continuity`
- chatbot context-recovery candidate
  - `thread_context_recovery`
  - `target_clarification`
- skill validation candidate
  - `skill_validation`
  - `validation_integrity`
- skill workflow-recovery candidate
  - `operator_workflow_recovery`
  - `workflow_recovery`
  - `recovery_next_step`
- optimize default guardrails
  - `repair_explicit_regressions_first`
  - `review_findings_binding`
  - `history_focuses_next_probe`
  - `rerun_relevant_gates`

## Current Slice

This slice keeps the contract intentionally thin but now makes the reusable
dimension vocabulary explicit.

- `report` materializes the intent profile once from explicit inputs
- `review` reuses that same object when building the meta-prompt packet
- `optimize` copies the same object into the bounded revision packet and may
  add product-owned guardrail defaults when none were declared
- `revision artifact` carries the same object forward so the next operator can
  see what behavior the bounded revision is trying to repair
- `scenario proposal` may carry the same object when a normalization helper or
  host packet already knows the intended behavior behind a reusable scenario

## Guardrails

- Do not turn the behavior-intent object into a prompt-programming runtime.
- Do not require host repos to encode policy-specific ontologies before they
  can use the product.
- Prefer one explicit summary plus a few durable catalog dimensions over deep
  nested schemas.
- Keep consumer prompts, adapters, policy, and scenario fixtures
  consumer-owned.
