# Debug Review: claim status report ESLint
Date: 2026-05-02

## Problem

The new `render-claim-status-report.mjs` script failed `npm run lint:eslint`.

## Correct Behavior

Given the claim status report script is committed as a maintained repo script, when `npm run lint:eslint` runs, then the script should pass the repo's unused-variable and complexity rules without waivers.

## Observed Facts

ESLint reported:

```text
scripts/agent-runtime/render-claim-status-report.mjs
   96:10  error  'addCountMaps' is defined but never used                                  no-unused-vars
  179:1   error  Function 'selectedSummary' has a complexity of 18. Maximum allowed is 12  complexity
  256:1   error  Function 'renderHeader' has a complexity of 18. Maximum allowed is 12     complexity
```

The focused Node test for the report renderer passed before the lint fix.

## Reproduction

```bash
npm run lint:eslint
```

## Candidate Causes

- The script accumulated fallback logic inline instead of splitting packet-normalization helpers.
- A helper introduced during drafting was no longer used after the report shape stabilized.
- The report renderer tried to handle optional packet fields in display functions instead of normalizing them before rendering.

## Hypothesis

If the failure is local script structure rather than behavior, then removing the unused helper and extracting fallback/header formatting helpers should make `npm run lint:eslint` pass while the focused renderer test keeps passing.

## Verification

`npm run lint:eslint` passed after repair.
The focused `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/render-claim-status-report.test.mjs` test also passed.

## Root Cause

The first implementation mixed packet normalization with rendering.
That kept behavior correct but exceeded the repo's complexity threshold and left one drafting helper unused.

## Seam Risk

- Interrupt ID: claim-status-report-eslint
- Risk Class: none
- Seam: local maintained Node script
- Disproving Observation: the focused renderer test passed before repair, so the issue is static maintainability rather than incorrect report content.
- What Local Reasoning Cannot Prove: whether the final Markdown is the exact reading shape the maintainer wants.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep generated report scripts split into packet-normalization helpers and rendering helpers so future artifact fields do not push display functions over the complexity limit.
