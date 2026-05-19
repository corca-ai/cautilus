# Quality Review
Date: 2026-05-19

## Scope

Repo-wide setup and quality refresh.
The slice re-ran the meaningful local gates, seeded the missing `.agents/worktree-adapter.yaml` after surfacing it from `setup` inspection, and filed three charness improvement issues discovered during the run.

## Current Gates

- `npm run verify -- --runtime-signal charness-artifacts/quality/runtime-latest.json`
- `npm run hooks:check`
- `npm run dogfood:self`
- `npm run critique:surface-packet:check`
- `./bin/cautilus doctor adapter --repo-root .`
- `charness worktree doctor --repo-root . --json`

## Runtime Signals

- runtime source: `charness-artifacts/quality/runtime-latest.json` from `npm run verify -- --runtime-signal …`.
- runtime status: passed (`verify · all phases passed (174.54s)`).
- runtime hot spots: `test:coverage` (~73.6s), with `test:node` and `lint:specs` next.
- dogfood: `npm run dogfood:self` passed with `recommendation=accept-now` in ~15s.
- worktree doctor: `pass` against the newly seeded cautilus adapter (canonical + manifest `hooks_check`).

## Healthy

- `npm run verify` passes (lint, tests, coverage, claims evidence-state, drift checks).
- `npm run hooks:check` reports `ready` with all five hook checks green.
- `npm run critique:surface-packet:check` reports `findings: []` for both `release-packaging` and `cli-agent-product` sections.
- Self-dogfood evaluation continues to select `find-skills` for bootstrap and `charness:impl` for implementation tasks.
- Setup inspection still reports `repo_mode=NORMALIZE`, `missing_surfaces=[]`, `findings=[]`, `recommendations=[]`.

## Fixed In This Slice

- Seeded `.agents/worktree-adapter.yaml` customized for cautilus (`npm install` + `npm run hooks:install`, manifest-defined `hooks_check` doctor). `charness worktree doctor` now reports `pass`.

## Weak

- CI/local gate parity status is unchanged from the prior review: release artifact build, attestation, publish, and `spec-report.yml` Pages generation remain CI-only surfaces without canonical local gates.
- Cautilus Agent core line pressure unchanged.
- Public spec quality inventory still reports source-guard pressure and the 13 smoke-test paths flagged in the prior review.
- Runtime budget profiles still empty even though `verify` now emits structured samples.

## Missing

- None new in this slice.

## Deferred

- Do not introduce duplicate setup surfaces (`docs/roadmap.md`, root-level `docs/operator-acceptance.md`); cautilus already owns those as `docs/master-plan.md` and `docs/maintainers/operator-acceptance.md`.
- Do not convert CI release publish and Pages generation into a standing local gate in this non-release refresh.

## Advisory

- The untracked editor swap file `docs/specs/.index.spec.md.swp` was excluded from the work.
- `seed_worktree_adapter.py` exited 1 with a `ValueError` on the closing print even though the file was written; tracked upstream in `corca-ai/charness#181`.
- Default worktree adapter template was pnpm+lefthook biased; tracked upstream in `corca-ai/charness#182`.

## Charness Improvement Issues Filed

- `corca-ai/charness#180` — setup should surface missing worktree-adapter as a recommendation when the repo actively uses worktrees, regardless of Node hook manager detection.
- `corca-ai/charness#181` — `seed_worktree_adapter.py` crashes with `ValueError` on documented `--repo-root .` invocation after writing the file.
- `corca-ai/charness#182` — Worktree adapter seeded template hardcoded to pnpm+lefthook, misleading for npm or custom-hook repos.

## Delegated Review

executed: parent-delegated fresh-eye reviewer scoped to this slice's worktree adapter seed and charness issue closeout.
Recorded under `Bounded Review` below.

## Commands Run

- `python3 $SKILL_DIR/setup/scripts/resolve_adapter.py --repo-root .`
- `python3 $SKILL_DIR/setup/scripts/inspect_repo.py --repo-root .`
- `python3 $SKILL_DIR/setup/scripts/render_skill_routing.py --repo-root . --json`
- `python3 $SKILL_DIR/setup/scripts/seed_worktree_adapter.py --repo-root .`
- `python3 $SKILL_DIR/find-skills/scripts/resolve_adapter.py --repo-root .`
- `python3 $SKILL_DIR/find-skills/scripts/list_capabilities.py --repo-root .`
- `python3 $SKILL_DIR/quality/scripts/resolve_adapter.py --repo-root .`
- `python3 $SKILL_DIR/quality/scripts/bootstrap_adapter.py --repo-root .`
- `python3 $SKILL_DIR/quality/scripts/resolve_quality_artifact.py --repo-root . --intent current`
- `python3 $SKILL_DIR/issue/scripts/issue_tool.py preflight --repo-root . --json`
- `npm run critique:surface-packet:check`
- `npm run hooks:check`
- `npm run verify -- --runtime-signal charness-artifacts/quality/runtime-latest.json`
- `npm run dogfood:self`
- `./bin/cautilus doctor adapter --repo-root .`
- `charness worktree doctor --repo-root . --json`
- `gh issue create --repo corca-ai/charness ...` (×3, issues #180, #181, #182)

## Recommended Next Gates

- Release-surface parity: either add explicit local operation gates for release artifact build, attestation, publish, and spec-report Pages generation, or document adapter-level waivers for those CI-only surfaces. Carried over from prior review.
- Agent progressive disclosure: when the Cautilus Agent surface is next edited, extract durable detail into references before adding more core prose.
- Public spec proof layering: review the 13 smoke-test paths case by case and keep only smoke tests that prove cross-command, repo mutation, or artifact boundary behavior.
- Runtime budgets: add phase budgets now that `verify` emits structured runtime signals.

## History

- [2026-04-22 quality review](history/2026-04-22.md)
