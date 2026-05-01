# Evidence Preflight Nilerr Debug
Date: 2026-05-01

## Problem

`npm run verify` failed during `golangci-lint` with two `nilerr` findings in possible-evidence preflight code.

## Correct Behavior

Given evidence preflight scans adapter evidence roots, when a directory walk itself fails, then the failure should be visible in the preflight summary.
Given an individual JSON file is not a claim evidence bundle, then the preflight should skip that file without making it look like an accidentally swallowed error.

## Observed Facts

- `golangci-lint` reported `internal/runtime/claim_discovery.go:1723:5` and `internal/runtime/claim_discovery.go:1740:5`.
- The first case returned `nil` when `filepath.WalkDir` passed a non-nil `walkErr`.
- The second case returned `nil` when `readJSONFile` failed or when the schema did not match `cautilus.claim_evidence_bundle.v1`.
- Skipping non-bundle JSON files is intentional, but swallowing walk errors was not explicit.

## Reproduction

Run `npm run verify` or `npm run lint:go` after adding possible-evidence preflight.
The lint phase reports `nilerr` for the two callback branches.

## Candidate Causes

- The code intentionally skipped unreadable or irrelevant files but used the same branch shape as accidental error swallowing.
- Directory walk errors and non-bundle JSON parse failures were conflated in one "skip" style.
- The preflight summary had no field for walk errors, so there was no durable place to record that class of issue.

## Hypothesis

If walk errors are returned to `filepath.WalkDir` and counted after the walk, while non-bundle JSON files are handled through a positive schema-match branch, then `nilerr` will pass and preflight will remain deterministic.

## Verification

`go test ./internal/runtime -run 'TestBuildClaimReviewInputIncludesPossibleEvidenceRefs'` passed.
`npm run lint:go` passed with `0 issues`.

## Root Cause

The implementation represented two different cases with the same "if error then return nil" shape: a real walk error and an intentionally ignored non-bundle JSON read/schema miss.

## Seam Risk

- Interrupt ID: evidence-preflight-nilerr
- Risk Class: deterministic-scan-error-handling
- Seam: adapter evidence roots to claim review input
- Disproving Observation: linter caught ambiguous error swallowing before release
- What Local Reasoning Cannot Prove: whether future evidence-root readers need richer per-file warning packets
- Generalization Pressure: low until evidence preflight reads more artifact schemas

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep deterministic preflight skip paths shaped as positive matches, and expose scan-level error counts when directory traversal itself fails.
