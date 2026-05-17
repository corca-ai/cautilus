# Debug Review
Date: 2026-05-17

## Problem

`git push origin main` stopped in the pre-push verify gate during `coverage:floor:check` after adding scenario telemetry attribution aggregation.

## Correct Behavior

Given `internal/runtime/scenario_telemetry.go` now aggregates request kind, source flow, cache policy, static context id, retry count, and tool-call count, when coverage floors run, then the file should have direct test coverage for the new branch surface.

## Observed Facts

The exact failure was:

```text
FAIL: floored files regressed below declared floor:
  - internal/runtime/scenario_telemetry.go  stmts=94 cov=4.26% floor=4.40%
```

The preceding lint, security, Go race, Node tests, and coverage generation phases passed.
The regression was small but below the declared per-file floor.

## Reproduction

Run `npm run coverage:floor:check` after adding new aggregation branches to `internal/runtime/scenario_telemetry.go` without adding a Go test for that file.

## Candidate Causes

- New string-dimension aggregation branches increased the statement count without direct Go coverage.
- Existing scenario telemetry coverage lived mostly through JS tests or higher-level flows, which do not raise Go file coverage.
- The push gate runs the per-file coverage floor later than focused behavior tests.

## Hypothesis

If a focused Go test calls `SummarizeScenarioTelemetryEntries` with explicit attribution fields, then the new branches will be covered and the file will clear its declared floor.

## Verification

After adding a focused Go test for `SummarizeScenarioTelemetryEntries`, `go test ./internal/runtime`, `npm run test:coverage`, and `npm run coverage:floor:check` passed.

## Root Cause

The implementation changed the Go runtime aggregation surface but initially tested the same behavior only through Node scenario telemetry tests and deployment evidence tests.
That left the Go file's own coverage just below its locked floor.

## Detection Gap

- Focused Node tests | cannot raise Go coverage | add Go tests when Go runtime files change.
- Pre-push coverage floor | fired before push | keep the gate as the enforcement point.

## Sibling Search

- Mental model: a mirrored JS test proves the product behavior for both runtimes.
- Runtime axis: Go runtime files need Go tests even when the Node helper has equivalent tests.
- Coverage axis: any touched floored file can fail on small statement-count changes.

## Seam Risk

- Interrupt ID: scenario-telemetry-coverage-floor
- Risk Class: none
- Seam: Go runtime coverage floor
- Disproving Observation: coverage floor stopped locally before remote state changed.
- What Local Reasoning Cannot Prove: whether future mirrored JS/Go surfaces will remember to add tests in both languages.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When changing a Go runtime file that has a coverage floor, add at least one focused Go test in the same slice even if an equivalent Node helper test exists.
