# Release Surface Check
Date: 2026-07-11

## Scope

Released Cautilus `v0.19.3` through the repo-owned release helper.

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

- GitHub Actions run `29155090420` completed successfully.
- The release-artifact job completed in 3m16s and its separate public-release verifier completed in 9s.
- Public release check: `node scripts/release/verify-public-release.mjs --version v0.19.3` returned `status: ok`.
- Seven expected assets were uploaded: four platform archives, the binary checksum manifest, the source checksum, and provenance release notes.
- Linux x64 archive digest: `00ec10045fd080476961994fadb4ab7ae67d460525e1fb7da401e4ed37b74de2`.
- `gh attestation verify` bound that archive to tag `v0.19.3`, workflow `release-artifacts`, and commit `50aa62c594ecbd166bba3026f74dbc41fc15b056`.

## Install Refresh

- The helper's immediate post-publication refresh failed truthfully with HTTP 404 because the release page preceded workflow-owned asset readiness.
- After workflow completion, `npm run release:smoke-install:current -- --skip-update` passed and the installed binary returned `0.19.3`.
- `npm run release:smoke-install -- --channel install_sh --version v0.19.3` also passed.
- The explicit smoke's update command reported `status: current`, `updated: false`, and latest version `0.19.3`.

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

- Binary operators update by re-running `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
- Binary operators roll back by setting `CAUTILUS_VERSION=v0.19.2` when running that installer, then checking `cautilus --version`.
- Source-checkout operators move to tag `v0.19.3` to receive the deployment-helper and coverage-runner changes, or return to `v0.19.2` to roll them back.
- Cautilus Agent and plugin behavior content did not change in this patch, so Agent-only consumers do not need `charness update` or `cautilus init` for these fixes.

## Non-Claims

- The GitHub release-notes asset is provenance-oriented and is not claimed to carry this operator narrative.
- No native macOS execution proof was run; Linux/current-host install proof does not substitute for it.
- The detailed coverage timing is a local alternating-sample result with strong order effects, not a portable or global speed claim.
- No provider-backed or live evaluator behavior was exercised for this patch.
