# Dev Repo Fixture Backend Results Debug
Date: 2026-05-16

## Problem

While strengthening evidence for `claim-docs-guides-cli-md-273`, the optional direct `cautilus evaluate fixture` probe against the checked-in `dev/repo` fixture failed under `--runtime fixture`.

## Correct Behavior

Given an adapter declares a fixture-capable eval runner, when `cautilus evaluate fixture --runtime fixture` runs against its checked-in fixture, then the adapter-owned runner should either receive deterministic fixture results or reject fixture runtime before the command starts.
This optional probe should not be confused with the focused app tests or the separate checked-in `dev/skill` fixture probe that passed.

## Observed Facts

- `./bin/cautilus evaluate fixture --repo-root . --adapter-name self-dogfood-eval --runtime fixture --skip-preflight --output-dir /tmp/cautilus-guides-cli-273-dev-repo-proof-2026-05-16` failed before producing `eval-observed.json`.
- The captured stderr says `--fixture-results-file is required when --backend fixture`.
- `.agents/cautilus-adapters/self-dogfood-eval.yaml` passes `--backend {backend}` to `scripts/run-self-dogfood-eval.mjs` but does not pass a fixture results file.
- `./bin/cautilus evaluate fixture --repo-root . --adapter-name self-dogfood-eval-skill --runtime fixture --skip-preflight --output-dir /tmp/cautilus-guides-cli-273-dev-skill-proof-2026-05-16` passed and produced `eval-cases.json`, `eval-observed.json`, and `eval-summary.json`.

## Reproduction

```bash
./bin/cautilus evaluate fixture --repo-root . --adapter-name self-dogfood-eval --runtime fixture --skip-preflight --output-dir /tmp/cautilus-guides-cli-273-dev-repo-proof-2026-05-16
```

## Candidate Causes

- The `self-dogfood-eval` adapter command template lacks a checked-in fixture-results path for fixture runtime.
- The `scripts/run-self-dogfood-eval.mjs` runner intentionally requires `--fixture-results-file` when `--backend fixture`.
- The operator-selected proof tried to strengthen a command-path claim with a fixture-runtime path that this adapter has not declared ready.

## Hypothesis

If the failure is adapter fixture-runtime wiring rather than the `evaluate fixture` command path itself, then a sibling adapter that does pass fixture results should run successfully through the same `evaluate fixture --runtime fixture` surface.

## Verification

The sibling checked-in `dev/skill` fixture probe passed:

```bash
./bin/cautilus evaluate fixture --repo-root . --adapter-name self-dogfood-eval-skill --runtime fixture --skip-preflight --output-dir /tmp/cautilus-guides-cli-273-dev-skill-proof-2026-05-16
```

Focused app tests for the command path also passed:

```bash
go test ./internal/app -run 'TestCLIEvalTestRunsDevRepoFixture|TestCLIEvalTestRunsDevSkillFixture|TestCLIEvalTestAcceptsFixtureRuntime|TestCLIEvalEvaluateDoesNotLaunchAdapterRunner' -count=1
```

## Root Cause

The optional `dev/repo` fixture-runtime proof selected an adapter command template that forwards `--backend fixture` to a runner requiring fixture results, but the adapter does not declare or pass a fixture-results file.

## Detection Gap

- optional proof strengthening | adapter fixture-runtime readiness was assumed from `--runtime fixture` support before checking its command template | check adapter runner arguments before adding direct fixture-runtime command evidence.

## Sibling Search

- Mental model: every checked-in eval fixture can be replayed under fixture runtime.
- Adapter axis: `self-dogfood-eval-skill` passes `--fixture-results-file` and is suitable for fixture-runtime command evidence.
- Dev/repo axis: `self-dogfood-eval` needs fixture-results wiring before its checked-in fixture can serve as direct fixture-runtime proof.
- Claim evidence axis: command-path claims can use focused tests plus one runnable checked-in fixture proof without claiming every adapter has fixture-runtime readiness.

## Seam Risk

- Interrupt ID: dev-repo-fixture-backend-results
- Risk Class: none
- Seam: adapter-owned runner template versus product-owned `evaluate fixture` orchestration
- Disproving Observation: the sibling `dev/skill` checked-in fixture probe passed through the same product command surface.
- What Local Reasoning Cannot Prove: whether `self-dogfood-eval` should gain a checked-in fixture-results file or reject fixture runtime more loudly.
- Generalization Pressure: low; this is adapter fixture-runtime readiness, not a generic command-path failure.

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When strengthening claim evidence with direct `--runtime fixture` runs, use only adapters that declare the fixture data required by their runner template, or keep the evidence at focused test plus checked-in fixture hash level.
