# Debug Review
Date: 2026-05-03

## Problem

A fresh-eye review read `claim show` `gitState.changedFiles` as the current working-tree diff and flagged the status packet as stale because untracked evidence files were absent.

## Correct Behavior

Given a claim packet was generated at an older commit, when `claim show` compares it with the current checkout, then `changedFiles` should be explicitly described as the committed diff between `packetGitCommit` and `currentGitCommit`.
The packet should also say that unstaged, staged, and untracked working-tree files are excluded from that comparison.

## Observed Facts

- `.cautilus/claims/status-summary.json` reported `comparisonStatus=fresh-with-head-drift`, `changedFileCount=25`, and `workingTreePolicy=excluded`.
- Current `git status --short --untracked-files=all` for the slice showed eight modified or untracked files.
- The fresh-eye reviewer expected the new untracked evidence bundle to appear in `changedFiles`.
- `ClaimPacketGitState` computed `changedFiles` from `git diff --name-status <packetGitCommit> <currentGitCommit>`, not from the working tree.

## Reproduction

```bash
jq '.gitState' .cautilus/claims/status-summary.json
git status --short --untracked-files=all
```

## Candidate Causes

- The field name `changedFiles` was underspecified and could be mistaken for current worktree changes.
- The existing `workingTreePolicy=excluded` field was too terse for report readers.
- The status report rendered the snapshot status but did not render the changed-file scope.

## Hypothesis

If `gitState` carries a `changedFilesBasis` object and the status report renders its scope, then future reviewers can distinguish committed head drift from uncommitted slice changes.

## Verification

- `go test ./internal/app -run TestRunClaimShowTreatsNonSourceHeadDriftAsFresh`
- `go test ./internal/runtime -run TestClaimPacketGitStateTreatsNonSourceHeadDriftAsFreshWhenContentHashMatches`
- `node --test scripts/agent-runtime/render-claim-status-report.test.mjs`

## Root Cause

The packet had correct freshness semantics but insufficiently explicit field semantics for human reviewers.
The report hid the strongest disambiguating fact behind a terse `workingTreePolicy` field.

## Seam Risk

- Interrupt ID: claim-gitstate-scope
- Risk Class: none
- Seam: claim status packet semantics versus human review interpretation
- Disproving Observation: reviewer treated committed-diff changed files as current worktree changes
- What Local Reasoning Cannot Prove: whether downstream consumers rely on the exact field set without tolerating additional keys
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Add explicit `changedFilesBasis.scope`, preserve `workingTreePolicy=excluded`, and render the scope in the markdown status report.
