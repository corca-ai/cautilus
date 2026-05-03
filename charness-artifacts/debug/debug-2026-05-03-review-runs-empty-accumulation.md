# Debug Review
Date: 2026-05-03

## Problem

Refreshing and reapplying claim review results accumulated duplicate empty `reviewRuns` entries in claim packets.

## Correct Behavior

Given a review result has no `reviewRun` or `sourceReviewInput` provenance, when it is applied to a claim packet, then it should update claim labels without appending an empty review-run record.
Given prior packets already contain review-run provenance, when discovery carries them forward or review results are reapplied, then duplicate records should be normalized away.

## Observed Facts

- `.cautilus/claims/evidenced-typed-runners.json` grew to `reviewRuns` length 96, with 72 entries where both `reviewRun` and `sourceReviewInput` were `{}`.
- `.cautilus/claims/latest.json` grew to `reviewRuns` length 64, with 48 empty entries.
- `renderClaimReviewRun` always returned a record with empty maps when the review result had no provenance fields.
- `ApplyClaimReviewResult` appended that record unconditionally.
- `claim discover --previous` carried previous `reviewRuns` forward before `claims:apply-review-results` reapplied all current review-result files.

## Reproduction

```bash
./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/evidenced-typed-runners.json --output .cautilus/claims/latest.json
npm run claims:apply-review-results
jq '{len:(.reviewRuns|length), empty:([.reviewRuns[]? | select((.reviewRun//{})=={} and (.sourceReviewInput//{})=={})]|length)}' .cautilus/claims/evidenced-typed-runners.json
```

Before the fix this reported many empty review-run entries.

## Candidate Causes

- `ApplyClaimReviewResult` appended empty provenance for every review-result file.
- `claim discover --previous` carried prior review-run records without filtering empty records.
- Reapplying review results had no dedupe key, so even meaningful provenance could accumulate duplicates.

## Hypothesis

If review-run normalization drops records with no `reviewRun` or `sourceReviewInput` and dedupes canonical records, then refreshed packets will keep meaningful provenance without empty accumulation.

## Verification

Run focused claim-review tests, refresh claim packets, and verify both `latest.json` and `evidenced-typed-runners.json` report zero empty review-run entries.

## Root Cause

Review-run provenance was treated as append-only even when the source review result did not contain provenance.
The refresh workflow then compounded the issue by carrying old runs forward and reapplying all review results.

## Seam Risk

- Interrupt ID: review-runs-empty-accumulation
- Risk Class: none
- Seam: claim review provenance and claim refresh workflow
- Disproving Observation: empty `reviewRuns` multiplied even though no new provenance had been created
- What Local Reasoning Cannot Prove: whether every historical non-empty review-run record is semantically unique
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Normalize review-run provenance in both carry-forward and apply-result paths, and keep regression tests for empty and duplicate review-run handling.
