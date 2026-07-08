# Release Critique

Date: 2026-07-09

## Execution

Fresh-eye release critique ran through subagent `019f43eb-8213-70d0-a298-376f0da2a6e0`.

## Fresh-Eye Satisfaction

parent-delegated

## Packet Consumed

n/a — release critique used the current diff, release adapter, release docs, and active goal artifact directly.

## Target

`release-critique`

## Release Scope

Version: `0.18.3`.
Tag: `v0.18.3`.
Consumer-facing change: patch release for release-readiness probe repair, aligning quality startup probes with current registry-backed `doctor` and `discover` command surfaces.

## Surface-Lock Inventory

- `.agents/quality-adapter.yaml` startup probes.
- `.agents/skills/cautilus-agent/SKILL.md` local Cautilus Agent guidance.
- `skills/cautilus-agent/SKILL.md` source Cautilus Agent guidance.
- `plugins/cautilus/skills/cautilus-agent/SKILL.md` packaged Cautilus Agent guidance.
- Version metadata rewritten by `npm run release:prepare -- 0.18.3`.
- `charness-artifacts/release/latest.md` target-specific release narrative.

## Findings

### Act Before Ship

- `v0.18.3` release surface was not prepared when critique ran.
  Disposition: fixed by running `npm run release:prepare -- 0.18.3`; initial claim freshness failure was resolved with `npm run claims:refresh:all`, then prepare passed.
- Worktree was not clean when critique ran because the active goal artifact was untracked.
  Disposition: fixed by committing `charness-artifacts/goals/2026-07-09-whole-repo-sweep-release.md` with the repair slice.
- `charness-artifacts/release/latest.md` still described `v0.18.2`.
  Disposition: fixed in the release-prep slice by rewriting it for `v0.18.3` before publish.

### Bundle Anyway

- The release scope should not claim a new Cautilus Agent command-discovery behavior unless the actual committed diff includes that surface.
  Disposition: release scope is narrowed to release-readiness probe repair and any committed Cautilus Agent guidance alignment.

### Over-Worry

- No configured release-time real-host proof trigger matched this slice.
  This does not block the patch release.

### Valid But Defer

- Full native macOS and Linux install smoke matrix remains available after publication.
  The normal release path relies on the tag-triggered workflow and post-publish install readback unless the operator asks for broader manual channel validation.

## Operator Action Required

- Commit release metadata, claim refresh artifacts, release narrative, and critique proof before publish.
- Re-run target-specific gates after the version bump.
- Run publish through `npm run release:publish -- --version 0.18.3 --json`.

## Upgrade Path

Operators with an existing install refresh the binary via the install-sh channel by re-running:

```bash
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
```

Claude Code and Codex plugin consumers pick up the Cautilus Agent refresh via `charness update` or by re-running `cautilus init` in the host repo.

## Deliberately Not Doing

- No compatibility alias is being restored for removed top-level `commands`, `scenarios`, or `healthcheck` invocations in this patch.
  The current documented surfaces are `doctor commands`, `discover scenarios`, and `doctor binary`.
- No broad app/live proof is being claimed for this release-readiness repair.

## Next Move

Proceed after release prepare, target-specific verification, dry-run publish, clean worktree, and committed release narrative all pass.
