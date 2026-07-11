# Release Surface Check
Date: 2026-07-11

## Scope

Advanced `cautilus` toward release `0.19.3` (tag `v0.19.3`) through the repo-owned release helper.

## Current Version

- previous version: `0.19.2`
- target version: `0.19.3`
- git branch: `main`
- git remote: `origin`

## Verification

- `npm run verify` passed before publish.
- `current_release.py` reported no version drift across packaging and generated install surfaces.
- initial release push carried the release branch update and tag from the release helper.
- post-publish artifact push recorded the verified public release state on the release branch.

## Release State

- local release mutation: complete
- branch/tag push: complete
- GitHub release record: verified URL `https://github.com/corca-ai/cautilus/releases/tag/v0.19.3`
- public release surface verification: verified
- audit narrative: durable record written to `charness-artifacts/release/latest.md` and committed with this slice

## Public Release Verification

- GitHub release publication: verified by the release backend.

## Distinct-Channel Verification

- Rung-2 distinct-channel verdict: `confirmed` via `https-fetch` (a channel distinct from `gh release view`).
- Channel URL: `https://github.com/corca-ai/cautilus/releases/tag/v0.19.3`
- HTTP status: `200`
- Rung-1 floor: a per-surface verdict is recorded (presence), so issue closeout was not silent; the honesty of this verdict is the human rung-2 disposition review.

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
- Retro artifact: `charness-artifacts/retro/2026-07-11-v0-19-3-release-auto-retro.md`.
- Recent lessons: `charness-artifacts/retro/recent-lessons.md`.
- Surface hits: 1.
  - `release-packaging`
- Path hits: 0.
- Evaluated changed paths: 48.
  - `.claude-plugin/marketplace.json`
  - `charness-artifacts/critique/2026-07-11-133548-packet.json`
  - `charness-artifacts/critique/2026-07-11-133548-packet.md`
  - `charness-artifacts/critique/2026-07-11-fourth-autonomous-two-hour-improvement-disposition.md`
  - `charness-artifacts/critique/2026-07-11-third-autonomous-two-hour-improvement-release-disposition-review.md`
  - `charness-artifacts/critique/2026-07-11-v0-19-3-release-critique.md`
  - `charness-artifacts/debug/2026-07-11-artifact-prune-false-success-removal-failure.md`
  - `charness-artifacts/debug/2026-07-11-build-deployment-evidence-option-like-output-mutation.md`
  - `charness-artifacts/debug/2026-07-11-deployment-evidence-invalid-json-stack-traces.md`
  - `charness-artifacts/debug/2026-07-11-install-overwrite-false-success-stale-tree.md`
  - `charness-artifacts/debug/2026-07-11-prepare-deployment-evidence-input-malformed-value-mutation.md`
  - `charness-artifacts/debug/2026-07-11-prune-dry-run-consumed-as-root.md`
  - `charness-artifacts/debug/2026-07-11-release-page-before-asset-readiness.md`
  - `charness-artifacts/debug/2026-07-11-scenario-builder-registry-validation-panic.md`
  - `charness-artifacts/debug/latest.md`
  - `charness-artifacts/goals/2026-07-11-fifth-autonomous-two-hour-improvement-release.md`
  - `charness-artifacts/goals/2026-07-11-fourth-autonomous-two-hour-improvement-early-close-report.md`
  - `charness-artifacts/goals/2026-07-11-fourth-autonomous-two-hour-improvement-host-log-probe.md`
  - `charness-artifacts/goals/2026-07-11-fourth-autonomous-two-hour-improvement.md`
  - `charness-artifacts/goals/2026-07-11-third-autonomous-two-hour-improvement-release-early-close-report.md`
  - ... 28 more

## Real-Host Verification

- No configured release-time real-host verification trigger matched this slice.

## Real-Host Proof

- No configured release-time real-host proof trigger matched this slice.

## Review Proof

- Review proof: `charness-artifacts/critique/2026-07-11-v0-19-3-release-critique.md`.

## Requested Review Gate

- Requested-review gate status: `ok`.
- Configuration status: `configured`.
- Policy: `warn-if-unconfigured`.
- Configured command count: `3`.

## Post-Publish Proof

- Public release check: `gh release view v0.19.3`.

## Install Refresh

- Post-publish install refresh status: `failed`.
- Command: `npm run release:smoke-install:current -- --skip-update`
- Return code: `1`
- Elapsed seconds: `0.808`
- Stdout tail: `> cautilus@0.19.3 release:smoke-install:current
> node scripts/release/run-install-smoke-current.mjs --skip-update`
- Stderr tail: `sh /home/hwidong/.cache/tmp/cautilus-install-smoke-iG0tzS/install.sh failed with exit 22
curl: (22) The requested URL returned error: 404`

## Release Runtime

- `requested_review_gate`: 6.135s
- `cli_skill_surface_gate`: 0.071s
- `quality_command`: 32.951s
- `fresh_checkout_probes_initial`: 7.924s
- `fresh_checkout_probes_after_amend`: 7.974s
- `push_create_verify_release`: 45.996s
- `distinct_channel_verification`: 0.468s
- `issue_closeout`: 0.000s
- `post_publish_install_refresh`: 0.808s

## Fresh Checkout Probes

- Fresh-checkout probe status: passed.
- `git fetch --unshallow --quiet || true`
- `npm run claims:evidence-state:check`
- `npm run claims:status-report:check`
- `npm run generated:drift:check`

## Issue Closeout

- Issue closeout verification: `not_requested`.

## User Update Steps

- Operators with an existing install refresh the binary via the install-sh channel: re-run `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
- Claude Code and Codex plugin consumers pick up the Cautilus Agent refresh via `charness update` or by re-running `cautilus init` in the host repo.
