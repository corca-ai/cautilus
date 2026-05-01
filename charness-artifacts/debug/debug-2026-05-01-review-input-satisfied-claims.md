# Debug Review: review input satisfied claims
Date: 2026-05-01

## Problem

The first bounded LLM review batch included claims already marked `evidenceStatus=satisfied`, which spent review budget on claims that did not need another reviewer pass.

## Correct Behavior

Given a claim packet already has direct or verified evidence for a claim, when `claim review prepare-input` builds LLM review clusters, then the satisfied claim should be excluded from review clusters by default and recorded as a skipped claim for audit.

## Observed Facts

- `.cautilus/claims/review-input-llm-batch1.json` included satisfied claims such as `claim-readme-md-7`, `claim-readme-md-144`, and `claim-readme-md-211`.
- The resulting batch had 14 candidate entries but only 8 unresolved claim entries.
- `claim plan-evals` already skips satisfied claims by default and records `already-satisfied` skipped claims.
- `docs/contracts/claim-discovery-workflow.md` already says eval planning skips satisfied claims, but review input did not have the same budget-preserving behavior.

## Reproduction

```bash
./bin/cautilus claim review prepare-input --claims .cautilus/claims/evidenced-typed-runners.json --max-clusters 6 --max-claims-per-cluster 8 --output /tmp/review-input.json
jq -r '.clusters[].candidates[] | select(.currentLabels.evidenceStatus=="satisfied") | .claimId' /tmp/review-input.json
```

The jq query printed satisfied claim ids before this fix.

## Candidate Causes

- Selection gap: `BuildClaimReviewInput` enriched candidates with possible evidence refs but did not filter already satisfied claims before clustering.
- Contract asymmetry: eval planning had an explicit satisfied-claim skip policy, while review input only had cluster-budget skips.
- Dogfood blind spot: earlier review batches focused on applying evidence and did not inspect whether satisfied claims were still being scheduled for review.

## Hypothesis

If `BuildClaimReviewInput` filters `evidenceStatus=satisfied` before clustering and records those entries under `skippedClaims`, then review input will keep satisfied claims out of LLM review clusters while preserving evidence refs for audit.

## Verification

Added `TestBuildClaimReviewInputSkipsSatisfiedClaims`.
The test builds a packet with one satisfied claim and one unknown claim, then verifies only the unknown claim appears in review clusters, the satisfied claim appears under `skippedClaims` with reason `already-satisfied`, and the selection policy records `excludesEvidenceStatus: ["satisfied"]`.

## Root Cause

`claim review prepare-input` treated all claim candidates as review candidates, regardless of final evidence status.
This was a budget-selection bug rather than an evidence validation bug.

## Seam Risk

- Interrupt ID: review-input-satisfied-claims
- Risk Class: none
- Seam: claim review scheduling versus carried evidence audit
- Disproving Observation: satisfied claims were visible inside review clusters even though their direct evidence refs were already validated.
- What Local Reasoning Cannot Prove: whether future operators will want an explicit override to re-review satisfied claims.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep review-cluster selection and eval-plan selection aligned around `evidenceStatus=satisfied`.
If re-reviewing satisfied claims becomes useful, add an explicit opt-in flag instead of making it the default review budget behavior.
