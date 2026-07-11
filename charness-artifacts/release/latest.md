# Release Surface Check
Date: 2026-07-11

## Scope

Advanced `cautilus` toward release `0.19.2` (tag `v0.19.2`) through the repo-owned release helper.

## Current Version

- previous version: `0.19.1`
- target version: `0.19.2`
- git branch: `main`
- git remote: `origin`

## Verification

- `npm run verify` passed before publish.
- `current_release.py` reported no version drift across packaging and generated install surfaces.
- initial release push carried the release branch update and tag from the release helper.

## Release State

- local release mutation: complete
- branch/tag push: complete
- GitHub release record: target URL `https://github.com/corca-ai/cautilus/releases/tag/v0.19.2`; creation runs after the branch/tag push
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
- Retro artifact: `charness-artifacts/retro/2026-07-11-v0-19-2-release-auto-retro.md`.
- Recent lessons: `charness-artifacts/retro/recent-lessons.md`.
- Surface hits: 1.
  - `release-packaging`
- Path hits: 0.
- Evaluated changed paths: 46.
  - `.claude-plugin/marketplace.json`
  - `charness-artifacts/critique/2026-07-11-105243-packet.json`
  - `charness-artifacts/critique/2026-07-11-105243-packet.md`
  - `charness-artifacts/critique/2026-07-11-autonomous-repo-improvement-disposition-review.md`
  - `charness-artifacts/critique/2026-07-11-second-autonomous-repo-improvement-disposition-review.md`
  - `charness-artifacts/critique/2026-07-11-v0-19-2-release-critique.md`
  - `charness-artifacts/debug/2026-07-11-claim-review-excerpt-unicode-boundary.md`
  - `charness-artifacts/debug/2026-07-11-compare-worktrees-option-like-output-mutation.md`
  - `charness-artifacts/debug/2026-07-11-consumer-prompt-read-failure-suppression.md`
  - `charness-artifacts/debug/2026-07-11-fresh-eye-fingerprint-installed-layout.md`
  - `charness-artifacts/debug/2026-07-11-node-active-run-whitespace-path-presence.md`
  - `charness-artifacts/debug/2026-07-11-workspace-start-option-like-value-mutation.md`
  - `charness-artifacts/debug/latest.md`
  - `charness-artifacts/goals/2026-07-11-autonomous-repo-improvement.md`
  - `charness-artifacts/goals/2026-07-11-second-autonomous-repo-improvement.md`
  - `charness-artifacts/goals/2026-07-11-third-autonomous-two-hour-improvement-release.md`
  - `charness-artifacts/quality/2026-07-11-second-autonomous-improvement.md`
  - `charness-artifacts/quality/latest.md`
  - `charness-artifacts/release/latest.md`
  - `charness-artifacts/retro/2026-07-11-second-autonomous-repo-improvement-retro.md`
  - ... 26 more

## Real-Host Verification

- No configured release-time real-host verification trigger matched this slice.

## Real-Host Proof

- No configured release-time real-host proof trigger matched this slice.

## Review Proof

- Review proof: `charness-artifacts/critique/2026-07-11-v0-19-2-release-critique.md`.

## Requested Review Gate

- Requested-review gate status: `ok`.
- Configuration status: `configured`.
- Policy: `warn-if-unconfigured`.
- Configured command count: `3`.

## Install Refresh

- Post-publish install refresh: pending final publish verification.

## Release Runtime

- `requested_review_gate`: 6.099s
- `cli_skill_surface_gate`: 0.062s
- `quality_command`: 33.532s
- `fresh_checkout_probes_initial`: 7.855s

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
