# Setup Normalization
Date: 2026-05-16

## Scope

Normalize Cautilus's operating-surface detection after running the setup skill.

## Changes

- Added `.agents/setup-adapter.yaml` so setup inspection maps this mature repo to its actual source-of-truth files.
- Mapped roadmap to `docs/master-plan.md` and operator acceptance to `docs/maintainers/operator-acceptance.md` instead of creating duplicate default docs.
- Kept `CLAUDE.md` as a symlink to `AGENTS.md`.
- Updated the `AGENTS.md` Skill Routing block with the generated session-start wording and a `gather` route for external source context.
- Acknowledged `skill_routing_block_custom_or_drifted` in the setup adapter because this repo intentionally keeps repo-specific critique packet rules below the compact routing block.

## Verification

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/setup/scripts/inspect_repo.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/skills/setup/scripts/render_skill_routing.py --repo-root . --json`

The setup inspector now reports `repo_mode=NORMALIZE`, `missing_surfaces=[]`, a valid `.agents/setup-adapter.yaml`, and no active setup recommendations.

## Delegated Review

executed: bounded setup reviewer confirmed the adapter and AGENTS routing tweak are the minimal fix, and warned against creating duplicate `docs/roadmap.md` or `docs/operator-acceptance.md`.
