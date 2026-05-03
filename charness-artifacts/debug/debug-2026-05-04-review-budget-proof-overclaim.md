# Debug: review-budget proof overclaim

## Trigger

Fresh-eye review found that `claim-docs-contracts-claim-discovery-workflow-md-214` was marked `satisfied` even though the evidence only proved that the agent stated a review budget before reviewer launch.

## Observation

The source claim says the user should confirm or adjust the review budget before subagents or other LLM-backed review.
The current dogfood transcript proves a budget-statement boundary, not explicit user confirmation.
The reviewer-launch audits also accepted too little budget detail and did not find reviewer-launch order in loose `command_execution` transcript shapes.

## Root Cause

I compressed "budget is stated before launch" and "user confirms or adjusts that budget" into the same proof target.
That was too broad for a `satisfied` evidence label.

## Fix Direction

`md-214` is downgraded back to `evidenceStatus=unknown` with an explicit next action.
The reviewer-launch and review-to-eval audits now:

- find reviewer launch order in raw `command_execution` events,
- require budget fields for cluster limit, claim limit, lane limit, excerpt budget, retry policy, and skipped-cluster policy,
- reject loose transcripts where the budget is only stated after reviewer launch.

## Regression Check

`node --test scripts/agent-runtime/audit-cautilus-reviewer-launch-flow-log.test.mjs scripts/agent-runtime/audit-cautilus-review-to-eval-flow-log.test.mjs` passes with the stricter tests.
The claim packet now leaves one reviewed eval-ready claim in the eval-plan queue instead of treating that user-confirmation claim as proven.
