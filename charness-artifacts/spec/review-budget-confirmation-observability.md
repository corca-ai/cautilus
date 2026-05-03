# Review Budget Confirmation Observability Spec Handoff

Date: 2026-05-04

## Context

The dev/skill episode runner must preserve fixture user turns in the combined transcript whenever an audit reasons about user confirmation, branch selection, or consent before a protected action.

## Contract

- Codex and Claude episode runners emit synthetic `episode_user_turn` message events into `combined.jsonl` before each backend turn output.
- Branch-order audits ignore ordinary message prose when detecting protected action launch order; launch evidence must come from command, write, or file-change events.
- Reviewer-launch and review-to-eval audits require these pre-launch facts: selected budget fields, a user confirmation or adjustment turn after that budget statement, and reviewer launch only after the confirmation.
- Fixtures that prove review-budget confirmation split preparation from continuation when needed so the user confirmation happens after the budget is visible.

## Checks

- `node --test scripts/agent-runtime/audit-cautilus-reviewer-launch-flow-log.test.mjs scripts/agent-runtime/audit-cautilus-review-to-eval-flow-log.test.mjs scripts/agent-runtime/run-local-skill-test.test.mjs`
- `npm run dogfood:cautilus-reviewer-launch-flow:eval:codex`
- `npm run dogfood:cautilus-review-to-eval-flow:eval:codex`
