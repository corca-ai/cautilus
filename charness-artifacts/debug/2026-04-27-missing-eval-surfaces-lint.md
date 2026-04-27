# Debug Review
Date: 2026-04-27

## Problem

`docs/specs/evaluation-surfaces.spec.md` names `lint:eval-surfaces`, but `npm run lint:eval-surfaces -- --help` fails because `package.json` has no such script.

## Correct Behavior

Given the evaluation surface contract references a verifier, when an operator follows that reference, then the referenced gate should exist or the spec should point at the real verifier.

## Observed Facts

- `npm run lint:eval-surfaces -- --help` exits with `npm error Missing script: "lint:eval-surfaces"`.
- `package.json` includes `lint:specs`, `lint:archetypes`, `lint:contracts`, and other gates, but no `lint:eval-surfaces`.
- `internal/runtime/evaluation_input.go` already validates supported surface/preset combinations.
- `internal/runtime/evaluation_input_test.go` has cross-axis rejection coverage.

## Reproduction

Run `npm run lint:eval-surfaces -- --help` from the repo root.

## Candidate Causes

- The spec referenced a planned dedicated lint that was never added.
- The dedicated lint was folded into runtime schema validation and unit tests, but the spec sentence was not updated.
- The script was renamed during the evaluation-surface migration.

## Hypothesis

The dedicated lint was never shipped as a public npm script; the implemented verifier is the evaluation-input schema normalizer plus its unit tests.

## Verification

`package.json` has no `lint:eval-surfaces` entry, and the runtime normalizer owns the concrete cross-axis rejection logic.

## Root Cause

Stale spec wording named a future script instead of the shipped verifier.

## Seam Risk

- Interrupt ID: none
- Risk Class: none
- Seam: spec-to-verification naming
- Disproving Observation: a hidden or generated `lint:eval-surfaces` script exists outside `package.json`
- What Local Reasoning Cannot Prove: whether a future release intended to expose a dedicated lint command
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Update the evaluation-surface spec to name the shipped schema/unit-test verifier, or add a real npm script before referencing it as an acceptance gate.
