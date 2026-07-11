# Debug Review: shell startup failures lose diagnostics
Date: 2026-07-11

## Problem

`runShellCommand` returns `status: failed` without an `error` or exit-code sentinel when the subprocess cannot start or change into its working directory.
Evaluation and review callers stop but cannot tell the operator why.

## Correct Behavior

Given a non-timeout command startup failure, the result must preserve the underlying error, use a consistent non-process exit-code sentinel, write available empty captures, and make `shellCommandPassed` surface the cause.

## Observed Facts

- `command.Run()` errors are recorded only when they are `*exec.ExitError`, nil, or a timeout.
- `errorMessages` contains timeout and capture failures but not other `command.Run()` failures.
- `shellCommandPassed` prints only the result's `error` field.
- A nonexistent `command.Dir` returns a non-`*exec.ExitError` startup error before bash begins.

## Reproduction

- Call `runShellCommand` with a nonexistent repo root and writable stdout/stderr capture paths.
- Direct old-code test confirmed the result was failed with no `error` and no `exitCode`; `shellCommandPassed` wrote nothing.

## Candidate Causes

- Every non-timeout execution failure was assumed to be `*exec.ExitError`.
- Startup failures were expected to be caught by earlier repo validation.
- Exit-code semantics were designed only for a started child process.
- Capture failures were recently added without revisiting the independent startup-error branch.

## Hypothesis

- Falsifiable claim: the unmatched `command.Run()` branch is the sole diagnostic loss; a direct nonexistent-directory test reproduces empty error output, while recording `err.Error()` and exitCode `-1` for non-exit failures will make all callers actionable without changing ordinary exit, timeout, or capture semantics | disconfirmer: `exec.CommandContext` always wraps the chdir failure as `*exec.ExitError` on supported platforms.

## Verification

- confirmed — the deterministic nonexistent-directory test failed against old result construction.
- initial delegated review found the new startup and existing capture error paths preserved CR/LF from operator-controlled paths.
- after collapsing CR/LF before result assembly, focused direct and race tests pass startup, capture, timeout, success, and environment-isolation branches.

## Root Cause

Result construction enumerated ordinary child exits, success, and timeouts but had no final branch for non-exit execution errors.
The recently repaired capture contract consumed `errorMessages`, so the missing execution-error append propagated silently to every final caller.

## Invariant Proof

- Invariant: when command execution cannot start, the shared result producer must carry a non-empty cause that review and evaluation final consumers surface before stopping.
- Producer Proof: a newline-bearing nonexistent `command.Dir` produces failed status, exitCode `-1`, empty durable captures, and a single-line path-bearing `command execution failed` message.
- Final-Consumer Proof: `shellCommandPassed` emits exactly one physical cause line and review normalization selects the same sanitized reason.
- Interface-Shape Sibling Scan: ordinary exit errors, timeouts, capture errors, and startup errors are the complete `command.Run()` result family.
- Non-Claims: no portable OS errno normalization or child-process exit-code claim for a process that never started.

## Detection Gap

- `internal/app/app_test.go` shell command tests | env, timeout, and capture branches existed but startup/chdir was absent | add one direct branch test with final caller stderr proof.

## Sibling Search

- Mental model: every failed `command.Run()` either times out or returns `*exec.ExitError`.
- same layer axis: unmatched non-exit execution error | decision: same bug, fix now | proof: static exhaustive branch review.
- abstraction up axis: review and evaluation callers | decision: same bug, fix now | proof: all use `shellCommandPassed` or result normalization.
- specialization down axis: nonexistent working directory versus missing bash binary | decision: intentional plain-text or non-rendering boundary | proof: the test uses deterministic chdir failure while both share the same unmatched branch.
- mental-model axis: preflight makes runtime startup infallible | decision: same class, diagnostic-only for this slice | proof: direct helper remains callable and filesystem state may change after preflight.
- cross-file: `internal/app/app_test.go` owns direct result and final-consumer proof outside `remaining_commands.go`.

## Seam Risk

- Interrupt ID: shell-startup-failure-diagnostic-loss
- Risk Class: none
- Seam: operating-system command startup to durable execution result and operator stderr
- Disproving Observation: direct and race tests pass the startup branch while existing timeout, capture, success, and environment-isolation tests remain green.
- What Local Reasoning Cannot Prove: platform-specific wording of the underlying chdir error.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Make result construction exhaustive over every `command.Run()` failure family, collapse CR/LF across composed execution/capture messages, and pin producer, durable capture, review normalization, and caller stderr surfaces.
