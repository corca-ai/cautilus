# Debug Review
Date: 2026-07-09

## Problem

`npm run lint:eslint` failed after Cycle 4 added `--review-drops` and `--review-drops-markdown` support to `render-claim-status-report.mjs`.
The exact error was `Refactor this function to reduce its Cognitive Complexity from 13 to the 12 allowed` at line 18.

## Correct Behavior

The status report should accept review-drop packet paths without weakening the existing ESLint complexity gate.
Argument parsing should stay readable as the report gains optional packet inputs.

## Observed Facts

- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/render-claim-status-report.test.mjs` passed.
- `npm run claims:status-report:check` failed because the checked-in generated report is stale, which is expected after changing report output.
- `npm run lint:eslint` failed only on `render-claim-status-report.mjs` cognitive complexity.

## Reproduction

- Run `npm run lint:eslint`.
- Observe the cognitive complexity failure at `scripts/agent-runtime/render-claim-status-report.mjs:18`.

## Candidate Causes

- `parseArgs` accumulated too many `else if` branches as new optional packet paths were added.
- The new review-drop options are independent argument mappings and can be parsed by a table-driven helper.
- The report-rendering logic is not implicated because focused tests passed before lint.

## Hypothesis

- If string-valued option parsing moves into a small path-option map helper, `parseArgs` complexity will drop below the lint threshold while custom argument tests continue to pass.
- Disconfirmer: rerun `npm run lint:eslint` and see the same complexity failure.

## Verification

- Confirmed: `npm run lint:eslint` passes after parser helper extraction.
- Confirmed: `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/render-claim-status-report.test.mjs` passes.
- Confirmed: `npm run claims:status-report && npm run claims:status-report:check` passes after regenerating the checked-in report.

## Root Cause

The implementation added correct new flags in the existing branch chain, crossing the repo's complexity threshold.
This is a code-shape bug in parser structure, not a report behavior bug.

## Invariant Proof

- Invariant: status report option growth must preserve deterministic parser behavior and stay under lint complexity limits.
- Producer Proof: `parseArgs` custom-input tests cover the new flags.
- Final-Consumer Proof: status report check mode will compare the regenerated report with checked-in output.
- Interface-Shape Sibling Scan: `build-canonical-claim-map.mjs` and other small CLIs can tolerate short branch chains, but this larger report parser now needs helper extraction.
- Non-Claims: this does not introduce a generic CLI parser framework.

## Detection Gap

- ESLint complexity gate | fired correctly after focused tests passed | no new gate needed.

## Sibling Search

- Mental model: adding two flags to an existing branch chain is cheap until the file is already near the complexity limit.
- same function: `parseArgs` | decision: move string path options into a helper | proof: rerun ESLint.
- same file: report digest/render helpers should stay separate from parser complexity | decision: do not refactor renderer broadly | proof: focused report tests.
- cross-file: no cross-file sibling requires action now because the failure names one parser and the durable guard already exists.

## Seam Risk

- Interrupt ID: none
- Risk Class: none
- Seam: none
- Disproving Observation: deterministic lint names a code-shape threshold.
- What Local Reasoning Cannot Prove: n/a
- Generalization Pressure: none

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When adding optional packet path flags to an already broad renderer CLI, prefer a small option map before appending more `else if` branches.
