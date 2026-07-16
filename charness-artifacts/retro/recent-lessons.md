# Recent Retro Lessons

## Current Focus

- Autonomous improvement run against `charness-artifacts/goals/2026-07-16-sixth-autonomous-improvement-release.md`. (source: `charness-artifacts/retro/2026-07-16-sixth-autonomous-improvement-and-v0-20-0-breaking-rename-release.md`)
- Release publish triggered a configured automatic session retro for `v0.19.2`. (source: `charness-artifacts/retro/2026-07-11-v0-19-2-release-auto-retro.md`)

## Repeat Traps

- Without the release-helper persistence step, a successful publish can leave a clean tree and make the retro trigger appear unneeded after the fact. (source: `charness-artifacts/retro/2026-07-11-v0-19-3-release-auto-retro.md`; sources: 4)
- `git add` atomic-fail race: in slice 2 I ran `git add -A scripts/coverage-floor.json internal/runtime/git_hooks.go`, but `git rm` had already staged the deletion, so the bare `git_hooks.go` pathspec made `git add` fail atomically — silently leaving the floor-json removal unstaged. The resulting commit deleted the file but kept its floor entry (an inconsistent commit my own slice-1 fail-closed fix would flag), needing an autosquash rebase to fold the fix into the right commit. Root cause: not checking the staging result before committing, plus `git add`'s all-or-nothing pathspec behavior. (source: `charness-artifacts/retro/2026-07-16-sixth-autonomous-improvement-and-v0-20-0-breaking-rename-release.md`)
- Guarded-publish worktree drift: I appended a slice-6 log (a goal-artifact edit) WHILE the `publish-release.mjs` guarded push was running; `guard-worktree-unchanged.mjs` correctly detected the mid-flight change and fail-safed the push. Nothing was pushed (origin/main unchanged, no tag), but it cost one full publish retry. Root cause: mutating the worktree during a guarded external command. (source: `charness-artifacts/retro/2026-07-16-sixth-autonomous-improvement-and-v0-20-0-breaking-rename-release.md`)
- Non-Goal premise error (net-positive): the plan forbade `claims:refresh:all` on the counterweight's assumption it would launder the 47 broken evidence bindings, but the doc edits are tracked claim sources so a refresh is the repo's prescribed action. This forced a mid-run investigation — which was itself valuable, empirically confirming the refresh does NOT re-pin the evidence bundles (warningCount stayed 47, no status flip). (source: `charness-artifacts/retro/2026-07-16-sixth-autonomous-improvement-and-v0-20-0-breaking-rename-release.md`)

## Next-Time Checklist

- Release helper auto-persisted this bounded retro trigger closeout; no additional follow-up is needed for this trigger instance. (source: `charness-artifacts/retro/2026-07-11-v0-19-3-release-auto-retro.md`; sources: 4)
- after a multi-pathspec `git add`, confirm staging with `git status --short` before committing (or stage deletions via `git add -A <dir>`/`git commit -a`); `git add` fails atomically on a missing pathspec and can silently leave intended changes unstaged. (source: `charness-artifacts/retro/2026-07-16-sixth-autonomous-improvement-and-v0-20-0-breaking-rename-release.md`)
- do not mutate the worktree (goal artifact or any file) while a guarded external command (`publish-release.mjs`, `.githooks/pre-push`, anything wrapping `guard-worktree-unchanged.mjs`) is running; batch all bookkeeping strictly before or after the guarded window. (source: `charness-artifacts/retro/2026-07-16-sixth-autonomous-improvement-and-v0-20-0-breaking-rename-release.md`)
- none — both are operating-discipline lessons, not gate gaps; the existing guard already caught the drift correctly. (source: `charness-artifacts/retro/2026-07-16-sixth-autonomous-improvement-and-v0-20-0-breaking-rename-release.md`)

## Selection Policy

- Source: `charness-artifacts/retro/lesson-selection-index.json`
- Slots: current_focus=2, repeat_trap=4, next_improvement=4
- Policy: advisory recency half-life 14 days plus recurrence boost with adaptive alpha.

## Sources

- `charness-artifacts/retro/2026-06-22-v0-17-1-release-auto-retro.md`
- `charness-artifacts/retro/2026-07-08-v0-18-1-release-auto-retro.md`
- `charness-artifacts/retro/2026-07-11-v0-19-2-release-auto-retro.md`
- `charness-artifacts/retro/2026-07-11-v0-19-3-release-auto-retro.md`
- `charness-artifacts/retro/2026-07-16-sixth-autonomous-improvement-and-v0-20-0-breaking-rename-release.md`
