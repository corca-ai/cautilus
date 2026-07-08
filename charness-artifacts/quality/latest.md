# Quality Review
Date: 2026-07-09

## Scope

Target boundary: repo-wide quality and test-speed economics for Cautilus as an installable CLI plus Cautilus Agent surface, focused on making the merged `lint:specs` standing gate observable without reducing proof depth.

Ambient repo findings: `lint · specs` remains the largest standing hotspot; the next useful work is inside `specdown run`, not the already-cheap promise-ledger drift check.

## Current Gates

- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/lint-specs.test.mjs`
- `npm run --silent lint:eslint`
- `npm run --silent lint:specs`
- `npm run claims:refresh:all`
- `npm run verify`
- `npm run hooks:check`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_debug_artifact.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_quality_artifact.py --repo-root .`

## Runtime Signals

- runtime source: direct `npm run --silent lint:specs` and final `npm run verify` measurements from this slice plus the existing `.charness/quality/runtime-signals.json` local-verify profile rendered by `render_runtime_summary.py`.
- runtime hot spots: final `npm run verify` passed in 77.67s and `lint:specs` printed `lint-specs timing: check=11ms, specdown=13.52s, trace=2.33s, ledger=24ms, total=15.89s`; the current internal hot spot remains the public `specdown run` phase, followed by strict trace generation, while the broader profile remains renderable by `render_runtime_summary.py`.
- coverage gate: final `npm run verify` ran the standing `test · coverage` phase, wrote Go/Node/combined coverage JSON, and passed `coverage:floor:check`.
- evaluator depth: deterministic local gates only; this slice changed standing-gate observability, not Cautilus Agent behavior, live evaluator prompts, or acceptance scope.

## Healthy

- `lint:specs` now emits one compact success timing line after the existing proof steps have completed.
- Full mode still runs spec index/link checks, the full public specdown suite, strict typed trace validation, and generated promise-ledger drift checking.
- Target mode still validates the selected linked specs and runs each selected file as a focused temporary specdown entry.
- Tests now assert the timing line in both target and full modes without coupling to exact elapsed values.
- Maintainer docs now say `lint:specs` reports check/specdown/trace/ledger timing so future slow-gate work starts from measured phases.
- A discovered `govulncheck` failure was resolved by aligning Go toolchain, GitHub workflows, and maintainer docs on Go 1.26.5.
- Claim-source freshness was restored with `npm run claims:refresh:all` after touching `docs/master-plan.md`.

## Weak

- The timing line is process-local and advisory; it is not yet merged into `.charness/quality/runtime-signals.json`.
- Focused mode reports all selected specdown entries as one `focused` timing bucket, which is enough for standing-gate shape but not per-spec profiling.
- The measured `specdown run` phase remains the dominant cost at 13.54s in this local run.
- Go patch-level security advisories can still force same-day toolchain bumps; the guard now passes, but the process remains reactive to govulncheck.

## Missing

- No per-spec or per-block specdown runtime report exists yet to identify which executable spec blocks dominate the 13.54s `specdown` phase.
- No policy decision exists yet for whether the history-wide `security:secrets` scan should stay in every standing verify run or split into local/current-tree plus on-demand history proof.

## Deferred

- Feeding `lint-specs timing` into the structured runtime signal store is deferred until the output proves stable across a few local runs.
- Changing `specdown run` coverage or scope is deferred because the timing result first needs per-spec evidence, not proof deletion.
- Changing secret-scan scope is deferred because it is a security coverage tradeoff, not just a runtime cleanup.

## Advisory

- implementation result: `scripts/lint-specs.mjs` wraps existing success-path phases in timing helpers and prints the summary only after the same proof steps pass.
- test result: `scripts/lint-specs.test.mjs` covers timing output for focused target mode and full typed-trace mode.
- runtime result: `npm run --silent lint:specs` passed and the final `npm run verify` reported `specdown=13.52s`, `trace=2.33s`, and `ledger=24ms` inside the standing gate.
- debug result: `npm run verify` first failed on `GO-2026-5856` in `crypto/tls@go1.26.4`; after bumping `go.mod`, workflows, and maintainer docs to Go 1.26.5, `npm run --silent security:govulncheck` and final `npm run verify` passed.
- delegated review result: subagent `Nash` confirmed proof depth and success-path coverage, and found a blocker where tests accepted only `ms` even though implementation can print `s`; the regex was widened and a failure-path negative assertion was added.

## Delegated Review

- Delegated Review: executed by explorer subagent `Nash`; status `completed`; scope `read-only review of lint-specs timing summary diff`.
- Slow-gate lenses applied: fixture-economics, parallel-critical-path, duplicated-proof, executable-spec economics, operator signal.
- Reviewer verdict: proof depth and failure behavior were preserved, but test regexes needed to accept both `ms` and `s` duration formats before commit.

## Commands Run

- `sed -n '1,260p' scripts/lint-specs.mjs`
- `sed -n '1,320p' scripts/lint-specs.test.mjs`
- `sed -n '1,220p' docs/maintainers/development.md`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/lint-specs.test.mjs`
- `npm run --silent lint:eslint`
- `npm run --silent lint:specs`
- `go env GOTOOLCHAIN GOVERSION GOROOT GOPATH`
- `npm run --silent security:govulncheck`
- `npm run claims:refresh:all`
- `npm run verify`
- `npm run hooks:check`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_debug_artifact.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_quality_artifact.py --repo-root .`
- `git diff --check`
- `sed -n '1,260p' /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/references/standing-gate-verbosity.md`
- `sed -n '1,260p' /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/references/executable-spec-economics.md`
- `sed -n '1,260p' /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/references/testability-and-selection.md`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_quality_artifact.py --help`
- delegated read-only review by subagent `Nash`

## Recommended Next Quality Moves

- active profile `specdown run` internals before changing proof scope — capability_needed=specdown runtime economics; next_center=docs/specs executable blocks and specdown adapter output; transformation=produce per-spec or per-block timing for the 13.54s phase; proof_boundary=unchanged full spec proof plus measured hot-spot report; enforcement_posture=advisory.
- active evaluate secret-scan split only with an explicit security coverage decision — capability_needed=security/runtime policy; next_center=package scripts and CI workflow; transformation=decide whether current-tree local scan plus on-demand/full-history scan preserves the desired guard; proof_boundary=gitleaks current-tree and history commands; enforcement_posture=needs maintainer decision.
- passive integrate `lint-specs timing` into runtime-signal capture later because the printed contract should stabilize before structured ingestion — capability_needed=runtime observability; next_center=scripts/run-verify.mjs and runtime summary rendering; transformation=parse compact phase timings into structured samples; proof_boundary=runtime sample fixture plus unchanged green output; enforcement_posture=advisory.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
