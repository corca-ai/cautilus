# Release Surface Check
Date: 2026-07-16

Released Cautilus `v0.20.0`.

## Release Scope

Minor release (0.19.4 → 0.20.0). Minor rather than patch because one breaking consumer-facing schema rename lands alongside a non-breaking gate/correctness/dead-code/doc bundle.

Breaking change (the reason for the minor bump):

- Renamed the live-target discovery schema `cautilus.workbench_instance_catalog.v1` → `cautilus.live_target_catalog.v1` so the schema matches the public `cautilus discover live-targets` verb and frees the `workbench` name for the master-plan-reserved future GUI. `discover live-targets` now rejects the retired schemaVersion with an actionable rename error naming both schemas. A consumer whose `command_template` (`kind: command` discovery) still prints the old schema must update it to emit the new one.

Non-breaking improvements bundled in:

- Gate integrity: `check-coverage-floor` now fails closed when a floored file drops out of the coverage report (previously silently unenforced while still counted OK).
- Dead-code removal: deleted the orphaned, callerless `internal/runtime/git_hooks.go` and its 0% coverage floor; node scripts own the hook surface.
- Correctness: `CompareVersions` orders SemVer prerelease identifiers per spec 11.4 (numeric identifiers compared numerically, ranked below alphanumeric) instead of one lexical string compare.
- Doc/spec self-consistency: the README `skill-experiment` token now names the real command path, and a stale find-skills retirement narrative in `evaluation.spec.md` was restated in the current tense per the repo's own prose rule.

## Current Version

- previous version: `0.19.4`
- target version: `0.20.0`
- git branch: `main`
- git remote: `origin`

## Verification

- `npm run verify` passed all phases on the prepared tree.
- `npm run test:on-demand` passed (release-prep and self-dogfood workflow tests).
- Parent-delegated `charness:bounded-reviewer` PASS on the breaking-rename slice (no defects).
- A separate parent-delegated release critique reviewed this bundle pre-publish and confirmed the version, schema-rename, and migration surfaces release-ready (all five version manifests agree at `0.20.0`; reject path actionable and tested; no consumer-facing old-schema drift). It flagged one overclaim in an earlier draft of this record — a prematurely past-tense "critique cleared" line — which was corrected here before publish; no code or version blocker was found.
- `npm run critique:surface-packet:check` and `:cli-agent:check` both reported `ready` with no findings.
- `npm run release:claim-freshness` reported the claim packet `fresh`; the claim refresh after the doc source changes was verified not to launder the 47 warn-only evidence bindings (warningCount stayed 47, no proof status flipped).

## Release State

- local release mutation: complete (version synced across package.json, lockfile, Claude marketplace, Claude plugin, Codex plugin)
- branch/tag push: complete (origin/main and tag `v0.20.0` at `d6833bf5`)
- GitHub release record: verified URL `https://github.com/corca-ai/cautilus/releases/tag/v0.20.0`
- public release surface verification: verified
- audit narrative: this durable record, committed with the closeout slice
- first publish attempt note: an earlier attempt fail-safed on the worktree-unchanged guard because a concurrent goal-artifact edit dirtied the tree mid guarded-push; nothing was pushed on that attempt (no tag, origin/main unchanged), and the clean-tree retry pushed the exact reviewed HEAD.

## Public Release Verification

- GitHub Actions `release-artifacts` run `29486505150` completed successfully; its in-workflow `verify-public-release` job passed (12s).
- `node scripts/release/verify-public-release.mjs --version v0.20.0` returned `status: ok`.
- Distinct-channel verdict: HTTP `200` on the release URL via `https` (a channel distinct from `gh release view`).
- Seven assets uploaded: four platform archives, the binary checksum manifest (`cautilus-v0.20.0-checksums.txt`), the source checksum (`cautilus-v0.20.0.sha256`), and provenance release notes.
- Install smoke: `npm run release:smoke-install:current -- --skip-update` returned `ok: true`; the install.sh-installed binary returned `0.20.0`.
- GitHub attestation verification succeeded for the Linux x64 archive (sha256 `691171368aee757582a0c5c90c944c32174a41c5e2e0381510ee06819ae696f1`), binding it to the release tag workflow and commit.

## Non-Claims

- No public-proof state is claimed until the publish slice records the real workflow, asset, and install readback evidence below.
- The GitHub release-notes asset is provenance-oriented and is not claimed to carry this operator narrative.
- No native macOS execution proof was run; Linux/current-host install proof does not substitute for it.
- No provider-backed or live evaluator behavior was exercised for this release.
- The SemVer prerelease fix is a genuine correctness repair but is dormant today: every shipped tag is a plain version, so no prerelease has yet entered the update path.
- Several internal (non-shipped) `find-skills` references remain frozen by the retirement contract's FD5/AC4.

## Breaking-Change Migration

- Adapters that discover live targets via `instance_discovery: { kind: command }` must update their `command_template` output to print `schemaVersion: cautilus.live_target_catalog.v1`. Emitting the retired `cautilus.workbench_instance_catalog.v1` now fails with an actionable rename error. Adapters using `kind: explicit` need no change; Cautilus builds that catalog internally with the new schema.

## User Update Steps

- Binary operators update by re-running `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`, and roll back by setting `CAUTILUS_VERSION=v0.19.4` when running that installer, then checking `cautilus --version`.
- Cautilus Agent SKILL content did not change in this release; Agent-only consumers do not need `cautilus init` for it, but consumers with a live-target `command_template` should apply the migration note above.
