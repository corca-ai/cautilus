# Release Surface Check
Date: 2026-07-08

Released Cautilus `v0.18.2`.

## Release Scope

`v0.18.2` is a patch release for provenance confidence, release safety, and maintainer feedback speed.
Scenario proposal packets now validate, preserve, and summarize evidence provenance through `origin`, `activityProvenance`, and `provenanceSummary` across the Node packet path, Go runtime, CLI-facing docs, and review HTML.
Release publishing now runs configured requested review commands before branch or tag push and reports `postPublishInstallReadback` separately from tag/workflow publication.
Local Node verification is faster while keeping real `bin/cautilus --version`, consumer `init`, and release smoke surfaces in place.

## Current Version

- previous version: `0.18.1`
- target version: `0.18.2`
- target tag: `v0.18.2`
- git branch: `main`
- git remote: `origin`

## Verification

- Release critique: `charness-artifacts/critique/2026-07-08-v0-18-2-release-critique.md`.
- Surface packet: `npm run critique:surface-packet:check` passed.
- Publisher policy: `npm run release:publisher-policy:check` passed.
- Release preparation: `npm run release:prepare -- 0.18.2` passed.
- Claim freshness: `npm run release:claim-freshness` passed during release preparation.
- Full verification: `npm run verify` passed all phases in 69.44s after release preparation.
- On-demand verification: `npm run test:on-demand` passed.
- Hook verification: `npm run hooks:check` passed.
- Generated drift: `npm run generated:drift:check` passed.
- Version readback: `./bin/cautilus --version` returned `0.18.2`.
- Publish dry-run: pending release commit because `publish-release.mjs --dry-run` requires a clean worktree.

## Release State

- local release mutation: complete
- branch/tag push: not started
- GitHub release record: not started
- public release surface verification: not started
- requested review commands: passed locally; publish helper will rerun before branch or tag push
- post-publish install readback: pending public release

## Public Release Verification

- Public release verification is pending tag-triggered GitHub workflow publication.
- Local public-release verification is not a substitute for workflow publication.

## Distinct-Channel Verification

- Distinct-channel verification is pending public release visibility.

## Release Adapter Preflight

- Release adapter focused preflight status: passed through `npm run critique:surface-packet:check`.
- Requested-review commands configured by `.agents/release-adapter.yaml`:
  - `npm run critique:surface-packet:check`
  - `npm run release:publisher-policy:check`
- Post-publish install refresh configured by `.agents/release-adapter.yaml`:
  - `npm run release:smoke-install:current -- --skip-update`

## Real-Host Verification

- No configured release-time real-host proof trigger matched this slice.

## Review Proof

- Review proof: `charness-artifacts/critique/2026-07-08-v0-18-2-release-critique.md`.
- Test quality proof: `charness-artifacts/quality/latest.md`.

## Requested Review Gate

- Requested-review gate status: passed locally; pending publish-helper rerun.
- Configuration status: configured.
- Policy: publish helper must run configured requested review commands before branch or tag push.

## Post-Publish Proof

- Public release check: pending tag-triggered release workflow.
- Install readback: pending `npm run release:smoke-install:current -- --skip-update` after public release visibility.

## Install Refresh

- Post-publish install refresh status: pending public release.
- Full install/update smoke after public release: `npm run release:smoke-install -- --channel install_sh --version v0.18.2`.

## User Update Steps

- Operators with an existing install refresh the binary via the install-sh channel: re-run `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
- Claude Code and Codex plugin consumers pick up the Cautilus Agent refresh via `charness update` or by re-running `cautilus init` in the host repo.
