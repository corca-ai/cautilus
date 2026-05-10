# Public Skill Dogfood Helper Debug
Date: 2026-05-10

## Problem

The quality public-skill dogfood helper failed while reviewing the Cautilus Agent skill surface.

## Correct Behavior

Given the Cautilus product repo treats `skills/cautilus-agent/SKILL.md` as an agent product surface, when quality reviews that surface, then the review path should either scaffold a consumer dogfood case for it or report that the helper is scoped to a different public-skill registry.

## Observed Facts

- `python3 /home/hwidong/.codex/plugins/charness/skills/quality/scripts/suggest_public_skill_dogfood.py --repo-root . --skill-id cautilus-agent` exited with status 1.
- The exact error was `Unknown public skill id(s): `cautilus-agent``.
- The helper derives public skill ids from `skills/public/<skill-id>/SKILL.md`.
- This repo's Cautilus Agent source lives at `skills/cautilus-agent/SKILL.md`, with a packaged copy at `plugins/cautilus/skills/cautilus-agent/SKILL.md`.
- `.agents/quality-adapter.yaml` already declares `product_surfaces: cautilus_agent` and lists both Cautilus Agent skill paths under `skill_ergonomics_skill_paths`.

## Reproduction

Run:

```bash
python3 /home/hwidong/.codex/plugins/charness/skills/quality/scripts/suggest_public_skill_dogfood.py --repo-root . --skill-id cautilus-agent
```

## Candidate Causes

- The helper is intentionally limited to Charness-style `skills/public/` skill ids.
- The Cautilus Agent is a repo-local product skill rather than a `skills/public/` skill.
- The quality adapter has enough product-surface metadata for ergonomics review but no mapping that teaches this helper how to scaffold a Cautilus Agent dogfood case.

## Hypothesis

If the helper only reads `skills/public/`, then passing `cautilus-agent` will always fail in this repo unless a Cautilus-specific mapping or separate dogfood helper is added.

## Verification

Inspected `/home/hwidong/.codex/plugins/charness/scripts/public_skill_validation_lib.py`.
`public_skill_ids(repo_root)` returns directories under `repo_root / "skills" / "public"` that contain `SKILL.md`, which excludes `skills/cautilus-agent/SKILL.md` by construction.

## Root Cause

The failure is a registry mismatch.
The Charness quality helper is a public-skill helper, while Cautilus Agent is a Cautilus product skill with adapter-declared product-surface paths.

## Seam Risk

- Interrupt ID: public-skill-dogfood-helper-cautilus-agent
- Risk Class: none
- Seam: Charness public-skill dogfood helper to Cautilus Agent product skill
- Disproving Observation: a helper or adapter mapping can scaffold a Cautilus Agent dogfood case without requiring the skill to move under `skills/public/`.
- What Local Reasoning Cannot Prove: the right portable API for Charness quality to discover repo-local product skills.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep current Cautilus Agent quality records explicit when the public-skill dogfood helper is unavailable.
Add a Cautilus-specific dogfood mapping or helper before treating consumer-side Cautilus Agent dogfood scaffolding as automated.

## Related Prior Incidents

- [debug-2026-05-10-cautilus-agent-skill-disclosure-limit.md](debug-2026-05-10-cautilus-agent-skill-disclosure-limit.md): the same product skill surface has a tight progressive-disclosure budget and needs quality review after edits.
