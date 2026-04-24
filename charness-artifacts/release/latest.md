# Release Record
Date: 2026-04-24

## Summary

Released Cautilus `v0.12.3`.

## Release Scope

Maintenance release bundling developer- and operator-facing improvements landed this session. No user-visible CLI, bundled skill, install path, or public API change.

- Durable skill outputs unified under `charness-artifacts/`; `skill-outputs/` tree retired.
- `AGENTS.md` normalized to init-repo's expectations (charness-artifacts repo-state clause, compact Skill Routing, task-completing review scopes).
- Per-file coverage-floor gate wired for Go and Node with a regression check against declared floors.
- Node coverage driver switched from `--experimental-test-coverage` to `c8` after diagnosing non-deterministic LCOV aggregation.
- `scripts/agent-runtime/evaluate-skill.mjs` split into three responsibility-scoped modules, file-level `max-lines` suppression removed.
- `gitleaks` secret scan added to `verify` and `release-artifacts` workflows.
- Quality adapter acknowledges `self-dogfood` as the owning public-skill validation seam so future reviews do not re-surface the missing-policy finding.

## Commits

- `063b7da` ci(release): install gitleaks in release-artifacts workflow
- `f789eb1` fix(coverage): switch node coverage driver from experimental-test-coverage to c8
- `3bd2dd4` chore(coverage): realign floor for build-evidence-input (measurement drift)
- `848ac98` Prepare Cautilus 0.12.3 release
- `37e3a4c` chore(coverage): realign floors after evaluate-skill split
- `987c475` ci(security): use gitleaks canonical go-install path
- `9342da9` feat(security): add gitleaks secret scan to verify
- `70cae68` docs(quality-adapter): acknowledge self-dogfood as public-skill validation seam
- `26989c7` refactor(skill-evaluation): split evaluate-skill.mjs by responsibility
- `2b7a096` ci(coverage): run coverage-floor gate in verify workflow
- `554bced` feat(coverage): add per-file coverage-floor gate
- `a98b606` build(coverage): aggregate per-file coverage across go and node
- `33bc78a` build(coverage): wire node per-file coverage measurement
- `d33ee20` build(coverage): wire go per-file coverage measurement
- `ea6bd07` docs(agents): sync AGENTS.md with init-repo normalization findings
- `3f538ee` chore(artifacts): unify durable skill outputs under charness-artifacts/

## Review

- `init-repo` and `quality` review runs: completed at session start; findings drove the commits above.
- `debug`: investigation of Node coverage non-determinism captured in `charness-artifacts/debug/debug-2026-04-24-node-coverage-nondeterminism.md`.
- Premortem: skipped — this release changed no compatibility expectation, install/update instruction, deletion, or real-host-proof boundary per the release skill body's trigger criteria.
- Delegated bounded review: not run. The session's risks (CI step additions, secret-scan introduction, coverage driver swap) were exercised directly by CI itself on the tag before publish.

## Verification

- `npm run verify` — green locally and on CI for every commit after fix landed.
- `npm run test:coverage && npm run coverage:floor:check` — green on CI.
- `npm run release:publish -- --version 0.12.3 --dry-run --json` — clean.
- `npm run release:publish -- --version 0.12.3 --json` — tag `v0.12.3` pushed (force-moved once after release-artifacts.yml fix).
- GitHub Actions `verify` (`24879702704`): success.
- GitHub Actions `spec-report` (`24879702702`): success.
- GitHub Actions `release-artifacts` (`24879719597`): success, including `verify-public-release`.
- `npm run release:smoke-install -- --channel install_sh --version v0.12.3 --repo corca-ai/cautilus --installer-source local --skip-update --json`: `ok: true`, installed binary reports `cautilus 0.12.3`.

## Public Release

- URL: https://github.com/corca-ai/cautilus/releases/tag/v0.12.3
- Tag: `v0.12.3`
- Head: `063b7da` (tag force-moved from initial `f789eb1` after wiring gitleaks into release-artifacts.yml)
- Assets: source-archive checksum, release notes, and darwin/linux arm64/x64 binary archives with checksum manifest.

## Notes For Next Session

- Related charness issues filed: [#70](https://github.com/corca-ai/charness/issues/70) (bootstrap_adapter defaults + absolute paths), [#71](https://github.com/corca-ai/charness/issues/71) (delegation-clause eyeball gravity).
- Coverage-floor gate is standing. `build-optimize-input.mjs` and friends stayed stable under c8 across 4 runs; floor values are captured from a single measurement, so any new volatile seam should be measured N≥3 times before floor promotion.
- `release-adapter.yaml` is still absent; the release skill used inferred defaults and hit a declared-seam mismatch that had to be reasoned around. A small adapter file recording this repo's real `release:prepare` / `release:publish` / `release:smoke-install` contract would remove that friction on the next release.
