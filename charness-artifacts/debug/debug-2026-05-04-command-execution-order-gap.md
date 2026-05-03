# Debug: command_execution order gap

## Trigger

The first-scan dogfood transcript contained `item.completed` / `command_execution` events instead of `response_item` function-call events.
The stricter first-scan audit initially failed to find the pre-discovery message boundary because `summarizeCodexSessionLogText` exposed loose commands without indexed tool-call records.

## Observation

The transcript contained the needed assistant message before `claim discover`, but `summary.toolCalls` was empty.
The audit could still list the commands, yet it could not compute which assistant messages happened before the first discovery command.

## Root Cause

The audit assumed command ordering could be derived from `summary.toolCalls`.
Newer or alternate Codex transcript shapes can represent commands as loose `command_execution` events, which were included in `commands` but not as indexed tool calls.

## Fix Direction

`audit-cautilus-first-scan-flow-log.mjs` now falls back to scanning raw JSONL events for command strings and uses the JSONL line index as the ordering boundary.
The test suite includes a loose `command_execution` transcript fixture so the gap stays covered.

## Regression Check

`node --test scripts/agent-runtime/audit-cautilus-first-scan-flow-log.test.mjs` passes, including the loose command execution transcript shape.
The current first-scan dogfood audit passes when rerun with the updated parser.
