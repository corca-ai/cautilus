# Issue 49 Resolution Critique
Date: 2026-06-22

## Execution

Fresh-eye code critique ran with three bounded read-only angle reviewers and one separate counterweight reviewer.

## Fresh-Eye Satisfaction

parent-delegated

## Packet Consumed

charness-artifacts/critique/2026-06-22-104735-packet.md

## Target

code critique

## Change

Resolve corca-ai/cautilus#49 by widening Claude `dev/skill` command-fragment observation from parent stream-json only to parent plus same-session subagent transcripts, and by adding `max_uncached_tokens` as a cache-read-excluded budget threshold.

## Diff Scope

- `scripts/agent-runtime/skill-test-claude-backend.mjs` now reads same-session Claude subagent transcript files, records subagent transcript artifact refs, captures real scalar tool input fields such as `file_path`, and treats observed stream-json with no commands as an empty command log rather than unavailable evidence.
- JS and Go skill evaluation paths now normalize and evaluate `max_uncached_tokens`, including baseline telemetry isolation, with contract docs and regression tests.

## Angles

- Michael Jackson / problem framing: checked whether the diff solved the reported undercount rather than a convenient parent-transcript-only variant.
- Gerald Weinberg / diagnostic: checked whether the budget and baseline fixes reached the causal data path in both JS and Go.
- Atul Gawande / operational checklist: checked artifact preservation, false-pass risks, and operator-visible failure modes.
- Counterweight: separated issue-scope blockers from broader runner-observability expansion.

## Findings

### Act Before Ship

- Baseline evaluation inherited candidate telemetry when `max_uncached_tokens` was present, which could distort `baselineStatus` and `relativeStatus`.
  Fixed by adding optional `baseline.telemetry` normalization and forcing baseline evaluation to use baseline telemetry or no telemetry, never candidate telemetry.

### Bundle Anyway

- The first subagent transcript test used synthetic `description` input rather than real Claude `Read { file_path }` shape.
  Fixed by capturing scalar tool input fields and changing the regression test to `file_path`.
- A workspace-scoped Claude run could false-pass if discovery fell back to another project tree with the same session id.
  Fixed by using only the workspace-derived Claude project when `workspace` is supplied, with a duplicate-session regression test.
- Failure paths could omit subagent transcript artifact refs.
  Fixed by adding subagent refs before process and parse failure returns.
- Observed stream-json with no tool commands previously collapsed to `null`, making required command fragments a no-op.
  Fixed by returning an empty command log for observed stream-json and preserving `null` only for unavailable transcript modes.

### Valid But Defer

- Multi-turn Claude episode cases still use their existing episode audit path and do not consume on-disk subagent transcripts.
  This is a separate episode-runner observability slice, not required for issue #49's parent-stdout undercount in the standard runner.
- Repeated-run `max_uncached_tokens` aggregation currently computes `median(total_tokens) - median(cache_read_input_tokens)`, not median per-run uncached tokens.
  This is a real aggregation semantics follow-up, but outside this issue's immediate cache-read-excluded threshold surface.

### Over-Worry

- A broad observation-scope diagnostic taxonomy is not needed for this issue after observed stream-json now yields an empty command log that fails required fragments.
- Scanning all Claude projects is not a current false-pass risk when `workspace` is supplied; the fallback now applies only when no workspace is known.

## Counterweight Triage

- Act Before Ship: baseline telemetry isolation.
- Bundle Anyway: real `Read.file_path` fixture, workspace-scoped project lookup, failure-path artifact refs, empty observed command log.
- Valid but Defer: episode-runner transcript discovery, repeated-run per-sample uncached aggregation.
- Over-Worry: broader diagnostics taxonomy for this issue.

## Deliberately Not Doing

This slice does not add live Claude subagent dogfood, episode-runner transcript discovery, or per-sample uncached-token aggregation.
Those are valid future hardening slices but would expand issue #49 beyond the two reported gaps.

## Verification

- `node --test scripts/agent-runtime/skill-test-claude-backend.test.mjs scripts/agent-runtime/evaluate-skill.test.mjs scripts/agent-runtime/run-local-skill-test.test.mjs`
- `go test ./internal/runtime -run 'TestBuildSkillEvaluationSummaryUsesCacheExcludedTokenThreshold|TestBuildSkillEvaluationSummaryDoesNotReuseCandidateTelemetryForBaseline|TestNormalizeSkillTestCaseSuiteAcceptsCacheExcludedTokenThreshold'`
- `npm run lint:eslint -- scripts/agent-runtime/skill-test-claude-backend.mjs scripts/agent-runtime/skill-evaluation-runs.mjs scripts/agent-runtime/skill-evaluation-normalizers.mjs`
- `npm run test`
- `npm run verify`
- `npm run hooks:check`

## Next Move

Commit and close issue #49 through the direct-commit carrier.
