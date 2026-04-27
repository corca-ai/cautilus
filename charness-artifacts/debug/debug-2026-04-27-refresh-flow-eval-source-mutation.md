# Debug Review: refresh flow eval source mutation
Date: 2026-04-27

## Problem

`npm run dogfood:cautilus-refresh-flow:eval` executed through `cautilus eval test`, but the evaluated Codex session ran with workspace write access against the real source checkout and changed `.cautilus/claims/latest.json`.
The same run returned `recommendation=reject` with `Audit failed: 6 finding(s).`

## Correct Behavior

Given a `dev/skill` eval episode needs write access to exercise a real agent flow, when `cautilus eval test` runs the self-dogfood refresh-flow adapter, then the agent should work inside a disposable candidate workspace under the run artifact directory.
The source checkout should remain unchanged, and the selected branch should produce a refresh plan through `claim discover --previous --refresh-plan` instead of editing the saved claim map directly.

## Observed Facts

- The failing command was `npm run dogfood:cautilus-refresh-flow:eval`.
- The adapter template called `run-local-skill-test.mjs --workspace {candidate_repo} --sandbox workspace-write`.
- In `eval test`, `{candidate_repo}` resolves from the workspace option, which defaulted to the source checkout.
- The audit transcript recorded `cautilus agent status`, direct reads of `.cautilus/claims/latest.json`, and a `perl -0pi` rewrite of legacy `repo/whole-repo` and `repo/skill` surface labels.
- The transcript did not include `cautilus claim discover --previous ... --refresh-plan`.
- The audit also flagged `forbidden_command:eval_test` because the `perl` replacement text contained the phrase `cautilus eval test`, not because the agent actually ran the eval command.
- The source checkout diff for `.cautilus/claims/latest.json` was restored before implementing the fix.

## Reproduction

```bash
npm run dogfood:cautilus-refresh-flow:eval
git diff -- .cautilus/claims/latest.json
jq '.recommendation, .evaluationCounts' artifacts/self-dogfood/cautilus-refresh-flow-eval/latest/eval-summary.json
```

Before the fix, the diff showed generated edits to `.cautilus/claims/latest.json` and the summary recommendation was `reject`.

## Candidate Causes

- The refresh-flow adapter reused the generic `{candidate_repo}` placeholder, whose default is the real workspace unless the caller supplies a different one.
- `run-local-skill-test.mjs` correctly obeyed its `--workspace` value, but the adapter did not create an isolated workspace for a write-capable episode.
- The bundled skill still allowed the selected refresh branch to be interpreted as saved-map migration instead of refresh-plan creation.
- The audit's forbidden eval pattern matched command arguments that only contained the phrase `eval test` as replacement text.

## Hypothesis

If the refresh-flow eval adapter invokes a wrapper that creates a disposable candidate worktree, syncs the current source checkout into it, installs the local skill there, and then runs the multi-turn skill test with `--workspace <candidate>`, then a live write-capable eval cannot mutate the source checkout.
If the forbidden eval pattern is scoped to actual `cautilus eval ...` commands, then migration text inside another shell command will no longer create a false overrun finding.

## Verification

Restored the source checkout after the first failed run and added `scripts/run-self-dogfood-skill-refresh-flow-eval.mjs`, which creates a disposable candidate worktree before invoking the generic skill-test runner.
Added fixture-backend coverage for that wrapper and audit coverage for distinguishing an actual `cautilus eval test` overrun from incidental prose inside a shell command.
Ran `node --test scripts/agent-runtime/audit-cautilus-refresh-flow-log.test.mjs scripts/run-self-dogfood-skill-refresh-flow-eval.test.mjs scripts/agent-runtime/run-local-skill-test.test.mjs`.
Updated the checked-in saved claim map from legacy `repo/whole-repo` and `repo/skill` surface names to `dev/repo` and `dev/skill`, then confirmed `./bin/cautilus agent status --repo-root . --json` reports `claimState.status=present` with `refresh_claims_from_diff` as the first branch.
Ran `npm run dogfood:cautilus-refresh-flow:eval`; the final run returned `recommendation=accept-now` with one passed `dev/skill` episode.
Confirmed the live run's source checkout did not receive generated `.cautilus/claims/refresh-plan.json`; that artifact stayed inside the candidate workspace.

## Root Cause

The first `dev/skill` multi-turn eval used the local skill runner directly, but that runner is a workspace executor, not a candidate-workspace materializer.
The adapter supplied the source workspace to a write-capable episode, so the evaluated agent's file edits landed in the real checkout.

## Seam Risk

- Interrupt ID: refresh-flow-eval-source-mutation
- Risk Class: none
- Seam: `eval test` adapter placeholder to write-capable agent workspace
- Disproving Observation: a self-dogfood eval run changed `.cautilus/claims/latest.json` in the source checkout
- What Local Reasoning Cannot Prove: whether future write-capable eval adapters remember to isolate candidates without a wrapper or explicit contract
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Use a wrapper for this write-capable self-dogfood eval that owns candidate workspace materialization before calling the generic skill runner.
Keep source-checkout cleanliness as an explicit verification point for live dogfood runs.
Scope audit forbidden-command patterns to actual command surfaces rather than incidental prose inside shell arguments.
Keep checked-in saved claim packets schema-valid after product-level fixture or surface renames, so the no-input flow reaches the intended stale-refresh branch instead of an invalid-packet repair branch.
