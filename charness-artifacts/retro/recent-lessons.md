# Recent Retro Lessons

## Current Focus

- Release publish triggered a configured automatic session retro for `v0.19.2`. (source: `charness-artifacts/retro/2026-07-11-v0-19-2-release-auto-retro.md`)
- Release publish triggered a configured automatic session retro for `v0.19.3`. (source: `charness-artifacts/retro/2026-07-11-v0-19-3-release-auto-retro.md`)

## Repeat Traps

- Without the release-helper persistence step, a successful publish can leave a clean tree and make the retro trigger appear unneeded after the fact. (source: `charness-artifacts/retro/2026-07-11-v0-19-3-release-auto-retro.md`; sources: 4)
- The answer to whether the release was done briefly mixed two states: published binary release was done, but post-release audit hardening was still uncommitted. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- The public release verifier checked asset presence and checksum structure but did not reject unverifiable source-tree delegation. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- The release process had to run full gates multiple times because the post-release audit fix landed after publication. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)

## Next-Time Checklist

- Release helper auto-persisted this bounded retro trigger closeout; no additional follow-up is needed for this trigger instance. (source: `charness-artifacts/retro/2026-07-11-v0-19-3-release-auto-retro.md`; sources: 4)
- applied — code-point semantics and malformed JavaScript-string handling now have deterministic cross-language tests. (source: `charness-artifacts/retro/2026-07-11-second-autonomous-repo-improvement-retro.md`)
- applied — `docs/maintainers/releasing.md` now preserves an early 404, waits for both workflow jobs, reruns the same install readback, and forbids page-only readiness claims. (source: `charness-artifacts/retro/2026-07-11-third-autonomous-two-hour-improvement-release-retro.md`)
- applied — normal durable quality runs now refresh existing runtime evidence before self-dogfood. (source: `charness-artifacts/retro/2026-07-11-session-retro.md`)

## Selection Policy

- Source: `charness-artifacts/retro/lesson-selection-index.json`
- Slots: current_focus=2, repeat_trap=4, next_improvement=4
- Policy: advisory recency half-life 14 days plus recurrence boost with adaptive alpha.

## Sources

- `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`
- `charness-artifacts/retro/2026-06-22-v0-17-1-release-auto-retro.md`
- `charness-artifacts/retro/2026-07-08-v0-18-1-release-auto-retro.md`
- `charness-artifacts/retro/2026-07-11-second-autonomous-repo-improvement-retro.md`
- `charness-artifacts/retro/2026-07-11-session-retro.md`
- `charness-artifacts/retro/2026-07-11-third-autonomous-two-hour-improvement-release-retro.md`
- `charness-artifacts/retro/2026-07-11-v0-19-2-release-auto-retro.md`
- `charness-artifacts/retro/2026-07-11-v0-19-3-release-auto-retro.md`
