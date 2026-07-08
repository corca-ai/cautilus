# Quality Review
Date: 2026-07-08

## Scope

Target boundary: repo-wide code quality and test-speed economics for Cautilus as installable CLI plus Cautilus Agent surface, focused on making `verify:runtime` output usable by the quality runtime summary.

Ambient repo findings: Cautilus Agent skill ergonomics and unbudgeted runtime phases remain ambient debt, not fixed in this slice.

## Current Gates

- `npm run verify:runtime`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/run-verify.test.mjs`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/render_runtime_summary.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_quality_artifact.py --repo-root .`

## Runtime Signals

- runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by `render_runtime_summary.py`; profile `local-linux-x86_64-36cpu`.
- runtime hot spots: `lint · specs` 25.7s latest / 25.6s median; `security · secret scan` 6.7s latest / 6.8s median; `lint · claim evidence hashes` 6.4s latest / 6.4s median; `test · coverage` 3.8s latest / 3.9s median; `lint · eslint` 3.4s latest / 3.5s median.
- coverage gate: `npm run verify:runtime` passed, including `test:coverage` and `coverage:floor:check`; `scripts/run-verify.mjs` coverage rose to 89.43% against its 76.94% floor.
- evaluator depth: deterministic local gates only; no live Cautilus evaluation was needed because the slice changed local runtime signal shape, not agent behavior.

## Healthy

- `run-verify.mjs --runtime-signal` now preserves the existing single-run fields and also writes `profiles.<profile>.commands` entries that quality's runtime summary consumes.
- The runtime sample merge keeps a bounded `recent_elapsed_ms` window of 10 samples and updates latest, median, max, and sample count per phase label.
- Partial runs no longer erase prior samples for phases that did not execute; existing profile commands seed the next write and only observed labels are updated.
- Node and Python profile naming now align on lowercase sanitized local profile names such as `local-linux-x86_64-36cpu`.
- `render_runtime_summary.py --json` now reports `commands_source: runtime_signals` and emits ranked hot spots instead of `no samples`.

## Weak

- The quality adapter still has no effective runtime budgets, so the newly visible hot spots remain advisory rather than enforced.
- `lint · specs` is now visibly the dominant standing cost, but one local profile with a small sample window is not enough evidence to prune or parallelize it.
- Cautilus Agent skill ergonomics inventory still reports long core, host-surface reference, and reference-discoverability pressure across source and packaged skill copies.
- The advisory standing-test-economics inventory still reports `test_file_count: 0`, so its file-count signal remains unreliable for this Go/Node repo.

## Missing

- No runtime budget profile is configured for the now-readable `local-linux-x86_64-36cpu` samples.
- No deterministic slow-phase ratchet exists for new or regressing verify phases.
- No bounded parallel group contract exists for `scripts/run-verify.mjs`; the current loop stays serial.

## Deferred

- Runtime budgets are deferred until the sample log has several comparable local runs and the team chooses acceptable thresholds.
- Parallelizing `verify` is deferred until phase dependency groups are explicit and a before/after runtime comparison can prove benefit.
- Cautilus Agent progressive-disclosure cleanup remains a separate skill-surface quality slice.

## Advisory

- structural review result: the weak downstream capability was quality-readable runtime drift; the next center moved from hidden single-run packets to `scripts/run-verify.mjs` writing renderer-compatible samples.
- prose review result: command evidence from `npm run verify:runtime`, `render_runtime_summary.py --json`, and `scripts/run-verify.test.mjs` shows the local proof path stayed deterministic while improving operator signal.
- runtime interpretation: `render_runtime_summary.py --json` ranks `lint · specs` first, but this is still an inference-layer trend and may include cache/noise effects from one machine.
- duplicated-proof advisory: `test:coverage` still reruns Go and Node tests after `test:go:race` and `test:node`; this remains a candidate only after runtime samples stabilize.

## Delegated Review

- Delegated Review: executed by subagent `Pascal`; status `completed`; reviewer tier requested `high-leverage`; host exposure state `metadata-hidden / not confirmable`.
- Slow-gate lenses applied: `fixture-economics`, `parallel-critical-path`, `duplicated-proof`, `operator-signal`, `schema-compatibility`, `sample-retention`, `test-coverage`, and `standing-gate-safety`.
- Disposition: fixed the returned Weak/Missing findings by preserving unobserved phase samples on partial runs, lowercasing profile normalization, and adding direct tests for bounded merge and partial-run retention.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/plan_quality_run.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/render_runtime_summary.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/inventory_skill_ergonomics.py --repo-root . --summary`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/inventory_standing_gate_verbosity.py --repo-root . --summary`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/inventory_standing_test_economics.py --repo-root . --summary`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/inventory_structural_waste.py --repo-root . --json`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/run-verify.test.mjs`
- `npm run verify:runtime`
- delegated fresh-eye review by subagent `Pascal`

## Recommended Next Quality Moves

- active collect several `verify:runtime` samples before setting budgets — capability_needed=runtime budget discipline; next_center=.agents quality runtime profile; transformation=derive advisory thresholds from observed medians; proof_boundary=runtime summary with stable median window; enforcement_posture=advisory.
- passive add phase budgets because one local sample window is not enough to make fair hard gates; capability_needed=runtime budget enforcement; next_center=quality adapter runtime budget profile; transformation=budget top standing phases; proof_boundary=budgeted runtime summary; enforcement_posture=no-gate until samples stabilize.
- passive define `verify` parallel groups until dependency and mutation boundaries are explicit; capability_needed=faster standing gate; next_center=`scripts/run-verify.mjs`; transformation=parallelize independent lint/security/test groups; proof_boundary=full verify plus runtime comparison; enforcement_posture=no-gate.
- passive address Cautilus Agent ergonomics until the next skill-surface slice because this run did not change skill packages; capability_needed=progressive disclosure; next_center=Cautilus Agent `SKILL.md` and references; transformation=reduce core pressure and fix reference discoverability; proof_boundary=skill ergonomics inventory plus prose review; enforcement_posture=existing advisory.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
