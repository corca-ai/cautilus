# Quality Review
Date: 2026-07-08

## Scope

Target boundary: repo-wide code quality and test-speed economics for Cautilus as installable CLI plus Cautilus Agent surface, focused on making `verify:runtime` samples budget-readable instead of only observable.

Ambient repo findings: Cautilus Agent skill ergonomics and future verify parallelism remain separate quality slices, not fixed here.

## Current Gates

- `npm run verify:runtime`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/run-verify.test.mjs`
- `npm run lint:eslint`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/check_runtime_budget.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/render_runtime_summary.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/resolve_adapter.py --repo-root .`

## Runtime Signals

- runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by `render_runtime_summary.py`; profile `local-verify`.
- sample sufficiency: `local-verify` now has 5 passing full-run samples for every verify phase; `lint · eslint` has 6 samples because the initial parser-complexity failure recorded a partial first phase.
- runtime hot spots: `lint · specs` 25.2s latest / 25.6s median, budget 35.0s; `security · secret scan` 6.8s latest / 6.8s median, budget 12.0s; `lint · claim evidence hashes` 6.3s latest / 6.3s median, budget 9.0s; `lint · eslint` 5.8s latest / 4.1s median, budget 8.0s; `test · coverage` 3.8s latest / 5.9s median, budget 10.0s.
- coverage gate: five `npm run verify:runtime` passes included `test:coverage` and `coverage:floor:check`; the floor check reported 141 floored files, 0 exempted, 19 in warn-band, and 36 cleared drift-lock.
- budget check: `check_runtime_budget.py --repo-root .` reports all configured `local-verify` budgets OK and no missing samples.
- evaluator depth: deterministic local gates only; no live Cautilus evaluation was needed because the slice changed local runtime signal and adapter budget behavior, not agent behavior.

## Healthy

- `verify:runtime` now records under an explicit `local-verify` runtime profile instead of relying only on an automatic CPU fingerprint.
- `.agents/quality-adapter.yaml` now configures `runtime_budget_profiles.local-verify.budgets` for the dominant standing phases.
- `render_runtime_summary.py --json` now reports `runtime_visibility_findings: []` and annotates hot spots with budgets.
- `scripts/run-verify.mjs` keeps `--runtime-profile` and `CHARNESS_RUNTIME_PROFILE` support while preserving bounded sample merge behavior.
- The parser-complexity regression found during sampling was resolved by extracting pending-value handling; eslint and focused runner tests pass.

## Weak

- The runtime budgets are advisory quality-review budgets, not a standing pre-push failure gate.
- `lint · specs` remains the dominant standing cost at about 25-26s median.
- `test · go race` shows cache sensitivity: one `local-verify` sample was 7.5s while the recent median is 0.64s, so it is intentionally unbudgeted for now.
- Cautilus Agent skill ergonomics inventory still reports long core, host-surface reference, and reference-discoverability pressure across source and packaged skill copies.

## Missing

- No CI or slower-machine runtime profile is configured yet.
- No deterministic slow-phase ratchet exists for new or regressing verify phases beyond the advisory budget checker.
- No bounded parallel group contract exists for `scripts/run-verify.mjs`; the current loop stays serial.

## Deferred

- Promoting runtime budgets into a standing gate is deferred until a CI or slower-machine profile exists or maintainers accept the local-only tradeoff.
- Parallelizing `verify` is deferred until phase dependency groups are explicit and a before/after runtime comparison can prove benefit.
- Cautilus Agent progressive-disclosure cleanup remains a separate skill-surface quality slice.

## Advisory

- structural review result: the weak downstream capability was runtime budget discipline; the next center moved from auto-profile samples to a named `local-verify` profile with adapter-owned budgets.
- prose review result: command evidence from five `npm run verify:runtime` passes, `check_runtime_budget.py`, `render_runtime_summary.py --json`, `npm run lint:eslint`, and focused runner tests shows the local proof path stayed deterministic while improving operator signal.
- runtime interpretation: the top cost is a real standing cost for this repo (`lint · specs`), but the current optimization move is budget visibility, not pruning or parallelizing proof.
- duplicated-proof advisory: `test:coverage` still reruns Go and Node tests after `test:go:race` and `test:node`; this remains a candidate only after dependency and proof overlap are mapped.

## Delegated Review

- Delegated Review: executed by subagent `Mendel`; status `completed`; lens `runtime-test-economics`.
- Slow-gate lenses applied: `fixture-economics`, `parallel-critical-path`, `duplicated-proof`, `operator-signal`, `adapter/runtime-budget-policy`, and `cache-sensitive-phase-review`.
- Reviewer disposition: 5 samples were sufficient for advisory/profile-aware budgets, but the initial global `runtime_budgets` patch risked applying one 36CPU machine's thresholds to other runners.
- Action taken: added explicit `--runtime-profile local-verify`, moved budgets into `runtime_budget_profiles.local-verify`, and kept them out of the standing gate.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/plan_quality_run.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/render_runtime_summary.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/check_runtime_budget.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/resolve_adapter.py --repo-root .`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/run-verify.test.mjs`
- `npm run lint:eslint`
- `npm run verify:runtime` five passing `local-verify` runs
- delegated fresh-eye review by subagent `Mendel`

## Recommended Next Quality Moves

- active decide whether to collect a CI or slower-machine runtime profile — capability_needed=runtime budget portability; next_center=.agents quality runtime profiles; transformation=add a second named profile only after real samples; proof_boundary=budgeted runtime summary for that profile; enforcement_posture=advisory.
- passive map `lint · specs` internals before optimizing because this slice only established runtime budgets, not a safe proof-reduction plan — capability_needed=faster standing gate; next_center=spec lint runner; transformation=identify whether the 25s median is necessary proof or avoidable orchestration cost; proof_boundary=before/after runtime summary; enforcement_posture=no-gate.
- passive define `verify` parallel groups after dependency review because the current runner order is serial and no dependency packet exists yet — capability_needed=faster standing gate; next_center=`scripts/run-verify.mjs`; transformation=parallelize independent lint/security/test groups; proof_boundary=full verify plus runtime comparison; enforcement_posture=no-gate.
- passive address Cautilus Agent ergonomics in a separate skill-surface slice because this run did not edit skill packages — capability_needed=progressive disclosure; next_center=Cautilus Agent `SKILL.md` and references; transformation=reduce core pressure and fix reference discoverability; proof_boundary=skill ergonomics inventory plus prose review; enforcement_posture=existing advisory.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
