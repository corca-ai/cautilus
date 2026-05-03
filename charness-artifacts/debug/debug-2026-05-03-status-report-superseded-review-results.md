# Debug Review: status report superseded review results
Date: 2026-05-03

## Problem

After applying newer review-result packets for current claim IDs, `.cautilus/claims/claim-status-report.md` could still show older review-result detail rows whose proof/readiness/evidence labels happened to match the current packet but whose rendered next actions or evidence reasons were stale.

## Correct Behavior

Given a claim status report is rendered from the current evidenced claim packet, when historical review-result packets contain updates for the same claim IDs, then the report should distinguish active updates from superseded historical updates by comparing all update fields that affect current rendered work.
Then stale next actions, evidence reasons, and evidence refs should not be presented as current work.

## Observed Facts

- The first renderer fix compared only `recommendedProof`, `verificationReadiness`, `evidenceStatus`, and `reviewStatus`.
- Fresh-eye review found current report detail rows where those four fields still matched but `nextAction` had been superseded by newer claim state.
- The current intended state for broad `reviewable-artifacts` claims is `evidenceStatus=unknown` with partial `possible` evidence, not satisfied.

## Reproduction

1. Add a newer review-result packet that changes an existing claim ID's `nextAction`, `evidenceStatusReason`, or `evidenceRefs`.
2. Regenerate `.cautilus/claims/evidenced-typed-runners.json`.
3. Regenerate `.cautilus/claims/claim-status-report.md`.
4. Observe that an older review-result packet for the same claim ID can still appear in the Review Results detail section if currentness is based only on coarse status fields.

## Candidate Causes

- The report renderer filters review-result digests by claim ID and a too-small state-field subset, not by whether all rendered update fields still match the current claim state.
- The review-result application order is correct, but the report treats every matching historical packet as equally current projection data.
- Historical review-result packets lack an explicit superseded marker, so the renderer must derive currentness from the selected claim packet.

## Hypothesis

If `render-claim-status-report.mjs` classifies each review-result update as active only when its applied fields still match the selected current claim, then obsolete proof-gap updates will remain auditable as superseded counts but disappear from current next-action detail tables.

## Verification

- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/render-claim-status-report.test.mjs`
- The report renderer now exposes active versus superseded review-result update counts and omits superseded updates from current next-action detail tables.
- Active matching now includes rendered update fields such as `nextAction`, `evidenceStatusReason`, `evidenceRefs`, and `unresolvedQuestions`, not only proof/readiness/evidence/review status.

## Root Cause

The Review Results projection had one freshness guard from the prior incident: it filtered out updates whose claim IDs no longer existed.
It did not handle the next stale shape, where the claim ID and coarse labels still match but a newer review-result packet has superseded rendered next-work fields.

## Seam Risk

- Interrupt ID: status-report-superseded-review-results
- Risk Class: local-report-projection
- Seam: claim status report projection over historical review-result packets
- Disproving Observation: current claim packet can carry newer rendered work fields while an older review-result detail table still carries obsolete next actions for the same claim ID
- What Local Reasoning Cannot Prove: whether all historical review-result packets should eventually carry source packet fingerprints and explicit supersession metadata
- Generalization Pressure: medium; the renderer should derive enough currentness to keep review reports readable without rewriting all historical packets

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Add a renderer test for superseded historical review updates and make the report expose active versus superseded update counts.

## Related Prior Incidents

- `charness-artifacts/debug/debug-2026-05-02-status-report-stale-review-results.md`: fixed the earlier stale shape where historical updates referenced claim IDs no longer present in the current packet.
