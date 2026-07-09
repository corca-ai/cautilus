# Debug Review
Date: 2026-07-09

## Problem

Final `npm run verify` failed in `coverage:floor:check` after Cycle 5 added `scripts/check-proof-boundary-names.mjs`.
The failure was `scripts/check-proof-boundary-names.mjs stmts=51 cov=64.71%`.

## Correct Behavior

A new deterministic checker should include enough tests for both its pure validator and CLI entry path to satisfy the repo coverage floor.
Final bundle verification should pass without waiving the floor.

## Observed Facts

- Focused tests for `checkProofBoundaryNames` passed.
- `npm run lint:contracts` passed.
- `./bin/cautilus evaluate live --help` exited 0 and `./bin/cautilus eval live --help` exited 1.
- `npm run verify` failed only at `coverage:floor:check` after the coverage run.

## Reproduction

- Run `npm run verify`.
- Observe `coverage:floor:check` reporting `scripts/check-proof-boundary-names.mjs` below `fail_below_pct`.

## Candidate Causes

- The tests covered the exported pure function but not the CLI `main()` branch.
- The file is small enough that untested success/failure CLI output paths materially lower statement coverage.
- The checker should not be excluded or waived because it is a standing contract lint.

## Hypothesis

- If tests spawn the CLI once against the real clean package and once against a temporary package with a bad `dogfood:*:live` script, coverage will include the entry path and floor check will pass.
- Disconfirmer: rerun focused coverage or `npm run verify` and see the same floor failure for this file.

## Verification

- Confirmed: `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/check-proof-boundary-names.test.mjs` passes after adding CLI success/failure tests.
- Confirmed: `npm run lint:contracts` passes.
- Confirmed: `npm run test:coverage && npm run coverage:floor:check` passes; the new checker no longer fails the floor.
- Pending: rerun full `npm run verify`.

## Root Cause

Cycle 5 converted a previously script-only checker into a tested pure function, but the test plan did not cover the retained CLI wrapper.
The broad coverage floor caught that the new file's executable entry path was not exercised.

## Invariant Proof

- Invariant: standing contract checkers must have tests for their imported validator and executable CLI behavior.
- Producer Proof: focused Node tests should cover both direct validator calls and spawned CLI calls.
- Final-Consumer Proof: `npm run lint:contracts` exercises the checker in the same package script used by verify.
- Interface-Shape Sibling Scan: other small contract checkers with CLI entrypoints need the same pattern when newly tested.
- Non-Claims: this does not change the proof-boundary command contract.

## Detection Gap

- Coverage floor | fired correctly during final verify | no new gate needed.

## Sibling Search

- Mental model: pure-function tests are enough when a CLI wrapper is trivial.
- same file: CLI success/failure branches | decision: add spawn tests | proof: coverage floor.
- same command surface: `lint:contracts` | decision: keep it as the consumer proof | proof: rerun lint script.
- cross-file: no immediate sibling patch needed because this slice only introduced coverage debt in the new checker.

## Seam Risk

- Interrupt ID: none
- Risk Class: none
- Seam: none
- Disproving Observation: coverage floor names a deterministic missing test surface.
- What Local Reasoning Cannot Prove: n/a
- Generalization Pressure: none

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When adding a new script that keeps an executable `main()` path, include at least one spawned CLI success or failure test in the same slice.
