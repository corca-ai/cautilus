# Debug Review: CI verify (and the v0.16.2 release workflow) failed on govulncheck because CI pinned a Go version behind two patched stdlib CVEs
Date: 2026-06-20

## Problem

The `v0.16.2` `release-artifacts` GitHub workflow failed at the `npm run verify` step (exit 3), so `Build release artifacts` and `action-gh-release` never ran and no public release was published. The same `verify` workflow had been failing on `main` for days.

## Correct Behavior

Given a clean push to `main` or a release tag, when CI runs `npm run verify` (which includes `security:govulncheck`), then govulncheck should report no stdlib vulnerabilities and the release workflow should proceed to build and publish artifacts.

## Observed Facts

- `gh run view 27857166704 --log-failed`: `Vulnerability #1: GO-2026-5039` (`net/textproto`, Found in `go1.26.3`, Fixed in `go1.26.4`); `Vulnerability #2: GO-2026-5037` (`crypto/x509`, Found in `go1.26.3`, Fixed in `go1.26.4`); "Your code is affected by 2 vulnerabilities from the Go standard library." govulncheck exits 3.
- `.github/workflows/{verify,release-artifacts,spec-report}.yml` all pinned `go-version: "1.26.3"`.
- Local `go version` = `go1.26.4`; local `npm run verify` passed (govulncheck resolved from `$(go env GOPATH)/bin` runs against the 1.26.4 stdlib, which is not affected).
- `gh run list --workflow=verify.yml --branch main` shows `failure` for many consecutive commits (2026-06-19 05:40, 11:07, 13:02, 21:03, and the 2026-06-20 push) — pre-existing, not introduced by the improve/release work.

## Reproduction

1. CI checks out the tag/commit, installs Go 1.26.3 via setup-go, installs govulncheck, runs `npm run verify`.
2. `security:govulncheck ./...` scans against the 1.26.3 stdlib and reports GO-2026-5039 + GO-2026-5037 → exit 3 → verify fails → release build skipped.

## Candidate Causes

- CI Go version pin (1.26.3) is behind the patched stdlib (1.26.4). (Confirmed — both vulns are "Fixed in go1.26.4".)
- A repo code vulnerability. (Rejected — both are Go standard-library vulns, not repo code; the fix is a toolchain bump.)
- govulncheck false positive. (Rejected — the affected symbols, e.g. `crypto/x509.Certificate.Verify`, are genuinely reachable; the right response is the patched toolchain.)

## Hypothesis

If the CI `go-version` is bumped from `1.26.3` to `1.26.4` in all three workflows, govulncheck scans against the patched stdlib, finds no vulnerabilities, `npm run verify` passes, and the release workflow proceeds to build and publish.

## Verification

Local `go1.26.4` already passes `npm run verify` (including govulncheck). Bumped `go-version` to `1.26.4` in `verify.yml`, `release-artifacts.yml`, and `spec-report.yml`; the v0.16.2 tag was re-pointed to the commit carrying the bump and re-pushed so the release workflow rebuilds on the patched toolchain.

## Root Cause

The CI Go toolchain pin (1.26.3) lagged the patch release (1.26.4) that fixed two reachable Go standard-library CVEs (net/textproto GO-2026-5039, crypto/x509 GO-2026-5037). Because `security:govulncheck` is part of `npm run verify`, every CI run on the pinned toolchain failed, and the release workflow could never reach its build/publish steps. Local verify masked it because the local toolchain was already 1.26.4 (and govulncheck is optional/skipped when absent from PATH).

## Detection Gap

- The standing local `npm run verify` does not catch a CI-only toolchain-pin lag (local toolchain differs; govulncheck is best-effort when not installed). The detection surface that fired is CI itself — but it had been red for days without being treated as a release blocker.
- Smallest change to fire earlier: track the CI Go pin against the latest patch (renovate/dependabot for `setup-go go-version`, or a verify step that fails when the pinned toolchain is behind the govulncheck-fixed version), and treat a red `verify` on `main` as a release-blocking signal rather than ambient noise.

## Sibling Search

- Mental model (wrong): "local verify green ⇒ CI verify green." Reality: CI pins a different (older) Go toolchain, so govulncheck results diverge.
- config axis: `.github/workflows/{verify,release-artifacts,spec-report}.yml` `go-version` | decision: FIX (1.26.3 → 1.26.4) | proof: re-run CI green.
- follow-up: automate CI Go-pin freshness so the pin does not silently lag patched CVEs.

## Prevention

Keep the CI `go-version` pin at or above the govulncheck-fixed patch release, and treat a red `verify` on `main` as a release blocker. Consider automating the toolchain-pin bump.
