# Claim Review Upstream Sample Policy Critique
Date: 2026-07-09

## Decision Under Review

Aggregate claim review replay now records `reviewApplication.droppedUpdateSamplePolicy` as producer-owned provenance for bounded dropped-update samples.
The review-drop summary preserves that upstream policy and now rejects missing or count-drifted source policy before writing the generated summary.

## Packet Consumed

- `charness-artifacts/critique/2026-07-09-claim-review-upstream-sample-policy-packet.md`
- Packet sections: `release-packaging`, `cli-agent-product`
- Packet status: `ok`

## Target

Code critique.

## Diff Scope

The changed implementation surfaces are `scripts/agent-runtime/apply-current-review-results.mjs` and `scripts/agent-runtime/summarize-claim-review-drops.mjs`.
The changed contract and proof surfaces are `docs/contracts/claim-discovery-workflow.md`, focused tests, and refreshed claim artifacts under `.cautilus/claims/`.

## Capability at Stake

Operators and agents need the upstream replay packet to explain how bounded dropped-update samples were selected before a downstream summary or re-review queue acts on them.
The source replay policy must be inspectable, preserved through the summary projection, and rejected when stale or absent.

## Failure Angles

- Jackson problem framing: the change solves the upstream audit problem because `reviewApplication` now owns the source policy instead of only adding summary prose.
- Weinberg boundary ownership: the producer of sample selection is aggregate replay, while the summary is a consumer that preserves and validates source provenance.
- Gawande operational checklist: the initial summary-only preservation could have allowed missing or stale upstream policy to pass `claims:review-drops:check`, so the summary now fails fast on absent policy with drops and on source count drift.

## Findings

- No remaining Act Before Ship findings after source-policy validation landed.
- The operational reviewer found that missing or stale upstream sample policy could previously pass generated-artifact freshness checks.
  That finding was fixed by validating `droppedUpdateSamplePolicy` in `buildReviewDropSummary`.
- Two reviewers noted that helper tests with `droppedUpdateCount > 0` and no samples made the representation flag look stronger than the fixture justified.
  That was fixed by giving the aggregate helper fixtures representative samples and matching policy counts.
- Requiring a full schema validator for every policy field is over-worry for this slice because the generated constants are narrow and the current failure mode is count provenance.
- Exact object-shape documentation for external packet consumers is valid but deferred; the current contract names the field and behavior, and the JSON packet carries the machine-readable details.

## Counterweight Pass

- Act Before Ship: none.
  The counterweight reviewer accepted that the source-policy validation closes the operational blocker.
- Bundle Anyway: add a direct `sourceDroppedUpdateCount` drift test.
  This was bundled while the summary tests were already open.
- Over-Worry: do not expand this slice into a general packet-schema migration.
- Valid but Defer: consider fuller object-shape documentation if external consumers start depending directly on `droppedUpdateSamplePolicy`.

## Structured Findings

- F1 | bin: act-before-ship | evidence: strong | ref: scripts/agent-runtime/summarize-claim-review-drops.mjs:253 | action: fix | note: missing or stale source replay sample policy had to fail before generated summaries could be accepted
- F2 | bin: bundle-anyway | evidence: strong | ref: scripts/agent-runtime/summarize-claim-review-drops.test.mjs:203 | action: fix | note: negative tests now cover missing source policy and policy count drift
- F3 | bin: over-worry | evidence: moderate | ref: scripts/agent-runtime/apply-current-review-results.mjs:417 | action: document | note: full schema migration for generated constant policy fields is beyond this provenance fix
- F4 | bin: valid-but-defer | evidence: moderate | ref: docs/contracts/claim-discovery-workflow.md:594 | action: defer | note: exact external packet object-shape documentation can wait for a consumer-facing schema slice

## Reviewer Tier Evidence

- Requested tier: high-leverage.
- Requested spawn fields: none.
- Host exposure state: host-defaulted
- Application state: host signal: `spawn_agent` returned reviewer ids `019f467c-d2df-76c1-859d-20079448f4ed`, `019f467c-e88c-7ca1-929c-7e8788abfff3`, `019f467c-fd97-71a1-8de4-e4091eb01542`, and `019f4680-9170-7af0-ad12-7134d565d604`.

## Fresh-Eye Satisfaction

parent-delegated

## Boundary Ownership

- Producer: aggregate review replay in `scripts/agent-runtime/apply-current-review-results.mjs`.
- Consumer: review-drop summary generation in `scripts/agent-runtime/summarize-claim-review-drops.mjs`, then operators and agents reading `.cautilus/claims/review-drops-summary.*`.
- Owning surface: claim review replay provenance plus generated review-drop diagnostics.
- Verdict: owned-correctly

## Defect Class Cross-Link

- n/a

## Capability Gap

- n/a

## Pre-Merge Action

- Fixed source policy validation for missing policy, selected sample drift, source dropped count drift, and sample cap drift.
- Fixed helper fixtures so nonzero dropped update counts include representative samples when asserting a representation-preserving policy.
- Re-ran focused replay and summary tests after the fixes.

## Deliberately Not Doing

- Not adding a standalone schema validator for `cautilus.claim_review_drop_summary.v1` in this slice.
- Not requiring `.cautilus/claims/latest.json` to contain `droppedUpdateSamplePolicy`; the aggregate replay output is the source consumed by review-drop summaries.

## Next Move

Run the full repo gates, validate the critique artifact, refresh claim outputs, and commit this scoped provenance improvement.
