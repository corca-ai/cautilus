# Debug Review: bounded shell command timeouts
Date: 2026-04-21

## Problem

Several operator-facing command runners launched shell subprocesses with no timeout.

## Correct Behavior

Given a checked-in command template that hangs,
when `cautilus` or the repo-local JS runner executes it,
then the runner should fail the command within a bounded timeout instead of waiting forever.

## Observed Facts

- `internal/app/remaining_commands.go` used `exec.Command("bash", "-lc", ...)` in `runShellCommand(...)` with no timeout.
- `runShellCommand(...)` was reused by `review variants`, `mode evaluate`, `instruction-surface test`, and `skill test`.
- `scripts/agent-runtime/command-progress.mjs` spawned shell commands with no kill timer.
- The adapter contract already declared `review_timeout_ms`, but the Go and JS fanout paths did not enforce it.

## Reproduction

1. Run a review or mode-evaluate template that sleeps indefinitely or far longer than expected.
2. Observe the runner continue waiting without a built-in timeout failure.

## Candidate Causes

- The common Go shell runner never wrapped the command in `context.WithTimeout`.
- The common JS shell runner never armed a kill timer for spawned commands.
- Timeout guidance existed in docs and one wrapper script, but not in the shared execution helpers.

## Hypothesis

If the shared Go and JS shell runners enforce bounded timeouts,
then the operator-facing flows that reuse them will fail closed instead of hanging indefinitely.

## Verification

- Added a Go unit test proving `runShellCommand(...)` reports a timeout for a long-running child process.
- Added JS regression tests proving the relevant review and mode-evaluate paths fail or record timeout observations when the timeout budget is exceeded.
- `go test ./internal/app` passed.
- The targeted JS regression tests passed.

## Root Cause

Timeout policy had been partially documented and partially enforced,
but the shared shell execution helpers in both Go and JS still allowed unbounded waits.

## Prevention

- Keep timeout enforcement in shared execution helpers instead of relying on individual callers to remember it.
- Prefer adapter-backed timeout defaults over ad hoc shell invocation from each command surface.
- Keep regression tests at the helper seam so future refactors do not silently reintroduce unbounded subprocesses.

## Related Prior Incidents

- `charness` issue #41 described the same class of failure in a nearby toolchain: long-lived subprocesses accumulated because timeout enforcement was missing on shared execution paths.
