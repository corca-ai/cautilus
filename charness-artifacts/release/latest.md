# Release Record
Date: 2026-04-24

## Summary

Released Cautilus `v0.12.0`.

## Release Scope

- Runtime fingerprints are normalized into `telemetry.runtimeFingerprint`.
- Reports can compare explicit prior evidence through `--prior-evidence-file` and emit `runtimeContext`.
- Adapter-owned pinned runtime policy can block mismatched runtime evidence.
- Optimize proposals carry runtime-change revision reasons and passing simplification context.
- Optimize search prefers shorter targets after behavioral ties and records `targetSizeDelta`.

## Commits

- `de6169f` Implement runtime fingerprint optimization flow
- `c553cbe` Prepare Cautilus 0.12.0 release

## Review

- Local review: completed against the runtime-fingerprint contract, report/skill/instruction-surface packet flow, optimize proposal flow, and release surface.
- `cautilus review variants`: attempted, but unavailable because the root adapter does not define `executor_variants`.
- Delegated review: not run in this host turn because subagent delegation was not explicitly requested for the release review.

## Verification

- `go test ./internal/runtime`
- `go test ./internal/app`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.10/scripts/validate_debug_artifact.py --repo-root .`
- `npm run verify`
- `npm run hooks:check`
- `./bin/cautilus doctor --repo-root .`
- `npm run release:publish -- --version 0.12.0 --dry-run --json`
- `npm run release:publish -- --version 0.12.0 --json`
- GitHub Actions `verify`: success
- GitHub Actions `spec-report`: success
- GitHub Actions `release-artifacts`: success, including `verify-public-release`
- `node ./scripts/release/verify-public-release.mjs --version v0.12.0 --repo corca-ai/cautilus --retry-attempts 3`
- `npm run release:smoke-install -- --channel install_sh --version v0.12.0 --repo corca-ai/cautilus --installer-source local --skip-update --json`

## Public Release

- URL: https://github.com/corca-ai/cautilus/releases/tag/v0.12.0
- Tag: `v0.12.0`
- Head: `c553cbeac10cef59bfb38496addff84bbfa576ef`
- Assets: checksum manifest, release notes, and darwin/linux arm64/x64 binary archives.
