# Release Surface Check
Date: 2026-06-29

Released Cautilus `v0.18.0`.

## Release Scope

Advanced `cautilus` to release `0.18.0` (tag `v0.18.0`) from `0.17.1` through the repo-owned release helper (`scripts/release/prepare-release.mjs` + `publish-release.mjs`).

Everything since tag `v0.17.1` is one coherent feature — the optimizer-untouchable final-acceptance-set read plus the acceptance risk-tier policy:

- read-time enforcement in `cautilus evaluate acceptance` (`--target`/`--waiver`, per-tier reliability floor, block-or-waiver).
- skip-time gate in read-only `cautilus doctor` (`--history-file`, the `acceptanceReadiness` block and `acceptance_read_readiness` check) plus the explicit `cautilus evaluate acceptance waive-skip` recorder.

The product owns only the closed effect vocabulary (`required`/`optional`/`skippable`); risk categories and tier names stay host/adapter-owned, and the acceptance read stays advisory — it never auto-applies or auto-rejects a candidate.

## Current Version

- previous version: `0.17.1`
- target version: `0.18.0`
- git branch: `main`
- git remote: `origin`
- bump rationale: minor — net-new operator commands (`evaluate acceptance`, `evaluate acceptance waive-skip`) and an optional `doctor --history-file` flag, with no breaking change to existing callers.

## Verification

- `npm run verify` passed before publish (all phases).
- `npm run hooks:check` ready; the publish push re-runs `npm run verify` plus generated-artifact drift via the pre-push hook.
- `prepare-release.mjs` bumped all five version surfaces to `0.18.0` with no drift; `npm run skills:sync-packaged` left no diff (the Cautilus Agent skill is unchanged this release).
- `release:claim-freshness` reported `fresh`.
- Go build clean; runtime and app test suites green; new fixture and smoke tests cover the skip-gate (`TestCLIDoctorAcceptanceSkipGate*`, `TestBuildAcceptanceReadiness*`).

## Review Proof

- Release critique: `charness-artifacts/critique/2026-06-29-v0.18.0-release-critique.md` (verdict: ship, 0 act-before-ship, 2 documented post-release follow-ups — Cautilus Agent acceptance-sequence routing and executable-spec coverage).

## Release State

- local release mutation: pending publish helper
- branch/tag push: pending publish helper
- GitHub release record: pending tag-triggered `release-artifacts.yml` workflow
- public release surface verification: pending `verify-public-release.mjs`
