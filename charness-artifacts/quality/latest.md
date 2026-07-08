# Quality Review
Date: 2026-07-08

## Scope

Target boundary: repo-wide quality and test-speed economics for Cautilus as an installable CLI plus Cautilus Agent surface, focused on removing duplicated Node test execution from `verify`.

Ambient repo findings: claim-audit narrowing, pre-push runtime sampling, and Cautilus Agent ergonomics remain separate slices.

## Current Gates

- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/run-verify.test.mjs`
- `npm run test:node:coverage`
- `npm run test:coverage:spec`
- `npm run verify:runtime`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/check_runtime_budget.py --repo-root .`

## Runtime Signals

- runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by `render_runtime_summary.py`; profile `local-verify`.
- runtime hot spots: `lint · specs` 16.1s latest / 25.2s median, budget 35.0s; `test · coverage` 8.2s latest / 5.9s median, budget 10.0s; `test · go race` 7.5s latest / 665ms median; `security · secret scan` 6.8s latest / 6.8s median, budget 12.0s.
- coverage gate: `npm run verify:runtime` ran one `test · coverage` phase that includes both Go coverage and the c8-wrapped Node test run.
- evaluator depth: deterministic local gates only; this slice changed verification orchestration, not agent behavior.

## Healthy

- `scripts/run-verify.mjs` no longer runs standalone `test · node` before `test · coverage`; the duplicated Node test execution was removed from standing `verify`.
- `test:coverage` remains the single standing Node-test executor through `test:node:coverage`, preserving failure propagation and coverage generation.
- `--verbose` still has a spec-reporter escape hatch through `test:coverage:spec` and `test:node:coverage:spec`.
- `scripts/run-verify.test.mjs` now pins that `test:node`, `test:node:coverage`, and `test:node:coverage:spec` use the same Node test glob.
- `.agents/quality-adapter.yaml` no longer budgets the removed `test · node` phase, and `check_runtime_budget.py` passes with the remaining configured phase budgets.
- `npm run verify:runtime` passed with `test · node` absent from the executed phase list.

## Weak

- The latest `verify:runtime` sample was 57.6s because Go race and Go coverage were cold; the median still shows Go race is usually cache-cheap, so it remains unbudgeted.
- `test · coverage` now carries the full Node test proof and measured 8.2s latest / 5.9s median; it is still within the 10.0s local budget.
- `lint · specs` remains the largest standing hotspot by recent median even after earlier adapter caching.
- `claims:audit-evidence` still spends about 6.5s on a standing evidence-hash audit with many warning-only historical references.
- Cautilus Agent skill ergonomics inventory still reports long core, host-surface references, and reference-discoverability pressure for both source and packaged skill copies.

## Missing

- No active-only standing mode exists for `claims:audit-evidence`.
- No CI or slower-machine runtime profile exists to decide whether the local `test · coverage` budget should be portable.
- No post-change median window exists yet with `test · node` removed from every recent sample.

## Deferred

- Tightening the `test · coverage` budget is deferred until more post-change `verify:runtime` samples replace older measurements.
- Adding an active-only claim evidence audit is deferred until current-vs-historical reference semantics are reviewed.
- Making pre-push use `verify:runtime` is deferred because this slice changed the runner contract, not hook policy.
- Cautilus Agent progressive-disclosure cleanup remains a separate skill-surface quality slice.

## Advisory

- structural review result: command: `inventory_standing_test_economics.py --repo-root . --summary` showed shared Node runner snippets, so the weak capability was faster standing verification without weakening Node test proof.
- prose review result: command: `node --test ... scripts/run-verify.test.mjs` now proves the phase list, verbose mapping, and Node glob parity contract.
- runtime interpretation: command: `render_runtime_summary.py --repo-root . --json` shows `test · node` removed from current execution while `test · coverage` absorbed the proof cost.
- budget interpretation: command: `check_runtime_budget.py --repo-root .` reports all remaining `local-verify` budgets OK after removing the stale `test · node` budget.
- delegated review result: subagent `Plato` confirmed the optimization is safe for standing `verify` if the coverage runner keeps the same Node test glob and the verbose path is preserved.

## Delegated Review

- Delegated Review: executed by subagent `Plato`; status `completed`; scope `read-only safety review for removing standalone test · node from verify`.
- Slow-gate lenses applied: fixture-economics, parallel-critical-path, duplicated-proof.
- Reviewer verdict: safe as a standing verify speed optimization because `test:node` and `test:node:coverage` use the same Node test glob and c8 propagates test failures.
- Reviewer-requested guard: add a contract test pinning glob parity across `test:node`, `test:node:coverage`, and `test:node:coverage:spec`; implemented.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/resolve_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/bootstrap_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/resolve_quality_artifact.py --repo-root . --intent current`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/plan_quality_run.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/check_runtime_budget.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/render_runtime_summary.py --repo-root . --json`
- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/run-verify.test.mjs`
- `npm run test:node:coverage`
- `npm run test:coverage:spec`
- `npm run verify:runtime`
- delegated safety review by subagent `Plato`

## Recommended Next Quality Moves

- active add a standing active-only mode for `claims:audit-evidence` after reviewing current-vs-historical reference semantics — capability_needed=faster standing claim audit; next_center=`scripts/agent-runtime/audit-claim-evidence-hashes.mjs`; transformation=keep full audit on demand and use active refs in standing verify; proof_boundary=focused tests plus before/after timed verify; enforcement_posture=advisory.
- active collect several post-change `verify:runtime` samples before tightening `test · coverage` or `lint · specs` budgets — capability_needed=runtime budget discipline; next_center=.agents quality runtime profile; transformation=lower budgets only after the recent median reflects current runner shape; proof_boundary=budgeted runtime summary; enforcement_posture=advisory.
- passive consider routing pre-push through `verify:runtime` because runtime samples are useful but this changes local hook behavior — capability_needed=runtime trend visibility; next_center `.githooks/pre-push`; transformation=write ignored runtime samples during maintainer push; proof_boundary=hook tests plus `hooks:check`; enforcement_posture=no-gate until maintainer policy is accepted.
- passive clean Cautilus Agent ergonomics in a separate skill-surface slice because this run did not edit skill packages — capability_needed=progressive disclosure; next_center=Cautilus Agent `SKILL.md` and references; transformation=reduce core pressure and improve reference discoverability; proof_boundary=skill ergonomics inventory plus prose review; enforcement_posture=existing advisory.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
