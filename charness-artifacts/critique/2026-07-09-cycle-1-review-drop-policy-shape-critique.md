# Cycle 1 Review Drop Policy Shape Critique
Date: 2026-07-09

## Decision Under Review

Cycle 1 tightens `droppedUpdateSamplePolicy` from a preserved source object into a checked producer-owned provenance contract.
The summary generator now rejects unsupported selection, non-integer caps, contradictory booleans, count drift, and missing reason representation when the source cap allows every dropped reason to be represented.

## Packet Consumed

- `charness-artifacts/critique/2026-07-09-cycle-1-review-drop-policy-shape-packet.md`
- Packet status: ok

## Diff Scope

The implementation changes `scripts/agent-runtime/summarize-claim-review-drops.mjs` and its tests.
The contract change is in `docs/contracts/claim-discovery-workflow.md`, with claim artifacts refreshed from the updated source.

## Capability at Stake

Agents should be able to trust the review-drop summary's source replay policy as a real audit signal.
If the source policy says bounded reason representation is preserved, the packet must either contain representative source samples for every counted dropped reason when the cap allows it or fail generation.

## Failure Angles

- Problem framing: source policy validation solves the upstream provenance problem rather than inventing a downstream summary policy.
- Boundary ownership: aggregate replay produces sample policy; review-drop summary consumes and validates that producer-owned policy.
- Operational checklist: malformed source policy must not pass `claims:review-drops:check` and later mislead queue selection.

## Findings

- Initial shape validation was too shallow because a packet could claim `preservesDroppedReasonRepresentationWhenCapAllows: true` while omitting a reason sample even when `maxRecordedSamples` could cover all counted reasons.
- That blocker was fixed by validating source reason representation when `maxRecordedSamples` is at least the nonzero dropped reason count.
- Counterweight found no remaining blocker after helper extraction restored ESLint complexity compliance.
- Future multi-policy selection support is valid but deferred; current behavior intentionally rejects unknown policy selections.

## Counterweight Pass

- Act Before Ship: fixed reason-representation validation and lint complexity.
- Bundle Anyway: added a non-integer `maxRecordedSamples` test.
- Over-Worry: do not introduce a full schema migration or accept future unknown policies now.
- Valid but Defer: a future reviewApplication-wide schema validator could share these rules if the packet surface broadens.

## Structured Findings

- F1 | bin: act-before-ship | evidence: strong | ref: scripts/agent-runtime/summarize-claim-review-drops.mjs:253 | action: fix | note: source policy reason-representation guarantee needed actual reason coverage validation
- F2 | bin: bundle-anyway | evidence: strong | ref: scripts/agent-runtime/summarize-claim-review-drops.test.mjs:203 | action: fix | note: malformed policy tests now cover unsupported selection, proportional flag, reason guarantee, non-integer cap, and missing represented reason
- F3 | bin: over-worry | evidence: moderate | ref: docs/contracts/claim-discovery-workflow.md:595 | action: document | note: accepting future sampling policies now would weaken the current audit contract
- F4 | bin: valid-but-defer | evidence: moderate | ref: scripts/agent-runtime/summarize-claim-review-drops.mjs:253 | action: defer | note: future reviewApplication-wide schema validation can absorb this local guard later

## Reviewer Tier Evidence

- Requested tier: high-leverage.
- Requested spawn fields: none.
- Host exposure state: host-defaulted
- Application state: host signal: `spawn_agent` returned reviewer ids `019f46c2-f1ff-79c2-bd9f-c3d4d71f2140`, `019f46c3-077d-7700-b93d-bb01751d289e`, and `019f46c3-2102-7e21-bf09-38a8d9df2212`.

## Fresh-Eye Satisfaction

parent-delegated

## Boundary Ownership

- Producer: aggregate review replay writes `reviewApplication.droppedUpdateSamplePolicy`.
- Consumer: review-drop summary generation validates and preserves that source policy.
- Owning surface: claim review replay provenance and generated review-drop diagnostics.
- Verdict: owned-correctly

## Defect Class Cross-Link

- n/a

## Capability Gap

- n/a

## Pre-Merge Action

- Fixed missing source reason representation validation.
- Added focused malformed policy tests.
- Extracted source reason representation validation into a helper after ESLint surfaced complexity drift.

## Deliberately Not Doing

- Not adding a full JSON schema validator for `reviewApplication`.
- Not rendering every source policy field in Markdown because the JSON summary remains the audit source.

## Next Move

Refresh claim artifacts, validate critique/debug/goal artifacts, commit Cycle 1, and proceed to Cycle 2.
