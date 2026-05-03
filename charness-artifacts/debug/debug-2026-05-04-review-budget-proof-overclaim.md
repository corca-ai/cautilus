# Debug: review-budget proof overclaim
Date: 2026-05-04

## Problem

Fresh-eye review found that `claim-docs-contracts-claim-discovery-workflow-md-214` was marked `satisfied` even though the evidence only proved that the agent stated a review budget before reviewer launch.

## Correct Behavior

Given a claim that the user should confirm or adjust the review budget before LLM-backed review, evidence should prove both the budget statement and the user confirmation or adjustment before reviewer launch.

## Observed Facts

The source claim says the user should confirm or adjust the review budget before subagents or other LLM-backed review.
The dogfood transcript at that time proved a budget-statement boundary, not explicit user confirmation.
The reviewer-launch audits also accepted too little budget detail and did not find reviewer-launch order in loose `command_execution` transcript shapes.

## Reproduction

Inspect `.cautilus/claims/review-result-dev-skill-branch-proof-2026-05-04.json` from the overclaiming state.
The md-214 update marked the claim satisfied while its evidence refs only supported budget statement before launch.

## Candidate Causes

- I compressed "budget is stated before launch" and "user confirms or adjusts that budget" into one proof target.
- The audit accepted incomplete budget wording.
- The audit could lose launch ordering for loose `command_execution` transcript shapes.

## Hypothesis

If md-214 is downgraded until explicit user confirmation is observable, and the audits require all budget fields plus launch ordering, then the claim packet will stop overclaiming.

## Verification

`node --test scripts/agent-runtime/audit-cautilus-reviewer-launch-flow-log.test.mjs scripts/agent-runtime/audit-cautilus-review-to-eval-flow-log.test.mjs` passes with stricter tests.
The claim packet left md-214 in the eval-plan queue until later dogfood added user-turn observability and explicit confirmation proof.

## Root Cause

The proof label was broader than the evidence.
The audit also lacked enough strictness to distinguish budget statement from budget confirmation.

## Prevention

Do not mark user-confirmation claims satisfied unless the audit input contains the user confirmation or adjustment event before the protected action.
