# Quality Review

Date: 2026-04-12

## Scope

Review repo-wide quality posture with emphasis on repo-owned gate honesty,
maintainer-local enforcement, and whether self-dogfood still proves the narrow
operator-facing claim after the Go shim port.

## Current Gates

- `npm run verify`
- `npm run hooks:check`
- `npm run dogfood:self`
- checked-in `.githooks/pre-push` running `npm run verify`
- GitHub Actions `verify` workflow on PRs and pushes to `main`

## Runtime Signals

- `./bin/cautilus adapter resolve --repo-root .` passed.
- `npm run hooks:check` passed with `core.hooksPath=.githooks` and an
  executable checked-in `pre-push`.
- `go test ./internal/app` passed after adding regression coverage for command
  env scrubbing.
- `npm run verify` passed with `177` Node tests and
  `spec checks passed (4 specs, 434 guard rows)`.
- `npm run dogfood:self` now reaches `gateRecommendation: accept-now`; it still
  exits `1` because the structured review returns `concern`, not because the
  full-gate run fails.
- Root cause fixed: internal shim env
  (`CAUTILUS_CALLER_CWD`, `CAUTILUS_TOOL_ROOT`) had leaked into nested shell
  commands, so `dogfood:self` could fail its internal `npm run verify` while a
  direct `npm run verify` still passed.
- Quality adapter preflight had drifted to `node ./bin/cautilus ...`; that was
  invalid once `bin/cautilus` became a POSIX shim and is now fixed to
  `./bin/cautilus ...`.

## Maintainer-Local Enforcement

- `healthy`: repo-owned `hooks:install`, `hooks:check`, and checked-in
  `.githooks/pre-push` make the stop-before-push gate deterministic.
- `healthy`: CI re-runs the same `npm run verify` surface instead of a parallel
  bespoke workflow.

## Enforcement Triage

- `AUTO_EXISTING`: `npm run verify`, `npm run hooks:check`, checked-in
  `pre-push`, GitHub `verify` workflow.
- `AUTO_CANDIDATE`: source-guard the quality-adapter preflight command so the
  shim invocation cannot drift again. Implemented.
- `AUTO_CANDIDATE`: regression-test command-runner env scrubbing so internal
  shim context cannot taint nested evaluations. Implemented.
- `NON_AUTOMATABLE`: decide whether the self-dogfood review packet now shows
  enough current-run evidence for an operator to trust the latest bundle. The
  current structured reviewer still says no.

## Healthy

- The shared repo gate is real and currently green.
- Maintainer-local enforcement is repo-owned, checked in, and validated.
- Go and Node test coverage both exercise product-owned runtime seams.
- Release automation reuses the repo gate and keeps provenance attestation in
  the published path.

## Weak

- `npm run dogfood:self` still ends in `overallStatus: concern` because the
  review packet does not yet prove enough current-run evidence for the narrow
  honesty claim.
- Self-dogfood honesty still depends on human-style review judgment rather than
  a deterministic packet-completeness gate.
- No repo-owned vulnerability audit gate is configured.

## Missing

- No deterministic check asserts that the self-dogfood review packet includes
  the current run's concrete summary/report/review recommendation fields.
- No checked-in security audit gate such as `govulncheck ./...` exists yet.

## Deferred

- Duplicate-budget and coverage-threshold follow-ups from the 2026-04-10
  review still matter, but they are no longer the highest-leverage next move
  after fixing the self-dogfood false negative.

## Commands Run

- `python3 ".../skills/quality/scripts/resolve_adapter.py" --repo-root .`
- `git status --short`
- `git config --get core.hooksPath`
- `find .git/hooks -maxdepth 1 -type f`
- `./bin/cautilus adapter resolve --repo-root .`
- `npm run hooks:check`
- `go test ./internal/app`
- `node ./scripts/check-specs.mjs`
- `npm run verify`
- `npm run dogfood:self`

## Recommended Next Gates

- `AUTO_CANDIDATE`: add one deterministic test/spec assertion that the
  self-dogfood review prompt or packet includes the current run's emitted
  `summary.json`, `report.json`, and recommendation values, not only the
  artifact layout.
- `AUTO_CANDIDATE`: add `govulncheck ./...` once the maintainer toolchain
  baseline explicitly includes it.
- `NON_AUTOMATABLE`: after strengthening self-dogfood evidence, re-run
  `npm run dogfood:self` and confirm the structured reviewer can accept the
  narrowed honesty claim.
