# App Prompt Intent Judge Helper Complexity Debug
Date: 2026-06-19

## Problem

`npm run verify` failed on eslint complexity for `scripts/on-demand/app-prompt-intent-judge-proof.mjs`.

## Correct Behavior

Given the app/prompt intent-judge replay helper, when `npm run verify` runs, then eslint should pass while the helper still checks two independent judge runs, aggregate consensus, no tool use, and facet values.

## Observed Facts

- Exact error: `Function 'assertIntentJudgePacket' has a complexity of 14. Maximum allowed is 12`.
- Exact error: `Refactor this function to reduce its Cognitive Complexity from 16 to the 12 allowed`.
- Focused app/prompt tests had already passed before `verify`.
- The failing function had packet shape checks, judge-run count checks, nested loops, aggregate comparison, and facet checks in one body.

## Reproduction

`npm run verify`

## Candidate Causes

- The load-bearing judgeRun assertions were concentrated in one function and exceeded eslint's complexity thresholds.
- The test helper may have accumulated control-flow from earlier reviewer hardening without a lint pass before commit.
- The complexity rule may count nested loop and conditional structure more aggressively than the focused Node test surfaced.

## Hypothesis

If packet shape checks, per-run checks, and per-verdict aggregate agreement are split into smaller helper functions, eslint complexity should pass without weakening the replay invariant.

## Verification

Focused replay passed with `node --test scripts/on-demand/app-prompt-intent-judge-proof.test.mjs scripts/on-demand/app-prompt-backend-proof.test.mjs`.
Debug validation passed for this artifact.
Eslint passed after splitting the helper control-flow.

## Root Cause

Reviewer-driven hardening made the correct invariant explicit, but the implementation placed too many branches in `assertIntentJudgePacket`.
The detection came from the final repo lint gate rather than the focused proof tests because the focused tests execute behavior but do not enforce lint complexity budgets.

## Invariant Proof

- Invariant: app/prompt intent-judge replay still rejects packet drift across independent judge runs and aggregate verdicts.
- Producer Proof: focused replay tests load `fixtures/eval/app/prompt/intent-judge/app-prompt-intent-judge-verdicts.json`.
- Final-Consumer Proof: `npm run verify` includes eslint plus the broader repo checks.
- Interface-Shape Sibling Scan: the exported helper API remains `assertIntentJudgePacket`, `findVerdict`, `assertIntentSoundVerdict`, and `assertIntentControlIsLoadBearing`.
- Non-Claims: this does not prove product-runner readiness.

## Detection Gap

- focused proof tests | did not run eslint complexity | run `npm run verify` before stopping and keep helper control-flow under local lint thresholds

## Sibling Search

- Mental model: focused behavior tests were enough to prove the helper shape.
- same-file: `assertIntentSoundVerdict` and `assertIntentControlIsLoadBearing` remain under threshold after the split | decision: inspect by lint | proof: `npm run verify`
- cross-file: no cross-file sibling: the failure is local helper control-flow in a new on-demand assertion file

## Seam Risk

- Interrupt ID: app-prompt-intent-judge-helper-complexity
- Risk Class: none
- Seam: none
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Run the repo lint gate after reviewer hardening, not only the focused replay tests, before committing helper-heavy proof code.
