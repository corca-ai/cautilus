# Debug Review
Date: 2026-07-09

## Problem

`npm run verify` failed during `security · govulncheck` after the lint-specs timing change.

## Correct Behavior

Given the repo standing gate runs on the maintainer clone or CI, when `npm run verify` reaches `security:govulncheck`, then govulncheck should exit 0 against the checked-in Go toolchain and current source.

## Observed Facts

- `npm run verify` exited 3 at `security · govulncheck`.
- Exact failure: `GO-2026-5856`, `Invoking Encrypted Client Hello privacy leak in crypto/tls`, `Found in: crypto/tls@go1.26.4`, `Fixed in: crypto/tls@go1.26.5`.
- `go version` reported `go1.26.4 linux/amd64`.
- `go.mod` had `toolchain go1.26.4`.
- GitHub workflows `.github/workflows/verify.yml`, `.github/workflows/release-artifacts.yml`, and `.github/workflows/spec-report.yml` pinned Go `1.26.4`.
- Maintainer docs still described `Go 1.26.3+` or `toolchain go1.26.3`.
- Web search for the exact vulnerability ID did not return a stronger public source than the local govulncheck advisory link, but govulncheck itself reported the fixed version and affected package.

## Reproduction

- `npm run --silent security:govulncheck` reproduced the failure with exit 3 and the same `GO-2026-5856` standard-library finding.
- `go env GOTOOLCHAIN GOVERSION GOROOT GOPATH` showed `GOTOOLCHAIN=auto`, `GOVERSION=go1.26.4`, and a downloaded `go1.26.4` toolchain under `golang.org/toolchain`.

## Candidate Causes

- Vulnerable Go standard-library toolchain: the repo and local environment were still on Go 1.26.4 while govulncheck requires 1.26.5 for this TLS advisory.
- Application-level TLS misuse: Cautilus code could be directly invoking an unsafe crypto/tls path independent of the toolchain.
- Stale govulncheck database or false positive: the scanner could be reporting a newly indexed advisory before a compatible toolchain is available.

## Hypothesis

- Falsifiable claim: if the checked-in toolchain and CI setup move to Go 1.26.5, then `go env GOVERSION` will resolve to `go1.26.5` and `npm run --silent security:govulncheck` will exit 0 without source-code changes.
- Disconfirmer: after the toolchain bump, run `go env GOVERSION GOROOT` and `npm run --silent security:govulncheck`.

## Verification

- Confirmed.
- After changing `go.mod` to `toolchain go1.26.5`, `go env GOVERSION GOROOT` downloaded and selected `go1.26.5`.
- After the same change, `npm run --silent security:govulncheck` exited 0 and printed `No vulnerabilities found.`

## Root Cause

The standing gate was correct to fail: the repo's pinned Go toolchain and CI workflows were on Go 1.26.4 after a standard-library TLS advisory required Go 1.26.5.
The structural cause was version-surface drift: the executable source of truth (`go.mod` and workflows) and human docs carried older patch-level assumptions, so a new stdlib advisory could break `verify` until all Go-version surfaces were advanced together.

## Invariant Proof

- Invariant: every maintainer and CI Go-version surface must be at or above the patch version required by standing govulncheck.
- Producer Proof: `go.mod` now declares `toolchain go1.26.5`, and all three GitHub workflow `setup-go` pins use `1.26.5`.
- Final-Consumer Proof: `go env GOVERSION GOROOT` selected the downloaded `go1.26.5` toolchain and `npm run --silent security:govulncheck` passed.
- Interface-Shape Sibling Scan: docs and workflows were scanned for `1.26.3`, `1.26.4`, `go1.26.3`, and `go1.26.4`; no old Go patch references remained in the checked files scanned.
- Non-Claims: this does not prove future Go patch advisories will be auto-updated; it proves this advisory is resolved and the currently known version surfaces are aligned.

## Detection Gap

- `npm run verify` / govulncheck | did fire, but only after the maintainer hit the full gate | prevention is to keep Go version pins and maintainer docs aligned in the same slice when govulncheck reports a fixed toolchain.
- maintainer docs | did not encode the current security-required minimum | smallest change was updating `Go 1.26.3+` to `Go 1.26.5+` and the master-plan toolchain note to `go1.26.5`.
- CI workflows | would have reproduced the same failure with `setup-go@1.26.4` | smallest change was bumping all workflow `go-version` pins to `1.26.5`.

## Sibling Search

- Mental model: a Go minor-line minimum is stable enough to leave patch-level docs and CI pins alone.
- same layer: `.github/workflows/verify.yml`, `.github/workflows/release-artifacts.yml`, `.github/workflows/spec-report.yml` | decision: same bug, fix now | proof: static scan plus edited pins.
- abstraction up: maintainer acceptance and release docs | decision: same bug, fix now | proof: static scan plus edited docs.
- specialization down: `go.mod` toolchain line | decision: same bug, fix now | proof: runtime `go env GOVERSION` selected 1.26.5.
- cross-file: `.github/workflows/verify.yml` and `docs/maintainers/development.md` carried the same stale Go-version assumption outside `go.mod`.

## Seam Risk

- Interrupt ID: govulncheck-go-1.26.5-toolchain
- Risk Class: none
- Seam: none
- Disproving Observation: `npm run --silent security:govulncheck` failed on 1.26.4 and passed after selecting 1.26.5.
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep Go patch-level bumps atomic across `go.mod`, GitHub workflows, maintainer docs, and any product-roadmap version note when govulncheck reports a standard-library fixed version.
Do not waive a standing govulncheck stdlib finding as a local false positive without first testing the fixed Go toolchain.
