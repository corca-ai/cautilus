# Release Surface Check
Date: 2026-06-29

Released Cautilus `v0.18.0`.

## Release Scope

Advanced `cautilus` to release `0.18.0` (tag `v0.18.0`) from `0.17.1` through the repo-owned release helper (`scripts/release/prepare-release.mjs` + `publish-release.mjs`).

Everything since tag `v0.17.1` is one coherent feature — the optimizer-untouchable final-acceptance-set read plus the acceptance risk-tier policy:

- read-time enforcement in `cautilus evaluate acceptance` (`--target`/`--waiver`, per-tier reliability floor, block-or-waiver).
- skip-time gate in read-only `cautilus doctor` (`--history-file`, the `acceptanceReadiness` block and `acceptance_read_readiness` check) plus the explicit `cautilus evaluate acceptance waive-skip` recorder.

The product owns only the closed effect vocabulary (`required`/`optional`/`skippable`); risk categories and tier names stay host/adapter-owned, and the acceptance read stays advisory — it never auto-applies or auto-rejects a candidate.

## Current Version

- previous version: `0.17.1`
- target version: `0.18.0`
- git branch: `main`
- git remote: `origin`
- bump rationale: minor — net-new operator commands (`evaluate acceptance`, `evaluate acceptance waive-skip`) and an optional `doctor --history-file` flag, with no breaking change to existing callers.

## Verification

- `npm run verify` passed before publish (all phases).
- `npm run hooks:check` ready; the publish push re-runs `npm run verify` plus generated-artifact drift via the pre-push hook.
- `prepare-release.mjs` bumped all five version surfaces to `0.18.0` with no drift; `npm run skills:sync-packaged` left no diff (the Cautilus Agent skill is unchanged this release).
- `release:claim-freshness` reported `fresh`.
- Go build clean; runtime and app test suites green; new fixture and smoke tests cover the skip-gate (`TestCLIDoctorAcceptanceSkipGate*`, `TestBuildAcceptanceReadiness*`).

## Review Proof

- Release critique: `charness-artifacts/critique/2026-06-29-v0.18.0-release-critique.md` (verdict: ship, 0 act-before-ship, 2 documented post-release follow-ups — Cautilus Agent acceptance-sequence routing and executable-spec coverage).

## Release State

- local release mutation: complete
- branch/tag push: complete (`publish-release.mjs`, both branch and tag verified against the remote)
- GitHub release record: verified URL `https://github.com/corca-ai/cautilus/releases/tag/v0.18.0`
- public release surface verification: verified

## Public Release Verification

- Tag-triggered `release-artifacts.yml` workflow (run `28349446031`) succeeded: built and attested binaries for darwin/linux × arm64/x64, generated checksums and self-contained release notes, created the GitHub release via `softprops/action-gh-release@v3`, and the dependent `verify-public-release` job passed `verify-public-release.mjs`.
- Release is published, not draft, not prerelease; 7 assets attached.

## Distinct-Channel Verification

- Rung-2 distinct-channel verdict: `confirmed` via `https-fetch` (a channel distinct from `gh release view` and from the CI backend that created the release).
- Channel URL: `https://github.com/corca-ai/cautilus/releases/tag/v0.18.0`
- HTTP status: `200`

## Release Helper Note

- The charness `release` skill's generic `publish_release.py`/`bump_version.py` failed first (`KeyError: 'claude'`) because it assumes a `package.json` with `claude.manifest.version`; this repo uses a flat `package.json` and its own canonical helpers under `scripts/release/`. No mutation occurred on that failure. The release was cut through the repo-owned `prepare-release.mjs` + `publish-release.mjs` path. This is a recurring release-helper-shape mismatch worth a retro lesson.

## User Update Steps

- Operators with an existing install refresh the binary via the install-sh channel: re-run `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
- Claude Code and Codex plugin consumers pick up the Cautilus Agent refresh via `charness update` or by re-running `cautilus init` in the host repo.
