## Problem

Several operator-facing command runners launched shell subprocesses with no timeout.

## Correct Behavior

Given a checked-in command template that hangs, when `cautilus` or the repo-local JS runner executes it, then the runner should fail the command within a bounded timeout instead of waiting forever.

## Observed Facts

- `internal/app/remaining_commands.go` used `exec.Command("bash", "-lc", ...)` in `runShellCommand(...)` with no timeout.
- `runShellCommand(...)` was reused by `review variants`, `mode evaluate`, `instruction-surface test`, and `skill test`.
- `scripts/agent-runtime/command-progress.mjs` used `spawn("bash", ["-lc", command])` with no timeout.
- `scripts/agent-runtime/run-executor-variants.mjs` and `scripts/agent-runtime/evaluate-adapter-mode.mjs` both depended on that JS helper.
- The adapter contract already declared `review_timeout_ms`, but the Go and JS review fanout paths did not enforce it.

## Reproduction

1. Run a review or mode-evaluate template that sleeps indefinitely or for an unexpectedly long time.
2. Observe the runner continue waiting without a built-in timeout failure.

## Candidate Causes

- The common Go shell runner never wrapped the command in `context.WithTimeout`.
- The common JS shell runner never armed a kill timer for spawned commands.
- Existing timeout guidance lived in docs and one wrapper script, but not in every execution path.

## Hypothesis

If the common Go and JS shell runners enforce bounded timeouts, then the operator-facing flows that reuse them will fail closed instead of hanging indefinitely.

## Verification

- Added a Go unit test proving `runShellCommand(...)` reports a timeout for a long-running child process.
- Added a JS regression test proving `run-executor-variants.mjs` fails a variant that exceeds adapter `review_timeout_ms`.
- Added a JS regression test proving `evaluate-adapter-mode.mjs` records a timed-out command observation when the bounded shell timeout is exceeded.
- `go test ./internal/app` passed.
- `node --test scripts/agent-runtime/run-executor-variants.test.mjs scripts/agent-runtime/evaluate-adapter-mode.test.mjs` passed.

## Root Cause

Timeout policy had been partially documented and partially enforced, but the shared shell execution helpers in both Go and JS still allowed unbounded waits.

## Prevention

- Keep timeout enforcement in shared execution helpers instead of relying on individual callers to remember it.
- Prefer adapter-backed or helper-backed timeout defaults over ad hoc shell invocation from each command surface.
- Keep regression tests at the helper seam so future refactors do not silently reintroduce unbounded subprocesses.

## Related Prior Incidents

- `charness` issue #41 described the same class of failure in a nearby toolchain: long-lived subprocesses accumulated because timeout enforcement was missing on shared execution paths.
