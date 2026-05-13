# Setup Normalization

Date: 2026-05-13

## Scope

Normalize the repo host-facing subagent delegation policy in `AGENTS.md`.

## Changes

- Added an explicit `Subagent Delegation` section.
- Replaced the legacy `init-repo` review scope with `setup`.
- Kept the existing custom `Skill Routing` block instead of replacing it with the generated compact block because this repo intentionally requires the first-turn `find-skills` bootstrap.

## Verification

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.23/skills/setup/scripts/inspect_repo.py --repo-root .`
- `npm run dogfood:self:eval`

The setup inspector now reports `has_subagent_delegation_section=true`, `legacy_init_repo_scope_present=false`, and no missing fresh-eye review snippets.
The Cautilus self-dogfood eval returned `recommendation=accept-now` for the checked-in `dev / repo` instruction-surface fixture after the `AGENTS.md` change.
