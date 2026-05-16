# Review Test Unparam Debug
Date: 2026-05-16

## Problem

`npm run verify` failed after adding `internal/runtime/review_test.go` because the test helper accepted an `exists` parameter that was always passed as `true`.

## Correct Behavior

Given the repo runs `golangci-lint` with `unparam`, when a helper only needs to assert existing file records, then the helper should not expose an unused generalization parameter.

## Observed Facts

- `npm run verify` failed during `npm run lint:go`.
- The exact lint finding was `internal/runtime/review_test.go:75:69: assertFileRecord - exists always receives true (unparam)`.
- The helper was called only for existing prompt, schema, artifact, and report records.
- `npm run hooks:check` passed independently.

## Reproduction

```bash
npm run verify
```

The command fails at `lint · golangci-lint` with the `unparam` finding.

## Candidate Causes

- The helper was copied with a future-looking `exists` parameter before a false case existed.
- The test should use a narrower helper that asserts existing file records only.
- A separate missing negative test could justify the parameter, but the current claim proof does not need that branch.

## Hypothesis

If the failure is only over-generalized test helper shape, then removing the `exists` parameter and asserting `exists == true` inside the helper should satisfy lint without changing runtime behavior.

## Verification

Pending after the helper is narrowed: rerun the focused Go test and `npm run verify`.

## Root Cause

The new test helper introduced an abstraction point that the current test did not exercise.
`golangci-lint` correctly rejected the unused parameter generalization.

## Detection Gap

- focused proof test | focused `go test` passed but did not run lint | run `npm run verify` before closeout and keep helper signatures as narrow as the current proof needs.

## Sibling Search

- Mental model: small test helpers can be slightly generic by default.
- Test axis: new test helpers should avoid parameters until at least two values are exercised.
- Lint axis: `go test` is not enough for Go slices in this repo because lint catches helper shape.
- Evidence axis: the evidence remains valid if the helper narrows without changing asserted packet fields.

## Seam Risk

- Interrupt ID: review-test-unparam
- Risk Class: none
- Seam: Go test helper lint
- Disproving Observation: focused test already passes; lint names only helper shape.
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep new test helpers minimal until a second caller requires a generalized parameter.

## Related Prior Incidents

- None.
