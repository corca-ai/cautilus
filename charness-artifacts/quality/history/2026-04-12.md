# Quality Review

Date: 2026-04-12

## Scope

Review repo-wide quality posture with emphasis on repo-owned gate honesty,
maintainer-local enforcement, the self-dogfood review boundary, and the newly
added Go vulnerability gate.

## Current Gates

- `npm run verify`
- `npm run hooks:check`
- `npm run dogfood:self`
- `npm run security:govulncheck`
- checked-in `.githooks/pre-push` running `npm run verify`
- GitHub Actions `verify` workflow on PRs and pushes to `main`

## Runtime Signals

- `./bin/cautilus adapter resolve --repo-root .` passed.
- `npm run hooks:check` passed with `core.hooksPath=.githooks` and an
  executable checked-in `pre-push`.
- repo-local Go toolchain now resolves to `go1.26.2` via `toolchain
  go1.26.2`, which clears the standard-library vulnerabilities that
  `govulncheck` reported under `go1.26.1`.
- `go test ./internal/app` passed after adding regression coverage for command
  env scrubbing.
- `npm run verify` passed with `179` Node tests,
  `spec checks passed (4 specs, 451 guard rows)`, and
  `No vulnerabilities found.` from `govulncheck`.
- `npm run dogfood:self` now exits `0` with `overallStatus: pass`,
  `reportRecommendation: accept-now`, and `gateRecommendation: accept-now`.
- Root cause fixed: internal shim env
  (`CAUTILUS_CALLER_CWD`, `CAUTILUS_TOOL_ROOT`) had leaked into nested shell
  commands, so `dogfood:self` could fail its internal `npm run verify` while a
  direct `npm run verify` still passed.
- Quality adapter preflight had drifted to `node ./bin/cautilus ...`; that was
  invalid once `bin/cautilus` became a POSIX shim and is now fixed to
  `./bin/cautilus ...`.
- The self-dogfood review prompt now includes current-run report evidence plus
  projected `summary.json` / `review-summary.json` surfaces, and the latest
  structured reviewer accepted the narrowed honesty claim.

## Maintainer-Local Enforcement

- `healthy`: repo-owned `hooks:install`, `hooks:check`, and checked-in
  `.githooks/pre-push` make the stop-before-push gate deterministic.
- `healthy`: CI re-runs the same `npm run verify` surface instead of a parallel
  bespoke workflow.
- `healthy`: repo-owned `security:govulncheck` now enforces a real Go
  vulnerability audit in both local `verify` and GitHub workflows.

## Enforcement Triage

- `AUTO_EXISTING`: `npm run verify`, `npm run hooks:check`, checked-in
  `pre-push`, GitHub `verify` workflow, `npm run security:govulncheck`.
- `AUTO_CANDIDATE`: source-guard the quality-adapter preflight command so the
  shim invocation cannot drift again. Implemented.
- `AUTO_CANDIDATE`: regression-test command-runner env scrubbing so internal
  shim context cannot taint nested evaluations. Implemented.
- `AUTO_CANDIDATE`: include current-run report evidence and projected published
  surfaces in the self-dogfood review prompt. Implemented.
- `NON_AUTOMATABLE`: the remaining self-dogfood review is still judgment-based,
  but the latest bounded reviewer now agrees with the automated
  `accept-now` recommendation.

## Healthy

- The shared repo gate is real and currently green.
- Maintainer-local enforcement is repo-owned, checked in, and validated.
- Go and Node test coverage both exercise product-owned runtime seams.
- Release automation reuses the repo gate and keeps provenance attestation in
  the published path.
- Self-dogfood currently proves its narrow operator-facing claim on a fresh run.
- The Go security gate is real, repo-owned, and green under the pinned
  `go1.26.2` toolchain baseline.

## Weak

- Self-dogfood honesty still depends on human-style review judgment rather than
  a fully deterministic packet-completeness gate.
- The Go vulnerability gate currently depends on the repo resolving
  `go1.26.2+`; clones pinned to an older toolchain will fail until upgraded or
  allowed to auto-download the newer toolchain.

## Missing

- No deterministic check yet asserts that every self-dogfood review prompt
  section keeps the current-run evidence shape beyond the covered smoke tests.

## Deferred

- Duplicate-budget and coverage-threshold follow-ups from the 2026-04-10
  review still matter, but they are no longer the highest-leverage next move
  after closing the self-dogfood false negative and adding the security gate.

## Commands Run

- `python3 ".../skills/quality/scripts/resolve_adapter.py" --repo-root .`
- `git status --short`
- `git config --get core.hooksPath`
- `find .git/hooks -maxdepth 1 -type f`
- `./bin/cautilus adapter resolve --repo-root .`
- `npm run hooks:check`
- `go env GOVERSION`
- `go test ./internal/app`
- `node ./scripts/check-specs.mjs`
- `npm run verify`
- `npm run dogfood:self`

## Recommended Next Gates

- `AUTO_CANDIDATE`: tighten self-dogfood prompt tests so they assert the
  projected published-surface mapping more explicitly than the current smoke
  coverage.
- `AUTO_CANDIDATE`: surface the `go1.26.2` toolchain requirement as close as
  possible to clone bootstrap so security-gate failures are less surprising.
- `DEFER`: return to duplicate-budget and coverage-floor work now that the
  honesty and security gates are in place.
