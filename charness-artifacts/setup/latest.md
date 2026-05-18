# Setup Normalization
Date: 2026-05-18

## Scope

Re-run setup normalization against Charness 0.7.0 during the setup/quality refresh.

## Result

No setup surface changes were needed.
The inspector reports `repo_mode=NORMALIZE`, `missing_surfaces=[]`, and `recommended_action=leave_as_is`.

## Current Surface Map

- `AGENTS.md` remains the repo instruction entrypoint.
- `CLAUDE.md` remains a symlink to `AGENTS.md`.
- `README.md` remains the user-facing entrypoint.
- `docs/master-plan.md` remains the roadmap source of truth.
- `docs/maintainers/operator-acceptance.md` remains the operator acceptance source of truth.
- `docs/internal/handoff.md` remains the next-session handoff source.

## Routing

The existing Skill Routing block is intentionally repo-specific.
The 0.7.0 renderer still recommends reviewing the custom block because it does not match the compact generated block byte-for-byte, but `missing_expected_snippets=[]` and the setup adapter acknowledges `skill_routing_block_custom_or_drifted`.

## Deliberately Not Doing

- Do not create duplicate default docs such as `docs/roadmap.md`.
- Do not create duplicate root-level `docs/operator-acceptance.md`.
- Do not replace the repo-specific critique packet guidance in `AGENTS.md` with the shorter generated block.

## Verification

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/setup/scripts/inspect_repo.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/setup/scripts/render_skill_routing.py --repo-root . --json`

## Delegated Review

executed: parent-delegated setup review confirmed the current operating-surface mapping is the right fit and warned against creating duplicate setup docs.
Counterweight review agreed this is a healthy setup signal, not a prompt for further normalization.
