# Debug Review
Date: 2026-05-17

## Problem

Subagent critique found that live app evaluation expected Codex JSONL telemetry but did not request JSONL output from `codex exec`.

## Correct Behavior

Given `run-app-eval` uses the `codex_exec` backend, when it preserves token and cost telemetry, then it should invoke Codex in the machine-readable mode that emits telemetry events.

## Observed Facts

`run-app-eval.mjs` parsed Codex stdout with `extractCodexTelemetry`.
The command args did not include `--json`, so real Codex runs could produce human-oriented output with no parseable token telemetry.
The existing fake Codex test emitted JSONL unconditionally and therefore did not catch the missing flag.

## Reproduction

Run a live `codex exec` app eval with a Codex CLI that emits JSONL events only when `--json` is present.
The result file can still be written, but telemetry extraction sees no JSONL token events.

## Candidate Causes

- The implementation reused `codex exec` structured result flags and assumed they also selected structured stdout.
- The fake Codex test did not assert the CLI argument contract.
- The telemetry parser and command builder were added in the same slice, so the stdout mode mismatch was not independently checked.

## Hypothesis

If `run-app-eval` passes `--json` to `codex exec` and the fake Codex test refuses to emit telemetry without that flag, then live app telemetry preservation will match the real CLI contract.

## Verification

After adding `--json`, the focused app eval test, deployment evidence tests, release claim freshness tests, focused Go runtime telemetry tests, and focused ESLint pass all completed successfully.

## Root Cause

The result schema contract and telemetry stdout contract are separate Codex CLI switches.
The app eval runner configured the result schema but omitted the stdout JSONL switch.

## Detection Gap

- Fake runtime | emitted JSONL regardless of args | make fake CLIs assert required machine-readable flags.
- Focused telemetry assertions | checked packet output, not invocation contract | assert both the preserved telemetry and the command shape.

## Sibling Search

- Claude app eval already requests JSON output through `--output-format json`.
- Skill-test Codex helpers use machine-readable Codex streams and should stay the reference for app eval.
- Deployment/report aggregation should preserve explicit telemetry provenance once the live runner emits it.

## Seam Risk

- Interrupt ID: codex-app-eval-json-telemetry
- Risk Class: none
- Seam: live app eval Codex backend telemetry stdout
- Disproving Observation: the test fake can fail when `--json` is missing.
- What Local Reasoning Cannot Prove: whether every installed Codex version emits identical JSONL event names.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

For live CLI wrappers, tests should validate the command mode that enables machine-readable telemetry instead of only validating the parsed packet.
