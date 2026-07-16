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
- Coverage-floor unit tests are now hermetic: `check-coverage-floor.mjs` honors `COVERAGE_FLOOR_PATH`/`COVERAGE_FLOOR_EXEMPTIONS_PATH` overrides so `coverage-dir.test.mjs` injects fixture floors instead of coupling to live values; the sanctioned floor writer no longer breaks the suite (proven by mutating the live floor and re-running green).
- The floor writer is now monotonic (never lowers a retained floor) with `--only-stale`/`--buffer`/`--stale-threshold` modes, default buffer aligned to the adapter's 1.0pp fragile margin, and a `coverage:floor:raise-stale` alias; `--only-stale` drops floored-and-exempted entries so it cannot author a gate contradiction (proven on the real gate).
- 13 stale placeholder floors were raised 10pp below current coverage (`scenario_telemetry.go` 4.4→69, `workspace.go` 2.25→60, `review.go` 4.43→42.03), a monotonic 13-file change verified stable across independent coverage runs.
- Standing `verify`, coverage-floor enforcement, and runtime budgeting remain green and high-signal.

## Weak

- Coverage floors are still loose by design after the raise: the 13 use a conservative 10pp buffer (safe against the pre-push+CI gate but tolerant of up to 10pp erosion), and ~42 files still clear the 1pp drift-lock WARN, which nags toward sub-1pp floors that would be CI-flaky. The remaining ~100 near-floor and 25 warn-band files were intentionally left untouched.

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

- Delegated Review: executed — three parent-delegated `charness:bounded-reviewer` runs. (1) parity gate: fixed the SKILL.md byte-compare contradiction + untested non-markdown branch. (2) floor-test decoupling: two nits applied. (3) floor writer: no blockers; two should-fix items applied (only-stale exempt-persistence gate contradiction, over-broad "monotonic" comment) plus missing-branch tests.
- Slow-gate lenses (fixture-economics, parallel-critical-path, duplicated-proof): not applicable — the change is a cheap deterministic lint, adding no slow standing gate.

## Commands Run

- quality planner, `render_runtime_summary.py`, `inventory_skill_ergonomics.py --summary`
- `./scripts/run-quality.sh --read-only`, `npm run verify` (multiple), `node --test scripts/release/sync-packaged-skill.test.mjs`, `node --test scripts/coverage-dir.test.mjs`
- `sync-packaged-skill.mjs --check` in-sync/drift probes, temp-tree regeneration diff, dual-copy `diff -rq`
- coverage determinism probes (`test:coverage` ×3 + spec variant, stable at 2600/55.54%), hermetic-decoupling proof (tests green after live-floor mutation)
- `coverage:floor:raise-stale` (13-file monotonic raise), floor diff analysis (13 raised / 0 lowered / 0 added / 0 removed), SF1 exempt-drop proof on the real gate, `npm run verify` (multiple, green)

## Recommended Next Quality Moves

- passive tighten the raised floors' buffer once CI variance is observed — capability_needed=stronger coverage ratchet; next_center=the 13 floors now at a 10pp buffer; transformation=lower the buffer toward the fragile margin once a few CI runs confirm per-file stability; proof_boundary=coverage-floor gate green across environments; enforcement_posture=existing-gate-reuse until CI stability data exists because a tighter buffer risks flaking the pre-push+CI gate.
- passive harden mirror parity for non-text/symlink assets — capability_needed=parity for future binary/symlink skill assets; next_center=`checkPackagedSkillInSync`; transformation=compare buffers and classify symlinks explicitly; proof_boundary=`lint:skill-packaged-sync`; enforcement_posture=no-gate because no such asset exists in the skill tree yet (watch on asset introduction).

## History

- [Second autonomous improvement](2026-07-11-second-autonomous-improvement.md)
- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
