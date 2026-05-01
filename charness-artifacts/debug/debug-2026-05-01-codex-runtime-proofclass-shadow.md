# Debug Review: codex runtime proofclass shadow
Date: 2026-05-01

## Problem

`eval test --runtime codex` passed the `dev/repo` self-dogfood fixture, but the emitted proof still reported `proofClass=fixture-smoke`.

## Correct Behavior

Given a typed dev runner declares `proof_class: coding-agent-messaging`, when `eval test` runs that runner with the Codex backend, then the observed proof should report `proofClass=coding-agent-messaging`.
Given the same runner runs with `--runtime fixture`, then the observed proof should remain downgraded to `fixture-smoke`.

## Observed Facts

- Command: `./bin/cautilus eval test --repo-root . --runtime codex --output-dir /tmp/cautilus-dev-repo-codex-eval`
- Result: `recommendation=accept-now`
- Observed summary path: `/tmp/cautilus-dev-repo-codex-eval/eval-summary.json`
- Observed proof fields: `runtime=codex`, `runnerId=dev-repo-self-dogfood`, `proofClass=fixture-smoke`, `proofClassSource=assessment`
- The runner assessment is intentionally `smoke-only` from the prior fixture run.
- The adapter typed runner declares `proof_class: coding-agent-messaging`.

## Reproduction

Run the Codex backend eval command above and inspect:

```bash
jq '.proof' /tmp/cautilus-dev-repo-codex-eval/eval-summary.json
```

The proof reports a fixture-smoke class even though the executed backend was Codex.

## Candidate Causes

- `BuildEvaluationProofFromRunnerReadiness` always prefers the runner assessment proof class, even when runtime evidence is stronger.
- `BuildRunnerReadinessForSurface` discards the adapter-declared typed runner proof class once an assessment exists.
- `eval test` passes the wrong runtime name into the proof builder.

## Hypothesis

The proof builder cannot distinguish assessment proof from declared runner capability after runner readiness collapses both into `proofClass`.
If readiness preserves the typed runner's declared proof class, then `BuildEvaluationProofFromRunnerReadiness` can use it for non-fixture dev runs while retaining the fixture downgrade behavior.

## Verification

Add tests for:

- fixture runtime still downgrades declared coding-agent proof to `fixture-smoke`
- codex runtime upgrades a dev runner from a smoke-only assessment to declared `coding-agent-messaging`
- app/product runners are not upgraded merely because a stronger declared proof class exists

Then rerun the Codex backend eval and inspect the proof packet.

## Root Cause

The prior fixture-downgrade fix handled the weak-runtime case but left the strong-runtime case shadowed by assessment state.
Runner readiness summarized the current assessment as the only proof class, so actual Codex execution could not surface the adapter-declared `coding-agent-messaging` capability.

## Seam Risk

- Interrupt ID: codex-runtime-proofclass-shadow
- Risk Class: contract-freeze-risk
- Seam: typed runner readiness to observed eval proof
- Disproving Observation: a real Codex backend run passed while proof metadata still said fixture-smoke
- What Local Reasoning Cannot Prove: whether future app/product runners should ever upgrade from declared proof without full verification capabilities
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Preserve declared typed-runner proof separately from assessment proof and only upgrade observed proof for non-fixture dev surfaces where `coding-agent-messaging` is an accepted proof class.
