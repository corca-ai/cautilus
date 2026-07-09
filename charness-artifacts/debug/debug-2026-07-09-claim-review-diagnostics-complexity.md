# Debug Review
Date: 2026-07-09

## Problem

`npm run lint:eslint` failed after adding structured dropped-update diagnostics to `apply-current-review-results.mjs`.
The failure was `Function 'writeAggregateReviewApplication' has a complexity of 14. Maximum allowed is 12`.

## Correct Behavior

Given aggregate review replay records additional diagnostics, when eslint runs, then compatibility helpers should still stay under the repo complexity limit.
The new dropped-update fields should not make an exported helper exceed the threshold.

## Observed Facts

- Reproduction: `npm run lint:eslint`.
- Symptom: eslint reported `scripts/agent-runtime/apply-current-review-results.mjs:175:8 error Function 'writeAggregateReviewApplication' has a complexity of 14. Maximum allowed is 12 complexity`.
- The helper already accepted many optional aggregate counts.
- The slice added `droppedUpdateReasonCounts` and `droppedUpdateSamples` defaults to the destructured parameter list.
- `npm run claims:apply-review-results` still ran and showed the intended summarized warning shape.

## Reproduction

- `npm run lint:eslint`

## Candidate Causes

- The optional-field defaults in `writeAggregateReviewApplication` increased eslint's complexity score.
- The new structured diagnostics required branching in the helper body.
- The lint rule changed during the slice.

## Hypothesis

- Falsifiable claim: normalizing `options` inside the helper with `emptyApplicationLog()` will reduce the exported function's complexity without changing its output.
- Disconfirmer: `npm run lint:eslint` still fails in the same function or focused tests observe changed aggregate provenance fields.

## Verification

- Result: confirmed.
- Replaced the destructured parameter default list with `options = {}` plus an internal `log` object.
- `npm run lint:eslint` passed.
- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/apply-current-review-results.test.mjs` passed.

## Root Cause

The helper's compatibility-oriented signature had accumulated optional defaults until adding two diagnostics fields pushed it past the complexity budget.
The logic was not conceptually complex; the function shape was.

## Invariant Proof

- Invariant: aggregate replay provenance includes the new dropped-update diagnostics while the exported helper stays lint-clean.
- Producer Proof: `writeAggregateReviewApplication` now derives aggregate defaults from `emptyApplicationLog`.
- Final-Consumer Proof: focused tests still assert aggregate paths, counts, reason counts, and samples.
- Interface-Shape Sibling Scan: `projectAggregateProvenance` already receives `applicationLog` and did not need the same signature change.
- Non-Claims: this does not reduce the underlying number of stale historical updates.

## Detection Gap

- eslint | fired immediately after the field addition | smallest change to keep it early: run `npm run lint:eslint` after extending exported helpers with optional diagnostic fields.

## Sibling Search

- Mental model: adding passive diagnostic fields would not affect helper complexity.
- same-file axis: `writeAggregateReviewApplication` options shape | decision: fixed now | proof: eslint passed.
- test axis: aggregate provenance assertions | decision: preserved | proof: focused test passed.
- cross-file: no sibling exported helper was given new option defaults in this slice | decision: no broader refactor | proof: changed-path review.

## Seam Risk

- Interrupt ID: claim-review-diagnostics-complexity-2026-07-09
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

When extending an exported helper that already has many optional fields, prefer one normalized options object over adding more destructured defaults.
