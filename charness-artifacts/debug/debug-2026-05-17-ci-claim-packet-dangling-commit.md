# Debug Review
Date: 2026-05-17

## Problem

The pushed `main` verify workflow failed in `npm run claims:evidence-state:check` even though the local pre-push verify passed.

## Correct Behavior

Given generated claim packets are committed, when a fresh checkout runs `npm run verify`, then claim evidence state should compare against commits present in the public repository history.

## Observed Facts

The exact CI failure was:

```text
.cautilus/claims/status-summary.json is stale; run npm run claims:evidence-state
```

A fresh clone reproduced the failure.
`./bin/cautilus discover claims status --input .cautilus/claims/evidenced-typed-runners.json --sample-claims 1` reported `comparisonStatus: stale-unknown-diff` and `isStale: true`.
The packet commit was `31d4879c7ccb43b1442415f67806f277ca3652d9`, which existed in the local repo object database but not in the fresh clone.

## Reproduction

Clone the repository fresh at `b46cc55d091a64df2dd946e32db881ce789871a9` and run `npm run claims:evidence-state:check`.

## Candidate Causes

- The claim refresh was generated before the final amend.
- The final commit was amended and pushed, leaving the packet commit reachable only from the local object database.
- Local generated-artifact drift equivalence allowed commit drift because the object was present locally, while CI could not compare against the dangling commit.

## Hypothesis

If the full claim refresh chain runs again after the final pushed commit, then the packet commit will be reachable from fresh clones and CI claim evidence state will pass.

## Verification

After running `npm run claims:refresh:all`, `npm run claims:evidence-state:check` passed and the regenerated status snapshot records `b46cc55d091a64df2dd946e32db881ce789871a9` as both `currentGitCommit` and `packetGitCommit`.
The replacement push workflow from the refresh commit passed.
Follow-up critique added a release preflight check that rejects status snapshots whose `packetGitCommit` is not reachable from `HEAD`.

## Root Cause

The claim packet was refreshed against an intermediate commit that was later replaced by `git commit --amend`.
The local repository retained the old commit object, so local checks could compute a clean head-drift comparison.
Fresh clones did not have that object and correctly treated the packet as stale.

## Detection Gap

- Local check | old commit object still available | reproduce claim freshness from a fresh clone when claim packets were generated before an amend.
- Pre-push verify | does not simulate missing local dangling commits | avoid amending after `npm run claims:refresh:all`, or rerun the full refresh after the last amend.

## Sibling Search

- Mental model: generated claim packets can tolerate commit drift if no claim source changed.
- Git object axis: that tolerance requires the packet commit object to exist.
- Workflow axis: amend-after-refresh creates a local-only packet base.

## Seam Risk

- Interrupt ID: ci-claim-packet-dangling-commit
- Risk Class: none
- Seam: generated claim state freshness across fresh clones
- Disproving Observation: a fresh clone fails while the original worktree passes.
- What Local Reasoning Cannot Prove: whether CI has the old amended commit object.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

After `npm run claims:refresh:all`, do not amend the commit that supplied the packet commit unless the full claim refresh chain runs again before pushing.
