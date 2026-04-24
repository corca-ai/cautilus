# Debug Review
Date: 2026-04-24

## Problem

`go test ./internal/runtime` failed while adding runtime-fingerprint tests.

## Correct Behavior

Given a pinned runtime policy and an otherwise valid instruction-surface evaluation, when the observed model differs from the pinned model, then the summary should carry `model_runtime_pinned_mismatch` under `runtimeContext` and defer the recommendation.

## Observed Facts

The exact failure was `evaluations[0].instructionSurface.surfaceLabel must be a non-empty string`.
The production normalizer `normalizeObservedInstructionSurface` requires `instructionSurface.surfaceLabel` and a `files` array.
The failing test fixture used an older ad hoc shape with `entryFile`, `instructionFiles`, and `supportingFiles`.

## Reproduction

Run `go test ./internal/runtime`.

## Candidate Causes

- The new runtime-fingerprint implementation changed instruction-surface normalization.
- The new pinned-runtime policy path rejects otherwise valid instruction-surface summaries.
- The test fixture did not match the existing instruction-surface input contract.

## Hypothesis

The failure is caused by the fixture shape, not runtime-policy logic.
If the fixture uses the existing `surfaceLabel` plus `files` shape, the test should reach the pinned-runtime assertion.

## Verification

The fixture was changed to include `surfaceLabel: root` and `files: [{path: AGENTS.md, kind: instruction}]`.
The next verification step is rerunning `go test ./internal/runtime`.

## Root Cause

The new test used an obsolete instruction-surface shorthand that the current normalizer has never accepted.

## Seam Risk

- Interrupt ID: runtime-fingerprint-instruction-surface-fixture
- Risk Class: none
- Seam: internal test fixture
- Disproving Observation: production normalization already documented the required shape through executable code and existing tests
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Use the existing instruction-surface normalizer shape in future runtime-context fixtures instead of inventing compact fixture objects.
