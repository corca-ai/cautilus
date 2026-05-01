# Removed Skills Install Test Debug
Date: 2026-05-01

## Problem

After removing the public `cautilus skills install` compatibility command, `go test ./internal/app ./internal/cli` still failed in `TestRunSkillsInstallDoesNotRequireToolRoot`.

## Correct Behavior

Given `cautilus install` is the single canonical repo skill setup path, when the app tests check install without `CAUTILUS_TOOL_ROOT`, then they should invoke `install --repo-root .` rather than the removed `skills install` command.

## Observed Facts

- The failed test called `Run([]string{"skills", "install"}, ...)`.
- The command registry and app dispatcher no longer expose `skills install`.
- The failure printed global usage and exited `1`, which is correct for an unknown command after the removal.
- The same install behavior is still available through `Run([]string{"install", "--repo-root", "."}, ...)`.

## Reproduction

`go test ./internal/app ./internal/cli -run 'TestRunSkillsInstallDoesNotRequireToolRoot|TestRenderUsageIncludesLifecycleCommands'`

## Candidate Causes

- A leftover test still exercised the removed compatibility command.
- The app dispatcher removal accidentally broke the canonical `install` path.
- The command registry and app dispatcher were inconsistent about whether the compatibility command exists.

## Hypothesis

If the failure is only stale test coverage, then changing the test to call `install --repo-root .` should preserve the original no-tool-root assertion and the targeted app and registry tests should pass.

## Verification

`go test ./internal/app ./internal/cli -run 'TestRunInstallDoesNotRequireToolRoot|TestCLIInstallCreatesRepoLocalCanonicalSkill|TestCLIInstallMigratesLegacyClaudeSkills|TestRenderUsageIncludesLifecycleCommands|TestDecodeRegistryRejectsUnknownCommandFields'` passed after the repair.

## Root Cause

The compatibility command was removed from the product surface, but one app-level no-tool-root test still used the old command path.

## Seam Risk

- Interrupt ID: removed-skills-install-test
- Risk Class: command-surface cleanup
- Seam: CLI registry, app dispatcher, install smoke tests
- Disproving Observation: targeted tests still fail after switching the test to the canonical install path
- What Local Reasoning Cannot Prove: whether external users still call the removed compatibility command
- Generalization Pressure: low inside this repo because the user explicitly asked to remove compatibility while the product is still pre-compatibility-lock

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When removing a compatibility command, search both command registry tests and app-level behavioral tests for the removed path before running the broad gate.
