# Recent Retro Lessons

## Current Focus

- This session swept Cautilus for release-blocking bugs, repaired stale release-readiness probes and Cautilus Agent command guidance, prepared `v0.18.3`, pushed the branch and tag, and verified the public release. (source: `charness-artifacts/retro/2026-07-09-session-retro.md`)
- Release publish triggered a configured automatic session retro for `v0.18.1`. (source: `charness-artifacts/retro/2026-07-08-v0-18-1-release-auto-retro.md`)

## Repeat Traps

- Without the release-helper persistence step, a successful publish can leave a clean tree and make the retro trigger appear unneeded after the fact. (source: `charness-artifacts/retro/2026-07-08-v0-18-1-release-auto-retro.md`; sources: 2)
- The answer to whether the release was done briefly mixed two states: published binary release was done, but post-release audit hardening was still uncommitted. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- The public release verifier checked asset presence and checksum structure but did not reject unverifiable source-tree delegation. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- The release process had to run full gates multiple times because the post-release audit fix landed after publication. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)

## Next-Time Checklist

- Release helper auto-persisted this bounded retro trigger closeout; no additional follow-up is needed for this trigger instance. (source: `charness-artifacts/retro/2026-07-08-v0-18-1-release-auto-retro.md`; sources: 2)
- applied: final release proof and this retro record the repo-owned release path and post-tag evidence boundary. (source: `charness-artifacts/retro/2026-07-09-session-retro.md`)
- applied: for release-shaped sweeps, run startup probes and release publisher dry-run before broad narrative edits. (source: `charness-artifacts/retro/2026-07-09-session-retro.md`)
- none — current deterministic gates caught the actual stale probes once the sweep exercised them. (source: `charness-artifacts/retro/2026-07-09-session-retro.md`)

## Selection Policy

- Source: `charness-artifacts/retro/lesson-selection-index.json`
- Slots: current_focus=2, repeat_trap=4, next_improvement=4
- Policy: advisory recency half-life 14 days plus recurrence boost with adaptive alpha.

## Sources

- `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`
- `charness-artifacts/retro/2026-06-22-v0-17-1-release-auto-retro.md`
- `charness-artifacts/retro/2026-07-08-v0-18-1-release-auto-retro.md`
- `charness-artifacts/retro/2026-07-09-session-retro.md`
