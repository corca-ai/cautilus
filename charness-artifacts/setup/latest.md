# Setup Normalization
Date: 2026-05-19

## Scope

Re-run setup inspection and complete the previously-implicit worktree adapter seam during a `/setup` + `/quality` refresh.

## Result

No core operating-surface changes were needed.
The inspector reports `repo_mode=NORMALIZE`, `missing_surfaces=[]`, `findings=[]`, `recommendations=[]`, and `recommended_action=leave_as_is`.

This slice seeded one previously-missing optional seam: `.agents/worktree-adapter.yaml`.

## Current Surface Map

- `AGENTS.md` remains the repo instruction entrypoint.
- `CLAUDE.md` remains a symlink to `AGENTS.md`.
- `README.md` remains the user-facing entrypoint.
- `docs/master-plan.md` remains the roadmap source of truth.
- `docs/maintainers/operator-acceptance.md` remains the operator acceptance source of truth.
- `docs/internal/handoff.md` remains the next-session handoff source.

## Routing

The existing Skill Routing block stays intentionally repo-specific.
The 0.7.x renderer still suggests reviewing the custom block because it does not match the compact generated block byte-for-byte; the setup adapter acknowledges `skill_routing_block_custom_or_drifted`, so this is informational, not a finding.

## Worktree Adapter

Seeded `.agents/worktree-adapter.yaml` tailored to cautilus's stack (npm + checked-in `.githooks`).
Default seed template assumed pnpm + lefthook; the file was rewritten to use:

- `prepare.commands`: `npm install` and `npm run hooks:install`
- `doctor.checks`: manifest-level `hooks_check` running `npm run hooks:check`

`charness worktree doctor --repo-root . --json` reports `status: pass` with the manifest `hooks_check` green.

This seam was visible in the prior `inspect_repo.py` output under `agent_docs.normalization.worktree_adapter` but never surfaced as a `recommendation` because the trigger gate (`hook_manager_detected`) requires lefthook/husky/simple-git-hooks. That gap is filed upstream as `corca-ai/charness#180`.

## Deliberately Not Doing

- Do not create duplicate default docs such as `docs/roadmap.md` or root-level `docs/operator-acceptance.md`.
- Do not replace the repo-specific critique packet guidance in `AGENTS.md` with the shorter generated block.
- Do not add the `find-skills --recommend-for-task` snippet to the Skill Routing block; the block already says "Keep this block short" and that decision is the repo's prior call.

## Verification

- `python3 $SKILL_DIR/setup/scripts/resolve_adapter.py --repo-root .`
- `python3 $SKILL_DIR/setup/scripts/inspect_repo.py --repo-root .`
- `python3 $SKILL_DIR/setup/scripts/render_skill_routing.py --repo-root . --json`
- `python3 $SKILL_DIR/setup/scripts/seed_worktree_adapter.py --repo-root .` (exited 1 with a print-only ValueError after writing the file — see `corca-ai/charness#181`)
- `charness worktree doctor --repo-root . --json`

## Delegated Review

executed: parent-delegated bounded review scoped to (a) worktree adapter seed fit for cautilus's npm + `.githooks` stack and (b) the three charness improvement issues opened during this slice.
Result recorded in `charness-artifacts/quality/latest.md` under `Delegated Review`.
