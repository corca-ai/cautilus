# Debug Review
Date: 2026-05-03

## Problem

Fresh-eye review found that the evaluation-process evidence bundle claimed review variants detect `blocker`, `concern`, and `pass`, but the cited test set did not directly exercise a `concern` verdict.

## Correct Behavior

Given a claim says a structured review loop can detect `blocker`, `concern`, and `pass`, when the evidence marks that claim satisfied, then the cited deterministic tests should exercise those verdict labels or the evidence should narrow the claim.
Given `.cautilus/claims/latest.json` is the raw discovery baseline and `.cautilus/claims/evidenced-typed-runners.json` is the review-applied packet, then it is acceptable for newly applied review results to appear only in the evidenced packet until the next discovery pass starts from that evidenced packet.

## Observed Facts

- `claim-docs-guides-evaluation-process-md-289` source text names `blocker`, `concern`, and `pass`.
- The initial evidence bundle cited review-variants tests that covered pass, blocked, failed, schema fallback, and output-file plumbing.
- No cited review-variants test directly emitted a `concern` verdict.
- During the initial repair pass, `.cautilus/claims/latest.json` and `.cautilus/claims/evidenced-typed-runners.json` differed because `latest.json` was generated before applying the new review-result file, while the status report was generated from the evidenced packet.
- To keep this evidence-only slice scoped, `.cautilus/claims/latest.json` was left at the prior raw discovery baseline and the review-applied status lives in `.cautilus/claims/evidenced-typed-runners.json`.
- Claim validation reported `issueCount=0`.

## Reproduction

```bash
go test ./internal/app -run 'TestCLIReviewVariantsSupportsOutputUnderTest|TestCLIReviewVariantsUsesDefaultSchemaFromReviewPromptInput|TestCLIReviewVariantsClassifiesUnavailableExecutorAsBlockedPartialSuccess|TestCLIReviewVariantsReturnsFailedSummaryWhenVariantEmitsFailedPayload' -count=1
jq '.claimCandidates[] | select(.claimId=="claim-docs-guides-evaluation-process-md-289") | {reviewStatus,evidenceStatus,evidenceRefs}' .cautilus/claims/evidenced-typed-runners.json
```

Before the repair, the test command did not include a concern-verdict case even though the evidence text claimed that behavior.

## Candidate Causes

- The evidence bundle compressed "structured verdict handling" too aggressively and treated schema enum coverage as behavior proof.
- The review-variants test suite had pass, blocked, and failed examples but no direct concern verdict example.
- The raw `latest.json` versus review-applied `evidenced-typed-runners.json` artifact split looked like stale state when read without the product-owned state-role convention.

## Hypothesis

If a review variant emits `verdict: "concern"` and a concern finding, then `review variants` should keep the command execution `passed`, set `reviewVerdict` to `concern`, and preserve the concern finding in the summary packet.

## Verification

Added `TestCLIReviewVariantsPreservesConcernVerdictAndFindings`.
Verified:

```bash
go test ./internal/app -run 'TestCLIReviewVariantsSupportsOutputUnderTest|TestCLIReviewVariantsUsesDefaultSchemaFromReviewPromptInput|TestCLIReviewVariantsClassifiesUnavailableExecutorAsBlockedPartialSuccess|TestCLIReviewVariantsReturnsFailedSummaryWhenVariantEmitsFailedPayload|TestCLIReviewVariantsPreservesConcernVerdictAndFindings' -count=1
node --test scripts/agent-runtime/prepare-compare-worktrees.test.mjs
./bin/cautilus claim validate --claims .cautilus/claims/evidenced-typed-runners.json --output .cautilus/claims/validation-evidenced-typed-runners.json
```

## Root Cause

The evidence bundle over-relied on adjacent structured-output coverage and did not require one test per verdict label named in the claim.
The state-packet concern was a role-labeling ambiguity rather than a validation failure: for this slice, `latest.json` remains the prior raw discovery baseline, while `evidenced-typed-runners.json` is the applied proof packet used by the status report.

## Seam Risk

- Interrupt ID: evaluation-process-concern-proof
- Risk Class: none
- Seam: claim evidence bundles and review-variants verdict semantics
- Disproving Observation: a fresh-eye reviewer could not find a concern-verdict test in the cited evidence path
- What Local Reasoning Cannot Prove: whether every future claim phrase that lists enum values has one direct test per value
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

When an evidence bundle claims support for a named finite set such as `blocker`, `concern`, and `pass`, either cite a direct test for every named member or narrow the evidence claim to the members actually tested.
When reporting claim-state artifacts, call out whether the packet is raw discovery state or review-applied evidence state.
