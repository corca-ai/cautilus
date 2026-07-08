# Recent Retro Lessons

## Current Focus

- Release publish triggered a configured automatic session retro for `v0.18.1`. (source: `charness-artifacts/retro/2026-07-08-v0-18-1-release-auto-retro.md`)
- This retro reviews the SkillOpt absorption documentation goal closeout. (source: `charness-artifacts/retro/2026-07-08-session-retro.md`)

## Repeat Traps

- Without the release-helper persistence step, a successful publish can leave a clean tree and make the retro trigger appear unneeded after the fact. (source: `charness-artifacts/retro/2026-07-08-v0-18-1-release-auto-retro.md`; sources: 2)
- The answer to whether the release was done briefly mixed two states: published binary release was done, but post-release audit hardening was still uncommitted. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- The public release verifier checked asset presence and checksum structure but did not reject unverifiable source-tree delegation. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- The release process had to run full gates multiple times because the post-release audit fix landed after publication. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)

## Next-Time Checklist

- Release helper auto-persisted this bounded retro trigger closeout; no additional follow-up is needed for this trigger instance. (source: `charness-artifacts/retro/2026-07-08-v0-18-1-release-auto-retro.md`; sources: 2)
- applied: goal closeout now records claim refresh as a separate proof step and names generated packet freshness in final verification. (source: `charness-artifacts/retro/2026-07-08-session-retro.md`)
- applied: the SkillOpt absorption contract now distinguishes local research context from public durable evidence. (source: `charness-artifacts/retro/2026-07-08-session-retro.md`)
- applied: this retro captures the claim-refresh and local-evidence wording traps for future documentation-design goals. (source: `charness-artifacts/retro/2026-07-08-session-retro.md`)

## Selection Policy

- Source: `charness-artifacts/retro/lesson-selection-index.json`
- Slots: current_focus=2, repeat_trap=4, next_improvement=4
- Policy: advisory recency half-life 14 days plus recurrence boost with adaptive alpha.

## Sources

- `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`
- `charness-artifacts/retro/2026-06-22-v0-17-1-release-auto-retro.md`
- `charness-artifacts/retro/2026-07-08-session-retro.md`
- `charness-artifacts/retro/2026-07-08-v0-18-1-release-auto-retro.md`
