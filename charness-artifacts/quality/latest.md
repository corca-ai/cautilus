# Quality Review
Date: 2026-07-09

## Scope

Target boundary: repo-wide quality and test-speed economics for Cautilus as an installable CLI plus Cautilus Agent surface, focused on carrying `lint:specs` internal timings from terminal output into structured runtime signals without reducing proof depth.

Ambient repo findings: `lint · specs` remains the largest standing hotspot; structured samples now show `specdown` dominates that phase, followed by strict trace generation.

## Current Gates

- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/lint-specs.test.mjs`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/run-verify.test.mjs scripts/lint-specs.test.mjs`
- `npm run --silent lint:eslint`
- `npm run --silent lint:specs`
- `npm run verify`
- `npm run verify:runtime`
- `npm run hooks:check`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_debug_artifact.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_quality_artifact.py --repo-root .`

## Runtime Signals

- runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by `render_runtime_summary.py`; `npm run verify:runtime` now stores `lint · specs` subphase samples parsed from the `lint-specs timing:` line.
- runtime hot spots: final `npm run verify:runtime` passed in 48.70s; `lint · specs` latest was 15.99s with subphases `specdown=13.53s`, `trace=2.25s`, `check=10ms`, and `ledger=25ms`; the phase-level summary still ranks `lint · specs` at 16.0s latest / 16.1s median, budget 35.0s.
- coverage gate: final `npm run verify` and `npm run verify:runtime` both ran the standing `test · coverage` phase, wrote Go/Node/combined coverage JSON, and passed `coverage:floor:check`.
- evaluator depth: deterministic local gates only; this slice changed standing-gate observability, not Cautilus Agent behavior, live evaluator prompts, or acceptance scope.

## Healthy

- `lint:specs` now emits one compact success timing line after the existing proof steps have completed.
- `run-verify` now captures only the `lint:specs` stdout stream, replays it unchanged, parses the compact timing line, and attaches subphase timings to the phase result.
- Runtime signal samples for `lint · specs` now preserve bounded recent windows for `check`, `specdown`, `trace`, and `ledger`.
- Full mode still runs spec index/link checks, the full public specdown suite, strict typed trace validation, and generated promise-ledger drift checking.
- Target mode still validates the selected linked specs and runs each selected file as a focused temporary specdown entry.
- Tests now assert the timing line in both target and full modes without coupling to exact elapsed values.
- Maintainer docs now say `lint:specs` reports check/specdown/trace/ledger timing so future slow-gate work starts from measured phases.
- A discovered `govulncheck` failure was resolved by aligning Go toolchain, GitHub workflows, and maintainer docs on Go 1.26.5.
- Claim-source freshness was restored with `npm run claims:refresh:all` after touching `docs/master-plan.md`.

## Weak

- Focused mode reports all selected specdown entries as one `focused` timing bucket, which is enough for standing-gate shape but not per-spec profiling.
- The measured `specdown run` phase remains the dominant cost at 13.54s in this local run.
- `render_runtime_summary.py` still renders hot spots at phase level; the subphase samples are present in JSON but not yet summarized in the markdown helper.
- `lint:specs` stdout is replayed after the child process exits, so a failing `lint:specs` run may not preserve exact stdout/stderr interleaving; stderr still streams live and the phase failure line remains immediate.
- Go patch-level security advisories can still force same-day toolchain bumps; the guard now passes, but the process remains reactive to govulncheck.

## Missing

- No per-spec or per-block specdown runtime report exists yet to identify which executable spec blocks dominate the 13.54s `specdown` phase.
- No policy decision exists yet for whether the history-wide `security:secrets` scan should stay in every standing verify run or split into local/current-tree plus on-demand history proof.

## Deferred

- Changing `specdown run` coverage or scope is deferred because the timing result first needs per-spec evidence, not proof deletion.
- Changing secret-scan scope is deferred because it is a security coverage tradeoff, not just a runtime cleanup.
- Rendering subphase hot spots in the shared `quality` summary helper is deferred because that helper lives in the installed Charness plugin rather than this repo-owned slice.

## Advisory

- implementation result: `scripts/lint-specs.mjs` wraps existing success-path phases in timing helpers and prints the summary only after the same proof steps pass.
- implementation result: `scripts/run-verify.mjs` captures and replays `lint:specs` stdout only for that phase, parses `lint-specs timing:`, and stores subphase samples under the existing runtime profile command summary.
- test result: `scripts/lint-specs.test.mjs` covers timing output for focused target mode and full typed-trace mode; `scripts/run-verify.test.mjs` covers parser behavior, stdout replay, and structured subphase samples.
- runtime result: `npm run verify:runtime` passed and stored `lint · specs` subphase samples with `specdown=13.53s`, `trace=2.25s`, `check=10ms`, and `ledger=25ms`.
- debug result: `npm run verify` first failed on `GO-2026-5856` in `crypto/tls@go1.26.4`; after bumping `go.mod`, workflows, and maintainer docs to Go 1.26.5, `npm run --silent security:govulncheck` and final `npm run verify` passed.
- delegated review result: subagent `Nash` confirmed proof depth and success-path coverage, and found a blocker where tests accepted only `ms` even though implementation can print `s`; the regex was widened and a failure-path negative assertion was added.
- delegated review result: subagent `Hubble` found that a failed `lint:specs` run without a timing line would have overwritten prior subphase history; the runtime merge now preserves previous subphase samples and tests cover that failure shape.

## Delegated Review

- Delegated Review: executed by explorer subagent `Nash`; status `completed`; scope `read-only review of lint-specs timing summary diff`.
- Delegated Review: executed by explorer subagent `Hubble`; status `completed`; scope `read-only review of run-verify subphase runtime-signal diff`.
- Slow-gate lenses applied: fixture-economics, parallel-critical-path, duplicated-proof, executable-spec economics, operator signal.
- Reviewer verdict: proof depth was preserved; one runtime-signal history loss case was fixed before commit, and stdout/stderr interleaving tradeoff is recorded as a weak point.

## Commands Run

- `sed -n '1,260p' scripts/lint-specs.mjs`
- `sed -n '1,320p' scripts/lint-specs.test.mjs`
- `sed -n '1,280p' scripts/run-verify.mjs`
- `sed -n '1,560p' scripts/run-verify.test.mjs`
- `sed -n '1,220p' docs/maintainers/development.md`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/lint-specs.test.mjs`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/run-verify.test.mjs scripts/lint-specs.test.mjs`
- `npm run --silent lint:eslint`
- `npm run --silent lint:specs`
- `go env GOTOOLCHAIN GOVERSION GOROOT GOPATH`
- `npm run --silent security:govulncheck`
- `npm run claims:refresh:all`
- `npm run verify`
- `node scripts/run-verify.mjs --runtime-profile local-test --runtime-signal /tmp/cautilus-runtime-signal-test.json`
- `npm run verify:runtime`
- `npm run hooks:check`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_debug_artifact.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_quality_artifact.py --repo-root .`
- `git diff --check`
- `sed -n '1,260p' /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/references/standing-gate-verbosity.md`
- `sed -n '1,260p' /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/references/executable-spec-economics.md`
- `sed -n '1,260p' /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/references/testability-and-selection.md`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_quality_artifact.py --help`
- delegated read-only review by subagent `Nash`
- delegated read-only review by subagent `Hubble`

## Recommended Next Quality Moves

- active profile `specdown run` internals before changing proof scope — capability_needed=specdown runtime economics; next_center=docs/specs executable blocks and specdown adapter output; transformation=produce per-spec or per-block timing inside the 13.53s `specdown` subphase; proof_boundary=unchanged full spec proof plus measured hot-spot report; enforcement_posture=advisory.
- active evaluate secret-scan split only with an explicit security coverage decision — capability_needed=security/runtime policy; next_center=package scripts and CI workflow; transformation=decide whether current-tree local scan plus on-demand/full-history scan preserves the desired guard; proof_boundary=gitleaks current-tree and history commands; enforcement_posture=needs maintainer decision.
- passive render subphase samples in the shared quality summary later because the repo-owned signal now exists but the renderer is plugin-owned — capability_needed=runtime observability; next_center=Charness `render_runtime_summary.py`; transformation=include top subphase timings when a hot phase exposes subphase samples; proof_boundary=runtime summary fixture plus unchanged phase-level ranking; enforcement_posture=advisory.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
