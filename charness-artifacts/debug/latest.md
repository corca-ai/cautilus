# Doctor Readiness Specdown Prerequisite Debug
Date: 2026-05-08

## Problem

`npm run verify` failed after removing `specdown_available` from doctor readiness.

## Correct Behavior

Given doctor no longer reports or depends on a `specdown_available` check, the app tests should keep only helpers that are still used by the remaining assertions.

## Observed Facts

- `npm run verify` passed eslint, spec lint, contract lint, evidence hash audit, link lint, and skill disclosure before failing at Go lint.
- The exact lint errors were `func doctorCheckOK is unused`, `func doctorCheckMeaning is unused`, and `func doctorCheckDetail is unused` in `internal/app/app_test.go`.
- The only remaining doctor helper use for the removed specdown surface is the negative `doctorCheckExists(..., "specdown_available")` assertion.

## Reproduction

Run:

```bash
npm run verify
```

## Candidate Causes

- Removing the specdown check made the previous positive doctor assertion helpers dead code.
- The test rewrite may have accidentally moved helper use into another file where unexported helpers cannot be seen.
- The lint failure may have come from generated stale files rather than the edited test file.

## Hypothesis

If the unused positive assertion helpers are deleted and the negative existence helper remains, Go lint should pass while preserving regression coverage that doctor does not emit `specdown_available`.

## Verification

- `npm run lint:go` passed after deleting the unused helpers.
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.18/scripts/validate_debug_artifact.py --repo-root .` passed.

## Root Cause

The specdown prerequisite removal changed the app tests from checking a doctor check's `ok`, `meaning`, and `detail` fields to checking that the old check ID is absent.
The previous helper functions were no longer referenced.

## Seam Risk

- Interrupt ID: doctor-specdown-helper-cleanup
- Risk Class: none
- Seam: none
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When removing a doctor check from the product surface, keep one negative existence assertion for the retired check ID and remove helper functions that only supported the old positive check shape.
