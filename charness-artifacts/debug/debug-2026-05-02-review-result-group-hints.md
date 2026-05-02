# Debug Review: review result group hints
Date: 2026-05-02

## Problem

`claim review apply-result` could update authoritative fields such as `claimAudience` and `recommendedProof`, while leaving derived `groupHints` such as `audience:developer` or `human-auditable` behind.
That made reviewed claim packets internally noisy after HITL decisions corrected audience or proof class.

## Correct Behavior

Given a review result changes `claimAudience` or `recommendedProof`, when `claim review apply-result` writes the updated claim packet, then derived audience and proof hints should match the authoritative fields.
Non-derived hints such as `contract`, `skill-doc`, and `linked-from:*` should be preserved.

## Observed Facts

- The accepted adapter contract claim had `claimAudience=user`, `claimAudienceSource=review-result`, and `recommendedProof=deterministic`.
- The same claim still carried `groupHints` containing `audience:developer` and `human-auditable`.
- Fresh-eye review classified this as audit noise, not a ship blocker, but it could still mislead agents reading raw claim packets.

## Reproduction

1. Apply a review-result update that changes a claim from `claimAudience=developer` to `claimAudience=user`.
2. Also change `recommendedProof` from `human-auditable` to `deterministic`.
3. Inspect the updated claim's `groupHints`.

## Candidate Causes

- `applyClaimUpdate` updates authoritative fields but never recomputes derived group hints.
- `groupHints` are treated as immutable discovery metadata even when review results refine labels.
- Downstream status buckets read authoritative fields, so tests did not catch stale hint text.

## Hypothesis

If stale hints are derived labels, then removing only audience/proof hints and re-adding the current authoritative values should preserve source/group context while eliminating misleading review artifacts.

## Verification

Added `TestApplyClaimReviewResultCanUpdateClaimAudience` coverage for group hint synchronization.
`go test ./internal/runtime` passes.

## Root Cause

Review-result application had a partial label update model.
It updated the fields that drive buckets and reports, but not the human-readable derived hints carried beside them.

## Seam Risk

- Interrupt ID: review-result-group-hints
- Risk Class: none
- Seam: claim review application over derived packet hints
- Disproving Observation: a review update now records `audience:user` and `deterministic` hints and removes stale derived hints.
- What Local Reasoning Cannot Prove: whether future derived fields beyond `groupHints` should also be synchronized by a shared normalizer.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

When review-result application changes authoritative labels, synchronize derived hint fields in the same code path rather than relying on rediscovery.
