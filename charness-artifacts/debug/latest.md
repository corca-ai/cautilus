# Claim Status Report Max Lines Debug
Date: 2026-05-10

## Problem

`npm run verify` failed after adding full non-ready bucket detail to the claim status report renderer.

## Correct Behavior

Given the report needs full non-ready bucket rows, when the renderer is updated, then it should keep the generated report useful without violating the repository's JavaScript lint limits.

## Observed Facts

- `npm run verify` failed in the eslint stage.
- The exact lint error was `File has too many lines (627). Maximum allowed is 600`.
- The failing file was `scripts/agent-runtime/render-claim-status-report.mjs`.
- The newly added action-bucket routing helper duplicated Go-side action-bucket routing inside the already-large renderer file.

## Reproduction

Run:

```bash
npm run verify
```

## Candidate Causes

- The status report renderer file was already close to the max-lines threshold.
- Adding full non-ready bucket rendering directly to the renderer pushed it over the lint limit.
- The action-bucket routing helper is reusable logic and belongs in a small support module rather than in the report renderer.

## Hypothesis

If the action-bucket routing helper moves to a focused module and the renderer imports it, then eslint will pass without changing the report behavior.

## Verification

- Moved action-bucket routing and full-bucket rendering helpers out of `render-claim-status-report.mjs`.
- Rendered Markdown links inside status-report table cells as plain text so source-relative links do not become broken links from the generated report path.
- Re-ran the status report renderer test.
- Re-ran the status report generator.
- `render-claim-status-report.mjs` is now 579 lines, below the 600-line lint limit.

## Root Cause

The immediate cause was implementation placement.
The full-bucket behavior was correct, but adding the routing helper directly to `render-claim-status-report.mjs` violated the repo's file-size lint budget.

## Seam Risk

- Interrupt ID: claim-status-report-max-lines
- Risk Class: none
- Seam: generated report renderer to lint maintainability limit
- Disproving Observation: eslint passes after moving the helper out of the large renderer.
- What Local Reasoning Cannot Prove: whether other large agent-runtime renderers are close enough to the same limit to fail after small future additions.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep reusable projection routing helpers in small modules when a renderer is near the lint line limit.
