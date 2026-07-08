# Release Surface Check
Date: 2026-07-09

Released Cautilus `v0.18.3`.

## Release Scope

`v0.18.3` is a patch release for release-readiness correctness.
The quality adapter startup probes now exercise the current registry-backed command surfaces: `doctor binary`, `doctor commands`, and `discover scenarios`.
Cautilus Agent command-discovery guidance now points agents at `doctor commands` instead of the removed top-level `commands` alias across the repo-local, source, and packaged skill surfaces.
No public command shape is added or removed in this release.

## Current Version

- previous version: `0.18.2`
- target version: `0.18.3`
- target tag: `v0.18.3`
- git branch: `main`
- git remote: `origin`

## Verification

- Debug proof: `charness-artifacts/debug/latest.md`.
- Release critique: `charness-artifacts/critique/2026-07-09-v0-18-3-release-critique.md`.
- Release preparation: `npm run release:prepare -- 0.18.3` passed after `npm run claims:refresh:all` refreshed stale claim state.
- Claim freshness: `npm run release:claim-freshness` passed during release preparation and inside `npm run verify`.
- Startup probe proof: `measure_startup_probes.py --repo-root . --json` passed with all five configured probes `ok`.
- Skill disclosure proof: `npm run lint:skill-disclosure` passed.
- Full verification: `npm run verify` passed all phases in 49.36s after release preparation.
- Hook verification: `npm run hooks:check` passed.
- Full history secret proof: `npm run security:secrets:history` passed.
- Publisher policy: `npm run release:publisher-policy:check` passed.
- On-demand verification: `npm run test:on-demand` passed.
- Version readback: `./bin/cautilus --version` returned `0.18.3`.

## Release State

- local release mutation: prepared
- branch/tag push: pending publish helper
- GitHub release record: pending tag-triggered workflow
- public release surface verification: pending tag-triggered workflow
- requested review commands: passed locally; publish helper will rerun configured commands before branch/tag push
- post-publish install readback: pending public release visibility

## Public Release Verification

- Pending: the tag-triggered `release-artifacts` workflow owns public release verification for `v0.18.3`.
- Local public-release verification has not run because the tag has not been published yet.

## Distinct-Channel Verification

- Pending: post-publish install readback through `npm run release:smoke-install:current -- --skip-update`.

## Release Adapter Preflight

- Release adapter focused preflight status: passed through `npm run critique:surface-packet:check`.
- Requested-review commands configured by `.agents/release-adapter.yaml`:
  - `npm run critique:surface-packet:check`
  - `npm run security:secrets:history`
  - `npm run release:publisher-policy:check`
- Post-publish install refresh configured by `.agents/release-adapter.yaml`:
  - `npm run release:smoke-install:current -- --skip-update`

## Real-Host Verification

- No configured release-time real-host proof trigger matched this slice.

## Review Proof

- Review proof: `charness-artifacts/critique/2026-07-09-v0-18-3-release-critique.md`.
- Quality proof: full `npm run verify`, focused startup probes, and skill disclosure checks passed after the patch.

## Requested Review Gate

- Requested-review gate status: passed locally.
- Configuration status: configured.
- Policy: publish helper must run configured requested review commands before branch or tag push.

## Post-Publish Proof

- Public release check: pending `release-artifacts` workflow after tag push.
- Install readback: pending `npm run release:smoke-install:current -- --skip-update` after public release visibility.

## Install Refresh

- Post-publish install refresh status: pending.
- Full install/update smoke after public release remains available for broader channel validation: `npm run release:smoke-install -- --channel install_sh --version v0.18.3`.

## User Update Steps

- Operators with an existing install refresh the binary via the install-sh channel: re-run `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
- Claude Code and Codex plugin consumers pick up the Cautilus Agent refresh via `charness update` or by re-running `cautilus init` in the host repo.
