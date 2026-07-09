# Debug Review
Date: 2026-07-09

## Problem

Aggregate claim review replay could still apply fingerprintless legacy updates to a current fingerprinted claim when the line-derived `claimId` matched, and all-stale replays emitted drop diagnostics without preserving them in the output packet.

## Correct Behavior

Given a current claim with `claimFingerprint`, when a review-result update lacks `claimFingerprint`, then replay must drop the update instead of trusting the display `claimId`.
Given an aggregate replay where every update is stale or dropped, when the command writes the output packet, then `reviewApplication` must still record dropped reason counts and bounded samples.

## Observed Facts

- Fresh-eye review found `updateMatchesClaim` accepted same-`claimId` fingerprintless updates for fingerprinted current claims.
- Fresh-eye review reproduced an all-stale replay where `droppedUpdateCount` was returned and a warning was emitted, but the output packet had no durable `reviewApplication` diagnostics.
- The existing focused test suite passed before these cases were added, so the standing tests did not encode either invariant.

## Reproduction

- Added `filterReviewResultForCurrentClaims drops fingerprintless updates for fingerprinted reused ids`, which fails on the old matcher because the fingerprintless update is kept.
- Added `applyCurrentReviewResults records dropped diagnostics when every result is stale`, which fails on the old projection guard because `reviewApplication` is omitted when `appliedResultCount` is zero.

## Candidate Causes

- Matcher cause: `updateMatchesClaim` treated missing update fingerprints as compatible with any current claim that had the same display id.
- Projection cause: `applyCurrentReviewResults` projected aggregate provenance only when at least one review-result had kept updates.
- Contract cause: docs named dropped diagnostics but did not state the reason vocabulary or the all-stale persistence requirement clearly enough for tests to follow.

## Hypothesis

- If `updateMatchesClaim` requires an update fingerprint whenever the current claim has one, the same-id fingerprintless collision will become a dropped `missing-fingerprint` update; disconfirmer: run the same-id fingerprintless regression and observe the update still being kept.
- If aggregate provenance is projected whenever replay processed review-result paths, all-stale replay outputs will preserve dropped diagnostics; disconfirmer: run the stale-only aggregate regression and observe `reviewApplication` still missing from the output packet.

## Verification

- Confirmed: `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/apply-current-review-results.test.mjs` passes with 13 tests after adding the two regressions.
- Confirmed: `npm run lint:eslint` passes after the matcher and projection changes.

## Root Cause

The implementation only used `claimFingerprint` to reject explicit mismatches or recover drifted ids, but it still treated same display ids as sufficient identity when the update omitted a fingerprint.
The aggregate projection guard also conflated "no updates applied" with "no replay state worth recording", so dropped-only diagnostics remained terminal-only.

## Invariant Proof

- Invariant: When aggregate replay emits dropped-update diagnostics, the final output packet must surface those diagnostics before the workflow can claim replay provenance.
- Producer Proof: the all-stale regression observes one warning and `droppedUpdateCount: 1`.
- Final-Consumer Proof: the same regression reads the output packet and asserts `reviewApplication.droppedUpdateReasonCounts` plus `droppedUpdateSamples`.
- Interface-Shape Sibling Scan: checked same replay matcher/projection path in `scripts/agent-runtime/apply-current-review-results.mjs`; no separate generated mirror owns these fields.
- Non-Claims: this does not recover legacy fingerprintless review intent; it only prevents unsafe carry-forward and records why updates were dropped.

## Detection Gap

- focused replay tests | missing fingerprintless same-id collision fixture | add same-id current-fingerprinted regression
- end-to-end aggregate replay test | missing all-stale output packet assertion | add stale-only `applyCurrentReviewResults` regression
- contract docs | reason vocabulary could be misread | define `missing-fingerprint` and `missing-live-fingerprint`

## Sibling Search

- Mental model: a display id match was treated as a safe fallback after fingerprint support was added.
- same layer: `scripts/agent-runtime/apply-current-review-results.mjs` matcher and projection guards | decision: same bug, fix now | proof: local payload proof
- abstraction up: aggregate diagnostic producers that only persist state after successful application | decision: same class, diagnostic-only for this slice | proof: static scan only | no action needed: this slice found only the aggregate review-result replay owner, and the final-output regression already covered that owner
- specialization down: dropped-update reason accounting and bounded samples | decision: same class, diagnostic-only for this slice | proof: local payload proof | no action needed: reason counts and bounded samples are already covered by focused serialization and stale-only replay tests
- mental-model sibling: stale review packets without fingerprints | decision: intentional non-recovery boundary | proof: contract-backed
- cross-file: docs/contracts/claim-discovery-workflow.md reason vocabulary and identity contract updated with the code change

## Seam Risk

- Interrupt ID: none
- Risk Class: none
- Seam: none
- Disproving Observation: focused JS tests exercise the replay seam without host adapters
- What Local Reasoning Cannot Prove: no external host behavior is involved
- Generalization Pressure: none

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

Parent-delegated fresh-eye critique already ran for this slice.

## Prevention

Keep claim replay identity tests aligned to the contract: current fingerprinted claims require fingerprinted review updates, and replay diagnostics must be asserted in the final output packet even when no review-result applies.
