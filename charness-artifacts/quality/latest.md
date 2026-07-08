# Quality Review
Date: 2026-07-08

## Scope

Target boundary: repo-wide quality and test-speed economics for Cautilus as an installable CLI plus Cautilus Agent surface, focused on spec-related standing verify overlap.

Ambient repo findings: `lint · specs` remains the largest standing hotspot; `security · secret scan` remains second and still scans full git history.

## Current Gates

- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/lint-specs.test.mjs scripts/agent-runtime/render-promise-ledger.test.mjs scripts/run-verify.test.mjs`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/*.test.mjs scripts/agent-runtime/*.test.mjs`
- `npm run --silent lint:eslint`
- `npm run --silent lint:specs`
- `npm run verify:runtime`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/render_runtime_summary.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/check_runtime_budget.py --repo-root .`

## Runtime Signals

- runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by `render_runtime_summary.py`; profile `local-verify`.
- runtime hot spots: after the change, `lint · specs` 16.0s latest / 16.1s median, budget 35.0s; `security · secret scan` 7.0s latest / 6.8s median, budget 12.0s; `test · coverage` 3.8s latest / 3.8s median, budget 10.0s; `lint · eslint` 3.5s latest / 3.5s median, budget 8.0s; `security · govulncheck` 1.8s latest / 1.9s median, budget 3.5s.
- removed overlap: standalone `lint · promise ledger` no longer runs as a separate `verify` phase; its drift check is executed inside `lint:specs` using the strict trace graph already produced there.
- runtime signal hygiene: full passing runtime samples now drop command labels that did not run, so removed phases do not remain current hot spots; partial failing samples still preserve unobserved phase history.
- coverage gate: `npm run verify:runtime` ran the standing `test · coverage` phase, including Go coverage and the c8-wrapped Node test run.
- evaluator depth: deterministic local gates only; this slice changed spec and runtime-signal orchestration, not agent behavior or live evaluator prompts.

## Healthy

- `lint:specs` now reuses the `specdown trace -strict` JSON graph to check generated promise-ledger drift instead of asking `specdown:ledger:check` to spawn a second trace process.
- `specdown:ledger:check` remains available as a standalone manual/regeneration guard; only the standing `verify` overlap was removed.
- The generated promise-ledger renderer now emits a prose empty state when no cross-cutting rule coverage edges exist, avoiding specdown-invalid header-only tables.
- Runtime signal merging now prunes stale phase labels after full passing runs, so quality summaries reflect the current verify phase surface.
- Documentation now says `npm run lint:specs` covers typed trace and promise-ledger drift.

## Weak

- `lint · specs` remains the top standing hotspot at about 16s latest on this local profile.
- The ledger fold saves a separate roughly 2.1-2.4s phase from `verify`, but it does not reduce the underlying `specdown run` cost inside `lint:specs`.
- Runtime medians for removed phases disappear from the current signal after a passing run; historical comparison for deleted labels must come from git history or prior artifacts.
- Debug artifact validation for all historical debug files still exits 1 because legacy records use older `Risk Class` / `Generalization Pressure` values; the current `latest.md` was validated in the command output before the historical failures.

## Missing

- No deeper specdown suite profiling exists yet to separate `specdown run` block execution cost from trace and check-specs overhead.
- No policy decision exists yet for whether the history-wide `security:secrets` scan should stay in every standing verify run or split into local/current-tree plus on-demand history proof.

## Deferred

- Folding `specdown:project:check` and `specdown:claim-state:check` is deferred; they are only about 0.15-0.19s each and still provide a clear producer/consumer boundary.
- Changing secret-scan scope is deferred because it is a security coverage tradeoff, not just a runtime cleanup.
- Further `lint · specs` optimization should profile specdown execution before changing proof depth.

## Advisory

- structural review result: command `sed -n '1,280p' scripts/lint-specs.mjs` and `sed -n '1,260p' scripts/agent-runtime/render-promise-ledger.mjs` showed `lint:specs` and `specdown:ledger:check` both ran `specdown trace`; the new path keeps one strict trace and reuses its graph for ledger drift.
- runtime result: command `/usr/bin/time -p npm run --silent specdown:ledger:check` measured about 2.09s before folding; command `npm run verify:runtime` passed in 37.73s with no separate promise-ledger phase.
- renderer robustness result: command `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/lint-specs.test.mjs scripts/agent-runtime/render-promise-ledger.test.mjs scripts/run-verify.test.mjs` covers zero-rule generated ledger output so a header-only Markdown table cannot recur.
- runtime hygiene result: command `node -e '...'` over `.charness/quality/runtime-signals.json` reported `ledger-absent`, and focused tests cover partial-run preservation plus full-run stale-label pruning.
- delegated review result: subagent `McClintock` confirmed the ledger folding is the safest immediate overlap removal and recommended preserving standalone `specdown:ledger:check`.

## Delegated Review

- Delegated Review: executed by explorer subagent `McClintock`; status `completed`; scope `read-only review of spec-related verify overlap`.
- Slow-gate lenses applied: fixture-economics, parallel-critical-path, duplicated-proof, executable-spec economics, operator signal.
- Reviewer verdict: ledger check folding is safe if it reuses the strict trace graph and leaves the standalone script available.
- Reviewer follow-up: projection folding is possible later, but must still check both inventory drift and projected page drift.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/resolve_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/resolve_quality_artifact.py --repo-root . --intent current`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/plan_quality_run.py --repo-root . --json`
- `/usr/bin/time -p npm run --silent lint:specs`
- `/usr/bin/time -p npm run --silent specdown:ledger:check`
- `/usr/bin/time -p npm run --silent specdown:project:check`
- `/usr/bin/time -p npm run --silent specdown:claim-state:check`
- `/usr/bin/time -p npm run --silent security:secrets`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/lint-specs.test.mjs scripts/agent-runtime/render-promise-ledger.test.mjs scripts/run-verify.test.mjs`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/*.test.mjs scripts/agent-runtime/*.test.mjs`
- `npm run --silent lint:eslint`
- `npm run --silent lint:specs`
- `npm run verify:runtime`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/render_runtime_summary.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/check_runtime_budget.py --repo-root .`
- delegated read-only review by subagent `McClintock`

## Recommended Next Quality Moves

- active profile `lint · specs` internals before changing proof scope — capability_needed=specdown runtime economics; next_center=scripts/lint-specs.mjs and specdown report/runtime output; transformation=separate `checkSpecs`, `specdown run`, and trace costs with low-noise timings; proof_boundary=runtime sample plus unchanged spec proof; enforcement_posture=advisory.
- active evaluate secret-scan split only with an explicit security coverage decision — capability_needed=security/runtime policy; next_center=package scripts and CI workflow; transformation=decide whether current-tree local scan plus on-demand/full-history scan preserves the desired guard; proof_boundary=gitleaks current-tree and history commands; enforcement_posture=needs maintainer decision.
- passive consider projection folding later because the two remaining phases are only about 0.15-0.19s each — capability_needed=small verify cleanup; next_center=build-goldset-projection.mjs and render-projected-claim-state.mjs; transformation=check inventory and page drift in one process; proof_boundary=stale inventory, stale page, both stale, and invalid projection tests; enforcement_posture=no urgency.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
