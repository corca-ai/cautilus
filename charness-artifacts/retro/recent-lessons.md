# Recent Retro Lessons

## Current Focus

- The user asked for autonomous repository improvement without push. (source: `charness-artifacts/retro/2026-07-11-session-retro.md`)
- The user requested another autonomous Cautilus improvement pass across bugs, test speed, and code quality without push. (source: `charness-artifacts/retro/2026-07-11-second-autonomous-repo-improvement-retro.md`)

## Repeat Traps

- Without the release-helper persistence step, a successful publish can leave a clean tree and make the retro trigger appear unneeded after the fact. (source: `charness-artifacts/retro/2026-07-08-v0-18-1-release-auto-retro.md`; sources: 2)
- The answer to whether the release was done briefly mixed two states: published binary release was done, but post-release audit hardening was still uncommitted. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- The public release verifier checked asset presence and checksum structure but did not reject unverifiable source-tree delegation. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)
- The release process had to run full gates multiple times because the post-release audit fix landed after publication. (source: `charness-artifacts/retro/2026-05-13-subagent-release-audit-retro.md`)

## Next-Time Checklist

- applied — code-point semantics and malformed JavaScript-string handling now have deterministic cross-language tests. (source: `charness-artifacts/retro/2026-07-11-second-autonomous-repo-improvement-retro.md`)
- applied — normal durable quality runs now refresh existing runtime evidence before self-dogfood. (source: `charness-artifacts/retro/2026-07-11-session-retro.md`)
- applied — the debug artifact preserves the validator-command invariant and the handoff points at canonical current state. (source: `charness-artifacts/retro/2026-07-11-session-retro.md`)
- display and execute every scaffold payload's `validator_command` before attempting any manually constructed path. (source: `charness-artifacts/retro/2026-07-11-session-retro.md`)

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
