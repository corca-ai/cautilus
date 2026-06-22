# Release Surface Check
Date: 2026-06-22

## Scope

Advanced `cautilus` toward release `0.17.1` (tag `v0.17.1`) through the repo-owned release helper.

## Current Version

- previous version: `0.17.0`
- target version: `0.17.1`
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
- GitHub release record: verified URL `https://github.com/corca-ai/cautilus/releases/tag/v0.17.1`
- public release surface verification: verified
- audit narrative: durable record written to `charness-artifacts/release/latest.md` and committed with this slice

## Public Release Verification

- GitHub release publication: verified by the release backend.

## Distinct-Channel Verification

- Rung-2 distinct-channel verdict: `confirmed` via `https-fetch` (a channel distinct from `gh release view`).
- Channel URL: `https://github.com/corca-ai/cautilus/releases/tag/v0.17.1`
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
- Retro artifact: `charness-artifacts/retro/2026-06-22-v0-17-1-release-auto-retro.md`.
- Recent lessons: `charness-artifacts/retro/recent-lessons.md`.
- Surface hits: 1.
  - `release-packaging`
- Path hits: 0.
- Evaluated changed paths: 49.
  - `.agents/skills/cautilus-agent/references/skill-evaluation.md`
  - `.agents/skills/cautilus-agent/references/skill-testing.md`
  - `.claude-plugin/marketplace.json`
  - `charness-artifacts/critique/2026-06-22-104735-packet.json`
  - `charness-artifacts/critique/2026-06-22-104735-packet.md`
  - `charness-artifacts/critique/2026-06-22-113232-packet.json`
  - `charness-artifacts/critique/2026-06-22-113232-packet.md`
  - `charness-artifacts/critique/2026-06-22-115039-packet.json`
  - `charness-artifacts/critique/2026-06-22-115039-packet.md`
  - `charness-artifacts/critique/2026-06-22-issue-49-resolution-critique.md`
  - `charness-artifacts/critique/2026-06-22-uncached-token-threshold-critique.md`
  - `charness-artifacts/critique/2026-06-22-v0.17.1-release-critique.md`
  - `charness-artifacts/debug/2026-06-22-claude-subagent-threshold-lint-complexity.md`
  - `charness-artifacts/debug/2026-06-22-release-helper-cli-surface-wrapper.md`
  - `charness-artifacts/debug/2026-06-22-verify-live-codex-exec.md`
  - `charness-artifacts/debug/latest.md`
  - `charness-artifacts/find-skills/latest.json`
  - `charness-artifacts/find-skills/latest.md`
  - `charness-artifacts/release/latest.md`
  - `charness-artifacts/retro/2026-06-22-v0-17-1-release-auto-retro.md`
  - ... 29 more

## Real-Host Verification

- No configured release-time real-host verification trigger matched this slice.

## Real-Host Proof

- No configured release-time real-host proof trigger matched this slice.

## Review Proof

- Review proof: `charness-artifacts/critique/2026-06-22-v0.17.1-release-critique.md`.

## Post-Publish Proof

- Public release check: `gh release view v0.17.1`.

## Install Refresh

- Post-publish install refresh status: `not_configured`.

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
