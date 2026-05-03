# Debug: command_execution order gap
Date: 2026-05-04

## Problem

The stricter first-scan audit could not find the pre-discovery message boundary when Codex emitted `item.completed` / `command_execution` events instead of `response_item` function-call events.

## Correct Behavior

Given a Codex transcript that contains loose command execution events, the audit should still identify the first `claim discover` command and inspect only assistant messages that happened before it.

## Observed Facts

The transcript contained the needed assistant message before `claim discover`, but `summary.toolCalls` was empty.
The audit could list commands, but it could not compute which assistant messages happened before discovery.

## Reproduction

Run the first-scan audit against a transcript whose commands are represented as `item.completed` / `command_execution` events.
Before the fix, the audit could not derive a pre-discovery boundary from those events.

## Candidate Causes

- The audit assumed command ordering could be derived only from `summary.toolCalls`.
- The session summary exposed loose commands without indexed tool-call records.
- The raw JSONL shape changed while the audit only had fixtures for function-call events.

## Hypothesis

If the audit falls back to raw JSONL line indexes for command strings, then it can preserve command-order evidence for loose `command_execution` transcript shapes.

## Verification

`node --test scripts/agent-runtime/audit-cautilus-first-scan-flow-log.test.mjs` passes, including the loose command execution transcript shape.
The current first-scan dogfood audit passes when rerun with the updated parser.

## Root Cause

The audit assumed command ordering could be derived from `summary.toolCalls`.
Newer or alternate Codex transcript shapes can represent commands as loose `command_execution` events, which were included in `commands` but not as indexed tool calls.

## Prevention

Keep loose command-execution transcript fixtures in audit tests for any branch-order audit.
