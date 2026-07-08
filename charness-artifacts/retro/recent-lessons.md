# Recent Retro Lessons

## Current Focus

- This retro reviews the SkillOpt absorption documentation goal closeout. (source: `charness-artifacts/retro/2026-07-08-session-retro.md`)
- The improved retro adapter was rerun against the release hardening paths after adding `release-packaging` to `auto_session_trigger_surfaces`. (source: `charness-artifacts/retro/session-release-adapter-rerun.md`)

## Repeat Traps

- Without the release-helper persistence step, a successful publish can leave a clean tree and make the retro trigger appear unneeded after the fact. (source: `charness-artifacts/retro/2026-06-22-v0-17-1-release-auto-retro.md`)
- The answer to whether the release was done briefly mixed two states: published binary release was done, but post-release audit hardening was still uncommitted. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- The public release verifier checked asset presence and checksum structure but did not reject unverifiable source-tree delegation. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- The release process had to run full gates multiple times because the post-release audit fix landed after publication. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)

## Next-Time Checklist

- applied: goal closeout now records claim refresh as a separate proof step and names generated packet freshness in final verification. (source: `charness-artifacts/retro/2026-07-08-session-retro.md`)
- applied: the SkillOpt absorption contract now distinguishes local research context from public durable evidence. (source: `charness-artifacts/retro/2026-07-08-session-retro.md`)
- applied: this retro captures the claim-refresh and local-evidence wording traps for future documentation-design goals. (source: `charness-artifacts/retro/2026-07-08-session-retro.md`)
- Add parity tests when two audit surfaces claim to reject the same class of stale or mutable pointer. (source: `charness-artifacts/retro/session-release-verifier-critique-miss.md`)

## Selection Policy

- Source: `charness-artifacts/retro/lesson-selection-index.json`
- Slots: current_focus=2, repeat_trap=4, next_improvement=4
- Policy: advisory recency half-life 14 days plus recurrence boost with adaptive alpha.

## Sources

- `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`
- `charness-artifacts/retro/2026-06-22-v0-17-1-release-auto-retro.md`
- `charness-artifacts/retro/2026-07-08-session-retro.md`
- `charness-artifacts/retro/session-release-adapter-rerun.md`
- `charness-artifacts/retro/session-release-verifier-critique-miss.md`
