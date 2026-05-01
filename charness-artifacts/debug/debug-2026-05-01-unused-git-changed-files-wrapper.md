# Debug Review: unused gitChangedFiles wrapper
Date: 2026-05-01

## Problem

`npm run verify` failed during `npm run lint:go` with `internal/runtime/claim_discovery.go:2423:6: func gitChangedFiles is unused`.

## Correct Behavior

Given claim freshness uses the newer diff helper with an explicit success flag, when Go lint runs, then no obsolete wrapper should remain unused.

## Observed Facts

- Command: `npm run verify`
- Failed step: `lint · golangci-lint`
- Exact error: `internal/runtime/claim_discovery.go:2423:6: func gitChangedFiles is unused`
- The new freshness implementation calls `gitChangedFilesWithStatus`.
- No remaining code path calls the old `gitChangedFiles` wrapper.

## Reproduction

```bash
npm run verify
```

The lint step reports the unused function.

## Candidate Causes

- The compatibility wrapper was left after all call sites moved to `gitChangedFilesWithStatus`.
- A test-only call site was expected but does not exist.
- The helper should have been updated in place instead of adding a wrapper.

## Hypothesis

If the obsolete `gitChangedFiles` wrapper is deleted and all current call sites keep using `gitChangedFilesWithStatus`, Go lint will pass this failure.

## Verification

Remove the wrapper, run the focused Go tests that cover claim freshness, then rerun `npm run verify`.

## Root Cause

The claim freshness refactor added an explicit-status diff helper but kept the previous wrapper even though no code still needed it.

## Seam Risk

- Interrupt ID: unused-git-changed-files-wrapper
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

When replacing helper APIs in Go, run the focused package test or `golangci-lint` before committing the slice.
