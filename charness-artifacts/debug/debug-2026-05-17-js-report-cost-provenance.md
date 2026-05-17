# Debug Review
Date: 2026-05-17

## Problem

Subagent critique found that the JS report builders preserved numeric cost totals but dropped cost provenance string fields.

## Correct Behavior

Given scenario or mode telemetry includes cost provenance, when JS report summaries aggregate telemetry, then the report should retain whether the cost was runtime-exact or derived and which pricing source/version produced it.

## Observed Facts

`telemetry-fields.mjs` declared `cost_truth`, `pricing_source`, and `pricing_version`.
`scenario-result-telemetry.mjs` only attached provider, model, request, cache, and static-context aggregates.
`build-report-packet.mjs` only normalized provider/model strings on mode telemetry and only promoted provider/model aggregates to mode and report telemetry.
The Go report path and deployment evidence path already preserved cost provenance, so the defect was isolated to the JS report surface.

## Reproduction

Build a JS report input whose scenario result telemetry includes `cost_usd`, `cost_truth`, `pricing_source`, and `pricing_version`.
Before the fix, the report included `cost_usd` but omitted `costTruths`, `pricingSources`, and `pricingVersions` from scenario, mode, and report summaries.

## Candidate Causes

- The string telemetry field list was added before the JS report aggregators shared a single dimension map.
- `build-report-packet.mjs` carried only provider/model strings from explicit mode telemetry, so new telemetry strings were silently dropped.
- Existing report tests asserted numeric cost totals but did not assert cost attribution fields.

## Hypothesis

If JS telemetry string dimensions are declared once and both scenario and report aggregation loop over them, then cost provenance and request/cache/static dimensions will remain attached through scenario, mode, and report summaries.

## Verification

The focused JS report/scenario telemetry tests, release claim freshness tests, verify phase tests, focused ESLint, and debug artifact validation passed.

## Root Cause

The JS report aggregation path duplicated a partial provider/model string-field list instead of using the canonical telemetry string fields.

## Detection Gap

- Report fixture coverage | checked `cost_usd` totals only | add assertions for `costTruths`, `pricingSources`, and `pricingVersions`.
- Mode telemetry normalization | accepted provider/model only | normalize every declared telemetry string field.
- Cross-runner parity | Go and deployment evidence were fixed separately | keep JS report aggregation on the same telemetry dimension declaration.

## Sibling Search

- `scenario-results.mjs` already normalizes all declared telemetry string fields.
- `skill-evaluation-normalizers.mjs` already normalizes all declared telemetry string fields.
- `deployment-evidence.mjs` already uses `TELEMETRY_STRING_FIELDS` for row and summary provenance.

## Seam Risk

- Interrupt ID: js-report-cost-provenance
- Risk Class: none
- Seam: JS report telemetry aggregation
- Disproving Observation: a fixture with cost provenance yields report telemetry without `costTruths`, `pricingSources`, or `pricingVersions`.
- What Local Reasoning Cannot Prove: whether every downstream consumer renders the new aggregate fields.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When adding telemetry dimensions, tests should assert both numeric totals and provenance aggregates on every report surface that claims telemetry preservation.
