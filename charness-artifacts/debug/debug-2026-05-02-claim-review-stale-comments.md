# Debug Review: claim review stale comments
Date: 2026-05-02

## Problem

The browser claim review server loaded saved comments even when the saved comment packet belonged to an older report fingerprint.
After the claim source boundary changed and the status report was regenerated, the old comment packet still appeared applicable to the new report.

## Correct Behavior

Given a saved `.cautilus/claims/claim-status-comments.json` packet has a `reportFingerprint` that differs from the current report, when the browser review server loads state, then it should not hydrate those comments into the current decision controls.
The UI should tell the reviewer that saved comments were from an older report.

## Observed Facts

- The saved comment packet had `reportFingerprint=sha256:901d45ef7418d6bdaf8e75a9d15a2c1284be4d8a1491d1d224d233505ee88533`.
- The regenerated report had `reportFingerprint=sha256:30462b90fefd5b116d1e541bd93a14c6556eb1802d5f0339f9087912bfce1e16`.
- `loadState` normalized saved comments without comparing fingerprints.
- The stale comments were produced by a real maintainer review and then the report changed underneath them.

## Reproduction

1. Save browser comments for one claim status report.
2. Regenerate `.cautilus/claims/claim-status-report.md`.
3. Open `/api/state`.
4. Observe that old comments are still returned as current comments.

## Candidate Causes

- `loadState` trusted the comments file path without checking `reportFingerprint`.
- `buildCommentPacket` wrote a fingerprint, but no reader enforced it.
- The UI had no stale-comment status field and therefore could not warn the reviewer.

## Hypothesis

If the root cause is missing fingerprint enforcement, then filtering saved comments by current report fingerprint should return zero comments for stale packets while preserving current packets.

## Verification

Added a server test that writes an old-fingerprint comment packet, loads state for a different report, and asserts `commentPacketStatus=stale` with no hydrated comments.
`node --test scripts/agent-runtime/serve-claim-status-review.test.mjs` passes.

## Root Cause

The writer treated `reportFingerprint` as audit metadata, but the reader did not treat it as the compatibility key for saved decisions.

## Seam Risk

- Interrupt ID: claim-review-stale-comments
- Risk Class: none
- Seam: browser HITL review over regenerated claim reports
- Disproving Observation: a fingerprint mismatch now returns `comments=[]` and `commentPacketStatus=stale`.
- What Local Reasoning Cannot Prove: whether the UI copy is enough for every stale-review recovery case.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Treat saved HITL decisions as scoped to the artifact fingerprint they reviewed.
Do not hydrate old decisions into regenerated reports unless an explicit migration or carry-forward step exists.
