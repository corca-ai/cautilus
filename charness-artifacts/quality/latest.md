# Quality Review
Date: 2026-07-08

## Scope

Target boundary: repo-wide code quality and test-speed economics for Cautilus as installable CLI plus Cautilus Agent surface.

Ambient repo findings: Cautilus Agent skill ergonomics and legacy debug-artifact schema drift are reported as ambient debt, not changes made by this slice.

## Current Gates

- `npm run verify`
- `npm run verify:runtime`
- `npm run test:node:coverage`
- `npm run hooks:check`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_quality_artifact.py --repo-root .`

## Runtime Signals

- runtime source: `npm run verify -- --runtime-signal .charness/quality/runtime-signals.json` generated a passing single-run packet rendered by `render_runtime_summary.py`; profile `local-linux-x86_64-36cpu`.
- runtime hot spots: `lint:specs` 25.73s, `test:coverage` 8.17s, `test:go:race` 7.37s, `security:secrets` 6.77s, `claims:audit-evidence` 6.45s; total 68.67s.
- coverage gate: focused `npm run test:node:coverage` passed in 2.77s after the reporter change and wrote `coverage/node.json`.
- evaluator depth: deterministic local gates only; no live Cautilus evaluation was needed because this slice changed verify/test ergonomics, not behavior-evaluation semantics.

## Healthy

- `npm run verify -- --runtime-signal .charness/quality/runtime-signals.json` passed, so the standing gate remains intact after the quality review baseline run.
- The checked-in hook path is meaningful: delegated review confirmed `core.hooksPath=.githooks`, `.githooks/pre-push` routes `npm run verify` through `guard-worktree-unchanged`, and CI also runs `npm run verify`.
- `test:node:coverage` now uses Node's dot reporter under `c8`, preserving the same test set while removing the previous successful TAP flood from the coverage phase.
- `verify:runtime` gives maintainers an explicit local timing command without changing the default `verify` behavior.
- `.charness/quality/runtime-signals.json` is ignored so local timing captures do not leave an untracked worktree artifact.

## Weak

- `render_runtime_summary.py` still cannot turn the generated single-run signal into hot spots because it expects profile-based samples; it reported `runtime_visibility_missing_budgets`.
- The quality adapter has no effective runtime budgets for the current local profile, so standing-gate cost centers are measurable but not budgeted.
- The planner's generic broad packet named missing `./scripts/run-quality.sh --read-only`; the repo-specific equivalent is `npm run verify`.
- Cautilus Agent skill ergonomics inventory still reports long core, host-surface reference, and reference-discoverability pressure across source and packaged skill copies.
- The advisory standing-test-economics inventory reported `test_file_count: 0` despite Go and Node test files existing, so its file-count signal is unreliable for this repo today.

## Missing

- No stable runtime sample log or budget policy is wired into quality summaries yet.
- No bounded parallel group contract exists for `scripts/run-verify.mjs`; the current loop is intentionally serial.
- No deterministic slow-test or slow-phase ratchet exists beyond the ad hoc timing packet.

## Deferred

- Parallelizing `verify` is deferred until the timing source has multiple comparable samples and phase dependency groups are explicit.
- Removing duplicated proof between `test:node`, `test:go:race`, and `test:coverage` is deferred because race, normal, and coverage runs prove different seams.
- Cautilus Agent progressive-disclosure cleanup remains a separate skill-surface quality slice.

## Advisory

- structural review result: the weak downstream capability is operator-visible runtime drift; current centers are `scripts/run-verify.mjs`, `.githooks/pre-push`, and CI `verify`, and the next center is a quality-readable runtime sample/budget contract.
- prose review result: command evidence from `npm run test:node:coverage` and `npm run verify -- --runtime-signal .charness/quality/runtime-signals.json` shows behavior proof stayed intact while output shape changed.
- run-quality mismatch: recorded in `charness-artifacts/debug/latest.md`; current disposition is use `npm run verify` as the repo equivalent rather than adding a wrapper immediately.
- duplicated-proof advisory: `test:coverage` reruns Go and Node tests after `test:go:race` and `test:node`; this is the first overlap candidate after runtime samples stabilize.

## Delegated Review

- Delegated Review: executed by subagent `Banach`; status `completed`; reviewer tier requested `high-leverage`; host exposure state `metadata-hidden / not confirmable`.
- Slow-gate lenses applied: `fixture-economics`, `parallel-critical-path`, `duplicated-proof`, and `operator-signal`.
- Disposition: implemented low-risk operator-signal/output improvements now; deferred parallelization and proof-overlap pruning until timing samples can distinguish real cost from one-run noise.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/find-skills/scripts/list_capabilities.py --repo-root . --recommend-for-task "overall repository code quality and test speed improvement" --summary`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/plan_quality_run.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/render_runtime_summary.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/inventory_skill_ergonomics.py --repo-root . --summary`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/inventory_standing_gate_verbosity.py --repo-root . --summary`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/inventory_standing_test_economics.py --repo-root . --summary`
- `npm run verify -- --runtime-signal .charness/quality/runtime-signals.json`
- `npm run verify:runtime`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/run-verify.test.mjs`
- `npm run test:node:coverage`
- `node -e "const p=require('./package.json'); if (!p.scripts['verify:runtime']) process.exit(1); console.log(p.scripts['verify:runtime'])"`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_debug_artifact.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_quality_artifact.py --repo-root .`
- `npm run hooks:check`
- delegated fresh-eye review by subagent `Banach`

## Recommended Next Quality Moves

- active teach quality runtime summary to ingest `cautilus.quality_runtime_signal.v1` single-run packets or append them into a profile sample log — capability_needed=runtime drift visibility; next_center=runtime summary ingestion; transformation=convert the existing signal into quality-readable samples; proof_boundary=runtime summary shows hot spots from this packet; enforcement_posture=advisory.
- passive add phase budgets because budgets need at least several comparable samples before they become fair gates; capability_needed=runtime budget discipline; next_center=quality adapter runtime profile; transformation=budget top standing phases; proof_boundary=budgeted runtime summary; enforcement_posture=no-gate until samples stabilize.
- passive define `verify` parallel groups until dependency and mutation boundaries are explicit; capability_needed=faster standing gate; next_center=`scripts/run-verify.mjs`; transformation=parallelize independent lint/security/test groups; proof_boundary=full verify plus runtime comparison; enforcement_posture=no-gate.
- passive address Cautilus Agent ergonomics until the next skill-surface slice because this run did not change skill packages; capability_needed=progressive disclosure; next_center=Cautilus Agent `SKILL.md` and references; transformation=reduce core pressure and fix reference discoverability; proof_boundary=skill ergonomics inventory plus prose review; enforcement_posture=existing advisory.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
