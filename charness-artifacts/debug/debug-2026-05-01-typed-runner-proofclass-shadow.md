# Debug Review: typed runner proofclass shadow
Date: 2026-05-01

## Problem

The typed multi-runner implementation failed to compile before behavior tests could run.

## Correct Behavior

Given runner readiness initializes proof metadata from adapter runner bindings, when an assessment is later loaded, then the code should update existing local variables without redeclaring names in the same scope.

## Observed Facts

- The failing command was `go test ./internal/runtime ./internal/app -run 'RunnerReadiness|ValidateAdapterDataAcceptsTyped|ValidateAdapterDataRejectsInvalidTyped|EvalTestRunsAppChat'`.
- The exact error was `internal/runtime/runner_readiness.go:236:13: no new variables on left side of :=`.
- `buildRunnerReadinessForRunner` already declared `proofClass` near the top of the function from adapter runner metadata.
- The assessment branch tried to redeclare `proofClass` with `:=`.

## Reproduction

```bash
go test ./internal/runtime ./internal/app -run 'RunnerReadiness|ValidateAdapterDataAcceptsTyped|ValidateAdapterDataRejectsInvalidTyped|EvalTestRunsAppChat'
```

## Candidate Causes

- The refactor kept the old assessment-local declaration after adding an adapter-level proof class variable.
- `recommendation` was still new on the same line in the earlier code shape, but gofmt/refactor left only already-declared names on one side.
- The build failed before tests could expose deeper runner-selection behavior.

## Hypothesis

If the assessment branch assigns to the existing `proofClass` variable and declares `recommendation` separately, then the package should compile and the targeted tests should reach behavior assertions.

## Verification

Rerun the targeted Go command and then continue to full verification after the implementation slice stabilizes.

## Root Cause

The refactor introduced a wider `proofClass` variable but did not update the later assessment branch declaration.

## Seam Risk

- Interrupt ID: typed-runner-proofclass-shadow
- Risk Class: none
- Seam: Go local variable scope during runner readiness refactor
- Disproving Observation: compiler stopped on a same-scope short declaration
- What Local Reasoning Cannot Prove: whether typed runner selection behavior passes after the compile fix
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When widening local state during a refactor, search for later short declarations of the same names before running behavior tests.
