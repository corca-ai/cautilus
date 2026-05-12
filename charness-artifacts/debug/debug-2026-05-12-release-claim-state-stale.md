# Release Claim State Stale Debug
Date: 2026-05-12

## Problem

`npm run verify` failed during the 0.15.3 release preparation because `.cautilus/claims/status-summary.json` was stale.

## Correct Behavior

Given a release branch has merged the intended mainline and issue-fix commits, when `npm run verify` runs before tagging, then checked-in generated claim state should match the current committed head.

## Observed Facts

The exact failing output was `.cautilus/claims/status-summary.json is stale; run npm run claims:evidence-state`.
The branch had merged local `main` and the issue 35 fix before `npm run release:prepare -- 0.15.3`.
Running `npm run claims:evidence-state` updated `.cautilus/claims/status-summary.json`, `.cautilus/claims/evidence-state.json`, and `docs/specs/proof/claim-evidence-state.md`, but the packet remained `stale=true`.
The release branch had changed claim sources, so a projection-only refresh could pass only before commit and would fail again in a fresh checkout.
Running `cautilus claim discover --previous .cautilus/claims/evidenced-typed-runners.json --output .cautilus/claims/evidenced-typed-runners.json` produced a fresh packet with `stale=false`, `candidateCount=368`, and `changedSourceCount=0`.

## Reproduction

Run `npm run verify` or the release fresh checkout probe on the release-prep branch after merging local `main` and before refreshing the stale claim packet.
The `claims:evidence-state:check` step exits with status 1 and reports the stale status summary.

## Candidate Causes

- The release version bump modified claim inputs directly.
- The issue and local main merge changed committed files that are summarized by the claim status snapshot.
- A generator regression produced unstable output unrelated to the current branch state.

## Hypothesis

The claim evidence snapshot intentionally records committed source drift.
Because the release branch changed claim sources, `claims:evidence-state` alone can only refresh the stale projection; the saved claim packet itself must be refreshed with `claim discover --previous`.

## Verification

`npm run claims:evidence-state` succeeded but left `gitState.isStale=true`.
`cautilus claim discover --previous .cautilus/claims/evidenced-typed-runners.json --output .cautilus/claims/evidenced-typed-runners.json` produced a packet whose `claim show` summary reported `isStale=false`, `changedSourceCount=0`, and `packetGitCommit` equal to the inspected checkout.

## Root Cause

The release branch advanced from the prior checked-in claim packet to a merged head that changed claim source documents.
Refreshing only the derived status and projection left the saved packet stale, so any fresh checkout at the release commit would regenerate different claim state.

## Seam Risk

- Interrupt ID: release-claim-state-stale
- Risk Class: none
- Seam: claim evidence state generation
- Disproving Observation: none
- What Local Reasoning Cannot Prove: whether the release tag has been pushed until remote verification runs
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When release input commits change claim sources, refresh the saved claim packet with `claim discover --previous` before regenerating canonical maps, status summaries, and Evidence State projections.
