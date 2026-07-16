# Quality Review
Date: 2026-07-16
Title: Packaged Cautilus Agent mirror parity gate

## Scope

Target boundary: the `cautilus-agent` product surface after the find-skills retirement — specifically whether the distributed plugin mirror (`plugins/cautilus/skills/cautilus-agent/`) is provably faithful to maintained source (`skills/cautilus-agent/`).

Ambient repo findings: standing `verify` is green; coverage floors are loose (41 floored files cleared drift-lock, 25 warn-band); runtime has no stale hot spots.

## Current Gates

- Read-only quality (`npm run verify`) passed all phases in ~33-42s across lint, specs, coverage, security, and skill-disclosure.
- Skill-disclosure lint enforced SKILL.md fragment/budget/forbidden rules and, before this turn, SKILL.md-only byte parity.
- New `lint:skill-packaged-sync` now enforces whole-tree source→package parity inside `lint`/`verify`.

## Runtime Signals

- runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by `render_runtime_summary.py`; profile `local-verify`. <!-- reproduction-source -->
- runtime hot spots: `lint · specs` 16.1s latest / 16.0s median vs 35.0s budget; `test · coverage` 4.1s / 3.9s vs 10.0s; no stale or over-budget hot spots.
- coverage gate: passed; `sync-packaged-skill.mjs` rose 79.58% → 94.85% (floor 85.80%) after the added tests.
- evaluator depth: deterministic gates only, because no Agent prompt, provider route, or live evaluator contract changed — only a packaging parity gate.

## Healthy

- Whole-tree packaged-mirror parity is now a hard gate: `checkPackagedSkillInSync` recomputes each expected packaged file (markdown links re-based, other files verbatim) and fails on any drifted/missing/extra file; proven to bite on a real drift probe (exit 1) and green on the in-sync tree (exit 0).
- Nine unit tests pin the inverse: rewrite parity, verbatim non-markdown branch, missing/extra detection, input-guard, and both `main --check` exit codes.
- Parity ownership is consolidated — the disclosure lint's duplicate SKILL.md byte-compare was removed so a future upward link in SKILL.md cannot make `verify` unsatisfiable.
- Standing `verify`, coverage-floor enforcement, and runtime budgeting remain green and high-signal.

## Weak

- The pre-existing coverage-floor set is loose: 41 floored files cleared the 1pp drift-lock and 25 sit in the warn-band, so the floors trail measured coverage and under-protect regressions in those files.

## Missing

- No repo-wide guard for non-text or symlink assets entering the skill tree; the parity check reads utf-8 and skips symlinks, which is correct for today's all-markdown-plus-one-YAML tree but would silently under-verify a future binary/symlink asset.

## Deferred

- `prepare-release` still regenerates the mirror without asserting a clean tree, but the new pre-push `lint:skill-packaged-sync` now backstops that gap, so tightening release-prepare itself is deferred.
- Bulk-raising the 41 cleared-drift-lock floors is a separate maintenance slice.

## Advisory

- structural review result: capability_needed = a trustworthy packaged mirror so host-repo agents read correct guidance; current centers were the sync generator and the SKILL.md-only parity check; the next center strengthened was the generator's own `--check` inverse, closing the gap without a new gate family.
- prose review result: command `inventory_skill_ergonomics.py` flags `reference_discoverability_gap` (3 of 22 refs listed) and `host_surface_reference` (25); these are intentional structure — the core routes discovery through the binary (`doctor commands`, `--example-input`) and references deepen a chosen move — not target-capability debt. `long_core` (185) is governed by the enforced 185-line budget with documented provenance (AUTO_EXISTING).
- command: the source↔mirror diff (7 reference files) is the deliberate `../` link re-base, not drift; confirmed by regenerating into a temp tree (empty diff).

## Delegated Review

- Delegated Review: executed — one parent-delegated `charness:bounded-reviewer` reviewed the full diff; it surfaced the latent SKILL.md byte-compare contradiction and the untested non-markdown branch, both fixed this turn, and confirmed the rewrite test is not gameable.
- Slow-gate lenses (fixture-economics, parallel-critical-path, duplicated-proof): not applicable — the change is a cheap deterministic lint, adding no slow standing gate.

## Commands Run

- quality planner, `render_runtime_summary.py`, `inventory_skill_ergonomics.py --summary`
- `./scripts/run-quality.sh --read-only`, `npm run verify` (before/after), `node --test scripts/release/sync-packaged-skill.test.mjs`
- `sync-packaged-skill.mjs --check` in-sync/drift probes, temp-tree regeneration diff, dual-copy `diff -rq`

## Recommended Next Quality Moves

- passive raise stale coverage floors — capability_needed=honest coverage ratchet; next_center=41 floored files that cleared the 1pp drift-lock; transformation=bulk-raise floors toward measured coverage in a dedicated slice; proof_boundary=coverage-floor gate; enforcement_posture=existing-gate-reuse until a maintainer opts into the bulk raise because it is a broad edit, not this turn's parity concern.
- passive harden mirror parity for non-text/symlink assets — capability_needed=parity for future binary/symlink skill assets; next_center=`checkPackagedSkillInSync`; transformation=compare buffers and classify symlinks explicitly; proof_boundary=`lint:skill-packaged-sync`; enforcement_posture=no-gate because no such asset exists in the skill tree yet (watch on asset introduction).

## History

- [Second autonomous improvement](2026-07-11-second-autonomous-improvement.md)
- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
