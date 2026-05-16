# Deployment Evidence Cache Telemetry Complexity Debug
Date: 2026-05-16

## Problem

`npm run lint` failed after adding cache-token telemetry fields to deployment evidence.

## Correct Behavior

Given deployment evidence normalizes skill summaries and scenario results, when cache-token telemetry fields are added, then row construction should preserve explicit telemetry fields while staying under the repo's ESLint complexity limit.

## Observed Facts

- `npm run lint` failed during `lint:eslint`.
- ESLint reported `Function 'buildSkillSummaryRow' has a complexity of 13. Maximum allowed is 12`.
- ESLint reported `Arrow function has a complexity of 15. Maximum allowed is 12`.
- Focused Node tests, focused Go tests, `npm run lint:specs`, and `git diff --check` passed before the lint failure.
- After the complexity repair, `npm run verify` failed at `coverage:floor:check`.
- Coverage reported `scripts/agent-runtime/render-review-prompt.mjs` below its declared statement floor after cache telemetry rendering was added.

## Reproduction

```bash
npm run lint
```

Before the repair, the command failed at `scripts/agent-runtime/deployment-evidence.mjs`.

## Candidate Causes

- Deployment evidence row construction mixed base row fields, metric fallback, telemetry fallback, and numeric field iteration in one function.
- The `total_tokens` and `cost_usd` compatibility fallback added nested conditional branches inside a loop.
- The scenario-result mapper kept status normalization, pass-status calculation, base row construction, and telemetry attachment in one callback.
- The review prompt renderer gained display branches for cache telemetry fields without a focused prompt-rendering assertion.

## Hypothesis

If telemetry numeric fallback and attachment move into helper functions, then deployment evidence can preserve the same fields while `buildSkillSummaryRow` and scenario row mapping stay below the lint complexity limit.
If review prompt tests assert the rendered cache telemetry line, then the renderer coverage floor should recover without lowering the threshold.

## Verification

- Focused tests passed before the repair: `node --test scripts/agent-runtime/skill-test-claude-backend.test.mjs scripts/agent-runtime/run-local-skill-test.test.mjs scripts/agent-runtime/evaluate-skill.test.mjs scripts/agent-runtime/deployment-evidence.test.mjs scripts/agent-runtime/scenario-result-telemetry.test.mjs scripts/agent-runtime/build-report-packet.test.mjs`.
- Focused Go tests passed before the repair: `go test ./internal/runtime ./internal/app`.
- `npm run lint:specs` passed before the repair.
- `git diff --check` passed before the repair.
- After the complexity repair, `npm run lint` passed.
- The prompt renderer coverage repair passed: `node --test scripts/agent-runtime/review-prompt-flow.test.mjs && npm run test:coverage && npm run coverage:floor:check`.

## Root Cause

The first deployment-evidence patch expanded the row-construction functions directly instead of treating telemetry fallback as a reusable normalization step.
That repeated a known repo pattern from prior complexity incidents: one-off packet projection logic grows past the lint budget when new fields are added inline.
The same patch also treated review prompt display as a low-risk projection and did not add a prompt-rendering assertion for the new cache telemetry branches.

## Detection Gap

- ESLint | focused behavior tests did not check maintainability complexity | keep running `npm run lint` after broad packet-shape changes.
- Coverage floor | focused telemetry tests did not cover user-facing prompt projection | add renderer assertions when telemetry fields become operator-visible.

## Sibling Search

- Mental model: adding allowlisted telemetry fields is a mechanical list expansion.
- Packet projection axis: deployment evidence row construction needed helper extraction.
- Review projection axis: renderers need explicit field-display assertions because coverage floors protect this surface.
- Scenario aggregation axis: telemetry field lists were centralized to avoid repeated inline expansion.

## Seam Risk

- Interrupt ID: deployment-evidence-cache-telemetry-complexity
- Risk Class: none
- Seam: packet telemetry normalization
- Disproving Observation: ESLint caught the maintainability failure before commit.
- What Local Reasoning Cannot Prove: whether future telemetry fields should remain a flat allowlist rather than a nested telemetry breakdown object.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep telemetry field names centralized and keep compatibility fallback logic outside row projection functions.
When a packet surface adds several sibling fields, add the field list and shared attachment helper before updating each projection path.
When telemetry fields become visible in human review prompts, add prompt-rendering assertions in the same slice.

## Related Prior Incidents

- `debug-2026-05-04-review-input-summary-complexity.md`: projection helpers exceeded the repo complexity limit when packet fallback and rendering were mixed.
- `debug-2026-05-13-surface-critique-packet-complexity.md`: scanner logic exceeded complexity when rule families stayed inline.
