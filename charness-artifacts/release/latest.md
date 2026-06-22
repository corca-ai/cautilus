# Release Record
Date: 2026-06-22

## Summary

Released Cautilus `v0.17.1`.

## Release Scope

Patch release.
The bump level is patch because this release repairs and tightens the maintained `dev/skill` evaluation surface without changing the install contract, command names, or public release artifact shape.

This release covers the patch range after `v0.17.0`:

- `9289cf65`: makes standard Claude dev/skill execution evidence observe delegated subagent work.
- `1846279f`: adds cache-read-excluded token budget views for dev/skill evaluation summaries.

The public product shape remains stable: installable Cautilus CLI, bundled Cautilus Agent, checked-in plugin metadata, and GitHub binary release artifacts.

## Shipped Changes

- **Delegated Claude work observation:** standard Claude dev/skill runs now read the parent stream-json transcript plus same-session `subagents/*.jsonl` transcripts when a session id is available.
  This keeps required command-fragment evidence from undercounting work performed by delegated Claude subagents.
- **Safer command evidence capture:** command text extraction now includes scalar tool inputs such as `file_path`, scopes same-session transcript lookup to the workspace-derived Claude project when workspace context is available, and preserves subagent transcript artifact refs on failure.
- **Uncached token budget views:** dev/skill evaluation packets can now preserve and threshold `uncached_tokens`, `median_run_uncached_tokens`, and `peak_run_uncached_tokens`.
  `uncached_tokens` is the collapsed median-view value, while the other two fields preserve per-run median and peak budget pressure.
- **JS/Go parity:** JavaScript and Go evaluation paths now accept the same uncached metric and threshold fields, preserve explicit backend-provided uncached metrics, treat missing cache-read telemetry as zero, and keep baseline metric normalization aligned.
- **Contract and agent reference sync:** skill evaluation/testing contracts and Cautilus Agent references document the new budget views, including source, packaged plugin, and `.agents` copies.

## Explicit Non-Scope

Episode-runner transcript discovery is not included in `v0.17.1`.
It is tracked separately as GitHub issue #50.

This release does not claim npm publication, public Claude/Codex marketplace publication, a breaking CLI command change, or an install/update contract change.

## Review

- Code critique: full — bounded fresh-eye reviewers found and the implementation fixed missing-cache-read false passes, explicit uncached metric overwrites, Go baseline normalization drift, and stale agent-facing references.
- Counterweight critique: full — no remaining Act Before Ship concerns; mixed explicit uncached metrics versus conflicting telemetry is valid but deferred.
- Release critique: full — bounded release reviewers required `0.17.1` version prep, full `v0.17.0..HEAD` narrative coverage, committed critique evidence, and post-prep release gates before tagging.
- Critique artifacts:
  - `charness-artifacts/critique/2026-06-22-uncached-token-threshold-critique.md`
  - `charness-artifacts/critique/2026-06-22-v0.17.1-release-critique.md`

## Verification

Pre-release gates run before release prep:

- `node --test scripts/agent-runtime/evaluate-skill.test.mjs scripts/agent-runtime/run-local-skill-test.test.mjs`: passed.
- `go test ./internal/runtime -run 'TestBuildSkillEvaluationSummaryUsesCacheExcludedTokenThreshold|TestBuildSkillEvaluationSummaryDoesNotReuseCandidateTelemetryForBaseline|TestBuildSkillEvaluationSummaryPreservesExplicitBaselineUncachedMetrics|TestNormalizeSkillTestCaseSuiteAcceptsCacheExcludedTokenThreshold'`: passed.
- `npm run lint:eslint -- scripts/agent-runtime/skill-test-observed.mjs scripts/agent-runtime/skill-evaluation-runs.mjs scripts/agent-runtime/skill-evaluation-normalizers.mjs scripts/agent-runtime/skill-test-telemetry.mjs scripts/agent-runtime/skill-test-case-suite.mjs scripts/agent-runtime/run-local-skill-test.test.mjs scripts/agent-runtime/evaluate-skill.test.mjs`: passed.
- `npm run test`: passed.
- `npm run verify`: passed.
- `npm run hooks:check`: passed.
- `npm run lint:skill-disclosure`: passed.
- `./bin/cautilus doctor commands --json`: passed.
- `./bin/cautilus discover scenarios --json`: passed.
- `./bin/cautilus doctor --repo-root . --scope agent-surface`: passed.
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.53.0/scripts/check_cli_skill_surface.py --repo-root . --adapter-path .agents/release-adapter.yaml --json`: passed.
- Fresh-checkout probes from `.agents/release-adapter.yaml`: passed.

Release prep:

- `npm run release:prepare -- 0.17.1`: passed.
  This aligned `package.json`, `package-lock.json`, `.claude-plugin/marketplace.json`, `plugins/cautilus/.claude-plugin/plugin.json`, and `plugins/cautilus/.codex-plugin/plugin.json`, synced the packaged Cautilus Agent, and confirmed release claim freshness.

Post-prep release gates run before tag publish:

- `npm run hooks:check`: passed.
- `npm run verify`: passed.
- `npm run test:on-demand`: passed.
- fresh-checkout probes from `.agents/release-adapter.yaml`: passed.
- `npm run critique:surface-packet:check`: passed.

## Operator Update Path

Existing binary users update through the existing tagged release path:

- `cautilus update`
- or re-run `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`

Repo-local Cautilus Agent/plugin consumers refresh through the host repo update flow, `charness update`, or by re-running `cautilus init` where appropriate.
