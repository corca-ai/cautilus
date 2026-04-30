# Debug Review: fixture runtime proof class downgrade
Date: 2026-05-01

## Problem

The typed root `dev/repo` runner reported `proofClass=coding-agent-messaging` even when the run used `--runtime fixture`.

## Correct Behavior

Given an eval runner executes with the fixture backend, when Cautilus records observed proof metadata, then the observed proof class should be `fixture-smoke` even if the adapter declares a stronger possible runner class.

## Observed Facts

- The command `./bin/cautilus eval test --repo-root . --runtime fixture --output-dir /tmp/cautilus-dev-repo-typed-runner-smoke` passed after adding fixture results.
- The summary proof included `runtime: fixture`.
- The same proof also included `proofClass: coding-agent-messaging` from adapter metadata.
- A fixture backend did not actually invoke Codex or Claude messaging.
- A separate app/chat smoke test did not pass `--runtime fixture`, so its effective runtime stayed `codex` even though the shell script returned fixture-like data.

## Reproduction

```bash
./bin/cautilus eval test --repo-root . --runtime fixture --output-dir /tmp/cautilus-dev-repo-typed-runner-smoke
jq '.proof' /tmp/cautilus-dev-repo-typed-runner-smoke/eval-summary.json
```

## Candidate Causes

- `BuildEvaluationProofFromRunnerReadiness` copied adapter-declared proof class without considering the selected runtime.
- The typed runner schema describes runner capability, while eval proof should describe the actual observed run.
- A test expectation can only require `fixture-smoke` when the eval command's effective runtime is actually `fixture`.

## Hypothesis

If fixture runtime downgrades observed proof to `fixture-smoke` while preserving the declared class separately, then downstream reports will not overread fixture-backed runs as coding-agent or product-path proof.

## Verification

Update proof tests and rerun the typed runner smoke plus full verification.

## Root Cause

The first typed runner implementation conflated declared runner capability with observed proof strength.

## Seam Risk

- Interrupt ID: fixture-runtime-proof-class-downgrade
- Risk Class: contract-freeze-risk
- Seam: eval proof metadata semantics
- Disproving Observation: a fixture run carried a stronger adapter-declared proof class
- What Local Reasoning Cannot Prove: whether future non-fixture runtimes need more nuanced runtime-to-proof mapping
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep observed proof strength derived from the actual runtime path.
Preserve adapter-declared proof class as metadata, but do not use it as the observed proof class when the fixture backend ran.
