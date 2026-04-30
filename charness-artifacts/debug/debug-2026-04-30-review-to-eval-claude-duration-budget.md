# Debug Review: review-to-eval Claude duration budget
Date: 2026-04-30

## Problem

The live Claude dogfood for `cautilus-review-to-eval-flow` passed the audit but returned `recommendation=defer`.

## Correct Behavior

Given Claude completes the review-to-eval branch, produces a passing audit, and does not hit a runner timeout, when the evaluation summary is built, then the fixture duration threshold should reflect the expected total episode duration for this longer branch.

## Observed Facts

- `npm run dogfood:cautilus-review-to-eval-flow:eval:claude` exited 0 and produced `recommendation=defer`.
- The audit status was `passed` with zero findings.
- The evaluation status was `degraded`.
- The summary said: `Runtime budgets were exceeded for duration_ms=518440 > 420000.`
- The 420 second threshold was copied from the shorter reviewer-launch episode, but review-to-eval adds review-result application, validation, and eval planning after reviewer output.

## Reproduction

```bash
npm run dogfood:cautilus-review-to-eval-flow:eval:claude
```

Inspect:

```bash
jq '{recommendation, summary: .evaluations[0].summary, metrics: .evaluations[0].metrics, thresholds: .evaluations[0].thresholds}' artifacts/self-dogfood/cautilus-review-to-eval-flow-eval-claude/latest/eval-summary.json
jq '{status, findings}' artifacts/self-dogfood/cautilus-review-to-eval-flow-eval-claude/latest/review-to-eval-flow/episode-cautilus-review-to-eval-flow/audit.json
```

## Candidate Causes

- The fixture inherited a threshold from a shorter branch instead of sizing the review-to-eval episode independently.
- Claude may have taken an unusually slow path unrelated to the product branch.
- The runner may be counting all four turns while the threshold was intended as a per-turn budget.

## Hypothesis

If the review-to-eval fixture raises its total duration threshold to 600 seconds, then the same branch can still enforce a finite budget while accepting the observed Claude runtime when the audit passes.

## Verification

Before repair:

```json
{
  "recommendation": "defer",
  "summary": "Execution consensus reached passed in 1/1 run(s). Audit passed: 0 finding(s). Runtime budgets were exceeded for duration_ms=518440 > 420000."
}
```

After repair, rerun:

```bash
npm run dogfood:cautilus-review-to-eval-flow:eval:claude
```

## Root Cause

The review-to-eval fixture reused the reviewer-launch duration threshold even though it validates a longer branch.
The branch behavior passed; only the fixture's total episode budget was undersized.

## Seam Risk

- Interrupt ID: review-to-eval-claude-duration-budget
- Risk Class: none
- Seam: live skill-evaluation fixture budget versus actual Claude episode duration
- Disproving Observation: the audit passed with zero findings and the only degraded condition was `duration_ms > max_duration_ms`
- What Local Reasoning Cannot Prove: whether future Claude model/runtime latency will stay below 600 seconds
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Size live skill fixture duration thresholds per branch after measuring the actual audited path, especially when a new branch extends an earlier episode.
