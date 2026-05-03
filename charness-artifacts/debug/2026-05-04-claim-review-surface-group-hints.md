# Debug Review
Date: 2026-05-04

## Problem

`cautilus claim review apply-result` could update a claim's `recommendedEvalSurface` without updating the derived surface value inside `groupHints`.

The dogfood symptom appeared in Crill: an agent review corrected an `analyze` claim from a dev/repo surface to `app/prompt`, but the generated claim packet still carried the old `dev/repo` group hint until it was manually patched.

## Correct Behavior

Given a review result updates or clears `recommendedEvalSurface`, when Cautilus applies that result, then `groupHints` should remove stale derived eval-surface hints and include only the current surface when one remains.

Given a review result changes `recommendedProof` away from `cautilus-eval`, then Cautilus should clear both the eval surface field and any stale surface group hint.

## Observed Facts

- `applyClaimUpdate` already updates or deletes `recommendedEvalSurface`.
- `syncClaimGroupHints` already removes and regenerates derived audience and proof hints.
- `syncClaimGroupHints` did not treat eval surfaces as derived hints.
- Initial claim discovery can add `recommendedEvalSurface` values to `groupHints`, so stale surface hints can survive later review application.
- Existing tests covered clearing the surface field but did not assert that stale surface hints were removed.

## Reproduction

The regression is reproduced by applying a review update to `claim-agents-md-3` in the tiny claim-discovery fixture with:

```json
{
  "recommendedProof": "cautilus-eval",
  "recommendedEvalSurface": "app/prompt"
}
```

Before the fix, the claim field changed to `app/prompt`, but the old surface hint could remain in `groupHints`.

## Candidate Causes

- `syncClaimGroupHints` only classifies audience and proof labels as derived.
- `recommendedEvalSurface` was added to raw discovery group hints before review-result application existed.
- Review-result validation checked surface values but did not force the hint list to recompute from the accepted surface.

## Hypothesis

If eval surfaces are treated as derived group hints and the current `recommendedEvalSurface` is regenerated alongside audience and proof hints, then review-result application will remove stale surface hints and add the current surface hint.

## Verification

- `go test ./internal/runtime -run 'TestApplyClaimReviewResult(CanClearRecommendedEvalSurface|SyncsRecommendedEvalSurfaceGroupHint|ClearsSurfaceForNonEvalProof|CanUpdateClaimAudience)'` passed.

## Root Cause

The review application path had a partial derived-hint model.
It knew `groupHints` contained generated values for audience and proof, but not that eval surfaces were also generated hints from discovery.
Changing `recommendedEvalSurface` therefore updated the canonical field while leaving an obsolete routing hint behind.

## Seam Risk

- Interrupt ID: claim-review-surface-group-hints
- Risk Class: contract-freeze-risk
- Seam: claim review result application feeding eval planning and status grouping
- Disproving Observation: Crill dogfood required a manual packet patch after a valid review-result update changed the surface.
- What Local Reasoning Cannot Prove: whether existing saved claim packets in consumer repos already contain stale surface hints; refreshed or newly applied packets will be corrected by the fix.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep `groupHints` synchronized from canonical fields rather than treating them as independent review-owned labels.
When a new canonical routing field is also stored as a hint, add it to the derived-hint sync tests before relying on it in status summaries or eval planning.
