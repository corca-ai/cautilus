# Debug Review: Claude refresh-flow parity
Date: 2026-04-27

## Problem

`npm run dogfood:cautilus-refresh-flow:eval:claude` initially failed to produce an `accept-now` result for the same two-turn `$cautilus` refresh-flow episode that Codex already passed.
The first failure blocked before turn 1 completed; later failures completed the episode but the audit rejected valid Claude command and Korean wording variants.

## Correct Behavior

Given the `dev / skill` refresh-flow fixture declares two ordered turns (`$cautilus`, then `1`), when the adapter runs it with `--runtime claude`, then the runner should drive a real resumable Claude CLI episode, audit the combined transcript, and accept the run when Claude reads `agent status`, writes a `claim discover --previous --refresh-plan` artifact, reads `refreshSummary`, and does not update the saved claim map or overrun into review/eval/edits/commits.

## Observed Facts

- The existing Claude skill backend only supported single-prompt JSON responses; multi-turn episode execution was Codex-only.
- Claude Code supports `--output-format stream-json`, `--verbose`, and `--resume <session-id>` for resumable non-interactive episodes.
- The first Claude episode attempt exited with `Error: Input must be provided either through stdin or as a prompt argument when using --print`.
- The cause was the runner passing the prompt as a positional argument after `--allowedTools`; Claude treats `--allowedTools` as a multi-value option, so the prompt was consumed as tool configuration.
- After switching to stdin, the adapter still rejected the first real attempt because `allowedTools` was too narrow for the skill's `CAUTILUS_BIN=...; "$CAUTILUS_BIN" ...` Bash snippet.
- After broadening the disposable-worktree eval to `Bash(*)`, Claude executed the intended commands, but the audit still rejected `$CAUTILUS_BIN` command forms and Korean wording such as `저장된 클레임 맵`, `변경되지 않았습니다`, and `그대로 두었습니다`.

## Reproduction

```bash
npm run dogfood:cautilus-refresh-flow:eval:claude
jq '{recommendation, evaluationCounts}' artifacts/self-dogfood/cautilus-refresh-flow-eval-claude/latest/eval-summary.json
jq '.' artifacts/self-dogfood/cautilus-refresh-flow-eval-claude/latest/refresh-flow/episode-cautilus-refresh-flow/audit.json
```

Before the fixes, the command completed with `recommendation=reject`.

## Candidate Causes

- Claude CLI may not support non-interactive resumable episodes.
- The runner may be passing CLI arguments in a shape that works for Codex but not Claude.
- The adapter permission surface may be too narrow for the actual bundled skill command pattern.
- The audit may be overfit to Codex JSONL and English/Codex-style command strings.

## Hypothesis

If the Claude episode runner sends prompts through stdin, resumes by the first turn's `session_id`, allows Bash in the disposable candidate worktree, and the audit recognizes Claude stream-json tool calls plus variable-backed `cautilus` invocations and Korean boundary wording, then the same refresh-flow fixture should pass under both Codex and Claude.

## Verification

Added Claude stream-json command/message normalization to the shared session summarizer.
Added `scripts/agent-runtime/skill-test-claude-episode.mjs` and routed multi-turn `claude_code` skill cases through it.
Changed the refresh-flow adapter's Claude tool allowance to `Bash(*)` inside the disposable candidate workspace.
Expanded refresh-flow audit patterns to accept `$CAUTILUS_BIN`, multiline Bash commands, `저장된 클레임 맵`, `변경되지`, `갱신 안 함`, and `그대로 두`.
Ran:

```bash
node --test scripts/agent-runtime/codex-session-summary.test.mjs scripts/agent-runtime/audit-cautilus-refresh-flow-log.test.mjs scripts/agent-runtime/run-local-skill-test.test.mjs
npm run dogfood:cautilus-refresh-flow:eval:codex
npm run dogfood:cautilus-refresh-flow:eval:claude
```

Both live eval runs returned `recommendation=accept-now`, `passed=1`, `failed=0`.

## Root Cause

The product had a real Codex multi-turn episode path, but Claude support stopped at single-prompt execution.
The first parity attempt also exposed two adapter/audit assumptions: tool permissions were matched to literal command snippets rather than the bundled skill's actual Bash wrapper, and the audit recognized Codex-shaped command strings and English wording better than Claude's natural Korean output.

## Seam Risk

- Interrupt ID: claude-refresh-flow-parity
- Risk Class: none
- Seam: coding-agent CLI transcript shape and permission policy across Codex and Claude
- Disproving Observation: Claude could perform the intended flow, but the runner and audit initially failed to represent it
- What Local Reasoning Cannot Prove: whether future agents will choose semantically equivalent wording outside the audit's accepted language variants
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep multi-turn skill eval support runtime-neutral where possible, but preserve per-runtime transcript adapters where the host JSONL shape differs.
For write-capable live agent evals, keep broad shell permission scoped by disposable candidate worktrees and product-owned audit checks rather than brittle literal command allowlists.
When an audit checks coordinator-facing text, accept equivalent Korean and English product terms instead of a single phrasing.
