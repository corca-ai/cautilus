# Eval Plan Skipped Claim Projection Debug
Date: 2026-05-04

## Problem

Fresh-eye review found that `.cautilus/claims/eval-plan-reviewed-eval-claims-2026-05-03.json` projected `claim-docs-guides-evaluation-process-md-269` as `evidenceStatus: "satisfied"` while dropping its `evidenceRefs`.
The same skipped claim also showed `recommendedEvalSurface: "dev/repo"` even though the applied review result had cleared `recommendedEvalSurface` because the claim was reclassified to deterministic proof.

## Correct Behavior

Given a skipped claim is already satisfied, when `claim plan-evals` records it under `skippedClaims`, then the skipped projection should retain evidence refs and source context regardless of skip reason.
Given a skipped claim is no longer a Cautilus eval target, when it has no explicit `recommendedEvalSurface`, then the skipped projection should not synthesize a default eval surface.

## Observed Facts

- `.cautilus/claims/evidenced-typed-runners.json` carried the correct evidence ref for `claim-docs-guides-evaluation-process-md-269`.
- `.cautilus/claims/review-result-eval-heuristic-batch-2026-05-03.json` set `recommendedEvalSurface` to `null` for that claim.
- `.cautilus/claims/eval-plan-reviewed-eval-claims-2026-05-03.json` dropped the evidence ref and printed `recommendedEvalSurface: "dev/repo"` in the skipped projection.
- `internal/runtime/claim_discovery.go` used `claimEvalPlanSurface(candidate)` for every skipped claim.
- `internal/runtime/claim_discovery.go` retained skipped evidence refs only when `reason == "already-satisfied"`.

## Reproduction

```bash
./bin/cautilus claim plan-evals \
  --claims .cautilus/claims/evidenced-typed-runners.json \
  --output .cautilus/claims/eval-plan-reviewed-eval-claims-2026-05-03.json

jq '.skippedClaims[] | select(.claimId=="claim-docs-guides-evaluation-process-md-269")' \
  .cautilus/claims/eval-plan-reviewed-eval-claims-2026-05-03.json
```

## Candidate Causes

- `skippedClaimEvalPlan` treated skipped non-eval claims as if they still needed a default eval surface.
- `skippedClaimEvalPlan` used the skip reason rather than `evidenceStatus` to decide whether evidence context should be preserved.
- Review-result application might have failed to clear `recommendedEvalSurface`.

## Hypothesis

If the bug is limited to skipped eval-plan projection, then the applied claim packet should already be correct, and changing `skippedClaimEvalPlan` should fix the output without changing review-result application.

## Verification

- `jq '.claimCandidates[] | select(.claimId=="claim-docs-guides-evaluation-process-md-269")' .cautilus/claims/evidenced-typed-runners.json` showed the applied packet had evidence refs and no `recommendedEvalSurface`.
- `go test ./internal/runtime -run 'TestBuildClaimEvalPlanSkipsSatisfiedEvalClaims|TestBuildClaimEvalPlanSkipsSatisfiedNonEvalClaimsWithEvidenceContext|TestBuildClaimEvalPlanSkipsHeuristicEvalClaims|TestBuildClaimEvalPlanSelectsReviewedEvalClaims' -count=1` passed.
- Regenerated `claim plan-evals` now preserves the evidence ref and omits synthetic `recommendedEvalSurface` for the deterministic skipped claim.

## Root Cause

`skippedClaimEvalPlan` reused eval-plan target-surface defaulting for all skipped claims, even when the skip reason was `not-cautilus-eval`.
It also tied evidence-context preservation to `reason == "already-satisfied"`, so satisfied claims skipped earlier for `not-cautilus-eval` lost their audit context.

## Seam Risk

- Interrupt ID: eval-plan-skipped-claim-projection
- Risk Class: none
- Seam: claim packet projection into eval planning summaries
- Disproving Observation: the source claim packet and review-result application were already correct; only the derived eval-plan projection was wrong.
- What Local Reasoning Cannot Prove: whether other derived packet projections have similar reason-order coupling.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Projection helpers should not synthesize eval-specific defaults for non-eval claims.
Projection helpers should preserve verified evidence context based on evidence status, not only on the first skip reason that matched.

## Related Prior Incidents

- `charness-artifacts/debug/debug-2026-05-03-eval-surface-related-evidence-ref.md`: prior evidence work where strict evidence validation caught an overclaim before attachment.
