# Aggregate Review Application Provenance Debug
Date: 2026-05-04

## Problem

After `npm run claims:apply-review-results`, `.cautilus/claims/evidenced-typed-runners.json` marked `claim-skills-cautilus-skill-md-68` as satisfied, but its top-level `reviewApplication` only described the final single `claim review apply-result` invocation.
That made audit readers infer that the new routing review result was not represented in the applied-update summary.

## Correct Behavior

Given `apply-current-review-results.mjs` applies multiple current review-result packets, the output packet should preserve aggregate provenance that names all applied review-result paths and aggregate kept/dropped counts.
The last single-apply packet details may remain available, but they should not be the only visible top-level provenance for an aggregate run.

## Observed Facts

The new routing review run appears in `reviewRuns`.
The claim update from `.cautilus/claims/review-result-claim-discovery-routing-flow-2026-05-04.json` is reflected on `claim-skills-cautilus-skill-md-68`.
The top-level `reviewApplication` still showed only the last normalized `reviewResultPath`, which was `.cautilus/claims/review-result-dev-skill-branch-proof-2026-05-04.json`.
The script summary printed aggregate counts to stdout, but those counts were not written into the output packet.

## Reproduction

Run:

```bash
npm run claims:apply-review-results
jq '.reviewApplication, (.reviewRuns[-3:])' .cautilus/claims/evidenced-typed-runners.json
```

Before the fix, the reviewed claim state and review runs included the new routing result, but `reviewApplication.reviewResultPath` named only the final applied result path.

## Candidate Causes

- `claim review apply-result` writes provenance for one review-result packet at a time.
- `apply-current-review-results.mjs` chains single-apply outputs but only normalizes the last packet's `reviewApplication`.
- No test asserted that aggregate review application writes all applied review-result paths into the final packet.

## Hypothesis

If `apply-current-review-results.mjs` writes aggregate provenance into the output packet after the final chained apply, then audit readers can see that the routing review result and the dev-skill branch proof review result were both applied.

## Verification

`node --test scripts/agent-runtime/apply-current-review-results.test.mjs` passes with a focused assertion that aggregate review-result paths are written into `reviewApplication`.
After rerunning `npm run claims:apply-review-results`, `.cautilus/claims/evidenced-typed-runners.json` reports `reviewApplication.provenanceMode=aggregate-current-review-results`, `appliedResultCount=67`, `keptUpdateCount=278`, and includes `.cautilus/claims/review-result-claim-discovery-routing-flow-2026-05-04.json` in `aggregateReviewResultPaths`.

## Root Cause

The wrapper script chained many single `claim review apply-result` executions, then copied the final packet and normalized only that packet's last single-apply paths.
The aggregate counts existed in terminal stdout but were not preserved in the packet.
The final packet therefore mixed a correct claim state with a too-narrow top-level application summary.

## Seam Risk

- Interrupt ID: aggregate-review-application-provenance
- Risk Class: host-disproves-local
- Seam: claim review-result aggregation script and packet provenance
- Disproving Observation: The packet's claim state and review runs included the new review result while the visible top-level application summary pointed only at the final single apply.
- What Local Reasoning Cannot Prove: Reading one claim update does not prove the aggregate application provenance is clear enough for a later audit reader.
- Generalization Pressure: factor-now

## Interrupt Decision

- Premortem Required: yes
- Next Step: spec
- Handoff Artifact: charness-artifacts/spec/aggregate-review-application-provenance.md

## Prevention

Add a focused script test for aggregate review-result provenance.
Keep aggregate apply summaries in the checked-in packet, not only in terminal stdout.
