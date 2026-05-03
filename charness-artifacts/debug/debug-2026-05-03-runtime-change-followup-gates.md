# Debug Review: runtime change follow-up gates
Date: 2026-05-03

## Problem

`claim-docs-contracts-runtime-fingerprint-optimization-md-154` says a runtime-change simplification candidate should still require the same tests and review gates before it is trusted.
The focused test I added failed because a generated passing-simplification proposal had `followUpChecks` equal to `["Preserve the current candidate as the next baseline."]`.

## Correct Behavior

Given an optimize proposal contains an optional `passing-simplification` suggested change, when the proposal is generated, then its stop conditions and follow-up checks must require rerunning the relevant held-out, comparison, and review gates before accepting the revision.
Given no suggested change is produced and the decision is `hold`, then preserving the current candidate as the next baseline is sufficient.

## Observed Facts

- `GenerateOptimizeProposal` built `suggestedChanges` before `decision`, then called `buildFollowUpChecks(decision)`.
- `buildPassingSimplificationChange` can add an optional `passing-simplification` change when `model_runtime_changed` and a passing report are both present.
- `buildOptimizeDecision` can still return `hold` for a passing report because the current candidate is already acceptable.
- The contract explicitly says `passing_simplification` may generate a candidate or revision brief, then require the same tests and review gates before the candidate is trusted.

## Reproduction

Run:

```bash
go test ./internal/runtime -run 'TestGenerateOptimizeProposalAddsPassingSimplificationForRuntimeChange' -count=1
```

Before the fix, the test failed with:

```text
expected follow-up checks to require held-out, comparison, and review gates, got []string{"Preserve the current candidate as the next baseline."}
```

## Candidate Causes

- `followUpChecks` was keyed only on the proposal decision and ignored optional suggested changes.
- The existing test checked `revisionReasons` and `suggestedChanges`, but did not assert the trust-before-accept gate text.
- The contract distinguishes "consider a revision" from "trust a revision", while the implementation reused the existing hold branch for both.

## Hypothesis

If `buildFollowUpChecks` also receives the generated suggested changes and treats a `hold` decision with proposed changes as a gated candidate path, then passing-simplification proposals will preserve the trust boundary without changing no-change hold behavior.

## Verification

- `go test ./internal/runtime -run 'TestGenerateOptimizeProposalAddsPassingSimplificationForRuntimeChange' -count=1`
- `node --test scripts/agent-runtime/build-canonical-claim-map.test.mjs`

Both focused checks passed after the repair.

## Root Cause

The follow-up check helper collapsed "hold with no proposed change" and "hold current baseline but consider an optional simplification candidate" into one branch.
That let an optional runtime-change simplification omit the same-gates-before-trust requirement.

## Seam Risk

- Interrupt ID: runtime-change-followup-gates
- Risk Class: contract-freeze-risk
- Seam: optimize proposal decision wording versus revision trust gates
- Disproving Observation: an optional suggested change existed, but follow-up checks said only to preserve the current baseline
- What Local Reasoning Cannot Prove: whether every future optimizer candidate kind has a distinct enough follow-up gate
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep the focused test assertion on both `stopConditions` and `followUpChecks` so optional passing-simplification candidates cannot regress into baseline-only guidance.
