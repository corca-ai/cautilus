# Debug Review: agent status branch catalog claim
Date: 2026-05-03

## Problem

`claim-docs-contracts-runner-readiness-md-118` says `agent status` should present next branches such as initialize adapter, refresh claim state, create runner assessment, run runner smoke, inspect existing claim map, or run eval.
The current implementation and tests do not cleanly support treating that sentence as satisfied.

## Correct Behavior

Given `agent status` is a read-only orientation packet, when adapter, claim-state, and runner-readiness state are inspected, then it should expose setup and inspection branches without executing smoke commands, refreshing claim state, launching eval, or marking semantic readiness.
Given a runner is ready, the runner-readiness detail may expose the eval command required by the assessed runner, but first-touch top-level orientation must not turn into an eval launcher without claim context.

## Observed Facts

- `internal/runtime/agent_status.go` builds top-level `nextBranches` from adapter setup, runner-readiness blocking branches, claim-state branches, and stop.
- `internal/runtime/runner_readiness.go` exposes `run_eval_with_assessed_runner` as `runnerReadiness.nextBranch` when the assessment is ready.
- `mergeAgentStatusBranches` intentionally does not promote `run_eval_with_assessed_runner` into top-level `nextBranches`.
- `internal/app/app_test.go` forbids first-touch `agent status` output from containing `eval test`, `review variants`, `optimize`, or `git commit`.
- Typed runner adapter validation preserves `smoke_command_template`, but runner-readiness branch output does not yet expose a distinct `run_runner_smoke` branch.

## Reproduction

1. Inspect `claim-docs-contracts-runner-readiness-md-118` in `.cautilus/claims/evidenced-typed-runners.json`.
2. Inspect `docs/contracts/runner-readiness.md` line 118.
3. Inspect `internal/runtime/agent_status.go` and `internal/runtime/runner_readiness.go`.
4. Observe that the contract sentence combines top-level orientation branches, nested runner-readiness branches, and a smoke branch that is not implemented as a branch.

## Candidate Causes

- The contract sentence predates the stricter no-input safety test and uses "next branches" too broadly.
- The implementation correctly separates top-level orientation from nested runner-readiness detail, but the contract does not name that boundary.
- `smoke_command_template` was added to the adapter schema before `agent status` got a non-executing smoke branch projection.

## Hypothesis

If the contract distinguishes top-level `nextBranches` from nested `runnerReadiness.nextBranch` and the implementation exposes a non-executing `run_runner_smoke` branch when a typed runner declares `smoke_command_template`, then the branch catalog claim can be made precise and proven without weakening first-touch safety.

## Verification

- `rg -n "run_eval_with_assessed_runner|eval test|run_runner_smoke" internal/runtime internal/app docs/contracts/runner-readiness.md`
- `internal/app/app_test.go` contains the first-touch safety assertion that `agent status` should not offer `eval test`.
- `internal/runtime/runner_readiness_test.go` already proves runner-readiness shape and that ready runners expose `run_eval_with_assessed_runner` in `runnerReadiness.nextBranch`.
- No current test proves a `run_runner_smoke` branch because no such branch is currently emitted.

## Root Cause

The claim source collapsed three different levels into one phrase: top-level orientation branches, nested runner-readiness next action, and an unimplemented smoke command projection.
That made the discovered claim broader than the actual safe product contract.

## Seam Risk

- Interrupt ID: agent-status-branch-catalog-claim
- Risk Class: contract-freeze-risk
- Seam: runner-readiness contract versus agent-status top-level orientation
- Disproving Observation: first-touch `agent status` must not offer `eval test`, while the contract sentence says `agent status` may present a run-eval branch
- What Local Reasoning Cannot Prove: whether future skill UX should ever promote ready-runner eval into top-level branches after a selected claim context exists
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Clarify the runner-readiness contract before marking the claim satisfied.
Add deterministic tests for the branch catalog after the contract separates top-level orientation from nested runner-readiness action fields.
