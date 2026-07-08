# Quality Review
Date: 2026-07-09

## Scope

Target boundary: repo-wide quality and test-speed economics for Cautilus as an installable CLI plus Cautilus Agent surface, focused on making stored `lint:specs` subphase timings directly inspectable without reducing proof depth.

Ambient repo findings: `lint · specs` remains the largest standing hotspot, and `specdown` still dominates that phase.
The repo now has both machine-readable subphase samples and a repo-owned human-readable reporter for them.

## Current Gates

- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/report-lint-specs-runtime.test.mjs`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/report-lint-specs-runtime.test.mjs scripts/run-verify.test.mjs scripts/lint-specs.test.mjs`
- `npm run --silent verify:lint-specs:subphases`
- `npm run --silent verify:lint-specs:subphases -- --json`
- `npm run --silent lint:eslint`
- `npm run --silent lint:specs`
- `npm run --silent test:node`
- `npm run verify`
- `npm run verify:runtime`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_debug_artifact.py --repo-root .`

## Runtime Signals

- runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by `render_runtime_summary.py`; profile `local-verify`; subphase detail rendered by `npm run --silent verify:lint-specs:subphases`.
- runtime hot spots: `lint · specs` 15.9s latest / 16.0s median, budget 35.0s; `security · secret scan` 6.9s latest / 6.8s median, budget 12.0s; `test · coverage` 3.9s latest / 3.9s median, budget 10.0s; `lint · eslint` 3.5s latest / 3.5s median, budget 8.0s; `security · govulncheck` 1.8s latest / 1.9s median, budget 3.5s.
- coverage gate: final broad runs executed `test · coverage` and `coverage:floor:check`; `scripts/report-lint-specs-runtime.mjs` entered the warn band at 84.69% statement coverage, not a floor regression.
- evaluator depth: deterministic local gates only; this slice changed runtime observability, not Cautilus Agent behavior, live evaluator prompts, or acceptance scope.
- broad gate status: `npm run verify` passed in 37.63s, and serial `npm run verify:runtime` passed in 37.78s.

## Healthy

- `verify:lint-specs:subphases` now renders the stored `lint · specs` subphase samples without requiring operators to inspect raw JSON.
- The reporter exposes source signal status, failed phase, generated time, command latest elapsed time, command latest timestamp, per-subphase timestamps, and warnings.
- The reporter warns when a failed runtime signal may be showing preserved previous subphase samples.
- The reporter warns when subphase sample timestamps are older than the command latest timestamp.
- Text output stays compact for operator use; `--json` provides a stable schema for future tooling.
- The existing `lint:specs` proof depth is unchanged: spec index/link checks, full public specdown suite, strict typed trace validation, and promise-ledger drift checking still run.
- Maintainer docs now point from `verify:runtime` to the new subphase reporter.
- Focused tests cover argument parsing, missing-signal errors, sorted output, text output, JSON CLI output, and stale preserved subphase warnings.

## Weak

- `specdown` remains the dominant measured cost inside `lint:specs`; this slice improves observability rather than reducing runtime.
- Broad coverage-producing gates share the `coverage/` output directory; running `npm run verify` and `npm run verify:runtime` concurrently produced a false coverage-floor failure in one process.
  Treat these as serial gates until coverage output isolation exists.
- Focused mode still reports all selected specdown entries as one `focused` timing bucket.
- The shared Charness runtime summary renderer still reports phase-level hot spots only; the repo-owned reporter covers `lint:specs` specifically.

## Missing

- No per-spec or per-block specdown runtime report exists yet to identify which executable spec blocks dominate the 13.35s `specdown` subphase.
- No policy decision exists yet for whether the history-wide `security:secrets` scan should stay in every standing verify run or split into local/current-tree plus on-demand history proof.

## Deferred

- Changing `specdown run` coverage or scope is deferred until per-spec evidence identifies duplicated or low-signal executable blocks.
- Changing secret-scan scope is deferred because it is a security coverage tradeoff, not just a runtime cleanup.
- Isolating coverage output for concurrent broad gates is deferred; the local operating rule is to run coverage-producing broad gates serially.

## Advisory

- implementation result: `scripts/report-lint-specs-runtime.mjs` reads `.charness/quality/runtime-signals.json` and reports stored `lint · specs` subphase samples.
- implementation result: `package.json` exposes the reporter as `verify:lint-specs:subphases`; evidence command `npm run --silent verify:lint-specs:subphases` printed the current text report.
- implementation result: the reporter includes stale-sample warnings so preserved subphase history is not mistaken for the latest failed run; evidence test `scripts/report-lint-specs-runtime.test.mjs` covers a failed signal with older subphase timestamps.
- debug result: `charness-artifacts/debug/latest.md` records the ESLint complexity failure and stale-sample ambiguity; evidence command `python3 .../validate_debug_artifact.py --repo-root .` passed.
- delegated review result: subagent `Popper` found the stale preserved-sample ambiguity, and the reporter now exposes signal status plus timestamp-based warnings; evidence test `scripts/report-lint-specs-runtime.test.mjs` passed after the fix.
- operator result: concurrent `npm run verify` and `npm run verify:runtime` produced a false coverage-floor failure because both write `coverage/`; serial `npm run verify:runtime` then passed in 37.78s.

## Delegated Review

- Delegated Review: executed by explorer subagent `Popper`; status `completed`; scope `read-only review of lint-specs runtime reporter diff`.
- Slow-gate lenses applied: fixture-economics, parallel-critical-path, duplicated-proof, and operator signal.
- Reviewer verdict: no package wiring or CLI parsing issues found, but the first report shape hid whether subphase samples were preserved from a previous successful run.
- Disposition: fixed before commit with source status fields, command/subphase timestamps, stale-sample warnings, and focused tests.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/find-skills/scripts/resolve_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/find-skills/scripts/list_capabilities.py --repo-root . --recommend-for-task "continue autonomous quality improvement for Cautilus runtime-test economics" --summary`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/resolve_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/plan_quality_run.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/impl/scripts/resolve_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/impl/scripts/survey_verification.py --repo-root .`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/report-lint-specs-runtime.test.mjs`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/report-lint-specs-runtime.test.mjs scripts/run-verify.test.mjs scripts/lint-specs.test.mjs`
- `npm run --silent verify:lint-specs:subphases`
- `npm run --silent verify:lint-specs:subphases -- --json`
- `npm run --silent lint:eslint`
- `npm run --silent lint:specs`
- `npm run --silent test:node`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/render_runtime_summary.py --repo-root . --json`
- `npm run verify`
- `npm run verify:runtime`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_debug_artifact.py --repo-root .`
- delegated read-only review by subagent `Popper`

## Recommended Next Quality Moves

- active profile `specdown run` internals before changing proof scope — capability_needed=specdown runtime economics; next_center=docs/specs executable blocks and specdown adapter output; transformation=produce per-spec or per-block timing inside the 13.35s `specdown` subphase; proof_boundary=unchanged full spec proof plus measured hot-spot report; enforcement_posture=advisory.
- active evaluate secret-scan split only with an explicit security coverage decision — capability_needed=security/runtime policy; next_center=package scripts and CI workflow; transformation=decide whether current-tree local scan plus on-demand/full-history scan preserves the desired guard; proof_boundary=gitleaks current-tree and history commands; enforcement_posture=needs maintainer decision.
- passive isolate coverage output before running broad coverage-producing gates concurrently because normal maintainer operation runs these gates serially, and this slice already records the serial rule without changing coverage infrastructure — capability_needed=operator runtime reliability; next_center=coverage output paths and `run-verify` runtime-signal mode; transformation=separate coverage directories per invocation or keep a documented serial rule; proof_boundary=two concurrent broad runs no longer cross-contaminate coverage floor; enforcement_posture=advisory.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
