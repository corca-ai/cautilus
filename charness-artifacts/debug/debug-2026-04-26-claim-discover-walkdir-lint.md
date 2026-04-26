# Debug Review: claim discover WalkDir lint
Date: 2026-04-26

## Problem

`npm run verify` failed during `npm run lint:go` with `nilerr` warnings in `internal/runtime/claim_discovery.go`:

```text
internal/runtime/claim_discovery.go:175:4: error is not nil (line 173) but it returns nil (nilerr)
internal/runtime/claim_discovery.go:191:4: error is not nil (line 189) but it returns nil (nilerr)
```

## Correct Behavior

Given `WalkDir` passes a non-nil traversal error or `filepath.Rel` fails, when the callback cannot safely classify the source, then it should return the actual error instead of silently returning nil.

## Observed Facts

- `walkClaimSourceTree` intentionally ignores missing optional source roots before walking them.
- Inside the walk callback, non-nil `err` and non-nil `relErr` were both swallowed.
- `golangci-lint` correctly flagged that as a likely accidental error discard.

## Reproduction

Run:

```bash
npm run verify
```

## Candidate Causes

- The walk callback was written to be best-effort and over-applied that policy to real traversal errors.
- The source discovery path should distinguish optional missing roots from unexpected per-file traversal errors.
- The callback copied a common skip-on-error pattern that this repo's lint profile rejects.

## Hypothesis

If the callback returns `err` and `relErr`, `golangci-lint` should pass while preserving the intended optional-root behavior.

## Verification

The lint error names the exact non-nil errors being discarded.
Changed the source-tree walk to ignore only missing optional roots and return real `os.Stat`, traversal, and `filepath.Rel` errors.
Reran `npm run verify`; it passed.
The same closeout command also ran `npm run hooks:check` and `npm run test:on-demand`; both passed.

## Root Cause

The first `claim discover` implementation silently discarded traversal errors inside the `WalkDir` callback.
That conflicted with the repo's Go lint profile.

## Seam Risk

- Interrupt ID: claim-discover-walkdir-lint
- Risk Class: none
- Seam: deterministic source inventory filesystem traversal
- Disproving Observation: lint rejects the callback before runtime behavior can be accepted
- What Local Reasoning Cannot Prove: whether future source roots should downgrade some traversal errors to inventory warnings
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep optional-root absence best-effort, but return real traversal errors from callback internals.
