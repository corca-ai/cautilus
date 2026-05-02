# Debug Review: status report stale review results
Date: 2026-05-02

## Problem

The claim status report stopped using `docs/maintainers/**` and `docs/specs/**` as current claim sources, but its Review Results section still exposed old `claim-docs-maintainers-*` rows from historical review-result packets.
That made the browser HITL surface capable of linking a reviewer to stale maintainer-only claim decisions as if they were current context.

## Correct Behavior

Given a claim status report is rendered for a selected current claim packet, when historical review-result packets are summarized, then only updates whose `claimId` still exists in the selected current packet should appear.
Old review-result packets may remain auditable on disk, but they should not be projected into the current HITL review context.

## Observed Facts

- `.cautilus/claims/latest.json` contains no `claim-docs-maintainers-*` candidates after the source-boundary change.
- `.cautilus/claims/claim-status-report.md` still displayed `claim-docs-maintainers-consumer-readiness-md-91` under a review-result detail section.
- `scripts/agent-runtime/render-claim-status-report.mjs` discovered every `.cautilus/claims/review-result-*.json` packet and rendered their update rows without checking membership in the selected current claim packet.
- The status-review UI links to the report's reviewed action sections, so stale rows were not merely inert archival data.

## Reproduction

1. Exclude `docs/maintainers/**` from claim discovery and regenerate `.cautilus/claims/latest.json`.
2. Leave older `.cautilus/claims/review-result-*.json` packets in the claims directory.
3. Render `.cautilus/claims/claim-status-report.md`.
4. Search the report for `claim-docs-maintainers`.

## Candidate Causes

- Review-result digest rendering was not scoped to the selected current claim packet.
- Historical review-result files were treated as live projection inputs instead of audit history.
- The browser HITL surface linked to review-result report sections without guarding against stale rows inside those sections.

## Hypothesis

If the stale rows come from unscoped historical review-result digests, then filtering each digest to updates whose `claimId` exists in the current claim packet will remove old maintainer-only rows while preserving useful review summaries for current claims.

## Verification

Added a report renderer test with a stale `claim-docs-maintainers-*` update in a review-result digest and asserted that neither the stale claim id nor its next action appears in the rendered report.
Regenerated `.cautilus/claims/claim-status-report.md` and confirmed `rg "claim-docs-maintainers|docs/maintainers" .cautilus/claims/claim-status-report.md` only reports the explicit discovery exclude list.
`node --test scripts/agent-runtime/render-claim-status-report.test.mjs scripts/agent-runtime/serve-claim-status-review.test.mjs` passes.

## Root Cause

The report renderer correctly used the current claim packet for status buckets, but it treated all historical review-result packets as current projection data.
That mixed audit history with live HITL context after the source boundary changed.

## Seam Risk

- Interrupt ID: status-report-stale-review-results
- Risk Class: none
- Seam: claim status report projection over historical review-result packets
- Disproving Observation: stale claim ids absent from the regenerated report except the explicit exclude-list text.
- What Local Reasoning Cannot Prove: whether every future report section has the right audit-versus-current projection boundary without additional focused tests.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

When a human-facing report projects auxiliary packets beside a selected current packet, filter auxiliary rows through current packet membership before rendering them as live review context.
