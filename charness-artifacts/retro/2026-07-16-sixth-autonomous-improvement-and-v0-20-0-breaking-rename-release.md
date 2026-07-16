# Sixth autonomous improvement and v0.20.0 breaking-rename release
Date: 2026-07-16

## Mode

session

## Context

Autonomous improvement run against `charness-artifacts/goals/2026-07-16-sixth-autonomous-improvement-release.md`.
Landed six evidence-backed slices — coverage-floor fail-closed, dead-code removal, SemVer 11.4 prerelease compare, doc/spec self-consistency, and one user-licensed breaking schema rename (`cautilus.workbench_instance_catalog.v1` → `cautilus.live_target_catalog.v1`) — then cut and publicly verified minor release `v0.20.0`.
The improvement backlog was mined by a dynamic discovery workflow (six read-only scouts + synthesis + counterweight) rather than from remembered seams.

## Evidence Summary

- Discovery workflow `wf_a739e366-382`: 21 raw findings → ranked backlog + counterweight that pruned false-proof/YAGNI/churn items before scope.
- Commit range `a662af99..HEAD` (10 commits): 6 improvement slices + 3 goal-bookkeeping + prepare, each verified.
- Two parent-delegated `charness:bounded-reviewer` runs: breaking-rename PASS (0 defects); release critique BLOCK→PASS (caught one record overclaim).
- Public proof: GitHub Actions run `29486505150` success; 7 assets; independent verifier `status: ok`; distinct-channel HTTP 200; install.sh readback `0.20.0`; Linux x64 attestation verified.
- Two self-inflicted rework events (below), both fail-safe (no bad state shipped).

## Waste

- Guarded-publish worktree drift: I appended a slice-6 log (a goal-artifact edit) WHILE the `publish-release.mjs` guarded push was running; `guard-worktree-unchanged.mjs` correctly detected the mid-flight change and fail-safed the push. Nothing was pushed (origin/main unchanged, no tag), but it cost one full publish retry. Root cause: mutating the worktree during a guarded external command.
- `git add` atomic-fail race: in slice 2 I ran `git add -A scripts/coverage-floor.json internal/runtime/git_hooks.go`, but `git rm` had already staged the deletion, so the bare `git_hooks.go` pathspec made `git add` fail atomically — silently leaving the floor-json removal unstaged. The resulting commit deleted the file but kept its floor entry (an inconsistent commit my own slice-1 fail-closed fix would flag), needing an autosquash rebase to fold the fix into the right commit. Root cause: not checking the staging result before committing, plus `git add`'s all-or-nothing pathspec behavior.
- Non-Goal premise error (net-positive): the plan forbade `claims:refresh:all` on the counterweight's assumption it would launder the 47 broken evidence bindings, but the doc edits are tracked claim sources so a refresh is the repo's prescribed action. This forced a mid-run investigation — which was itself valuable, empirically confirming the refresh does NOT re-pin the evidence bundles (warningCount stayed 47, no status flip).

## Critical Decisions

- Mining the backlog with a counterweight lens up front: it caught the false-proof `claims:refresh` laundering risk and the fixture-replay fake-judge before either entered scope. Without it, an autonomous run would plausibly have "manufactured green proof" — the worst failure mode for a "Proven On Itself" product.
- Empirically verifying the claims-refresh safety instead of blindly refusing OR blindly running it: resolved the Non-Goal-vs-prescribed-process tension with evidence (diff audit + warningCount invariance), not assertion.
- Autosquash rebase to repair the inconsistent slice-2 commit rather than a trailing fixup: kept every commit internally buildable/verifiable.
- Delegating a fresh-eye reviewer for BOTH the breaking rename and the release: the release critic caught the release record pre-declaring its own critique as "cleared" — the exact overclaim the gate exists to catch.

## Expert Counterfactuals

- Engelbart `system-improving-itself` lens (H + LAM + T as one unit): most of this run improved the repo's own gates and contracts, so the Tool (guards), the Method (my operating sequence), and the Language (working-patterns) should be co-designed. The guarded-publish waste is precisely a T/Method mismatch: the Tool (`guard-worktree-unchanged`) correctly enforces a frozen worktree, but my Method had no rule that a guarded external command opens a worktree-freeze window. Co-designing the two would have batched all bookkeeping before the publish. The fix is a Language/Method change (a durable operating pattern), not a new Tool — the Tool already did its job.

## Sibling Search

- axis: guarded/async operations that read the whole worktree | location: `guard-worktree-unchanged.mjs` is also wrapped around `npm run verify` and `generated:drift:check` in `.githooks/pre-push` | decision: valid follow-up inside this closeout | proof: the same guard would fail-safe any concurrent edit during pre-push too | follow-up: add a durable operating pattern (below) covering all guarded commands, not just publish.
- axis: `git add` with an already-staged deletion in the same pathspec list | location: any multi-pathspec `git add` after a `git rm` | decision: valid follow-up inside this closeout | proof: the slice-2 inconsistent commit | follow-up: fold into the same working-patterns note (verify staging before commit).

## Next Improvements

- workflow: do not mutate the worktree (goal artifact or any file) while a guarded external command (`publish-release.mjs`, `.githooks/pre-push`, anything wrapping `guard-worktree-unchanged.mjs`) is running; batch all bookkeeping strictly before or after the guarded window.
- workflow: after a multi-pathspec `git add`, confirm staging with `git status --short` before committing (or stage deletions via `git add -A <dir>`/`git commit -a`); `git add` fails atomically on a missing pathspec and can silently leave intended changes unstaged.
- capability: none — both are operating-discipline lessons, not gate gaps; the existing guard already caught the drift correctly.
- memory: record both patterns in `docs/internal/working-patterns.md` so the next session inherits them.

## Persisted

Persisted: yes: charness-artifacts/retro/2026-07-16-sixth-autonomous-improvement-and-v0-20-0-breaking-rename-release.md
