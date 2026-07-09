# Release Surface Check
Date: 2026-07-09

Released Cautilus `v0.19.0`.

## Release Scope

`v0.19.0` is a minor release for the CLI structured stdout contract.
Structured command stdout now defaults to YAML for agent readability and token-efficient inspection.
Parser-facing callers can request JSON with `--format json`, and the existing `--json` compatibility alias is preserved.
JSON packet files, `--output` artifacts, active-run artifacts, fixtures, and schemas remain JSON.
The default `cautilus init run` shell export remains unchanged so `eval "$(cautilus init run ...)"` continues to work.

## Current Version

- previous version: `0.18.3`
- target version: `0.19.0`
- target tag: `v0.19.0`
- git branch: `main`
- git remote: `origin`

## Verification

- Implementation commit: `f2b3ccb3` defaulted structured CLI stdout to YAML and preserved JSON parser/file contracts.
- Debug proof: `charness-artifacts/debug/latest.md` and `charness-artifacts/debug/debug-2026-07-09-cli-json-alias-parser-leak.md`.
- Release critique: `charness-artifacts/critique/2026-07-09-v0-19-0-cli-format-release-critique.md`.
- Release preparation: `npm run release:prepare -- 0.19.0` passed.
- Claim freshness: `npm run release:claim-freshness` passed during release preparation.
- Strict alias smoke: `discover claims status --json`, `evaluate claims plan --json`, and `discover claims validate --json` produced parseable JSON after the release critique blocker was fixed.
- Full verification: `npm run verify` passed all phases in 49.31s before release preparation and 43.70s after `0.19.0` release preparation.
- Hook verification: `npm run hooks:check` passed.
- Generated drift check: `npm run generated:drift:check` passed on the implementation commit.
- Full history secret proof: `npm run security:secrets:history` passed.
- Publisher policy: `npm run release:publisher-policy:check` passed.

## Release State

- local release mutation: prepared and committed at `7d6404a040c1ab28d94c474398c63b3ba33b9ab4`.
- branch/tag push: published; at publish time `origin/main` and `refs/tags/v0.19.0` both pointed at `7d6404a040c1ab28d94c474398c63b3ba33b9ab4`.
- release tag commit: `refs/tags/v0.19.0` remains fixed at `7d6404a040c1ab28d94c474398c63b3ba33b9ab4`.
- GitHub release record: published by `release-artifacts` workflow run `28984676895`.
- public release surface verification: passed in the workflow and passed locally through `scripts/release/verify-public-release.mjs`.
- requested review commands: passed locally and passed inside the publish helper before branch/tag push.
- post-publish install readback: passed through `node scripts/release/run-install-smoke-current.mjs --skip-update --json`.

## Public Release Verification

- GitHub Actions: `release-artifacts` run `28984676895` completed successfully.
- Workflow jobs: `release-artifacts` passed in 3m27s and `verify-public-release` passed in 11s.
- Public release URL: `https://github.com/corca-ai/cautilus/releases/tag/v0.19.0`.
- Local verifier: `node ./scripts/release/verify-public-release.mjs --version v0.19.0 --json --retry-attempts 5 --retry-delay-ms 10000` passed on the first attempt.
- Expected assets were present: `cautilus-v0.19.0.sha256`, four platform tarballs, `cautilus-v0.19.0-checksums.txt`, and `release-notes-v0.19.0.md`.
- Checksum verification passed, and the release-notes source archive checksum matched `e5b1e13121365362f86b07590cae891c8b895cc9394f731ab3f87c62941abf35`.

## Distinct-Channel Verification

- `node scripts/release/run-install-smoke-current.mjs --skip-update --json` passed.
- The install-sh smoke installed `https://github.com/corca-ai/cautilus/releases/download/v0.19.0/cautilus_0.19.0_linux_x64.tar.gz`.
- The installed wrapper returned `0.19.0` for `--version`.
- `cautilus version --verbose` reported `current.version` as `0.19.0` and `installKind` as `install_sh_binary`.

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

- Review proof: `charness-artifacts/critique/2026-07-09-v0-19-0-cli-format-release-critique.md`.
- Quality proof: full `npm run verify`, hooks check, generated drift check, debug artifact validation, strict JSON alias smokes, and requested-review commands passed after the fresh-eye blocker was fixed.

## Requested Review Gate

- Requested-review gate status: passed locally.
- Configuration status: configured.
- Policy: publish helper must run configured requested review commands before branch or tag push.

## Post-Publish Proof

- Public release check: passed in GitHub Actions and passed locally.
- Install readback: passed through `node scripts/release/run-install-smoke-current.mjs --skip-update --json`.

## Install Refresh

- Post-publish install refresh status: passed.
- Full install/update smoke after public release remains available for broader channel validation: `npm run release:smoke-install -- --channel install_sh --version v0.19.0`.

## User Update Steps

- Operators with an existing install refresh the binary via the install-sh channel: re-run `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
- Claude Code and Codex plugin consumers pick up the Cautilus Agent refresh via `charness update` or by re-running `cautilus init` in the host repo.
