# Release Record
Date: 2026-05-11

## Summary

Released Cautilus `v0.15.2`.

## Release Scope

Minor release for the maintained skill-clone experiment comparison surface.
The release makes `cautilus eval skill-experiment compare` visible as an operator-facing post-run comparison command and keeps the Cautilus Agent boundary aligned with that stable surface.
Two failed tag attempts, `v0.15.0` and `v0.15.1`, remain immutable release attempts without public releases.

## Commits

- `8426b5b` Prepare Cautilus 0.15.0 release
- `a30e823` Prepare Cautilus 0.15.1 release
- `374b363` Stabilize claim refresh plan report selection
- `9f1a0c4` Prepare Cautilus 0.15.2 release

## Review

- Premortem: delegated via release critique subagents.
  Fresh-eye satisfaction: parent-delegated.
- Act before ship:
  - The first release attempt under-disclosed the new skill-experiment compare surface in the README, packaged Cautilus Agent, and operator acceptance record.
    Resolved before the first tag by documenting the compare command as a stable post-run eval surface and adding a smoke row.
  - Release adapter warnings hid bundled-skill and CLI/Agent proof expectations.
    Resolved by declaring the bundled-skill product surface, skill paths, command docs, and probe globs in `.agents/release-adapter.yaml`.
  - Release notes alone were too thin to carry operator verification context.
    Resolved by keeping the workflow release-note pointer to `charness-artifacts/release/latest.md`.
- Bundle anyway:
  - The command is additive and does not break existing `eval test` or `eval evaluate` behavior.
  - The release includes a narrow CI determinism repair needed to make tag workflows reproducible.
- Valid but defer:
  - A broader docs information-architecture rewrite can wait.
  - Failed historical tags should stay in place unless a maintainer explicitly decides otherwise.

## Debug Notes

- `v0.15.0` failed during `npm run verify` because GitHub Actions shallow checkout did not include enough history for claim freshness comparison.
  Resolved by setting `fetch-depth: 0` in release and branch verify workflows.
- `v0.15.1` failed during `npm run verify` because claim status report rendering selected the displayed refresh plan summary by filesystem `mtimeMs`.
  Resolved by selecting refresh plans by current-packet match, then `up-to-date` status, then deterministic path order.
- The current incident is recorded in [charness-artifacts/debug/latest.md](../debug/latest.md).

## Verification

- `node --test scripts/agent-runtime/render-claim-status-report.test.mjs`: green, including the mtime-free refresh-plan summary regression test.
- Clean clone reproduction after `374b363`: `npm run claims:evidence-state:check` and `npm run claims:status-report:check` both passed.
- `npm run verify` before the final version bump: green.
- `npm run release:prepare -- 0.15.2`: surfaces synced, package.json, package-lock.json, marketplace.json, plugin.json (Claude + Codex) advanced to 0.15.2.
- `./bin/cautilus --version`: `0.15.2`.
- `./bin/cautilus version --verbose`: current version `0.15.2`.
- `npm run hooks:check`: ready.
- `npm run generated:drift:check`: clean.
- `npm run verify` after the final version bump: green.
- GitHub Actions run `25649021254` for `v0.15.0`: failed before asset publication at claim evidence state freshness.
- GitHub Actions run `25649251200` for `v0.15.1`: failed before asset publication at claim status report drift.
- GitHub Actions run `25649590613` for `v0.15.2`: `release-artifacts` and `verify-public-release` succeeded.
- `node scripts/release/verify-public-release.mjs --version v0.15.2 --json`: ok, all expected assets present and checksum manifest complete.
- Pinned installer smoke: `npm run release:smoke-install -- --channel install_sh --version v0.15.2 --repo corca-ai/cautilus --installer-source local --skip-update --json`: ok, installed `0.15.2`.
- Unpinned latest installer smoke: `npm run release:smoke-install -- --channel install_sh --repo corca-ai/cautilus --installer-source local --skip-update --json`: ok, `releases/latest` resolved to `v0.15.2` and installed `0.15.2`.

## Public Release

- Failed tags without public release: `v0.15.0`, `v0.15.1`.
- Released tag: `v0.15.2`.
- URL: `https://github.com/corca-ai/cautilus/releases/tag/v0.15.2`.
- Published at: `2026-05-11T04:06:01Z`.
- Assets:
  - `cautilus_0.15.2_darwin_arm64.tar.gz`
  - `cautilus_0.15.2_darwin_x64.tar.gz`
  - `cautilus_0.15.2_linux_arm64.tar.gz`
  - `cautilus_0.15.2_linux_x64.tar.gz`
  - `cautilus-v0.15.2-checksums.txt`
  - `cautilus-v0.15.2.sha256`
  - `release-notes-v0.15.2.md`

## Operator Update Steps

1. Refresh the binary via the install-sh channel:
   `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
   Operators who previously installed via Homebrew should first run `brew uninstall cautilus` and clear shell command caches to avoid stale PATH shadows.
2. Claude Code and Codex plugin consumers pick up the bundled Cautilus Agent refresh via `charness update` or by re-running `cautilus install` in the host repo.
3. Host repos using skill behavior experiments can now keep baseline and variant outputs in host-owned workspaces, then run `cautilus eval skill-experiment compare` for the reviewable promotion report.

## Open Risks

- `v0.15.0` and `v0.15.1` remain failed tags without public releases.
  Do not move or delete them without an explicit maintainer decision.
- The release intentionally adds comparison and reporting support for skill-clone experiments, not a full product-owned skill sandbox runtime.
