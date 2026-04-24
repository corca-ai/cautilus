# Debug Review
Date: 2026-04-24

## Problem

`validate_skill_ergonomics.py --repo-root . --json` reported `checked_skills: []` after the quality adapter opted into `skill_ergonomics_gate_rules`.

## Correct Behavior

Given this repo ships a bundled public Cautilus skill under `skills/cautilus/`, when a quality check is expected to protect that surface, then the checked skill surface should be explicitly included in the executed quality proof.

## Observed Facts

The exact observed output included `"rules": ["progressive_disclosure_risk"]`, `"checked_skills": []`, and `"violations": []`.
The Charness helper `inventory_skill_ergonomics.py` can inspect `skills/cautilus/SKILL.md` when called with `--skill-path skills/cautilus/SKILL.md`.
The Charness opt-in validator imports the same iterator but calls `iter_skill_paths(repo_root, [])`, whose default search only scans `skills/public/*` and `skills/support/*`.
The Cautilus bundled skill intentionally lives at `skills/cautilus/`, not under `skills/public/`.

## Reproduction

Run:

```bash
python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.10/skills/quality/scripts/validate_skill_ergonomics.py --repo-root . --json
```

## Candidate Causes

- The quality adapter rules were invalid and therefore skipped.
- The repo did not have a public skill path recognized by the generic Charness helper.
- The Cautilus bundled skill path is product-specific and outside Charness's current default public/support layout.

## Hypothesis

The validator is working for Charness-style `skills/public/*` repos, but it does not discover Cautilus's standalone bundled skill path.
If the same inventory helper is called with `--skill-path skills/cautilus/SKILL.md`, it should inspect the skill and report its line count and heuristics.

## Verification

The explicit inventory command inspected `skills/cautilus/SKILL.md` and reported `core_nonempty_lines: 110`.
The repo-owned `npm run lint:skill-disclosure` check now validates both `skills/cautilus/SKILL.md` and `plugins/cautilus/skills/cautilus/SKILL.md`.
The quality adapter startup probes also successfully measured standing CLI health and release-class command registry, scenario catalog, and agent-surface install probes.

## Root Cause

The generic Charness skill ergonomics validator does not yet have an adapter-declared product-surface path for CLI plus bundled-skill repos.
Its default discovery is scoped to `skills/public/*` and `skills/support/*`, so Cautilus needs repo-owned proof until Charness grows the adapter-level contract tracked in corca-ai/charness#69.

## Seam Risk

- Interrupt ID: quality-skill-discovery-bundled-skill
- Risk Class: none
- Seam: Charness quality helper discovery versus Cautilus bundled skill layout
- Disproving Observation: adapter opt-in rules can pass vacuously when the target skill is outside the helper's default discovery roots
- What Local Reasoning Cannot Prove: whether the future Charness adapter contract will use `product_surfaces`, explicit skill paths, or another product-shape declaration
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: corca-ai/charness#69

## Prevention

Keep the Cautilus-specific disclosure check repo-owned through `npm run lint:skill-disclosure`.
Keep the quality adapter's CLI and bundled-skill probes explicit until Charness supports adapter-declared product surfaces for this pattern.
