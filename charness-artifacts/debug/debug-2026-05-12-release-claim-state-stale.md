# Release Claim State Stale Debug
Date: 2026-05-12

## Problem

`npm run verify` failed during the 0.15.3 release preparation because `.cautilus/claims/status-summary.json` was stale.

## Correct Behavior

Given a release branch has merged the intended mainline and issue-fix commits, when `npm run verify` runs before tagging, then checked-in generated claim state should match the current committed head.

## Observed Facts

The exact failing output was `.cautilus/claims/status-summary.json is stale; run npm run claims:evidence-state`.
The branch had merged local `main` and the issue 35 fix before `npm run release:prepare -- 0.15.3`.
Running `npm run claims:evidence-state` updated `.cautilus/claims/status-summary.json`, `.cautilus/claims/evidence-state.json`, and `docs/specs/proof/claim-evidence-state.md`.
The generated diff updated the status hash, `currentGitCommit`, and the committed changed-file/source summaries from the previous release baseline to the merged release head.

## Reproduction

Run `npm run verify` on the release-prep branch after merging local `main` and before refreshing claim evidence state.
The `claims:evidence-state:check` step exits with status 1 and reports the stale status summary.

## Candidate Causes

- The release version bump modified claim inputs directly.
- The issue and local main merge changed committed files that are summarized by the claim status snapshot.
- A generator regression produced unstable output unrelated to the current branch state.

## Hypothesis

The claim evidence snapshot intentionally records committed diff metadata, so merging the release inputs changed the expected generated snapshot and `claims:evidence-state` should produce a bounded generated-only diff.

## Verification

`npm run claims:evidence-state` succeeded.
The resulting diff was limited to generated claim state files and reflected the merged release head metadata.

## Root Cause

The release branch advanced from the prior checked-in claim evidence state to a merged head that included local main and issue 35 commits.
The checked-in claim evidence snapshot had not yet been refreshed for that head.

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

Refresh claim evidence state after merging release inputs and before the final pre-tag `npm run verify`.
