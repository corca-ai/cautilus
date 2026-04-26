# Debug Review: claim discover helper collision
Date: 2026-04-26

## Problem

`go test ./internal/runtime ./internal/app ./internal/cli` failed after adding `internal/runtime/claim_discovery.go` with:

```text
internal/runtime/report_reasons.go:26:6: stringFromAny redeclared in this block
	internal/runtime/claim_discovery.go:456:6: other declaration of stringFromAny
```

## Correct Behavior

Given `claim_discovery.go` lives in package `runtime`, when it needs a small string helper, then it should reuse or avoid existing package-level helpers instead of redefining a duplicate top-level function name.

## Observed Facts

- The failure is a compile-time package collision, not a runtime behavior failure.
- `internal/runtime/report_reasons.go` already defines `stringFromAny`.
- The new claim discovery validator added a second `stringFromAny` with the same signature.

## Reproduction

Run:

```bash
go test ./internal/runtime ./internal/app ./internal/cli
```

## Candidate Causes

- A same-named helper already existed in package `runtime`.
- The new helper should have been package-private but still shares the same package namespace.
- The validator code copied an app-layer helper pattern without first searching package-local helpers.

## Hypothesis

If the new duplicate helper is removed and the existing package-level `stringFromAny` is reused, package compilation should proceed past this failure.

## Verification

The compile error names the exact duplicate symbol and both file locations.
Removed the duplicate helper from `claim_discovery.go` and reused the existing package-level `stringFromAny`.
Reran `go test ./internal/runtime ./internal/app ./internal/cli`; it passed.

## Root Cause

The new runtime file introduced a package-level helper with a name already used by another runtime file.
Go package scope made the duplicate invalid.

## Seam Risk

- Interrupt ID: claim-discover-helper-collision
- Risk Class: none
- Seam: internal runtime helper namespace
- Disproving Observation: package compilation fails before tests run
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Search for package-local helpers before adding generic helper names.
Prefer narrower helper names when a new file only needs a one-off conversion.
