# Debug Review
Date: 2026-07-09

## Problem

`go test ./internal/app ./internal/runtime` failed in `TestCLIDoctorReportsReadyWithExecutionSurface` after adding `evaluation_input_default_valid`.
The test expected `cautilus doctor` to report ready, but doctor exited 1 because the synthetic default fixture was not valid under the app/prompt evaluation input contract.

## Correct Behavior

Given an adapter declares `evaluation_input_default`, when `cautilus doctor` validates readiness, then it should block missing or invalid default fixtures.
Given the smoke adapter intentionally declares a runnable default fixture, when the test creates that fixture, then it must include all fields required by `NormalizeEvaluationInput`.

## Observed Facts

- Reproduction: `go test ./internal/app ./internal/runtime`.
- Symptom: `TestCLIDoctorReportsReadyWithExecutionSurface` reported `Run returned exit code 1, stderr=`.
- The new doctor check calls `validateDefaultEvaluationInput`, which loads the file and runs `NormalizeEvaluationInput` for non-step fixtures.
- `validAppPromptFixture` in `internal/runtime/evaluation_input_test.go` includes suite-level `provider` and `model`.
- The new smoke fixture used `surface: app` and `preset: prompt`, but omitted `provider` and `model`.

## Reproduction

- `go test ./internal/app ./internal/runtime`

## Candidate Causes

- The new doctor validation was too strict and rejected otherwise runnable first-run inputs.
- The smoke fixture shape was incomplete for `app/prompt`.
- The test harness resolved `evaluation_input_default` against the wrong root and loaded the wrong path.

## Hypothesis

- Falsifiable claim: the failure is caused by the smoke fixture omitting required app/prompt suite fields; adding `provider` and `model` will make the existing doctor ready test pass without weakening `evaluation_input_default_valid`.
- Disconfirmer: after adding those fields, `go test ./internal/app ./internal/runtime` still fails in the same test or reports `evaluation_input_default_valid` as false.

## Verification

- Result: confirmed.
- Added `provider: anthropic` and `model: claude-sonnet-4-6` to the test fixture.
- `go test ./internal/app ./internal/runtime` passed.
- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/on-demand/smoke-external-consumer.test.mjs` passed, so the capture-label regression test still holds.

## Root Cause

The new readiness check correctly moved `evaluation_input_default` from path-existence validation to runnable-input validation, but the smoke test fixture was authored from a partial app/prompt mental model.
That partial fixture had enough fields to look representative in the doctor test but not enough to pass the runtime normalizer that the real first bounded run uses.

## Invariant Proof

- Invariant: when doctor advertises an actual first bounded-run fixture, that fixture must pass the same input normalization path used by evaluation.
- Producer Proof: `validateDefaultEvaluationInput` calls `LoadEvaluationInputFile` and `NormalizeEvaluationInput` for non-step fixtures.
- Final-Consumer Proof: the ready doctor smoke now passes with a fixture that includes required app/prompt fields, and the missing-fixture smoke still expects `evaluation_input_default_valid` to block readiness.
- Interface-Shape Sibling Scan: app/prompt fixture shape was compared against the runtime normalizer fixture helper before repair.
- Non-Claims: the readiness check proves input shape, not that the repo's external model call will succeed.

## Detection Gap

- ready doctor smoke | fired immediately after the stricter check landed | smallest change to keep it firing: keep synthetic default fixtures aligned with `NormalizeEvaluationInput` helpers.
- external onboarding smoke | did not catch this exact test-only fixture because it uses generated fresh consumer fixtures | smallest change to fire it for capture drift: retain the capture-label regression test.

## Sibling Search

- Mental model: a plausible fixture snippet was treated as a runnable app/prompt fixture.
- same-file axis: ready doctor smoke fixture | decision: fixed now | proof: focused Go test passed.
- negative-path axis: missing default fixture test | decision: retained | proof: still covered by `go test ./internal/app ./internal/runtime`.
- cross-file: `internal/runtime/evaluation_input_test.go` valid app/prompt helper | decision: used as source shape | proof: provider/model copied into the smoke fixture.

## Seam Risk

- Interrupt ID: evaluation-default-fixture-shape-2026-07-09
- Risk Class: none
- Seam: none
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When adding readiness checks that validate a default fixture path, make ready-path smoke fixtures borrow the minimal valid shape from the runtime normalizer tests rather than hand-authoring partial JSON snippets.
