# Debug Review: workbench command removal test
Date: 2026-04-30

## Problem

The focused app test failed after adding a negative assertion for removed top-level `workbench` commands.

## Correct Behavior

Given `workbench discover` is no longer registered, when `Run([]string{"workbench", "discover", "--repo-root", "."})` executes, then it should return non-zero and show the normal unregistered-command usage surface without exposing a top-level `workbench` command.

## Observed Facts

- `go test ./internal/app -run 'TestRunCommandsJSONReturnsRegistry|TestRunWorkbenchCommandIsNotRegistered|TestCLIEvalLive|TestCLILiveEval'` failed.
- The exact failing assertion expected `Usage: cautilus <command>`.
- The actual stderr begins with `Usage:` and then prints the registry-rendered command families.
- The rendered usage includes `cautilus eval live ...` entries and no `cautilus workbench ...` entries.

## Reproduction

```bash
go test ./internal/app -run 'TestRunWorkbenchCommandIsNotRegistered'
```

## Candidate Causes

- The new test asserted a stale usage heading that the CLI does not emit.
- The command registry may still match `workbench` through a hidden alias.
- The registry usage renderer may include removed commands even when command matching no longer does.

## Hypothesis

If the negative test asserts the stable facts instead of a stale heading, then it will pass while still proving the removed command is unregistered.
The stable facts are non-zero exit, no stdout, stderr contains the registry `Usage:` heading, and stderr does not contain `cautilus workbench`.

## Verification

After correcting the assertion, these passed:

```bash
go test ./internal/app -run 'TestRunCommandsJSONReturnsRegistry|TestRunWorkbenchCommandIsNotRegistered|TestCLIEvalLive|TestCLILiveEval'
go test ./internal/runtime -run TestValidateAdapterDataAcceptsLiveRunInvocation
go test ./internal/cli
```

## Root Cause

The new negative test over-specified the exact usage heading.
The product behavior was already aligned with the command-surface decision: the command failed and usage listed only `eval live`.

## Seam Risk

- Interrupt ID: workbench-command-removal-test
- Risk Class: none
- Seam: negative command-surface test versus rendered usage wording
- Disproving Observation: the failure output showed no top-level `workbench` command in usage
- What Local Reasoning Cannot Prove: whether full verification has unrelated failures after this assertion is corrected
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

For removed-command tests, assert command absence and exit behavior rather than exact full usage prose.
