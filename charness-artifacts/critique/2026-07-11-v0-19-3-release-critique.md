# v0.19.3 Release Critique
Date: 2026-07-11

## Decision Under Review

Publish the accumulated compatible correctness, diagnostic, and maintainer-test improvements as patch release `v0.19.3` after one synchronized preparation and verification sequence.

## Release Scope

Installed binaries receive strict scenario-state validation and truthful prune, Agent overwrite, capture, and command-startup failures.
Source-checkout workflows additionally receive fail-closed deployment-evidence parsing and one-line diagnostics.
Maintainers receive isolated parallel coverage orchestration; the packaged Cautilus Agent behavior contract does not change.

## Surface-Lock Inventory

- Five versioned package and plugin manifests plus packaged Agent-tree parity.
- Go binary scenario proposal/conversation review and command failure behavior.
- Source-checkout deployment-evidence executables.
- Maintainer `test:coverage` and `test:coverage:spec` commands and floors.
- Four platform archives, checksum manifests, provenance notes, attestations, public release, installer, and update readback.
- Target-specific release, quality, goal, retro, and handoff artifacts.

## Failure Angles

- Gawande operational angle: version/narrative preparation, clean committed state, post-prepare gates, workflow/assets/install ordering, and one attestation verification are concrete release steps.
- Minto/Raskin reader angle: binary, source-checkout, maintainer, and unchanged Agent audiences need separate scope, recovery, update, rollback, and non-claim wording.
- Known race angle: release-page visibility can precede asset readiness, so tag or HTTP visibility cannot close public proof.
- Policy boundary angle: native macOS proof and public-notes redesign are real gaps but not adapter-triggered patch blockers.

## Counterweight Pass

- Act before ship: prepare `0.19.3`, author audience-accurate recovery copy, commit every in-scope artifact, and rerun broad/requested/fresh-checkout/dry-run gates on the exact tree.
- Act before close: wait for release workflows and all assets/checksums, retry install readback after readiness, and verify one published binary attestation.
- Bundle anyway: include binary/source-checkout/Agent-specific update and rollback instructions.
- Valid but defer: record native macOS as unverified under the current adapter and keep the GitHub notes asset explicitly provenance-only; reconcile policy and public narrative in separate slices.
- Over-worry: no provider eval, minor bump, asset-matrix redesign, Agent refresh requirement, or global performance percentage is justified by this delta.

## Operator Action Required

1. Run the repo-owned preparation helper for `0.19.3`, write the target release record, and commit synchronized manifests and critique evidence.
2. Run pre-push verify, hooks, on-demand tests, requested-review gates, fresh-checkout probes, and publish dry-run after preparation.
3. Publish only the clean release commit, then wait for workflow, asset, checksum, verifier, install/update, and attestation proof before closure.

## Upgrade Path

- Binary update: rerun the standard `install.sh` path, then read back `cautilus --version` and `version --verbose`.
- Binary rollback: rerun the installer with `CAUTILUS_VERSION=v0.19.2` and read back the version.
- Source-checkout update or rollback: move the checkout to `v0.19.3` or the prior tag.
- Agent/plugin users: no behavior migration is required; packaged parity is verified but an Agent-only refresh is not required for these code changes.

## Deliberately Not Doing

- No packet schema-version bump: valid packets require no migration, while previously tolerated malformed registry/coverage values now fail with indexed recovery guidance.
- No public release-notes pipeline redesign: the attached notes asset remains checksum/asset provenance, while the checked-in release record owns the operator story.
- No native macOS claim: the current adapter did not trigger a real-host matrix, so Linux/current-host proof does not imply macOS execution.
- No global speed claim: local timings show order/cache variability and cover only focused coverage commands.

## Structured Findings

- F1 | bin: act-before-ship | evidence: strong | ref: package.json:4 | action: fix | note: prepare and synchronize target version 0.19.3
- F2 | bin: act-before-ship | evidence: strong | ref: charness-artifacts/release/latest.md | action: fix | note: author audience-separated scope recovery and non-claims
- F3 | bin: act-before-ship | evidence: strong | ref: docs/maintainers/releasing.md:40 | action: fix | note: rerun exact-tree gates after preparation
- F4 | bin: act-before-ship | evidence: strong | ref: docs/maintainers/releasing.md:74 | action: fix | note: wait for workflow assets checksums and final install readback
- F5 | bin: bundle-anyway | evidence: strong | ref: docs/maintainers/releasing.md:139 | action: fix | note: verify one published binary attestation
- F6 | bin: bundle-anyway | evidence: strong | ref: install.sh:7 | action: fix | note: include audience-specific update and v0.19.2 rollback
- F7 | bin: valid-but-defer | evidence: contested | ref: .agents/release-adapter.yaml | action: document | note: record native macOS proof as unverified under current adapter
- F8 | bin: valid-but-defer | evidence: strong | ref: .github/workflows/release-artifacts.yml:55 | action: document | note: keep public notes asset provenance-only and defer redesign
- F9 | bin: over-worry | evidence: strong | ref: charness-artifacts/goals/2026-07-11-fifth-autonomous-two-hour-improvement-release.md | action: defer | note: reject provider eval minor bump Agent migration and global speed claims

## Reviewer Tier Evidence

- Requested tier: high-leverage for release angles and counterweight.
- Requested spawn fields: existing parent-delegated reviewers were reused; no model/provider override fields were exposed by follow-up dispatch.
- Host exposure state: metadata-hidden
- Application state: host accepted all three reviewer turns; provider application metadata was not exposed.

## Fresh-Eye Satisfaction

parent-delegated — two distinct release angles and one separate counterweight ran read-only, and rail-1 verification reported no worktree, index, or HEAD drift after each review set.

## Boundary Ownership

- Producer: repo-owned release preparation and publish helpers produce synchronized metadata and release evidence.
- Consumer: public GitHub release, installer, and operator readbacks determine release visibility and usability.
- Owning surface: release adapter, helper scripts, and target-specific release record.
- Verdict: owned-correctly

Packet Consumed: `charness-artifacts/critique/2026-07-11-133548-packet.md`
