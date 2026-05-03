# Debug Review
Date: 2026-05-03

## Problem

Applying a new verified evidence review-result could still leave the target claims with `evidenceStatus=unknown`.

## Correct Behavior

Given a claim has verified or direct evidence and `evidenceStatus=satisfied`, when an older review-result that did not inspect evidence is applied later in the aggregate replay order, then the older `unknown`, `missing`, or `partial` evidence status should not downgrade the verified evidence.
An explicit `stale` update should still be able to invalidate evidence.

## Observed Facts

- `.cautilus/claims/review-result-evidence-install-packaging-2026-05-03.json` marked `claim-readme-md-7`, `claim-readme-md-10`, and `claim-readme-md-13` as `satisfied`.
- After `npm run claims:apply-review-results`, those candidates carried the new verified evidence ref but still had `evidenceStatus=unknown`.
- Existing older review-result packets for the same claims recorded that their review lane had not run install proof.
- `applyClaimUpdate` overwrote `evidenceStatus`, `evidenceStatusReason`, `nextAction`, and `unresolvedQuestions` in literal replay order.

## Reproduction

```bash
npm run claims:apply-review-results
jq '.claimCandidates[] | select(.claimId=="claim-readme-md-7" or .claimId=="claim-readme-md-10" or .claimId=="claim-readme-md-13") | {claimId,evidenceStatus,evidenceStatusReason}' .cautilus/claims/evidenced-typed-runners.json
```

## Candidate Causes

- Review-result replay order is filename based, not semantic recency based.
- Older review packets used `unknown` to mean "this lane did not inspect evidence", but the merge code treated it as a stronger current assertion.
- Evidence refs were merged independently from `evidenceStatus`, allowing internally contradictory packets with verified refs, unknown evidence state, and stale unresolved questions.

## Hypothesis

If `applyClaimUpdate` protects already satisfied evidence from later `unknown`, `missing`, or `partial` evidence updates, then verified evidence state and its resolved-question audit state remain stable while explicit `stale` invalidation remains possible.

## Verification

- `go test ./internal/runtime -run 'TestApplyClaimReviewResultDoesNotDowngradeSatisfiedEvidenceWithOlderUnknownReview|TestApplyClaimReviewResultUpdatesLabelsWithVerifiedEvidence'`
- `npm run claims:apply-review-results`
- `./bin/cautilus claim validate --claims .cautilus/claims/evidenced-typed-runners.json --output .cautilus/claims/validation-evidenced-typed-runners.json`

The target install/packaging claims now remain `evidenceStatus=satisfied`, stale unresolved questions are not reintroduced by older non-evidence review lanes, and validation reports zero issues.

## Root Cause

The review-result merge contract lacked a monotonic rule for verified evidence.
Older review lanes that merely lacked evidence could overwrite newer verified evidence because the aggregate script replays all current review-result files.

## Seam Risk

- Interrupt ID: verified-evidence-downgrade
- Risk Class: none
- Seam: review-result replay order versus evidence truth state
- Disproving Observation: target claims had verified evidence refs but `evidenceStatus=unknown`
- What Local Reasoning Cannot Prove: whether future review-result schemas need an explicit evidence revocation field beyond `stale`
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Protect `satisfied` evidence and its resolved unresolved-question state from downgrade by later non-invalidating review updates.
Use `stale` as the explicit evidence invalidation state when a reviewer or refresh step needs to revoke evidence.

## Related Prior Incidents

- `charness-artifacts/debug/debug-2026-05-01-carried-evidence-reconciliation-tests.md`: established that evidence carry-forward and stale marking need explicit evidence-state semantics.
