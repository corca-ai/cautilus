# Claim Source Commit Stale Debug
Date: 2026-05-01

## Problem

`claim review prepare-input` rejects a claim packet immediately after the source docs and regenerated claim packet are committed together.

## Correct Behavior

Given a claim packet generated from the current working tree, when the source docs and packet are committed together, then the packet should be `fresh-with-head-drift` rather than stale if the recorded source content hashes still match the checkout.

## Observed Facts

- After commit `f34ccf8fb058ec947f759b0ad2c012897bc0bbe5`, `claim review prepare-input --claims .cautilus/claims/latest.json` failed.
- The exact error was: `claim review prepare-input requires a fresh claim packet: recorded claim sources changed between packet gitCommit 905735f0fa87c3d01d3f9cc152629b7a787361f4 and current HEAD f34ccf8fb058ec947f759b0ad2c012897bc0bbe5; run claim discover --previous <claims.json> --refresh-plan first or pass --allow-stale-claims`.
- The packet had been regenerated after the source doc edits, before the commit that recorded both docs and generated artifacts.
- `git diff 905735f0fa87c3d01d3f9cc152629b7a787361f4 f34ccf8fb058ec947f759b0ad2c012897bc0bbe5` correctly listed source docs, but that did not prove the packet content was stale.

## Reproduction

1. Edit a claim source file.
2. Run `./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json`.
3. Commit the source file and `.cautilus/claims/latest.json` together.
4. Run `./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json`.

## Candidate Causes

- `ClaimPacketGitState` treats any changed source path between `packet.gitCommit` and `HEAD` as stale, even when the packet records the new content hash.
- `claim discover` records the pre-commit HEAD, because the commit does not exist yet while generated artifacts are being written.
- Generated claim artifacts and source docs are committed atomically, so commit-range path diff alone is too coarse for post-commit freshness.

## Hypothesis

If source freshness checks compare the current file hash against the packet's recorded `sourceInventory[].contentHash`, source paths already represented by the packet will not be marked stale after an atomic source-plus-packet commit, while real source edits after packet generation will still be stale.

## Verification

- Added `TestClaimGitStateIgnoresCommittedSourceDriftWhenContentHashMatches`.
- Ran `go test ./internal/runtime -run 'TestBuildClaimRefreshPlanMarksChangedSources|TestBuildClaimRefreshPlanIgnoresCommittedClaimPacketDrift|TestClaimGitStateIgnoresCommittedSourceDriftWhenContentHashMatches|TestClaimGitStateMarksSymlinkTargetChangeStale'`.
- Re-ran `./bin/cautilus claim review prepare-input --claims .cautilus/claims/latest.json --max-clusters 12 --output /tmp/cautilus-review-input-postcommit-fixed.json`; it accepted the post-commit packet without `--allow-stale-claims`.

## Root Cause

Claim freshness used git path drift as the only source freshness signal.
That was correct for detecting edits after packet generation, but wrong for an atomic source-plus-packet commit because the packet can already contain the new source content while `packet.gitCommit` still points to the previous HEAD.

## Seam Risk

- Interrupt ID: claim-source-commit-stale
- Risk Class: workflow-state
- Seam: git commit provenance versus content freshness
- Disproving Observation: source path changed in git history but current content hash still matches the generated packet
- What Local Reasoning Cannot Prove: whether every source entry always has a usable content hash
- Generalization Pressure: claim freshness and runner assessment freshness both need hash-first semantics with commit drift as provenance

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Add a regression test for atomic source-plus-claim-packet commits and make source path filtering hash-aware.
