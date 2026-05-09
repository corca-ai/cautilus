# CI Go Toolchain Vulnerability Debug
Date: 2026-05-09

## Problem

The `v0.14.1` release workflow failed in GitHub Actions during `npm run verify`, even though local `npm run verify` had passed before tagging.

## Correct Behavior

Given the release workflow runs `govulncheck`, when Go standard-library vulnerabilities are fixed in a patch toolchain, then GitHub Actions should use the patched Go toolchain rather than an older pinned patch release.

## Observed Facts

- GitHub Actions run `25596627243` failed in workflow `release-artifacts`, job `release-artifacts`, step `Run npm run verify`.
- `govulncheck` reported GO-2026-4971 and GO-2026-4918 in the Go standard library.
- Both vulnerabilities were reported as found in Go 1.26.2 and fixed in Go 1.26.3.
- Local `go env GOVERSION` returns `go1.26.3`.
- The GitHub workflows pinned `actions/setup-go` to `go-version: "1.26.2"`.

## Reproduction

Run:

```bash
gh run view 25596627243 --repo corca-ai/cautilus --log-failed
rg -n "go-version: \"1.26.2\"" .github
```

## Candidate Causes

- CI workflows pinned a vulnerable Go patch version.
- Local verification used the patched Go 1.26.3 toolchain, so the release gate was stricter in CI only because of workflow pin drift.
- Maintainer docs still advertised Go 1.26.2+ after govulncheck began requiring the patched stdlib.

## Hypothesis

If GitHub workflows and maintainer docs are updated from Go 1.26.2 to Go 1.26.3, then release `npm run verify` should use the patched standard library and `govulncheck` should pass.

## Verification

- Updated `.github/workflows/release-artifacts.yml`, `.github/workflows/verify.yml`, and `.github/workflows/spec-report.yml` to Go 1.26.3.
- Updated maintainer docs and roadmap references to Go 1.26.3+.
- Pending: rerun local `npm run verify`.
- Pending: rerun the release workflow on the fix-forward tag.

## Root Cause

The release workflows pinned Go 1.26.2 while local verification had already moved to Go 1.26.3.
`govulncheck` correctly blocked release verification because the binary code path reaches standard-library network APIs affected in 1.26.2 and fixed in 1.26.3.

## Seam Risk

- Interrupt ID: ci-go-toolchain-vuln-pin
- Risk Class: contract-freeze-risk
- Seam: maintainer-local Go toolchain versus GitHub Actions pinned Go toolchain
- Disproving Observation: CI release workflow passes `govulncheck` after setup-go uses Go 1.26.3.
- What Local Reasoning Cannot Prove: Whether future Go patch vulnerabilities will require a standing "latest patch" policy instead of exact patch pins.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: `.github/workflows/release-artifacts.yml`

## Prevention

Keep CI Go patch versions aligned with the local `toolchain` patch when `govulncheck` begins reporting standard-library fixes.
Do not cut release artifacts from a workflow pinned below the fixed Go patch version.
