# Debug Review: review-result empty question clear
Date: 2026-05-01

## Problem

`claim review apply-result` could not clear stale `unresolvedQuestions` with an explicit empty array.

## Correct Behavior

Given a reviewer result includes `"unresolvedQuestions": []`, when `claim review apply-result` merges that result, then the updated claim should contain an empty `unresolvedQuestions` array instead of preserving old questions.

## Observed Facts

- The review-to-eval evidence bundle was strengthened from Codex-only to Codex+Claude evidence.
- The existing review result needed to remove the old question: `Claude parity for this review-to-eval branch remains outside this evidence bundle.`
- `applyClaimUpdate` only applied `unresolvedQuestions` when `len(arrayOrEmpty(update["unresolvedQuestions"])) > 0`.
- Therefore an explicit empty array was ignored.

## Reproduction

Apply a `cautilus.claim_review_result.v1` update with `"unresolvedQuestions": []` to a claim that already has one unresolved question.
Before the fix, the old question remains.

## Candidate Causes

- The merge logic treated empty arrays as absent fields.
- The review-result validator did not assert that `unresolvedQuestions`, when present, is an array.
- The evidence bundle update should keep the old unresolved question because Claude evidence was not actually present.

## Hypothesis

If `applyClaimUpdate` distinguishes field presence from array length, and validation asserts array shape when present, then a reviewer can clear stale unresolved questions intentionally.

## Verification

Added `TestApplyClaimReviewResultCanClearUnresolvedQuestions` and reran:

```bash
go test ./internal/runtime -run 'TestApplyClaimReviewResultCanClearUnresolvedQuestions|TestApplyClaimReviewResultCanClearRecommendedEvalSurface'
```

The focused test selection passed.

## Root Cause

The merge path used `arrayOrEmpty` as both a parser and a presence check.
That is correct for optional omitted fields but wrong for explicit empty arrays that are intended to clear prior review state.

## Seam Risk

- Interrupt ID: review-result-empty-question-clear
- Risk Class: none
- Seam: deterministic claim review-result merge
- Disproving Observation: the field was present in the review-result packet but ignored because its array length was zero.
- What Local Reasoning Cannot Prove: none; this is a local merge semantic.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Review-result merge tests should cover explicit empty arrays for fields that represent mutable reviewer state.
