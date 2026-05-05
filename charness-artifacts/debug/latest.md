# Debug Review
Date: 2026-05-05

## Problem

`npm run lint:eslint` failed after replacing `check:cautilus-readiness` with generalized `check:cautilus-json-command`.
Exact error: `Function 'valueAtPath' has a cognitive complexity of 18. Maximum allowed is 12`.

## Correct Behavior

Given the specdown Cautilus adapter supports selector JSON paths such as `checks[id=adapter_found].ok`, when `npm run lint:eslint` runs, then path traversal should stay under the repo's configured complexity threshold while preserving selector, array index, and object field behavior.

## Observed Facts

ESLint reported only one failure in `scripts/specdown/cautilus-adapter.mjs`.
The failure was in `valueAtPath`.
The sonarjs cognitive-complexity rule penalizes nested branches and loop decisions, which the first selector implementation concentrated in one traversal function.

## Reproduction

`npm run lint:eslint` reproduced the failure.
`node --test scripts/specdown-cautilus-adapter.test.mjs`, `go test ./internal/app ./internal/runtime`, and `npm run lint:specs` had already passed before this lint failure was addressed.

## Candidate Causes

- The new JSON path traversal handles null checks, array indexes, selector objects, and object fields in one loop.
- The repo's configured cognitive-complexity threshold is intentionally lower than the first-pass traversal shape.
- Selector support is valid behavior, but branch-heavy local implementation crossed the lint budget.

## Hypothesis

If segment traversal is extracted into focused helpers for array indexes, selector objects, and object fields, then `valueAtPath` will fall below the configured complexity threshold without changing behavior.

## Verification

The traversal was split into `valueAtSegment`, `valueAtIndex`, `valueAtSelector`, `valueAtProperty`, and `missingValue`.
`npm run lint:eslint`, `node --test scripts/specdown-cautilus-adapter.test.mjs`, and `npm run lint:specs` pass after extraction.

## Root Cause

The first selector-path implementation put several independent traversal cases in one function.
That made the function exceed the repo's ESLint cognitive-complexity budget even though the behavior was locally correct.

## Seam Risk

- Interrupt ID: eslint-complexity-json-path-adapter
- Risk Class: none
- Seam: specdown adapter JSON command/file checks
- Disproving Observation: lint reported a single local complexity violation, not a runtime protocol failure.
- What Local Reasoning Cannot Prove: whether future JSON path selectors need a more formal parser instead of this small supported subset.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep specdown adapter handlers and traversal functions as orchestration functions, and move branch-heavy validation into focused helpers before adding more row shapes.
