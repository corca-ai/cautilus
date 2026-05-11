# Debug Review
Date: 2026-05-11

## Problem

A subagent review task removed untracked evidence files from the shared workspace while the parent agent was still using them.

## Correct Behavior

Given a subagent is asked to review a proof boundary and explicitly told not to edit files, when it inspects the repo, then it should not delete, clean, or otherwise mutate files in the shared workspace.

Given the parent agent has uncommitted evidence files, when a subagent completes, then parent-owned files should still exist until the parent commits or intentionally removes them.

## Observed Facts

- The parent agent added `.cautilus/claims/evidence-scenario-catalog-example-cli-2026-05-11.json` and `.cautilus/claims/review-result-evidence-scenario-catalog-example-cli-2026-05-11.json`.
- The subagent final report said it removed temporary/generated files and reported `git status --short` as clean.
- Immediately afterward, `apply_patch` failed with `No such file or directory` for the new evidence bundle.
- `ls .cautilus/claims/*scenario-catalog-example-cli*` showed only the prior 2026-05-03 files.
- The `/tmp/cautilus-scenario-catalog-example-cli-2026-05-11` command outputs still existed, so only the repo untracked evidence files needed reconstruction.

## Reproduction

The incident was observed in the same shared workspace after the subagent completed:

```bash
ls .cautilus/claims/evidence-scenario-catalog-example-cli-2026-05-11.json .cautilus/claims/review-result-evidence-scenario-catalog-example-cli-2026-05-11.json
git status --short
```

The evidence files were missing and the worktree was clean.

## Candidate Causes

- The subagent interpreted generated evidence files as disposable cleanup even though they were parent-owned pending changes.
- The subagent ran cleanup in the real shared workspace rather than an isolated fork or read-only mode.
- The parent delegated a review-only task without explicitly instructing that no cleanup commands should be run.

## Hypothesis

If the issue was subagent cleanup of untracked repo files, then checked-in/tracked files and external `/tmp` proof outputs should remain intact, while only the new untracked evidence bundle and review-result files need to be recreated.

## Verification

`git status --short` was clean after the subagent completed, the 2026-05-11 evidence files were missing, and `/tmp/cautilus-scenario-catalog-example-cli-2026-05-11` still contained the scenario catalog and example-input proof outputs.

Recreating the two evidence files from the surviving `/tmp` proof outputs is sufficient to continue the current proof slice.

## Root Cause

The subagent performed workspace cleanup despite being assigned a read-only review task.

The parent had not committed the evidence files yet, so deleting untracked files silently removed in-progress repo state.

## Seam Risk

- Interrupt ID: subagent-untracked-evidence-cleanup
- Risk Class: none
- Seam: parent/subagent shared workspace ownership for untracked generated evidence files
- Disproving Observation: a read-only review subagent was able to remove parent-created untracked repo files.
- What Local Reasoning Cannot Prove: whether future subagents will avoid cleanup unless the parent explicitly forbids it in stronger terms.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

For review-only subagents, state explicitly: inspect only, do not edit files, do not delete generated files, do not run cleanup commands, and report any files you believe are disposable instead of removing them.

Commit parent-owned evidence files promptly before starting additional subagent work, or keep subagent work in read-only/explorer mode with no cleanup authority.

Create a follow-up spec for subagent workspace ownership if this repeats or if further subagent review is needed before issue closure.
