# Debug Review: typed runner dev repo fixture backend
Date: 2026-05-01

## Problem

The root typed `dev/repo` runner failed when exercised with `--runtime fixture`.

## Correct Behavior

Given the adapter command supports the fixture backend, when `cautilus eval test --runtime fixture` runs the checked-in `dev/repo` fixture, then the adapter command should receive a fixture-results file and produce `eval-observed.json`.

## Observed Facts

- The failing command was `./bin/cautilus eval test --repo-root . --runtime fixture --output-dir /tmp/cautilus-dev-repo-typed-runner-smoke`.
- Preflight passed.
- The runner failed before producing `eval-observed.json`.
- The exact stderr was `--fixture-results-file is required when --backend fixture`.
- The root adapter command passed `{backend}` but did not pass `--fixture-results-file`.

## Reproduction

```bash
./bin/cautilus eval test --repo-root . --runtime fixture --output-dir /tmp/cautilus-dev-repo-typed-runner-smoke
```

## Candidate Causes

- The typed runner copied the existing root command template, which was normally used with live agent backends.
- The repo did not have a checked-in `dev/repo` fixture-results packet for the fixture backend.
- The fixture smoke path was assumed from app/skill dogfood wrappers instead of being proved for the root default adapter.

## Hypothesis

If the root adapter command passes a checked-in `dev/repo` fixture-results file, then the fixture backend should produce a valid observed packet and the typed runner smoke should pass.

## Verification

Rerun the `eval test --runtime fixture` command and inspect `eval-summary.json`.

## Root Cause

The default adapter exposed a fixture-selectable backend without providing the fixture-results input required by the underlying runner.

## Seam Risk

- Interrupt ID: typed-runner-dev-repo-fixture-backend
- Risk Class: none
- Seam: root adapter typed runner command template
- Disproving Observation: local runner rejected fixture backend before behavior evaluation
- What Local Reasoning Cannot Prove: whether live Codex or Claude backends remain healthy
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When making a root adapter runner fixture-selectable, keep the fixture-results file beside the fixture and include it in the command template.
