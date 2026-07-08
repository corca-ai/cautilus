# Debug Review
Date: 2026-07-09

## Problem

The new `verify:lint-specs:subphases` reporter had two quality defects before closeout.
First, `npm run --silent lint:eslint` failed on `lintSpecsSubphaseReport` complexity.
Second, delegated review found the text/JSON report could show preserved previous subphase samples after a failed runtime signal without warning the operator.

## Correct Behavior

Given the repo adds a small advisory runtime reporter, when ESLint runs and when a failed runtime signal preserves previous subphase samples, then the reporter should stay within the repo maintainability threshold and disclose whether reported subphase samples are stale.

## Observed Facts

- Focused reporter tests passed before lint.
- `npm run --silent verify:lint-specs:subphases` printed the expected stored `lint · specs` subphase report.
- `npm run --silent lint:eslint` failed with `Function 'lintSpecsSubphaseReport' has a complexity of 14. Maximum allowed is 12`.
- Prior debug memory records the same class of issue for helper-heavy JavaScript surfaces: behavior tests pass, but a coordinator function crosses the ESLint complexity budget.
- Subagent `Popper` observed that `run-verify` intentionally preserves previous subphase samples when a failing `lint:specs` run has no timing line, so a reporter that omits status and timestamps can present stale samples as current.

## Reproduction

- Run `npm run --silent lint:eslint` after the first reporter implementation.
- Observed result: ESLint exits 1 with a complexity error in `scripts/report-lint-specs-runtime.mjs`.
- Construct a failed runtime signal whose command latest timestamp is newer than its preserved subphase timestamps.
- Observed result before the fix: the report had no warning field and text output did not disclose stale samples.

## Candidate Causes

- The reporter function combined command lookup, subphase shape validation, entry projection, sorting, and empty-entry handling.
- The complexity threshold is too strict for JSON-shape validation helpers.
- The script should not be a new repo-owned surface; the existing runtime JSON could be read manually.
- The reporter treated preserved subphase samples as self-evidently current because it did not carry runtime status, command latest timestamp, or per-subphase timestamps into the output.

## Hypothesis

- Falsifiable claim: the failure is structural complexity in one coordinator, not an excessive product surface.
- Disconfirmer: if extracting lookup, subphase validation, and sorted-entry construction still fails ESLint or changes focused reporter tests, the surface or validation behavior needs narrowing.
- Falsifiable claim: if the report includes runtime status plus command/subphase timestamps, then a failed signal with preserved subphases can emit an explicit stale-sample warning.
- Disconfirmer: a fixture with failed status and older subphase timestamps still exits 0 without a warning.

## Verification

- Result: confirmed pending final broad verify.
- The implementation now delegates command lookup, subphase-shape validation, and sorted-entry construction to helpers.
- The implementation now emits runtime status, failed phase, generated time, command latest elapsed/timestamp, subphase timestamps, and warnings.
- Focused reporter tests, stale-sample warning tests, and ESLint are rerun before closeout.

## Root Cause

The root cause was placing several independent runtime-signal shape checks and report-building branches in one exported function.
The stale-sample ambiguity came from not carrying provenance fields from the source runtime signal into the report, even though runtime-signal merge semantics intentionally preserve prior subphase samples on failed runs.
The repo's existing ESLint complexity gate correctly caught the maintainability regression before commit.

## Invariant Proof

- Invariant: JSON-shape reporters should keep lookup, validation, and projection branches in small helpers, and should expose source provenance when stored samples may be preserved across failed runs.
- Producer Proof: ESLint identified the overloaded coordinator; Popper identified the stale-sample provenance gap.
- Final-Consumer Proof: focused reporter tests cover text output, JSON output, sorting, missing-signal errors, and stale-sample warnings after the helper split.
- Interface-Shape Sibling Scan: `scripts/run-verify.mjs` already separates timing parsing, runtime-signal merge, and write behavior into helpers.
- Non-Claims: this debug note does not claim final `npm run verify` has passed; that is recorded in the quality closeout.

## Detection Gap

- surface: advisory runtime reporter maintainability | what did not fire: focused reporter tests do not enforce maintainability complexity | smallest change to fire it: existing `lint:eslint` already fires, no new gate needed.
- surface: advisory runtime reporter provenance | what did not fire: first tests did not model failed signals with preserved subphases | smallest change to fire it: add a failed-signal fixture with stale subphase timestamps.

## Sibling Search

- Mental model: a small read-only report can keep all validation and formatting control flow in one function.
- helper-extraction axis: `scripts/report-lint-specs-runtime.mjs` | decision: split lookup, validation, and projection helpers | proof: focused ESLint rerun after repair.
- provenance axis: `scripts/report-lint-specs-runtime.mjs` | decision: include runtime status and timestamp warnings | proof: stale-sample fixture test.
- cross-file: `scripts/run-verify.mjs` owns the sibling runtime-signal shape and already uses helper-oriented structure.

## Seam Risk

- Interrupt ID: lint-specs-runtime-reporter-complexity-2026-07-09
- Risk Class: none
- Seam: none
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep runtime-signal reporters helper-oriented when they validate nested JSON.
When a reporter reads merged sample history, carry enough source provenance to tell fresh samples from preserved samples.
Run focused ESLint after adding a new operator-facing script, even when focused behavior tests pass.
