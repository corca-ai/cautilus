# Debug Review
Date: 2026-07-09

## Problem

`npm run lint:eslint` failed after Cycle 1 added source sample policy shape validation.
The exact error was `Function 'validateSourceSamplePolicy' has a complexity of 13. Maximum allowed is 12`.

## Correct Behavior

Given a narrow validator expansion, ESLint should still pass without weakening the policy check.
The source policy validator should keep shape checks readable and put the reason-coverage invariant in a small helper.

## Observed Facts

- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/summarize-claim-review-drops.test.mjs` passed.
- `npm run claims:review-drops:check` passed.
- `npm run lint:eslint` failed only on `scripts/agent-runtime/summarize-claim-review-drops.mjs` complexity.

## Reproduction

- Run `npm run lint:eslint`.
- Observe the complexity failure at `scripts/agent-runtime/summarize-claim-review-drops.mjs:254`.

## Candidate Causes

- The source policy validator accumulated too many independent conditionals.
- The reason-representation check belongs in a helper because it is a separate invariant.
- The ESLint complexity threshold is intentionally catching validator growth.

## Hypothesis

- If reason-coverage validation moves into a helper, the parent validator complexity will drop below the lint threshold while focused policy tests continue to pass.
- Disconfirmer: run `npm run lint:eslint` and see the same complexity failure.

## Verification

- Confirmed: `npm run lint:eslint` passes after helper extraction.
- Confirmed: `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/summarize-claim-review-drops.test.mjs` passes with 15 tests.
- Confirmed: `npm run claims:review-drops:check` passes against the checked-in generated packet.

## Root Cause

The implementation added correct policy checks in one function, crossing the repo's complexity guard.
The failure was structural, not a behavior bug in the source policy invariant.

## Invariant Proof

- Invariant: the summary generator must reject malformed source sample policy while keeping validator code below lint complexity limits.
- Producer Proof: n/a — this is a validator implementation structure bug.
- Final-Consumer Proof: focused tests and `claims:review-drops:check` exercise the policy consumer.
- Interface-Shape Sibling Scan: the sibling risk is future validator growth in the same function; helper extraction is the local prevention.
- Non-Claims: this does not add a full reviewApplication schema validator.

## Detection Gap

- ESLint complexity gate | fired correctly after the focused tests passed | no new gate needed.

## Sibling Search

- Mental model: because the policy rules were related, they could stay in one validator function.
- same function: `validateSourceSamplePolicy` | decision: split helper | proof: rerun ESLint.
- same file: other summary helpers already isolate coverage and action classification | decision: follow local pattern | proof: helper extraction keeps tests unchanged.
- cross-file: no sibling validator currently failed; no broader refactor is needed.

## Seam Risk

- Interrupt ID: none
- Risk Class: none
- Seam: none
- Disproving Observation: local lint names a deterministic code-shape threshold.
- What Local Reasoning Cannot Prove: n/a.
- Generalization Pressure: none

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep policy shape checks and derived coverage invariants in separate helpers when the same validator grows past the lint threshold.
