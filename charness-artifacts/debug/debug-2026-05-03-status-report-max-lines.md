# Status Report Max Lines Debug
Date: 2026-05-03

## Problem

`npm run verify` failed after adding refresh-plan currentness checks to `scripts/agent-runtime/render-claim-status-report.mjs`.

## Correct Behavior

Given a status-report helper change, when `npm run verify` runs, then ESLint should still pass the repo's file-size guardrails.

## Observed Facts

- ESLint reported: `File has too many lines (618). Maximum allowed is 600 max-lines`.
- The failure path was `scripts/agent-runtime/render-claim-status-report.mjs`.
- The trigger was adding refresh-plan currentness helpers and tests.

## Reproduction

```bash
npm run verify
```

## Candidate Causes

- The helper file was already close to the 600-line limit before this slice.
- The refresh-plan currentness logic was added inline instead of being kept compact or extracted.
- The status report renderer is accumulating multiple digest/render responsibilities in one module.

## Hypothesis

If the new refresh-plan currentness logic is made compact enough or extracted, then ESLint will pass without changing behavior.

## Verification

Repaired.
The refresh-plan digest/rendering helpers were extracted from `render-claim-status-report.mjs`.
`wc -l` now reports 576 lines for `render-claim-status-report.mjs`, below the 600-line guardrail.
The focused status-report test passes.

## Root Cause

The immediate cause is inline helper growth in a file already near the ESLint max-lines guardrail.

## Seam Risk

- Interrupt ID: status-report-max-lines
- Risk Class: none
- Seam: local lint guardrail
- Disproving Observation: lint names a single file-size violation
- What Local Reasoning Cannot Prove: whether a broader renderer split would be worth doing now
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep small report-rendering additions compact, and split the renderer module if future report responsibilities keep accumulating.
