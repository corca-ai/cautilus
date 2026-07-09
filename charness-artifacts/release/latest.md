# Release Surface Check
Date: 2026-07-09

Released Cautilus `v0.19.1`.

## Release Scope

`v0.19.1` is a patch release for proof, claim, and review diagnostics plus release-drift hardening after the `v0.19.0` CLI stdout release.
Operators get clearer claim-review drop summaries, stronger generated drift checks, tighter proof marker validation, more reliable starter and consumer-onboarding smoke coverage, and a release packet check that keeps the binary and Cautilus Agent surfaces aligned.
The release does not change the `v0.19.0` structured stdout contract, the install surface, or the Cautilus Agent behavior contract.

## Current Version

- previous version: `0.19.0`
- target version: `0.19.1`
- target tag: `v0.19.1`
- git branch: `main`
- git remote: `origin`

## Verification

- Release preparation: `npm run release:prepare -- 0.19.1` passed.
- Claim freshness: `npm run release:claim-freshness` passed during release preparation.
- Release critique: `charness-artifacts/critique/2026-07-09-v0-19-1-release-critique.md`.
- Critique packet: `charness-artifacts/critique/2026-07-09-143053-packet.md`.
- Release packet check: `npm run critique:surface-packet:check` passed before release preparation.
- Requested review gate: `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.63.0/skills/release/scripts/check_requested_review_gate.py --repo-root . --skip-commands --json` returned `status: ok`.
- Real-host proof gate: no configured release-time real-host proof trigger matched this slice.
- Full verification: `npm run verify` passed all phases after `0.19.1` release preparation.
- Hook verification: `npm run hooks:check` passed after `0.19.1` release preparation.
- Generated drift check: `npm run generated:drift:check` passed after `0.19.1` release preparation.
- Full history secret proof: `npm run security:secrets:history` passed after `0.19.1` release preparation.
- Publisher policy: `npm run release:publisher-policy:check` passed after `0.19.1` release preparation.

## Release State

- local release mutation: prepared and committed at `51f3137f27ed62fa3c2a63e5b9ef4b9174485636`.
- branch/tag push: published; at publish time `origin/main` and `refs/tags/v0.19.1` both pointed at `51f3137f27ed62fa3c2a63e5b9ef4b9174485636`.
- release tag commit: `refs/tags/v0.19.1` remains fixed at `51f3137f27ed62fa3c2a63e5b9ef4b9174485636`.
- GitHub release record: published by `release-artifacts` workflow run `29026486780`.
- public release surface verification: passed in the workflow and passed locally through `scripts/release/verify-public-release.mjs`.
- requested review commands: passed in dry-run and inside the publish helper before branch/tag push.
- post-publish install readback: passed through `node scripts/release/run-install-smoke-current.mjs --skip-update --json`.

## Public Release Verification

- GitHub Actions: `release-artifacts` run `29026486780` completed successfully.
- Workflow jobs: `release-artifacts` passed in 4m16s and `verify-public-release` passed in 9s.
- Public release URL: `https://github.com/corca-ai/cautilus/releases/tag/v0.19.1`.
- GitHub release record: non-draft, non-prerelease, published at `2026-07-09T14:46:53Z`.
- Local verifier: `node ./scripts/release/verify-public-release.mjs --version v0.19.1 --json --retry-attempts 5 --retry-delay-ms 10000` passed on the first attempt.
- Expected assets were present: `cautilus-v0.19.1.sha256`, four platform tarballs, `cautilus-v0.19.1-checksums.txt`, and `release-notes-v0.19.1.md`.
- Checksum verification passed, and the release-notes source archive checksum matched `6f5607d37c288defcb5a2c08fd086aa7476abec861b353c73acf63fdfce22d45`.

## Distinct-Channel Verification

- `node scripts/release/run-install-smoke-current.mjs --skip-update --json` passed.
- The install-sh smoke installed `https://github.com/corca-ai/cautilus/releases/download/v0.19.1/cautilus_0.19.1_linux_x64.tar.gz`.
- The installed wrapper returned `0.19.1` for `--version`.
- `cautilus version --verbose` reported `current.version` as `0.19.1` and `installKind` as `install_sh_binary`.

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

- Fresh-eye release critique: `charness-artifacts/critique/2026-07-09-v0-19-1-release-critique.md`.
- Packet consumed by reviewers: `charness-artifacts/critique/2026-07-09-143053-packet.md`.
- Counterweight disposition: use repo-owned release scripts, commit generated critique packets, keep release notes operator-facing, and avoid implying an Agent behavior migration.

## Requested Review Gate

- Requested-review gate status: passed in read-only preflight.
- Configuration status: configured.
- Policy: publish helper must run configured requested review commands before branch or tag push.

## Post-Publish Proof

- Public release check: passed in GitHub Actions and passed locally.
- Install readback: passed through `node scripts/release/run-install-smoke-current.mjs --skip-update --json`.

## Install Refresh

- Post-publish install refresh status: passed.
- Full install/update smoke after public release remains available for broader channel validation: `npm run release:smoke-install -- --channel install_sh --version v0.19.1`.

## User Update Steps

- Operators with an existing install refresh the binary via the install-sh channel: re-run `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
- Claude Code and Codex plugin consumers only need to run `charness update` or re-run `cautilus init` when they want to refresh repo-local Cautilus Agent surfaces in a host repo.
- This patch does not require an Agent behavior migration.
