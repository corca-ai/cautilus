# Satisfied Claim Eval Plan Debug
Date: 2026-05-01

## Problem

`claim plan-evals` kept emitting an eval plan for a claim after that claim had `evidenceStatus=satisfied`, and the first fix skipped satisfied claims without documenting that exclusion in the generated `selectionPolicy`.

## Correct Behavior

Given a reviewed claim packet, when a `cautilus-eval` claim already has verified/direct evidence and `evidenceStatus=satisfied`, then default eval planning should skip that claim instead of asking the host to create or run another eval fixture.
The generated eval-plan packet should also state that satisfied claims are excluded, so a downstream reader can understand the selection policy without reverse-engineering `skippedClaims`.

## Observed Facts

- `.cautilus/claims/evidenced-typed-runners.json` marks `claim-readme-md-148` as `evidenceStatus=satisfied`.
- `claim validate` accepted the packet with `valid=true` and `issueCount=0`.
- `claim plan-evals --claims .cautilus/claims/evidenced-typed-runners.json` still included `claim-readme-md-148`.
- Fresh-eye review later confirmed the skip behavior but found that `selectionPolicy` omitted the `evidenceStatus=satisfied` exclusion.

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

If `BuildClaimEvalPlan` skips claims with `evidenceStatus=satisfied` and records `excludesEvidenceStatus=["satisfied"]` in `selectionPolicy`, then satisfied claims will stay valid evidence records, no longer appear in new eval fixture plans, and remain explainable from the packet itself.

## Verification

- Added `TestBuildClaimEvalPlanSkipsSatisfiedEvalClaims`.
- Extended the same test to assert `selectionPolicy.excludesEvidenceStatus` includes `satisfied`.
- Ran `go test ./internal/runtime -run 'TestBuildClaimEvalPlan(SkipsSatisfiedEvalClaims|SelectsReviewedEvalClaims|SkipsHeuristicEvalClaims)'`.
- Re-ran `./bin/cautilus claim plan-evals --claims .cautilus/claims/evidenced-typed-runners.json --output .cautilus/claims/eval-plan-evidenced-typed-runners.json`.
- The evidenced eval plan now has one remaining plan and skips `claim-readme-md-144`, `claim-readme-md-148`, and `claim-readme-md-211` with `reason=already-satisfied`.

## Root Cause

`BuildClaimEvalPlan` did not initially consider `evidenceStatus`.
Once a claim became satisfied, it still matched `recommendedProof=cautilus-eval`, `verificationReadiness=ready-to-verify`, and `reviewStatus=agent-reviewed`, so it stayed in the planning queue.
The first repair added the filter but missed the packet-level policy metadata.

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

Add a regression test that satisfied `cautilus-eval` claims are skipped by default eval planning and that the generated selection policy documents the exclusion.
