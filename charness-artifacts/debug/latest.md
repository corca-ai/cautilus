# Debug Review
Date: 2026-06-10

## Problem

A maintainer-ratified review correction (`verificationReadiness=blocked` on the master-plan `eval live`/workbench claim) was silently lost during `claims:refresh:all` after a doc edit shifted the claim's source line, breaking the claim-discovery spec's bucket assertions.
Exact symptom: specdown FAIL at `docs/specs/user/claim-discovery.spec.md:205` (`expected: bucketCount=6`, actual 7 with a new `agent-design-scenario` bucket) and rows 222/223 (bucket id mismatches).

## Correct Behavior

Given a historical `cautilus.claim_review_result.v1` correction applied to a claim, when the claim's line-derived display `claimId` drifts while its `claimFingerprint` stays stable, then the refresh replay must still re-apply the correction (contract rule: "Refresh matching should use `claimFingerprint`, not source line number alone") and must not silently drop reviewed state.

## Observed Facts

- A master-plan edit (commit `3ec0fb5`) inserted one line above the claim; `claim-docs-master-plan-md-90` became `claim-docs-master-plan-md-91`; the fingerprint `sha256:815dd0a6…` is identical across both packets.
- `latest.json` carry-forward worked: `reviewStatus=agent-reviewed`, `evidenceStatusReason`, and `nextAction` survived the id drift (fingerprint-keyed in Go `applyPreviousClaimState`).
- The replay leg failed: prev `evidenced-typed-runners.json` (git `66763b6`) has `verificationReadiness=blocked`; current has `needs-scenario` (the recomputed heuristic value).
- The original correction lives in `.cautilus/claims/review-result-readiness-triage-2026-05-10.json` referencing `claimId=claim-docs-master-plan-md-90` with **no** `claimFingerprint` on the update.
- `scripts/agent-runtime/apply-current-review-results.mjs` matches updates via `claimIndex.get(update.claimId)` (claimId-only); `updateMatchesClaim` uses fingerprint only as a mismatch veto, never as a fallback matcher; non-matching updates are counted in `droppedUpdateCount` but not surfaced anywhere an operator would see.

## Reproduction

Deterministic, in-repo: run `npm run claims:refresh:all` at HEAD (`bde828e`) and compare `evidenced-typed-runners.json` against `git show 66763b6:.cautilus/claims/evidenced-typed-runners.json` for fingerprint `sha256:815dd0a6…`; then `npm run specdown` fails the three bucket rows.

## Candidate Causes

- Replay matcher matches by display claimId only and the drifted id no longer exists in the current packet (verified, code-level).
- Historical review-result updates were authored without per-update `claimFingerprint`, so even a fingerprint-fallback matcher cannot recover them from the update alone (verified for the 2026-05-10 packet).
- Go `discover claims apply-review` rejecting the update (falsified: the update never reaches the Go binary; the .mjs filter drops it first).
- Carry-forward regression in the Go engine (falsified: reviewed fields keyed by fingerprint survived in `latest.json`).

## Hypothesis

If the .mjs replay filter drops the update because `claimIndex.get("claim-docs-master-plan-md-90")` is undefined, then adding a fingerprint-fallback would not recover this particular packet (the update has no fingerprint), and the lost label can only be restored by an append-only correction packet (contract: later packets intentionally override older decisions).

## Verification

- Code read confirms claimId-only lookup (`apply-current-review-results.mjs:301`).
- The 2026-05-10 update payload confirmed fingerprint-less.
- Prev/cur evidenced packets confirm the label flip on identical fingerprints; `unresolvedQuestions` unchanged, ruling out an intentional override.

## Root Cause

Two-legged: (1) the replay matcher in `apply-current-review-results.mjs` has no fingerprint fallback and no id-rewrite for drifted display ids, contradicting the contract's fingerprint-identity rule that the Go carry-forward already honors; (2) review-result claimUpdates have historically been written without `claimFingerprint`, making display-id drift unrecoverable from the update alone.

## Invariant Proof

- Invariant: a reviewed correction applied to claim X (identified by fingerprint) survives any refresh in which X's fingerprint still exists in the current packet.
- Producer Proof: review-result packets carry corrections; new updates must carry `claimFingerprint` (contract note added this slice; the repair packet carries it).
- Final-Consumer Proof: the replay filter recovers fingerprinted updates across id drift (new test in `apply-current-review-results.test.mjs`); fingerprint-less historical updates are reported as dropped instead of vanishing silently.
- Interface-Shape Sibling Scan: Go `applyPreviousClaimState` (fingerprint-keyed, correct), Go evidence-ref `supportsClaimIds` rewrite (correct precedent), `filterReviewResultForClaimIds` (.mjs, claimId-only — used for explicit id-set filtering where fingerprints are unavailable by design).
- Non-Claims: this slice does not backfill fingerprints into historical review-result packets; the 2026-05-10 losses are repaired by an append-only correction packet, not by mutating history.
  Per-update triage of all 23 updates in the 2026-05-10 packet (era fingerprint mapping via git history): 3 lost-and-repaired (master-plan md-90→91, reporting md-112→132, claim-discovery-workflow md-323→356), 1 drifted but superseded by the 2026-05-17 helper-packets result (md-694→727), same-id updates applied normally (later overrides legitimate), the rest retired or never carried an era fingerprint.

## Detection Gap

- `claims:refresh:all` replay | `droppedUpdateCount` was computed but surfaced nowhere; a ratified-label loss produced no warning and only failed later via an unrelated spec's bucket-count pin | smallest change: print dropped update ids per packet to stderr during replay so refresh output names every lost correction.

## Sibling Search

- Mental model: "display claimId is a stable key" — wrong; the contract says ids are display handles and fingerprints are identity.
- Same-key axis: `filterReviewResultForClaimIds` (.mjs) | decision: leave (operates on explicit id sets, fingerprint unavailable by design) | proof: code read.
- Same-consumer axis: Go `discover claims apply-review` | decision: leave (receives pre-filtered updates whose ids were rewritten to the current packet) | proof: code read of the call chain.
- cross-file: Go `applyPreviousClaimState` and evidence `supportsClaimIds` rewrite in `internal/runtime/claim_discovery.go` | decision: already correct (fingerprint-keyed; the precedent this fix copies) | proof: this incident's carry-forward behavior.
- follow-up: historical-review-result-fingerprint-backfill — a one-time backfill of `claimFingerprint` into fingerprint-less historical review-result updates (derivable from git history of `latest.json`, as the triage above proved mechanically) would permanently close the unrecoverable-drift class, shrink the ~220 standing dropped-update warnings to genuinely dead claims, and also fix the residual case where fp-less updates are kept on bare id match; outside this slice.

## Seam Risk

- Interrupt ID: none
- Risk Class: none
- Seam: none
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: yes
- Critique Scope: scoped repair-risk critique (replay behavior change affects refresh-chain semantics); ran pre-commit, blocker folded — see Prevention
- Next Step: impl
- Handoff Artifact: this file

## Prevention

- Fingerprint-fallback + id-rewrite in the replay filter, including `evidenceRefs[].supportsClaimIds` rewrite (maps to the sibling scan's correct Go precedent); the fallback also recovered 111 previously-silently-dropped historical fingerprinted updates.
- Dropped updates printed per packet during replay (maps to the detection gap); counts recorded as `rewrittenUpdateCount`/`droppedUpdateCount` in `reviewApplication`.
- Contract note: review-result `claimUpdates` should carry `claimFingerprint`; the replay recovers fingerprinted updates across display-id drift.
- Append-only correction packet `review-result-readiness-triage-replay-2026-06-10.json` restores all three lost labels with fingerprints included.
- Scoped repair-risk critique ran before commit (resurrection ordering, fingerprint collision, supportsClaimIds rewrite, packet ordering, warning volume); its blocker — two additional lost labels from the same packet — is folded into the correction packet, and its follow-up recommendation is recorded in Sibling Search.

## Related Prior Incidents

- `debug-2026-05-18-evidence-state-empty-sample-table.md` — same symptom class (claim-discovery spec bucket pins failing after refresh), different root cause (generator empty-table + stale spec positions vs reviewed-label loss).
- `debug-2026-05-17-release-prepare-claim-freshness.md` — claims-refresh-chain seam, freshness-gating leg.
