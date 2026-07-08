# Setup Normalization
Date: 2026-07-08

## Scope

Re-run `charness:setup` normalization for the repo host-instruction surface after repeated quality optimization rounds.

The narrow question was whether `AGENTS.md` or the `CLAUDE.md` compatibility surface needed another change.

## Result

One targeted `AGENTS.md` update was needed.

The setup inspector previously emitted `commit_discipline_drift` because the repo had commit guidance, but did not explicitly say that task-completing work must not be reported done while meaningful implementation, workflow, or artifact work remains uncommitted unless that deferral is explicit.

`AGENTS.md` now keeps commit discipline compact and says to commit meaningful work slices as they finish, commit meaningful `charness-artifacts/` changes with the work they support, and avoid done-claims while meaningful work remains uncommitted.

## Current Surface Map

- `AGENTS.md` remains the repo instruction entrypoint.
- `CLAUDE.md` remains a symlink to `AGENTS.md`.
- `README.md` remains the user-facing entrypoint.
- `docs/master-plan.md` remains the roadmap source of truth.
- `docs/maintainers/operator-acceptance.md` remains the operator acceptance source of truth.
- `docs/internal/handoff.md` remains the next-session handoff source.

## Routing

The existing Skill Routing block stays intentionally repo-specific.

The renderer still suggests reviewing the custom block because it does not match the compact generated block byte-for-byte.
The setup adapter acknowledges `skill_routing_block_custom_or_drifted`, so this remains informational rather than an active setup recommendation.

## Delegated Review

executed: bounded read-only subagent review scoped to AGENTS/CLAUDE setup normalization.

The reviewer agreed that only `## Commit Discipline` needed an immediate edit, recommended leaving the custom Skill Routing block intact, and confirmed that `CLAUDE.md -> AGENTS.md` was the right host-doc shape.

## Verification

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/setup/scripts/inspect_repo.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/setup/scripts/normalize_host_docs.py --repo-root .`
- `git diff --check`
- `npm run hooks:check`
- `npm run claims:refresh:all`
- `npm run verify`

## Non-Claims

- This was not a broad product quality pass.
- This did not replace the repo-specific Skill Routing policy with the generated compact block.
