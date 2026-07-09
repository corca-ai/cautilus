# Debug Review
Date: 2026-07-09

## Problem

`npm run verify` failed in `test:coverage` after Cycle 5 because `reviewable-artifact-projections.test.mjs` expected the old claim-status report proof marker string.

## Correct Behavior

Given a report renderer's operator-facing proof marker text changes, when the reviewable artifact projection matrix is checked, then the matrix should point at the current executable marker text.

## Observed Facts

- `npm run verify` failed with `claim-status-markdown proof marker missing Active updates still match the current claim packet in scripts/agent-runtime/render-claim-status-report.mjs`.
- `scripts/agent-runtime/render-claim-status-report.mjs` now emits `Active updates still match current claim identity`.
- `docs/contracts/reviewable-artifact-projections.json` still required the old marker.
- `rg` found no remaining executable use of the old marker except the matrix entry and failing test output.

## Reproduction

- `npm run verify` reproduced the failure during `test:coverage`.
- Narrow reproducer: `node --test scripts/agent-runtime/reviewable-artifact-projections.test.mjs`.

## Candidate Causes

- Matrix drift: proof marker metadata was not updated when the renderer wording changed.
- Test drift: the projection matrix test might be asserting an obsolete marker that no longer matters.
- Renderer regression: the renderer might have accidentally dropped the intended proof sentence entirely.

## Hypothesis

- Falsifiable claim: updating the `claim-status-markdown` matrix marker to the new renderer sentence will make the narrow projection matrix test pass.
  Disconfirmer: run `node --test scripts/agent-runtime/reviewable-artifact-projections.test.mjs` after the matrix update.

## Verification

- Result: confirmed.
  The narrow projection matrix test passed after updating the matrix marker.

## Root Cause

Cycle 1 changed the status report wording from field-equality language to claim-identity language, but only updated the renderer, generated report, and renderer tests.
The reviewable artifact projection matrix is a separate executable proof registry and was left with the old marker.

## Invariant Proof

- Invariant: every operator-facing projection proof marker in `docs/contracts/reviewable-artifact-projections.json` must match current executable renderer text.
- Producer Proof: `scripts/agent-runtime/render-claim-status-report.mjs` contains `Active updates still match current claim identity`.
- Final-Consumer Proof: `scripts/agent-runtime/reviewable-artifact-projections.test.mjs` passes after the matrix marker update.
- Interface-Shape Sibling Scan: searched for both old and new marker strings with `rg`; only the matrix needed synchronization.
- Non-Claims: this does not claim any change to report semantics beyond the already-reviewed Cycle 1 behavior.

## Detection Gap

- Surface: Cycle 1 focused checks.
  What did not fire: they ran report-specific tests and generated report checks, but not the projection matrix proof-marker test.
  Smallest change to fire it: when changing a renderer proof sentence, run `node --test scripts/agent-runtime/reviewable-artifact-projections.test.mjs` or update the matrix in the same slice.

## Sibling Search

- Mental model: renderer tests were treated as the whole owner of report wording.
- same-surface: `.cautilus/claims/claim-status-report.md` was regenerated; decision: synchronized; proof: `npm run claims:status-report:check`.
- contract registry: `docs/contracts/reviewable-artifact-projections.json`; decision: update required marker; proof: narrow projection matrix test.
- cross-file: `scripts/agent-runtime/render-claim-status-report.test.mjs`; decision: already updated to the new wording; proof: focused renderer test passed.

## Seam Risk

- Interrupt ID: reviewable-artifact-projection-marker-drift
- Risk Class: none
- Seam: local contract metadata and renderer source.
- Disproving Observation: the narrow matrix test passes after metadata synchronization.
- What Local Reasoning Cannot Prove: n/a
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When changing projection marker wording, include `reviewable-artifact-projections.test.mjs` in the focused verification set or update the matrix before broad verify.
