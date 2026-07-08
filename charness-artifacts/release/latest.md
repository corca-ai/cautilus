# Release Surface Check
Date: 2026-07-08

## Scope

Advanced `cautilus` toward release `0.18.1` (tag `v0.18.1`) through the repo-owned release helper.

## Current Version

- previous version: `0.18.0`
- target version: `0.18.1`
- git branch: `main`
- git remote: `origin`

## Verification

- `npm run verify` passed before publish.
- `current_release.py` reported no version drift across packaging and generated install surfaces.
- initial release push carried the release branch update and tag from the release helper.

## Release State

- local release mutation: complete
- branch/tag push: complete
- GitHub release record: target URL `https://github.com/corca-ai/cautilus/releases/tag/v0.18.1`; creation runs after the branch/tag push
- public release surface verification: not checked by this helper
- audit narrative: durable record written to `charness-artifacts/release/latest.md` and committed with this slice

## Public Release Verification

- GitHub release publication: expected after branch/tag push; not verified yet.

## Release Adapter Preflight

- Release adapter focused preflight status: `not_required`.
- Reason: release adapter did not change in the release delta
- Focused preflight commands: none executed.

## Retro Trigger Evaluation

- Triggered: `True`.
- Evaluated at: `final_release_paths`.
- Input mode: `explicit_paths`.
- Reason: Changed surfaces hit configured install/update/support/export/discovery retro triggers.
- Closeout status: `written`.
- Retro artifact: `charness-artifacts/retro/2026-07-08-v0-18-1-release-auto-retro.md`.
- Recent lessons: `charness-artifacts/retro/recent-lessons.md`.
- Surface hits: 1.
  - `release-packaging`
- Path hits: 0.
- Evaluated changed paths: 54.
  - `.cautilus/claims/canonical-claim-map.json`
  - `.cautilus/claims/claim-status-report.md`
  - `.cautilus/claims/evidence-state.json`
  - `.cautilus/claims/evidenced-typed-runners.json`
  - `.cautilus/claims/latest.json`
  - `.cautilus/claims/status-summary.json`
  - `.claude-plugin/marketplace.json`
  - `README.md`
  - `charness-artifacts/critique/2026-07-08-003218-packet.json`
  - `charness-artifacts/critique/2026-07-08-003218-packet.md`
  - `charness-artifacts/critique/2026-07-08-013231-packet.json`
  - `charness-artifacts/critique/2026-07-08-013231-packet.md`
  - `charness-artifacts/critique/2026-07-08-015851-packet.json`
  - `charness-artifacts/critique/2026-07-08-015851-packet.md`
  - `charness-artifacts/critique/2026-07-08-025153-packet.json`
  - `charness-artifacts/critique/2026-07-08-025153-packet.md`
  - `charness-artifacts/critique/2026-07-08-scenario-provenance-validation-fix-review.md`
  - `charness-artifacts/critique/2026-07-08-skillopt-absorption-disposition-review.md`
  - `charness-artifacts/critique/2026-07-08-skillopt-provenance-post-commit-critique.md`
  - `charness-artifacts/debug/2026-07-08-release-helper-packaging-manifest-mismatch.md`
  - ... 34 more

## Real-Host Verification

- No configured release-time real-host verification trigger matched this slice.

## Real-Host Proof

- No configured release-time real-host proof trigger matched this slice.

## Review Proof

- Review proof: `charness-artifacts/critique/2026-07-08-scenario-provenance-validation-fix-review.md`.

## Requested Review Gate

- Requested-review gate status: `ok`.
- Configuration status: `not_configured`.
- Policy: `warn-if-unconfigured`.
- Configured command count: `0`.
- Warning: requested_review_commands is empty; requested-review enforcement is advisory-only for this release.

## Install Refresh

- Post-publish install refresh: pending final publish verification.

## Release Runtime

- `requested_review_gate`: 0.001s
- `cli_skill_surface_gate`: 0.070s
- `quality_command`: 84.036s
- `fresh_checkout_probes_initial`: 10.006s

## Fresh Checkout Probes

- Fresh-checkout probe status: passed.
- `git fetch --unshallow --quiet || true`
- `npm run claims:evidence-state:check`
- `npm run claims:status-report:check`
- `npm run generated:drift:check`

## Issue Closeout

- Issue closeout verification: pending or not requested.

## User Update Steps

- Operators with an existing install refresh the binary via the install-sh channel: re-run `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
- Claude Code and Codex plugin consumers pick up the Cautilus Agent refresh via `charness update` or by re-running `cautilus init` in the host repo.
