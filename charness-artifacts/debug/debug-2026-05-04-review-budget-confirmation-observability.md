# Review Budget Confirmation Observability Debug
Date: 2026-05-04

## Problem

`npm run dogfood:cautilus-reviewer-launch-flow:eval:codex` first exited successfully but produced `recommendation=reject` because the stricter audit could not prove user confirmation of the review budget before reviewer launch.

## Correct Behavior

Given a dev/skill reviewer-launch or review-to-eval episode, when the skill states a selected review budget, then the transcript artifact used by the audit should include a later user confirmation or adjustment turn before any reviewer lane launch.
Given that confirmation, the audit should still require the selected budget fields and branch order before passing.

## Observed Facts

The first reject had `missing_user_budget_confirmation`.
The combined Codex JSONL contained assistant messages and tool signals, but not the fixture user turns.
The separate `turn-*.input.md` artifacts did contain the confirmation input.
After synthetic user-turn events were added to the combined transcript, reviewer-launch still failed until the skill restated the complete selected budget fields before reviewer launch.
The final reviewer-launch and review-to-eval Codex dogfood runs both returned `recommendation=accept-now`.

## Reproduction

Run `npm run dogfood:cautilus-reviewer-launch-flow:eval:codex` with the audit requiring user budget confirmation.
Inspect `artifacts/self-dogfood/cautilus-reviewer-launch-flow-eval-codex/latest/reviewer-launch-flow/episode-cautilus-reviewer-launch-flow/audit.json`.
Before the fix, the audit failed even when a fixture turn asked to confirm the budget.

## Candidate Causes

- The episode runner wrote user turns to `turn-*.input.md` but did not include them in `combined.jsonl`.
- The audit treated arbitrary message text containing `review-result` as reviewer launch order evidence.
- The skill phrasing let agents proceed after a broad launch request without restating all selected budget fields and waiting for a post-budget confirmation.

## Hypothesis

If combined transcripts include synthetic user-turn message events, the audit ignores ordinary message text when detecting reviewer launch order, and the skill requires a post-prepare-input budget restatement before launch, then dogfood can directly prove md-214 instead of leaving it as unknown.

## Verification

`node --test scripts/agent-runtime/audit-cautilus-reviewer-launch-flow-log.test.mjs scripts/agent-runtime/audit-cautilus-review-to-eval-flow-log.test.mjs scripts/agent-runtime/run-local-skill-test.test.mjs` passes.
`npm run dogfood:cautilus-reviewer-launch-flow:eval:codex` completes with `recommendation=accept-now`.
`npm run dogfood:cautilus-review-to-eval-flow:eval:codex` completes with `recommendation=accept-now`.

## Root Cause

The maintained episode transcript was not fully auditable because user turns existed as separate input artifacts but were absent from the JSONL stream consumed by audits.
That made the stricter claim impossible to prove from the audit input.
The review-to-eval fixture also compressed budget confirmation and continuation into one pre-budget instruction, so the audit correctly rejected it once user-turn ordering became visible.

## Seam Risk

- Interrupt ID: review-budget-confirmation-observability
- Risk Class: host-disproves-local
- Seam: dev/skill episode runner transcript assembly and audit interpretation
- Disproving Observation: A dogfood command can exit 0 while its evaluation summary recommends reject.
- What Local Reasoning Cannot Prove: A standalone audit test cannot prove the real episode runner includes fixture user turns in the combined transcript.
- Generalization Pressure: factor-now

## Interrupt Decision

- Premortem Required: yes
- Next Step: spec
- Handoff Artifact: charness-artifacts/spec/review-budget-confirmation-observability.md

## Prevention

Keep synthetic user-turn events in both Codex and Claude episode runners.
When adding branch-order audits, ignore ordinary assistant/user prose as launch evidence unless it is attached to a command, write, or file-change event.
For budgeted LLM review branches, fixture prompts should separate budget preparation from post-budget user confirmation.
