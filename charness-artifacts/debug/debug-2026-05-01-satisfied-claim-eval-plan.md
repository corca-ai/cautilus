# Satisfied Claim Eval Plan Debug
Date: 2026-05-01

## Problem

`claim plan-evals` keeps emitting an eval plan for a claim after that claim has `evidenceStatus=satisfied`.

## Correct Behavior

Given a reviewed claim packet, when a `cautilus-eval` claim already has verified/direct evidence and `evidenceStatus=satisfied`, then default eval planning should skip that claim instead of asking the host to create or run another eval fixture.

## Observed Facts

- `.cautilus/claims/evidenced-typed-runners.json` marks `claim-readme-md-148` as `evidenceStatus=satisfied`.
- `claim validate` accepted the packet with `valid=true` and `issueCount=0`.
- `claim plan-evals --claims .cautilus/claims/evidenced-typed-runners.json` still included `claim-readme-md-148`.

## Reproduction

1. Apply `.cautilus/claims/review-result-evidence-dev-skill-dogfood.json` to `.cautilus/claims/reviewed-typed-runners.json`.
2. Validate the resulting `.cautilus/claims/evidenced-typed-runners.json`.
3. Run `./bin/cautilus claim plan-evals --claims .cautilus/claims/evidenced-typed-runners.json`.
4. Observe that `claim-readme-md-148` remains in `evalPlans`.

## Candidate Causes

- `BuildClaimEvalPlan` filters by `recommendedProof`, `verificationReadiness`, and `reviewStatus`, but not `evidenceStatus`.
- The original eval-planning slice was written before the repo had a real satisfied claim packet to exercise this branch.
- `verificationReadiness=ready-to-verify` is not automatically updated when evidence becomes satisfied, so eval planning must check evidence status explicitly.

## Hypothesis

If `BuildClaimEvalPlan` skips claims with `evidenceStatus=satisfied`, then satisfied claims will stay valid evidence records but no longer appear in new eval fixture plans.

## Verification

- Added `TestBuildClaimEvalPlanSkipsSatisfiedEvalClaims`.
- Ran `go test ./internal/runtime -run 'TestBuildClaimEvalPlan(SkipsSatisfiedEvalClaims|SelectsReviewedEvalClaims|SkipsHeuristicEvalClaims)'`.
- Re-ran `./bin/cautilus claim plan-evals --claims .cautilus/claims/evidenced-typed-runners.json --output .cautilus/claims/eval-plan-evidenced-typed-runners.json`.
- The evidenced eval plan now has three remaining plans and skips `claim-readme-md-148` with `reason=already-satisfied`.

## Root Cause

`BuildClaimEvalPlan` did not consider `evidenceStatus`.
Once a claim became satisfied, it still matched `recommendedProof=cautilus-eval`, `verificationReadiness=ready-to-verify`, and `reviewStatus=agent-reviewed`, so it stayed in the planning queue.

## Seam Risk

- Interrupt ID: satisfied-claim-eval-plan
- Risk Class: workflow-state
- Seam: reviewed claim evidence state to eval planning selection
- Disproving Observation: a satisfied claim remained in the generated eval plan
- What Local Reasoning Cannot Prove: whether every future caller wants an explicit re-eval option for satisfied claims
- Generalization Pressure: low; default planning should avoid already satisfied claims, while a future explicit refresh/recheck option can add them back

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Add a regression test that satisfied `cautilus-eval` claims are skipped by default eval planning.
