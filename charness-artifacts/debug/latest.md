# Debug Review: review input resolved claims
Date: 2026-05-01

## Problem

The first bounded LLM review batches included claims already marked `evidenceStatus=satisfied` and claims already marked `agent-reviewed`, which spent review budget on claims that did not need another reviewer pass.

## Correct Behavior

Given a claim packet already has direct or verified evidence, or a non-stale claim already has agent/human review, when `claim review prepare-input` builds LLM review clusters, then the resolved claim should be excluded from review clusters by default and recorded as a skipped claim for audit.

## Observed Facts

- `.cautilus/claims/review-input-llm-batch1.json` included satisfied claims such as `claim-readme-md-7`, `claim-readme-md-144`, and `claim-readme-md-211`.
- The resulting batch had 14 candidate entries but only 8 unresolved claim entries.
- After satisfied claims were excluded, `.cautilus/claims/review-input-llm-batch2.json` still prioritized already reviewed unknown claims such as `claim-readme-md-13`, `claim-readme-md-9`, and `claim-readme-md-95`.
- `claim plan-evals` already skips satisfied claims by default and records `already-satisfied` skipped claims.
- `docs/contracts/claim-discovery-workflow.md` already says eval planning skips satisfied claims, but review input did not have the same budget-preserving behavior.

## Reproduction

```bash
./bin/cautilus claim review prepare-input --claims .cautilus/claims/evidenced-typed-runners.json --max-clusters 6 --max-claims-per-cluster 8 --output /tmp/review-input.json
jq -r '.clusters[].candidates[] | select(.currentLabels.evidenceStatus=="satisfied") | .claimId' /tmp/review-input.json
```

The jq query printed satisfied claim ids before the first fix.
The second dogfood pass showed the same selection issue for already reviewed non-stale claims.

## Candidate Causes

- Selection gap: `BuildClaimReviewInput` enriched candidates with possible evidence refs but did not filter already satisfied or already reviewed non-stale claims before clustering.
- Contract asymmetry: eval planning had an explicit satisfied-claim skip policy, while review input only had cluster-budget skips.
- Dogfood blind spot: earlier review batches focused on applying evidence and did not inspect whether satisfied claims were still being scheduled for review.

## Hypothesis

If `BuildClaimReviewInput` filters `evidenceStatus=satisfied` and already reviewed non-stale claims before clustering and records those entries under `skippedClaims`, then review input will keep resolved claims out of LLM review clusters while preserving evidence refs and prior decisions for audit.

## Verification

Added `TestBuildClaimReviewInputSkipsSatisfiedClaims`.
The test builds a packet with one satisfied claim, one reviewed unknown claim, and one heuristic unknown claim.
It verifies only the heuristic unknown claim appears in review clusters, the satisfied claim appears under `skippedClaims` with reason `already-satisfied`, the reviewed unknown claim appears with reason `already-reviewed`, and the selection policy records the excluded evidence and review statuses.

## Root Cause

`claim review prepare-input` treated all claim candidates as review candidates, regardless of final evidence or review status.
This was a budget-selection bug rather than an evidence validation bug.

## Seam Risk

- Interrupt ID: review-input-resolved-claims
- Risk Class: none
- Seam: claim review scheduling versus carried evidence audit
- Disproving Observation: satisfied and already reviewed claims were visible inside review clusters even though their evidence refs or prior review decisions were already recorded.
- What Local Reasoning Cannot Prove: whether future operators will want an explicit override to re-review satisfied claims.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep review-cluster selection focused on unresolved heuristic claims by default.
If re-reviewing satisfied or already reviewed claims becomes useful, add an explicit opt-in flag instead of making it the default review budget behavior.
