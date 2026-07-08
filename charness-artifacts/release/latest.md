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

- local release mutation: prepared and committed at `97042dd964980898182d3c7c57f299e4de3c6dcb`
- branch/tag push: published; at publish time `origin/main` and `refs/tags/v0.18.3` both pointed at `97042dd964980898182d3c7c57f299e4de3c6dcb`
- release tag commit: `refs/tags/v0.18.3` remains fixed at `97042dd964980898182d3c7c57f299e4de3c6dcb`
- GitHub release record: published by `release-artifacts` workflow run `28981602710`
- public release surface verification: passed in the workflow and passed locally through `scripts/release/verify-public-release.mjs`
- requested review commands: passed locally and passed inside the publish helper before branch/tag push
- post-publish install readback: passed through `npm run release:smoke-install:current -- --skip-update --json`

## Public Release Verification

- GitHub Actions: `release-artifacts` run `28981602710` completed successfully.
- Workflow jobs: `release-artifacts` passed in 4m13s and `verify-public-release` passed in 12s.
- Public release URL: `https://github.com/corca-ai/cautilus/releases/tag/v0.18.3`.
- Local verifier: `node ./scripts/release/verify-public-release.mjs --version v0.18.3 --json --retry-attempts 5 --retry-delay-ms 10000` passed on the first attempt.
- Expected assets were present: `cautilus-v0.18.3.sha256`, four platform tarballs, `cautilus-v0.18.3-checksums.txt`, and `release-notes-v0.18.3.md`.
- Checksum verification passed, and the release-notes source archive checksum matched `46de6c046117c208e147a317d15b7295fe4e61ffe59f079065f39acb4e7051d6`.

## Distinct-Channel Verification

- `npm run release:smoke-install:current -- --skip-update --json` passed.
- The install-sh smoke installed `https://github.com/corca-ai/cautilus/releases/download/v0.18.3/cautilus_0.18.3_linux_x64.tar.gz`.
- The installed wrapper returned `0.18.3` for `--version`.
- `cautilus version --verbose` reported `current.version` as `0.18.3`, `installKind` as `install_sh_binary`, and the installed binary path under the smoke workdir.

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

- Public release check: passed in GitHub Actions and passed locally.
- Install readback: passed through `npm run release:smoke-install:current -- --skip-update --json`.

## Install Refresh

- Post-publish install refresh status: passed.
- Full install/update smoke after public release remains available for broader channel validation: `npm run release:smoke-install -- --channel install_sh --version v0.18.3`.

## User Update Steps

- Operators with an existing install refresh the binary via the install-sh channel: re-run `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
- Claude Code and Codex plugin consumers pick up the Cautilus Agent refresh via `charness update` or by re-running `cautilus init` in the host repo.
