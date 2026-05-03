# Debug Review
Date: 2026-05-03

## Problem

`scripts/agent-runtime/apply-current-review-results.mjs` writes claim packets whose `reviewApplication.claimsPath` and `reviewApplication.reviewResultPath` can contain random absolute temporary paths.

## Correct Behavior

Given the aggregate review-result application script uses temporary filtered packets internally, when it writes `.cautilus/claims/evidenced-typed-runners.json`, then durable packet metadata should point at stable operator-facing inputs.
The generated artifact should not churn only because the temporary directory name changed.

## Observed Facts

- Reapplying current review results changed `.cautilus/claims/evidenced-typed-runners.json` from `/home/hwidong/.cache/tmp/cautilus-review-results-41fkCD/...` to `/home/hwidong/.cache/tmp/cautilus-review-results-1aDjKJ/...`.
- The actual claim update for this slice is narrow: `claim-docs-specs-user-index-spec-md-24` changes from heuristic unknown to agent-reviewed deterministic satisfied.
- `ApplyClaimReviewResult` records the exact `ClaimsPath` and `ReviewResultPath` passed by the caller.
- The aggregate script passes temporary filtered files to `cautilus claim review apply-result`, then copies the final temporary packet into the durable output.

## Reproduction

```bash
npm run claims:apply-review-results
git diff -- .cautilus/claims/evidenced-typed-runners.json
```

## Candidate Causes

- The Go apply-result implementation records the literal command inputs, which is useful for direct CLI runs but unstable for aggregate temporary callers.
- The aggregate script does not normalize the final packet after applying filtered review results.
- Temporary path churn is hidden by large generated JSON diffs, so prior review focused on claim counts rather than metadata portability.

## Hypothesis

If the aggregate script rewrites the final packet's `reviewApplication` path fields to stable source inputs after the last filtered apply, then current artifacts can preserve applied update metadata without leaking temporary paths.

## Verification

Pending repair should show that repeated `npm run claims:apply-review-results` produces no diff when inputs are unchanged.
The repair should also keep existing review-result filtering tests green and preserve the new specdown prerequisite evidence attachment.

## Root Cause

The aggregate review application script reused a direct CLI metadata contract for an internal temporary pipeline.
That made temporary implementation details part of the durable claim packet.

## Seam Risk

- Interrupt ID: claim-review-application-temp-paths
- Risk Class: none
- Seam: direct CLI provenance versus aggregate artifact generation
- Disproving Observation: the same logical review-result application produced different absolute temp paths in a checked-in packet
- What Local Reasoning Cannot Prove: whether any external consumer relies on the temp path values
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Normalize aggregate-generated provenance to stable operator-facing paths.
Keep direct `cautilus claim review apply-result` behavior unchanged unless a separate contract decides that CLI provenance should also be relative or redacted.

## Related Prior Incidents

- `charness-artifacts/debug/latest.md` previously captured claim-status snapshot freshness; both incidents come from generated artifacts presenting process state as durable product evidence.
