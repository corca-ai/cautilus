# Release Surface Check
Date: 2026-06-22

## Scope

Prepared `cautilus` release `0.17.1` (tag `v0.17.1`) through release prep and pre-publish verification.
This is a patch release for the maintained `dev/skill` evaluation surface.

The release covers the patch range after `v0.17.0`:

- `9289cf65`: makes standard Claude dev/skill execution evidence observe delegated subagent work.
- `1846279f`: adds cache-read-excluded token budget views for dev/skill evaluation summaries.
- `b6ba4d1c`: prepares the checked-in version, package lock, marketplace metadata, and packaged plugin surfaces for `v0.17.1`.

The public product shape remains stable: installable Cautilus CLI, bundled Cautilus Agent, checked-in plugin metadata, and GitHub binary release artifacts.
Episode-runner transcript discovery is not included in `v0.17.1`; it is tracked separately as GitHub issue #50.

## Current Version

- previous version: `0.17.0`
- target version: `0.17.1`
- git branch: `main`
- git remote: `origin`

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
- `python3 scripts/check_cli_skill_surface.py --repo-root . --adapter-path .agents/release-adapter.yaml --run-probes --changed-path scripts/check_cli_skill_surface.py --json`: passed.

The first `publish_release.py --execute` attempt stopped before remote push or tag creation because `scripts/check_cli_skill_surface.py` was missing.
The wrapper has been added and verified; branch/tag publish and GitHub release creation are pending the next clean-tree publish helper run.

## Release State

- local release mutation: complete
- branch/tag push: pending after interrupted publish attempt
- GitHub release record: target URL `https://github.com/corca-ai/cautilus/releases/tag/v0.17.1`; creation pending branch/tag push
- public release surface verification: pending publish
- audit narrative: durable record written to `charness-artifacts/release/latest.md`

## Public Release Verification

- GitHub release publication: pending.
- Public binary assets: pending GitHub release creation.
- Public source tag `v0.17.1`: pending.

## Release Adapter Preflight

- Release adapter focused preflight status: `not_required`.
- Reason: release adapter did not change in the release delta.

## Review Proof

- Code critique: `charness-artifacts/critique/2026-06-22-uncached-token-threshold-critique.md`.
- Release critique: `charness-artifacts/critique/2026-06-22-v0.17.1-release-critique.md`.
- Debug review: `charness-artifacts/debug/2026-06-22-release-helper-cli-surface-wrapper.md`.

## Issue Closeout

- Issue #49: closed before release prep.
- Issue #50: filed for deferred episode-runner transcript discovery.

## User Update Steps

- Operators with an existing install refresh the binary via the install-sh channel after publication: re-run `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
- Claude Code and Codex plugin consumers pick up the Cautilus Agent refresh via `charness update` or by re-running `cautilus init` in the host repo.
