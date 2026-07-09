# Release Critique
Date: 2026-07-09

## Execution

Fresh-eye release critique ran through parent-delegated subagents `019f474a-4eab-7293-9f26-09a6317c5f1f`, `019f474a-8503-7703-87f0-33b25fd485e4`, and `019f474a-ac53-7633-952d-e4abb8945c4b`.
Counterweight triage ran through parent-delegated subagent `019f474d-c0d9-7251-a129-bf107f48a4c2`.

## Fresh-Eye Satisfaction

parent-delegated

## Packet Consumed

`charness-artifacts/critique/2026-07-09-143053-packet.md`

## Target

`release-critique`

## Release Scope

Version: `0.19.1`.
Tag: `v0.19.1`.
Consumer-facing change: patch release for proof, claim, and review diagnostics plus release-drift hardening after the `v0.19.0` CLI stdout release.

## Surface-Lock Inventory

- Version metadata rewritten by `npm run release:prepare -- 0.19.1`.
- Release packaging packet and CLI agent product packet readiness checks.
- Claim evidence and status artifacts under `.cautilus/claims/`.
- Review-drop summary artifacts under `.cautilus/claims/review-drops-summary.*`.
- Claim review projection and drop summary runtime scripts under `scripts/agent-runtime/`.
- Generated drift and proof-boundary validators under `scripts/`.
- CLI packet inspection selector hints under `internal/runtime/packet_inspection.go`.
- Consumer starter, onboarding, and guide documentation touched by the autonomous improvement cycles.
- Release narrative at `charness-artifacts/release/latest.md`.

## Findings

### Act Before Ship

- The generic Charness release publisher must not mutate this repo.
  Disposition: fixed by using the repo-owned release path: `npm run release:prepare -- 0.19.1` and `npm run release:publish -- --version 0.19.1`.
- The generated critique packet artifacts would break the publish helper's clean-worktree gate if left untracked.
  Disposition: fixed by committing `charness-artifacts/critique/2026-07-09-143053-packet.{json,md}` with this release evidence before publish.

### Bundle Anyway

- The release story should be an operator-facing patch narrative rather than a raw commit list.
  Disposition: the release narrative frames `v0.19.1` as proof, claim, review, and release-drift hardening.
- Update instructions should not imply this patch changed Cautilus Agent behavior.
  Disposition: the release narrative treats the binary refresh as the operator action and marks repo-local Agent regeneration as optional for consumers who want to refresh checked-in local surfaces.

### Over-Worry

- Forcing a minor bump was rejected.
  The change set is additive diagnostics and hardening rather than a new default behavior comparable to `v0.19.0`.
- Manifest drift and tag collision were not promoted beyond the repo-owned publish gates.
  The release surface packet is ready, and the publish helper checks version surface drift and tag availability.
- A stale local `updateCheck` signal in a source checkout is not release-blocking.
  The release smoke verifies installed binary version and install kind after publication.

### Valid But Defer

- Review-drop actions could be lifted earlier in the claim status report.
  This is useful UX work, but it is not a patch-release blocker.
- `doctor packet inspect --help` could show concrete selector examples.
  The selector hints exist and can be made more explicit in a later UX slice.

## Counterweight Pass

- Act before ship: use only repo-owned release scripts and commit the critique packet artifacts before publish.
- Bundle anyway: write the release narrative as operator-facing highlights and scope update instructions to the binary refresh.
- Over-worry: minor bump pressure, speculative manifest drift, tag collision, and local update-check noise are covered by normal gates.
- Valid but defer: review-drop action placement and packet selector help can wait for a focused UX pass.

## Structured Findings

- F1 | bin: act-before-ship | evidence: strong | ref: docs/maintainers/release-boundary.md:57 | action: fix | note: release must use repo-owned prepare and publish scripts, not generic Charness mutation scripts
- F2 | bin: act-before-ship | evidence: strong | ref: scripts/release/publish-release.mjs:140; git status | action: fix | note: untracked critique packet artifacts would fail clean-worktree publish
- F3 | bin: bundle-anyway | evidence: moderate | ref: charness-artifacts/release/latest.md; docs/maintainers/release-boundary.md:62 | action: fix | note: release narrative should use operator-facing highlights
- F4 | bin: bundle-anyway | evidence: moderate | ref: charness-artifacts/release/latest.md:100; charness-artifacts/critique/2026-07-09-143053-packet.md | action: fix | note: update note should separate binary refresh from optional repo-local Agent regeneration
- F5 | bin: valid-but-defer | evidence: weak | ref: UX reviewer finding | action: defer | note: review-drop placement and packet selector help are useful later, not patch-release blockers
- F6 | bin: over-worry | evidence: weak | ref: angle reviewers over-worry list | action: document | note: minor bump pressure, manifest drift, tag collision, and stale local updateCheck lack current blocking evidence

## Reviewer Tier Evidence

- Requested tier: high-leverage.
- Requested spawn fields: host defaulted; no explicit model override was sent.
- Host exposure state: host-defaulted
- Application state: subagent ids returned by the host spawn surface and completed with parent-delegated reviews.

## Operator Action Required

- Commit the release metadata, release critique proof, generated critique packet, and target-specific release narrative.
- Run the repo-owned dry-run publish helper after the release preparation commit.
- Publish through `npm run release:publish -- --version 0.19.1 --json`.
- Wait for the tag-triggered `release-artifacts` workflow and public release verification.
- Run the post-publish install readback for the published version.

## Upgrade Path

Operators with an existing install refresh the binary via the install-sh channel by re-running:

```bash
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
```

Claude Code and Codex plugin consumers only need to re-run `charness update` or `cautilus init` when they want to refresh repo-local Cautilus Agent surfaces in their host repo.
This patch does not require an Agent behavior migration.

## Deliberately Not Doing

- No generic Charness release publisher is used for mutation.
- No minor version bump is forced.
- No follow-up UX work for review-drop action placement or packet selector examples is bundled into this release.

## Next Move

Proceed after release preparation, target-specific verification, dry-run publish, clean worktree, and committed release narrative all pass.

## Boundary Ownership

- Producer: release helper and release operator artifacts.
- Consumer: Cautilus operators installing from tagged GitHub releases.
- Owning surface: release-packaging.
- Verdict: owned-correctly
