# Debug Review: shell command capture write false success
Date: 2026-07-11

## Problem

`runShellCommand` ignores failures while writing captured stdout and stderr files.
A command can therefore return `status: passed` and advertise evidence paths that were never materialized, causing review/evaluation consumers to trust missing audit evidence.

## Correct Behavior

The result may report `passed` only when the command succeeds and both declared capture files are written successfully.
A capture write failure must set `status: failed`, preserve inline output and the command exit code, and include a path-bearing capture error.

## Observed Facts

- Both `os.WriteFile` returns are assigned to `_`.
- Result status depends only on `command.Run()`.
- Review variant summaries propagate `executionStatus`, `stdoutFile`, and `stderrFile` from this result.
- Evaluation preflight and test loops stop only when result status is not `passed`.
- Existing tests cover environment isolation and timeout status but not capture persistence failure.

## Reproduction

- Call `runShellCommand` with a successful `printf` command and a stdout capture path that is an existing directory.
- Observe `status: passed`, `exitCode: 0`, inline stdout present, and no stdout capture file.

## Candidate Causes

- Capture files were treated as best-effort diagnostics while inline output remained authoritative.
- The caller was expected to check file existence independently.
- Write failure was considered impossible because output directories are normally pre-created.
- Command status and evidence persistence were intentionally separate but the result has no field representing that distinction.

## Hypothesis

- Falsifiable claim: the ignored write returns are the sole false-success gap; a deterministic directory-as-file test passes on old code with `status: passed`, while incorporating capture errors into result status and error text will make callers stop without changing successful commands or timeout behavior | disconfirmer: add the direct failure test and observe a caller-independent check already marks the result failed.

## Verification

- confirmed — the deterministic directory-as-file test returned `status: passed` against old code; after repair it returns failed with exitCode 0, preserves inline stdout, records a path-bearing capture error, writes the independent stderr capture, and the review normalizer surfaces the capture error as its failure reason.

## Root Cause

The result model conflates subprocess success with complete execution evidence.
Capture persistence is part of the declared result contract, but its authoritative filesystem errors are discarded before status construction.

## Invariant Proof

- Invariant: `runShellCommand.status == passed` implies command success and successful materialization of both declared capture files.
- Producer Proof: deterministic stdout capture path points to an existing directory while the command itself exits 0.
- Final-Consumer Proof: result is failed with exitCode 0, inline stdout preserved, review normalization retains the path-bearing reason, and evaluation callers emit the same error independently of progress quiet mode before stopping.
- Interface-Shape Sibling Scan: both stdout and stderr writes share the same contract and must be handled together; unrelated output writers already return errors directly.
- Non-Claims: this slice does not change command exit codes, make capture writes atomic, remove attempted path fields, or redesign review summary schemas.

## Detection Gap

- `internal/app/app_test.go` shell-command tests | command env and timeout branches were covered but evidence persistence was assumed | add direct capture failure plus existing success/timeout regressions.

## Sibling Search

- Mental model: pre-created output directories make capture writes infallible.
- same layer axis: stdout and stderr capture writes | decision: same bug, fix now | proof: both errors are discarded before one shared status.
- abstraction up axis: review/eval execution summaries | decision: same bug, fix now | proof: all callers gate on `result.status` and propagate file paths.
- specialization down axis: simultaneous command and capture failure | decision: same bug, fix now | proof: combine capture diagnostic with timeout text while preserving command exit semantics.
- mental-model axis: inline output as fallback | decision: intentional plain-text or non-rendering boundary | proof: preserve inline stdout/stderr for repair, but do not call missing durable evidence passed.
- cross-file: `internal/app/remaining_commands.go` owns execution/result construction and `internal/app/app_test.go` owns direct branch proof.

## Seam Risk

- Interrupt ID: shell-command-capture-write-false-success
- Risk Class: none
- Seam: subprocess completion to durable capture evidence and result status
- Disproving Observation: capture failure yields failed status/path error while success and timeout tests pass.
- What Local Reasoning Cannot Prove: external filesystem recovery or atomic persistence of both capture files.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Treat capture persistence as part of execution success, retain inline repair evidence, and pin the result-map semantics directly.
