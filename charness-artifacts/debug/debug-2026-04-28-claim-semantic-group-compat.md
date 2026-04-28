# Debug Review: claim semantic group compatibility
Date: 2026-04-28

## Problem

`npm run verify` failed after adding `claimSemanticGroup` to discovered claim packets.

## Correct Behavior

Given an older valid `cautilus.claim_proof_plan.v1` fixture without `claimSemanticGroup`, when `claim show`, `claim review prepare-input`, `claim review apply-result`, or `claim plan-evals` reads it, then the command should keep working and derive a generic semantic group for review batching.

## Observed Facts

- `npm run verify` failed during `test · go race`.
- The exact error was `claimCandidates[0].claimSemanticGroup must be a non-empty string`.
- The failing tests were existing `internal/app` command tests that use older minimal claim packet fixtures.
- Fresh `claim discover` output already includes `claimSemanticGroup`.

## Reproduction

```bash
npm run verify
```

Before the fix, `internal/app` tests failed before exercising stale-packet or review-input behavior because packet validation rejected older fixtures.

## Candidate Causes

- The new field was accidentally required in `ValidateClaimProofPlan`.
- The app tests may be stale and need fixture updates only.
- Downstream review/status code may not have a fallback when the field is absent.

## Hypothesis

If `claimSemanticGroup` is optional at validation time but downstream renderers and review cluster keys default missing values to `General product behavior`, then old packets keep working while fresh discovery still emits the richer field.

## Verification

After the compatibility patch, this passed:

```bash
npm run verify
```

## Root Cause

The implementation treated a newly added review-batching hint as a required packet field.
That was too strict for existing checked fixtures and prior claim packets.

## Seam Risk

- Interrupt ID: claim-semantic-group-compat
- Risk Class: contract-freeze-risk
- Seam: claim packet validation versus additive review metadata
- Disproving Observation: old command tests failed before command behavior could run
- What Local Reasoning Cannot Prove: whether every older real-world packet shape is represented by the current app fixtures
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep newly added claim review labels optional unless the packet schema version changes.
Use deterministic defaults in summaries, review clusters, and current labels so older packets remain consumable.
