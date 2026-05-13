# Recent Retro Lessons

## Current Focus

- This session shipped Cautilus `v0.15.4` for auditable subagent execution proof across Codex and Claude non-interactive backends. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- The session reviewed and rewrote user-facing Cautilus specs through HITL. (source: `charness-artifacts/retro/hitl-terminology-drift.md`)

## Repeat Traps

- The answer to whether the release was done briefly mixed two states: published binary release was done, but post-release audit hardening was still uncommitted. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- The public release verifier checked asset presence and checksum structure but did not reject unverifiable source-tree delegation. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- The release process had to run full gates multiple times because the post-release audit fix landed after publication. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- The release record was updated after the tag, so the initial public release notes pointed to stale tagged source context. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)

## Next-Time Checklist

- Capability: Charness release should add a public-release-notes audit that rejects unverifiable pointers to mutable or stale source-tree records. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- Capability: Charness release should expose release-state labels in closeout: local prepared, tag pushed, workflow completed, public verified, audit narrative committed. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- Memory: keep the stale release-note pointer debug artifact current so future release work starts from this failure mode. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- Workflow: before `release:publish`, require the release record or public release notes to be self-contained for the target version. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)

## Selection Policy

- Source: `charness-artifacts/retro/lesson-selection-index.json`
- Slots: current_focus=2, repeat_trap=4, next_improvement=4
- Policy: advisory recency half-life 14 days plus recurrence boost with adaptive alpha.

## Sources

- `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`
- `charness-artifacts/retro/hitl-terminology-drift.md`
