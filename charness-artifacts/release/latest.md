# Release Surface Check
Date: 2026-07-11

## Scope

Released `cautilus` `v0.19.2` through the repo-owned ordered publisher.
This patch improves review-input fidelity, failure-path correctness, workspace mutation safety, and proof-preserving maintainer test economics.
Installed binaries receive Unicode-safe claim-review excerpts and fail-closed consumer-prompt reads; source-checkout workflows additionally receive active-run whitespace normalization and pre-mutation guards in `workspace-start`, `prepare-compare-worktrees`, and `prune-workspace-artifacts`.
It does not change packet schemas, structured stdout, install mechanisms, or the Cautilus Agent behavior contract, and it does not claim repo-wide parser hardening or a global verification-speed percentage.

## Current Version

- previous version: `0.19.1`
- target version: `0.19.2`
- git branch: `main`
- git remote: `origin`

## Behavior and Recovery

- A consumer prompt recorded as present but later unreadable now returns a path-bearing error in Go and Node; restore the referenced prompt or regenerate the prompt-input/review packet, then rerun.
- All-whitespace optional active-run paths mean absent, while non-empty path identity remains unchanged.
- The focused compare-worktree parser suite median changed from `1.85s` to `1.57s` on this machine with cases and mutation oracles unchanged; no total-suite percentage is claimed.

## Verification

- `npm run verify` passed before publish.
- `current_release.py` reported no version drift across packaging and generated install surfaces.
- initial release push carried the release branch update and tag from the release helper.
- post-publish artifact push recorded the verified public release state on the release branch.

## Release State

- local release mutation: complete
- branch/tag push: complete
- GitHub release record: verified URL `https://github.com/corca-ai/cautilus/releases/tag/v0.19.2`
- public release surface verification: verified
- audit narrative: durable record written to `charness-artifacts/release/latest.md` and committed with this slice

## Public Release Verification

- GitHub Actions run `29150460445` completed successfully.
- `release-artifacts` passed in 4m02s, including verify, asset build, binary attestations, and GitHub release upload.
- `verify-public-release` passed in 12s.
- Local `verify-public-release.mjs` passed on its first post-workflow attempt with all seven expected assets, a complete four-binary checksum manifest, and matching source-archive checksum `4211d19ba2b38fe2478c1a14ea9f7fd93815b06eb2d78202308d5661bcf09c97`.
- `gh attestation verify` passed for `cautilus_0.19.2_linux_x64.tar.gz`.

## Distinct-Channel Verification

- Rung-2 distinct-channel verdict: `confirmed` via `https-fetch` (a channel distinct from `gh release view`).
- Channel URL: `https://github.com/corca-ai/cautilus/releases/tag/v0.19.2`
- HTTP status: `200`
- The verdict confirms only release-page visibility; no tracked issue closeout was requested or implied.

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

## Post-Publish Proof

- Public release check: workflow and local verifier passed with the complete asset matrix.
- Distinct install readback: passed after asset publication.
- Timing incident: `charness-artifacts/debug/latest.md` records the release-page-before-asset-readiness window and the unchanged-command retry proof.

## Install Refresh

- Initial post-publish install refresh status: `failed` after 0.82s because the release page was visible before workflow assets existed; the Linux archive URL returned HTTP 404 while `gh release view` showed an empty asset list.
- Final post-workflow install readback status: `passed` through `npm run release:smoke-install:current -- --skip-update`.
- The installer downloaded `cautilus_0.19.2_linux_x64.tar.gz`; `--version` and `version --verbose` both reported `0.19.2` with `installKind: install_sh_binary`.
- Full Linux install/update smoke also passed through `npm run release:smoke-install -- --channel install_sh --version v0.19.2`; `cautilus update` reported `status: current`, `updated: false`, and latest version `0.19.2`.
- The adapter command uses an isolated install root and does not refresh the maintainer's PATH-level binary; that local binary remains an explicit environment-skew observation, not a release failure.

## Release Runtime

- `requested_review_gate`: 6.099s
- `cli_skill_surface_gate`: 0.062s
- `quality_command`: 33.532s
- `fresh_checkout_probes_initial`: 7.855s
- `fresh_checkout_probes_after_amend`: 9.472s
- `push_create_verify_release`: 60.365s
- `distinct_channel_verification`: 0.521s
- `issue_closeout`: 0.000s
- `post_publish_install_refresh`: 0.820s

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
- Roll back by rerunning the installer with `CAUTILUS_VERSION=v0.19.1`, then verify `cautilus --version`.
- Source-checkout users move their checkout or tag to receive or roll back the Node helper changes.
- Claude Code and Codex plugin consumers need no Agent behavior migration; use `charness update` or rerun `cautilus init` only when refreshing repo-local surfaces.
