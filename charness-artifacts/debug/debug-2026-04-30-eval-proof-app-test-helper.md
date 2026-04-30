# Debug Review: eval proof app test helper
Date: 2026-04-30

## Problem

Targeted Go tests failed to compile after adding eval proof assertions to `internal/app/cli_smoke_test.go`.

## Correct Behavior

Given app package tests assert proof metadata in CLI output, when the tests compile, then they should use helpers available in the `internal/app` package rather than runtime-only helper names.

## Observed Facts

- The failing command was `go test ./internal/runtime ./internal/app -run 'ClaimEvalPlan|EvaluationProof|EvalTestRunsAppChat|ReportPacketSummarizesBlocked|OptimizeInputRejectsBlocked|FixtureExamplesValidateAgainstPublishedSchemas'`.
- The exact error was `internal/app/cli_smoke_test.go:3355:11: undefined: asMap` and `internal/app/cli_smoke_test.go:3360:5: undefined: asMap`.
- `internal/app/app.go` provides `mapOrEmpty`.
- `asMap` is a runtime package helper and is not visible in app tests.

## Reproduction

```bash
go test ./internal/runtime ./internal/app -run 'ClaimEvalPlan|EvaluationProof|EvalTestRunsAppChat|ReportPacketSummarizesBlocked|OptimizeInputRejectsBlocked|FixtureExamplesValidateAgainstPublishedSchemas'
```

## Candidate Causes

- The new app test used a helper copied from runtime tests.
- The app package has a differently named equivalent helper.
- The test file may need a local conversion helper, but one already exists in package code.

## Hypothesis

If the app test uses `mapOrEmpty` instead of `asMap`, then the package should compile without changing production behavior.

## Verification

Rerun the targeted Go test command, then continue to full repo verification.

## Root Cause

The proof assertion crossed a package helper boundary while moving from runtime tests to app CLI tests.

## Seam Risk

- Interrupt ID: eval-proof-app-test-helper
- Risk Class: none
- Seam: app test helper boundary
- Disproving Observation: compiler reported undefined helper names before running behavior tests
- What Local Reasoning Cannot Prove: whether later behavior assertions pass after the compile fix
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When adding assertions to a different package, use package-local helpers or exported APIs instead of copying unexported helper names from adjacent runtime tests.
