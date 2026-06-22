# Uncached Token Threshold Critique

Date: 2026-06-22
Target: code critique for uncached token aggregate thresholds.
Fresh-Eye Satisfaction: parent-delegated.
Packet Consumed: `charness-artifacts/critique/2026-06-22-113232-packet.md`.

## Change

The slice adds three cache-read-excluded token budget views for dev/skill evaluation:

- `uncached_tokens` / `max_uncached_tokens`
- `median_run_uncached_tokens` / `max_median_run_uncached_tokens`
- `peak_run_uncached_tokens` / `max_peak_run_uncached_tokens`

It keeps episode-runner transcript discovery out of scope and tracks it as GitHub issue #50.

## Fresh-Eye Findings

Acted before ship:

- Repeated-run `max_uncached_tokens` could false-pass when only some samples reported `cache_read_input_tokens`; missing cache-read telemetry now counts as `0` per sample, and regression coverage asserts the resulting threshold findings.
- Single-run explicit uncached metrics could be overwritten by derived metrics; explicit `metrics.uncached_tokens`, `metrics.median_run_uncached_tokens`, and `metrics.peak_run_uncached_tokens` now win.
- Go baseline normalization dropped the new uncached metrics; Go now preserves them, and JS/Go tests cover explicit baseline metric deltas.
- Docs and Cautilus Agent references did not explain the collapsed median-view versus per-run views; source, packaged, and `.agents` references now name the distinction.

Bundle anyway:

- Added end-to-end repeated-run coverage that feeds generated metrics into `buildSkillEvaluationSummary`.

## Counterweight Triage

Act Before Ship: none remaining.

Bundle Anyway: none remaining.

Over-Worry:

- Changing `uncached_tokens` to a sum across repeated runs would contradict the now-explicit collapsed median-view contract.
- Reopening episode-runner transcript discovery in this slice would violate the scoped deferral to issue #50.

Valid but Defer:

- Mixed per-sample inputs that provide both explicit `metrics.uncached_tokens` and conflicting total/cache telemetry may need a future contract decision.

## Verification

- `node --test scripts/agent-runtime/evaluate-skill.test.mjs scripts/agent-runtime/run-local-skill-test.test.mjs`
- `go test ./internal/runtime -run 'TestBuildSkillEvaluationSummaryUsesCacheExcludedTokenThreshold|TestBuildSkillEvaluationSummaryDoesNotReuseCandidateTelemetryForBaseline|TestBuildSkillEvaluationSummaryPreservesExplicitBaselineUncachedMetrics|TestNormalizeSkillTestCaseSuiteAcceptsCacheExcludedTokenThreshold'`
- `npm run lint:eslint -- scripts/agent-runtime/skill-test-observed.mjs scripts/agent-runtime/skill-evaluation-runs.mjs scripts/agent-runtime/skill-evaluation-normalizers.mjs scripts/agent-runtime/skill-test-telemetry.mjs scripts/agent-runtime/skill-test-case-suite.mjs scripts/agent-runtime/run-local-skill-test.test.mjs scripts/agent-runtime/evaluate-skill.test.mjs`
- `npm run test`
- `npm run lint:skill-disclosure`
- `./bin/cautilus doctor commands --json`
- `./bin/cautilus discover scenarios --json`
- `./bin/cautilus doctor --repo-root . --scope agent-surface`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.53.0/scripts/check_cli_skill_surface.py --repo-root . --adapter-path .agents/release-adapter.yaml --json`
