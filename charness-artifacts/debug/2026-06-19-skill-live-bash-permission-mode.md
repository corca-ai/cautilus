# Skill live run Debug: dontAsk permission mode blocks Bash, so the no-input orientation degrades

## Problem

Driving the cautilus-agent no-input orientation LIVE (`run-local-skill-test.mjs --backend claude_code --claude-permission-mode dontAsk`) produces `outcome: degraded`: the agent cannot execute `./bin/cautilus doctor status` and orients from cached artifacts instead of the live `cautilus.agent_status.v1` packet.

## Correct Behavior

Given a no-input first-touch orientation run, when the live claude/Sonnet agent invokes the skill, then it should be able to run the read-only `./bin/cautilus doctor status` command (the `orient_first` governing rule), read the live status packet, summarize, and stop at branch selection — `outcome: passed`.

## Observed Facts

- Run 1: `--claude-permission-mode dontAsk --claude-allowed-tools 'Bash(cautilus *)'` → `invoked: true`, `outcome: degraded`; summary verbatim: "doctor status --json 바이너리 실행이 dontAsk 모드에서 차단되어 캐시된 아티팩트... 기반으로 orientation을 수행했습니다".
- Run 2: broadened allowlist `'Bash(cautilus *),Bash(./bin/cautilus *),Bash(cd *),Read,Glob,Grep'` → still `outcome: degraded`; summary: "Bash가 차단되어 `./bin/cautilus doctor status --repo-root . --json`을 직접 실행할 수 없었고".
- The agent oriented soundly from cached artifacts and HONESTLY self-reported the degradation both times (good skill behavior; the discipline held).
- `./bin/cautilus doctor status --repo-root .` run directly prints `ready` (binary works).

## Reproduction

Cheap falsifier (no full skill run), `claude -p --permission-mode <mode>` asked to run `./bin/cautilus doctor status` via Bash and echo the output:
- `dontAsk` + `--allowedTools 'Bash(./bin/cautilus *)'` → empty result (Bash blocked/denied).
- `bypassPermissions` → `result: ready` (Bash ran, binary executed).

## Candidate Causes

1. The `claude_code` skill backend never passes a sandbox flag to claude (`skill-test-claude-backend.mjs` `claudeArgs` only emits `-p --no-session-persistence --output-format json --exclude-dynamic-system-prompt-sections --model --permission-mode --allowedTools`); `--sandbox read-only` is inert for the claude backend. So permission-mode is the only Bash lever.
2. `dontAsk` permission mode does not grant Bash execution in headless `-p` mode even with an `--allowedTools 'Bash(...)'` allowlist.
3. The allowlist pattern does not match the agent's command form.
4. The binary path / PATH provisioning is wrong (falsified: direct run prints `ready`, and bypassPermissions run prints `ready`).

## Hypothesis

Cause 2 (compounded by Cause 1): in headless claude `-p`, `dontAsk` does not auto-approve Bash, and since the skill backend gives no sandbox/approval path, Bash is denied; `bypassPermissions` is required to let the read-only `doctor status` run.

## Verification

The cheap two-mode probe confirms it: identical prompt/binary, only the permission mode differs — `dontAsk` → blocked (empty), `bypassPermissions` → `ready`. The allowlist is present in the blocked case, so the allowlist is not the lever; the permission mode is.

## Root Cause

`dontAsk` permission mode does not permit Bash execution in headless claude, and the `claude_code` skill backend exposes no other approval/sandbox path, so the live no-input orientation cannot run `doctor status` and degrades. The repo's adapters specify `--claude-permission-mode dontAsk`, but they default to `fixture` runtime, so the live claude Bash path was never actually exercised — the stale mode hid behind fixture mode (same hiding mechanism as the 2026-06-19 `agent status` fragment bug).

## Detection Gap

No live claude skill run was ever executed (adapters default to `fixture`), so no gate exercised the `dontAsk`+Bash path. The new on-demand live proof (`npm run proof:skill-orientation:live`) is the gate that now exercises it; it uses `bypassPermissions` for the read-only orientation and asserts `outcome: passed` so a future regression to a Bash-blocking mode fails loudly.

## Sibling Search

- The dev/repo live proof (`behavior-eval-live-proof.mjs`) does NOT run a binary (the routing task only reads AGENTS.md and reports a decision), so it is unaffected by this Bash-permission gap — verified it asserts on `routingDecision` from a no-Bash capture.
- follow-up: the checked-in adapters (`self-dogfood-skill-judge-eval.yaml`, `self-dogfood-realsurface-judge-eval.yaml`) still carry `--claude-permission-mode dontAsk`; harmless while they run `fixture`, but if anyone runs them live with claude + Bash they will degrade. Left as a noted follow-up, not changed in this slice (they are fixture-default).

## Prevention

The on-demand live skill proof uses `--claude-permission-mode bypassPermissions` (read-only orientation on our own repo) and asserts `outcome: passed` AND the command log contains `doctor status`, so a Bash-blocking permission mode is caught by the proof rather than silently degrading.
