# Debug Review
Date: 2026-07-08

## Problem

`npm run verify:runtime` failed immediately after adding `--runtime-profile` support to `scripts/run-verify.mjs`.
ESLint reported `parseArgs` exceeded the `sonarjs/cognitive-complexity` limit: current 15, allowed 12.

## Correct Behavior

Given `verify:runtime` now needs a stable runtime profile, when the runner accepts `--runtime-profile`, then argument parsing should preserve the existing CLI contract and remain inside the repo's maintainability gate.

## Observed Facts

- `npm run verify:runtime` failed in the first phase, `lint · eslint`.
- The exact error was `scripts/run-verify.mjs 35:17 error Refactor this function to reduce its Cognitive Complexity from 15 to the 12 allowed`.
- The failing function was `parseArgs`.
- The new implementation added a second pending value path for `--runtime-profile` alongside `--runtime-signal`.
- A related prior incident, `2026-07-08-scenario-provenance-js-validation-complexity.md`, recorded the same pattern: validation/control-flow additions in one JavaScript function tripped the lint complexity gate.

## Reproduction

- Run `npm run verify:runtime` from repo root after the initial runtime-profile patch.
- Observed result: `lint · eslint` exits 1 before runtime samples are collected.
- Focused reproduction: run `npm run lint:eslint`.

## Candidate Causes

- The parser change added too many branches in `parseArgs`.
- The lint threshold is too strict for CLI argument parsing.
- The runtime-profile feature introduced an unsupported argument shape that eslint misreported as complexity.

## Hypothesis

- Falsifiable claim: the failure is local structural complexity in `parseArgs`, not an invalid runtime-profile feature or an overly strict lint rule.
- Disconfirmer: if extracting pending-value handling into helpers still fails `npm run lint:eslint` or focused runner tests, then the feature shape or lint threshold needs reconsideration.

## Verification

- Result: confirmed.
- `parseArgs` now keeps only the loop and option selection, while `applyPendingArgValue` and `assertNoPendingArgValue` own the pending-value branches.
- `npm run lint:eslint` passed.
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/run-verify.test.mjs` passed.

## Root Cause

The root cause was adding a second value-taking option by extending one parser function directly.
That concentrated option-state handling, value assignment, missing-value checks, and ordinary flag handling in `parseArgs`, exceeding the repo's cognitive-complexity gate.

## Invariant Proof

- Invariant: runner CLI parsing should keep value-pending state handling in helpers once more than one option consumes a following value.
- Producer Proof: eslint caught the monolithic parser before the change could collect runtime samples.
- Final-Consumer Proof: focused parser and runtime-signal tests still pass after helper extraction.
- Interface-Shape Sibling Scan: `--runtime-signal` and `--runtime-profile` now share the same pending-value helper path.
- Non-Claims: this debug note does not claim full `npm run verify:runtime` has passed; that belongs to the resumed quality verification.

## Detection Gap

- surface: `scripts/run-verify.mjs` parser maintainability | what did not fire: focused parser tests do not measure complexity | smallest change to fire it: existing `npm run lint:eslint` already fired in `verify:runtime`, so no new gate is needed.

## Sibling Search

- Mental model: adding one more CLI option can stay inline in the existing parser.
- same-file axis: `--runtime-signal` and `--runtime-profile` | decision: route both through one pending-value helper | proof: focused tests pass and eslint passes.
- cross-file: prior JS validation complexity incident | decision: preserve helper-extraction pattern for JavaScript control-flow growth | proof: prior debug memory identified the same maintainability failure mode.

## Seam Risk

- Interrupt ID: run-verify-runtime-profile-parser-complexity-2026-07-08
- Risk Class: none
- Seam: runner CLI option parsing to maintainability gate
- Disproving Observation: eslint failed deterministically before runtime collection continued.
- What Local Reasoning Cannot Prove: n/a
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep `scripts/run-verify.mjs` parser additions helper-oriented when adding value-taking flags.
Do not weaken the eslint complexity gate for runner code; it caught a real maintainability regression early.
