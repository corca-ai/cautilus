# Optimize Search Eval Test Score Debug
Date: 2026-05-01

## Problem

After wiring optimize-search candidate evaluation through `cautilus eval test`, `TestCLIOptimizeSearchRunUsesEvalTestForHeldOutAndFullGate` failed because `optimize search run` returned a blocked result even though the mutation candidate's eval summary passed.

## Correct Behavior

Given a mutation candidate runs through `eval test` and produces a passing held-out evaluation, when optimize search ranks candidates, then the candidate's held-out score must participate in frontier selection and final full-gate evaluation.

## Observed Facts

- The mutation candidate had `evaluationArtifacts.status=passed`.
- The mutation candidate's eval summary had `recommendation=accept-now` and `evaluationCounts.passed=1`.
- The result still selected `seed` and blocked after the seed failed the final full-gate checkpoint.
- The held-out matrix entry for the mutation carried `overallScore=100` but did not carry `score`.

## Reproduction

`go test ./internal/app -run TestCLIOptimizeSearchRunUsesEvalTestForHeldOutAndFullGate -count=1 -v`

## Candidate Causes

- The eval-test runner did not write a valid summary.
- The candidate worktree did not contain the mutated prompt.
- The new held-out entry shape did not match the existing frontier ranking contract.

## Hypothesis

If frontier ranking reads `score` rather than `overallScore`, then adding `score=overallScore` to eval-derived held-out entries should let the mutation candidate outrank the seed and proceed to full-gate evaluation.

## Verification

`go test ./internal/app -run TestCLIOptimizeSearchRunUsesEvalTestForHeldOutAndFullGate -count=1 -v` passed after adding `score` to eval-derived held-out entries and checking the held-out matrix instead of candidate-registry internals.

## Root Cause

The new eval-derived held-out entry used scenario-results style `overallScore` but missed the normalized `score` field consumed by the existing optimize-search matrix and frontier ranking code.

## Seam Risk

- Interrupt ID: optimize-search-eval-test-score
- Risk Class: packet-shape mismatch
- Seam: eval-test summary to optimize-search held-out matrix
- Disproving Observation: mutation candidates still lose to weaker seed candidates after carrying both `overallScore` and `score`
- What Local Reasoning Cannot Prove: whether all consumer adapters will use `evaluation_input_default` for optimize-search held-out and full-gate proof
- Generalization Pressure: medium because eval summaries and scenario-results packets use adjacent but not identical score field names

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When adapting one result packet into another search or ranking contract, assert the exact field consumed by the ranking function, not only the human-readable score field.
