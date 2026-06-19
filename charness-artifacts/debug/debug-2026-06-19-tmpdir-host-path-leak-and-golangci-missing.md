# Debug Review: TMPDIR-under-home false positive in host-path-leak smoke + missing golangci-lint
Date: 2026-06-19

## Problem

`npm run verify` is blocked on this machine by two unrelated failures, surfaced while closing the app/chat external-data slice: (1) `internal/app` `TestCLIReviewVariantsRunsInsideFreshRepoWithoutHostSpecificPaths` fails with a "host-local path leak"; (2) `npm run lint:go` aborts because `golangci-lint` is not installed.

## Correct Behavior

- Given a fresh temp repo created by `t.TempDir()`, when `evaluate review variants` runs and the summary legitimately contains the temp repo root, then the host-path-leak assertion should pass regardless of where `TMPDIR` points — it must only fail on a path that references the real host home OUTSIDE the sandboxed temp root.
- Given `golangci-lint` is absent, that is an environment install gap, not a repo code defect; `verify` on a provisioned machine (binary present) should pass.

## Observed Facts

- Fact: the test passes under `TMPDIR=/tmp` and fails under `TMPDIR=/home/ubuntu/.cache/tmp` (both run this session).
- Fact: the leaked string the assertion flags IS the sandboxed temp root, which the same test asserts as `summary["repoRoot"]` two lines above.
- Fact: `golangci-lint` is on neither PATH nor `$(go env GOPATH)/bin`.
- Fact: both failures reproduce on clean HEAD (verified by stashing this session's app/chat slice), so neither is a regression from this session.
- Assumption (not verified from here): the operator's push environment uses `/tmp` and has `golangci-lint` installed — the prior handoff says `verify` was green there.

## Reproduction

```
# Issue 1 — fails only when TMPDIR lives under the home dir:
TMPDIR=/home/ubuntu/.cache/tmp go test ./internal/app/ -run TestCLIReviewVariantsRunsInsideFreshRepoWithoutHostSpecificPaths   # FAIL (pre-fix)
TMPDIR=/tmp                     go test ./internal/app/ -run TestCLIReviewVariantsRunsInsideFreshRepoWithoutHostSpecificPaths   # ok
# Issue 2:
which golangci-lint ; ls "$(go env GOPATH)/bin/golangci-lint"   # not found / no such file
```

Confirmed pre-existing on clean HEAD (verified earlier by stashing the app/chat slice and re-running — still fails), so it is not a regression from this session's work.

## Candidate Causes

- (control-flow / brittle assertion) The test hardcodes the literal `/home/ubuntu/` as the host-leak marker; when `TMPDIR` is under `/home/ubuntu`, the legitimate temp root the summary is asserted to contain trips the marker. ← primary.
- (product bug) `evaluate review variants` leaks an absolute host path it should relativize. Falsified: under `TMPDIR=/tmp` the same code path produces a summary that passes, and the leaked string IS the sandboxed temp root (already asserted as `repoRoot`), not a real host path.
- (environment) `TMPDIR` set to a home-relative cache dir on this box; CI/operator boxes use `/tmp`. ← contributing environment factor for issue 1, and the whole story for issue 2 (missing binary).

## Hypothesis

If the marker `/home/ubuntu/` collides with a home-relative `TMPDIR` rather than catching a genuine leak, then stripping the asserted temp-root prefix before the leak check makes the test pass under a home-relative `TMPDIR` while still failing on a home path outside the temp root; and forcing `TMPDIR=/tmp` makes the unmodified test pass.

## Verification

- Falsifier (env): `TMPDIR=/tmp` → unmodified test passes. Confirms the marker collides with the temp path, not a real leak.
- Fix applied (`internal/app/cli_smoke_test.go`): derive `os.UserHomeDir()`, `strings.ReplaceAll(summaryJSON, root, "<root>")`, then fail only if `homeDir+"/"` still appears. Result: passes under both `TMPDIR=/home/ubuntu/.cache/tmp` and `TMPDIR=/tmp`; full `internal/app` package green. A genuine leak (a home path not under `root`) survives the strip and is still caught, so detection is preserved, not weakened.
- Issue 2: `golangci-lint not found` on PATH and GOPATH/bin — a missing binary, no code change applicable.

## Root Cause

Issue 1: the smoke test encoded "host-specific path" as the literal string `/home/ubuntu/`. That is a proxy for "a path under the developer's home that is not the sandboxed test dir", but the proxy breaks when `t.TempDir()` itself resolves under the home directory (`TMPDIR=/home/ubuntu/.cache/tmp`), turning the legitimately-present temp root into a false leak. Issue 2: `golangci-lint` is simply not installed in this environment; `lint:go` (`scripts/run-golangci-lint.mjs`) correctly aborts and prints install docs.

## Invariant Proof

- Invariant: n/a — not a workflow-boundary propagation bug. The fix is a test-only assertion hardening; no producer→consumer packet contract is involved.
- Producer Proof: n/a
- Final-Consumer Proof: n/a
- Interface-Shape Sibling Scan: n/a
- Non-Claims: this does NOT prove the operator's push environment is green (golangci-lint install + TMPDIR there are unverified from here); it only proves the test is no longer fragile to a home-relative TMPDIR.

## Detection Gap

- Surface: the Go smoke test itself was the detection surface, but it fired as a FALSE positive. The gap is that no test exercised the assertion under a home-relative `TMPDIR`, so the brittle literal shipped. Smallest change that would have fired it correctly: the root-stripped home check applied here (it passes on a home-relative TMPDIR and still catches an out-of-root home leak). golangci-lint absence: `lint:go` already reports it clearly; no detection gap, only an install gap.

## Sibling Search

- Mental model that was wrong: "no test temp dir will ever live under /home/<user>, so a literal /home/ubuntu/ marker is a safe leak proxy."
- four-axis scan: grep across `internal/ cmd/ --include=*.go` for `/home/ubuntu` → exactly one occurrence (the fixed line 613). No cross-file sibling.
- cross-file: no cross-file sibling — the only hardcoded home-path assertion in the Go tree was this single line.
- proof: decision = fix in place; proof level = grep-confirmed isolation (single occurrence) + green full-package run under both TMPDIR values.

## Seam Risk

- Interrupt ID: none
- Risk Class: none
- Seam: none — test-only change, no host/external seam, no product behavior touched.
- Disproving Observation: none
- What Local Reasoning Cannot Prove: whether the operator's CI box has golangci-lint installed (separate env concern).
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none
- Rationale: trivial single-file test-only assertion hardening (no design, workflow, compatibility, host-proof, prompt-surface, public-skill, validator, or export behavior affected). The fix is applied and committed in this slice; the golangci-lint install is an operator env action, not a code change.

## Prevention

- Issue 1: prevented in place — the assertion now derives the home dir and strips the temp root, so it is robust to `TMPDIR` location (maps directly to the detection-gap finding).
- Issue 2: operator action, not code — install `golangci-lint` (`scripts/run-golangci-lint.mjs` prints the official install URL); or run `verify` on a provisioned box. No durable repo change needed unless the team wants `lint:go` to soft-skip on a missing binary, which is deliberately NOT done here to avoid silently dropping a gate.

## Related Prior Incidents

- `debug-2026-04-26-source-shim-read-only-go-cache.md` — also an environment/path-shaped failure surfaced by Go tooling under a non-default cache/temp layout; same class (env layout vs hardcoded assumption), different surface.
