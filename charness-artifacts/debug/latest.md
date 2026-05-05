# Debug Review
Date: 2026-05-05

## Problem

`npm run lint:eslint` failed after adding `check:cautilus-readiness`.
Exact error: `Function 'handleReadiness' has a complexity of 13. Maximum allowed is 12`.

## Correct Behavior

Given the specdown Cautilus adapter has a readiness check, when `npm run lint:eslint` runs, then the adapter should stay under the repo's configured complexity threshold while preserving the same readiness validation behavior.

## Observed Facts

ESLint reported only one failure in `scripts/specdown/cautilus-adapter.mjs`.
The failure was in `handleReadiness`.
The official ESLint complexity rule caps cyclomatic complexity and reports when a function crosses the configured threshold.

## Reproduction

`npm run lint:eslint` reproduced the failure.
`node --test scripts/specdown-cautilus-adapter.test.mjs`, `npm run test:node`, `go test ./internal/app ./internal/runtime`, and `npm run lint:specs` had already passed before this lint failure was addressed.

## Candidate Causes

- The new readiness handler contained too many local branch points.
- The repo's configured complexity threshold is intentionally lower than the handler's first-pass shape.
- The readiness validation was mixing command execution, JSON parsing, row lookup, result comparison, and meaning comparison in one function.

## Hypothesis

If the command execution, doctor-check lookup, and check comparison are extracted into smaller helpers, then `handleReadiness` will fall below the configured complexity threshold without changing behavior.

## Verification

The handler was split into `runReadinessCommand`, `findDoctorCheck`, and `verifyReadinessCheck`.
The focused readiness adapter test still covers the passing behavior after extraction.

## Root Cause

The first implementation put several independent validation responsibilities in one function.
That made the function exceed the repo's ESLint complexity budget even though the behavior was locally correct.

## Seam Risk

- Interrupt ID: eslint-complexity-readiness-adapter
- Risk Class: none
- Seam: specdown adapter readiness check
- Disproving Observation: lint reported a single local complexity violation, not a runtime protocol failure.
- What Local Reasoning Cannot Prove: whether future readiness scenarios will need a richer domain adapter once blocked states and next-action mapping are made executable.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep specdown adapter handlers as orchestration functions and move branch-heavy validation into focused helpers before adding more row shapes.
