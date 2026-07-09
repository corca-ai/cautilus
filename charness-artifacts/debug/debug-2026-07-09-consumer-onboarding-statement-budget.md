# Debug Review
Date: 2026-07-09

## Problem

`npm run verify` failed at the eslint phase after the fresh-consumer onboarding smoke was extended to run `evaluate observation`.
The failure was `Async function 'runExternalConsumerOnboardingSmoke' has too many statements (52). Maximum allowed is 50`.

## Correct Behavior

Given the smoke helper grows to execute the full first bounded-run packet loop, when `npm run verify` runs, then the helper should still satisfy the repo's eslint complexity limits.
The added recheck behavior should not make the orchestration function exceed its statement budget.

## Observed Facts

- Reproduction: `npm run verify`.
- Symptom: eslint reported `scripts/on-demand/smoke-external-consumer.mjs:373:8 error Async function 'runExternalConsumerOnboardingSmoke' has too many statements (52). Maximum allowed is 50 max-statements`.
- The new behavior added `evaluate observation` execution plus recheck summary path and result fields.
- The function already owned install, adapter init, fixture seeding, git commit, doctor, eval execution, and summary assembly.
- `npm run lint:eslint` passed after moving summary assembly into `completeOnboardingSummary`.

## Reproduction

- `npm run verify`
- Minimal gate: `npm run lint:eslint`

## Candidate Causes

- The new recheck fields pushed an already-large orchestration function over the eslint `max-statements` limit.
- Eslint configuration changed while the implementation was in progress.
- The test helper generated code or capture output that eslint parsed unexpectedly.

## Hypothesis

- Falsifiable claim: the failure is caused by summary field assignment growth in `runExternalConsumerOnboardingSmoke`; extracting the final summary assembly into a helper will make `npm run lint:eslint` pass without changing the smoke behavior.
- Disconfirmer: `npm run lint:eslint` still fails with the same max-statements error after helper extraction.

## Verification

- Result: confirmed.
- Added `completeOnboardingSummary` and moved the final result assembly out of `runExternalConsumerOnboardingSmoke`.
- `npm run lint:eslint` passed.
- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/on-demand/smoke-external-consumer.test.mjs` passed, preserving the recheck behavior.

## Root Cause

The implementation added correct recheck state to the same orchestration function that was already near the repo's statement-count ceiling.
The helper had mixed command sequencing with final summary materialization, so a small behavioral addition crossed the lint threshold.

## Invariant Proof

- Invariant: the fresh-consumer smoke can run the full first bounded-run packet loop while staying within repo complexity limits.
- Producer Proof: `completeOnboardingSummary` owns materialized result fields, leaving `runExternalConsumerOnboardingSmoke` focused on command sequencing.
- Final-Consumer Proof: the focused smoke test passed after the extraction.
- Interface-Shape Sibling Scan: the capture builder remains unchanged and still asserts repo-relative packet paths plus `evaluate observation`.
- Non-Claims: this does not prove the future review-loop expansion.

## Detection Gap

- eslint | fired in full `npm run verify`, after focused smoke tests had passed | smallest change to fire it earlier: run `npm run lint:eslint` after growing orchestration helpers near known statement limits.

## Sibling Search

- Mental model: adding a small packet recheck was treated as behavior-only and not as statement-budget pressure.
- same-file axis: final summary assembly in `runExternalConsumerOnboardingSmoke` | decision: extracted now | proof: eslint passed.
- test axis: focused smoke behavior | decision: unchanged | proof: focused node test passed.
- cross-file: no similar orchestration helper was edited in this slice | decision: no broader refactor | proof: changed path review.

## Seam Risk

- Interrupt ID: consumer-onboarding-statement-budget-2026-07-09
- Risk Class: none
- Seam: none
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When adding steps to orchestration-heavy smoke helpers, keep command sequencing separate from result materialization and run `npm run lint:eslint` before the final full verify.
