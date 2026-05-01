# ProofLayer Removal Inline JSON Debug
Date: 2026-05-01

## Problem

After removing `proofLayer` from generated claim packets, targeted app tests failed with `invalid character '"' after object key:value pair`.

## Correct Behavior

Given test fixtures are inline JSON strings, when a final JSON field is removed, then the previous field must lose its JSON trailing comma while the Go string literal still keeps its composite-literal comma.

## Observed Facts

- Runtime claim discovery tests passed after the `proofLayer` field removal.
- App tests that parse inline claim packets failed before command logic ran.
- The affected fixture lines ended with JSON `sourceRefs` as the last field but either kept an invalid JSON comma or lost the Go composite-literal comma.

## Reproduction

`go test ./internal/runtime ./internal/app -run 'TestDiscoverClaimProofPlanClassifiesFixtureClaims|TestRunClaimShowSummarizesExistingProofPlan|TestRunClaimReviewPrepareInputWritesClusters|TestRunClaimPlanEvalsWritesIntermediatePlan|TestRunClaimValidateWritesReport'`

## Candidate Causes

- Bulk removal left invalid JSON commas in inline fixtures.
- Runtime validation still required `proofLayer`.
- The schema example was invalid after field removal.

## Hypothesis

If the failure is fixture JSON syntax, then repairing the affected `sourceRefs` lines should let the same targeted tests progress past JSON parsing without changing runtime logic.

## Verification

`go test ./internal/runtime ./internal/app -run 'TestDiscoverClaimProofPlanClassifiesFixtureClaims|TestRunClaimDiscoverWritesProofPlan|TestRunClaimShowSummarizesExistingProofPlan|TestRunClaimReviewPrepareInputWritesClusters|TestRunClaimPlanEvalsWritesIntermediatePlan|TestRunClaimValidateWritesReport|TestExamplesValidateAgainstSchemas'` passed after the fixture repair.

## Root Cause

The mechanical cleanup removed the final `proofLayer` JSON field from inline fixtures without preserving the distinction between JSON commas and Go composite-literal commas.

## Seam Risk

- Interrupt ID: prooflayer-removal-inline-json
- Risk Class: generated-packet schema cleanup
- Seam: inline JSON fixtures in Go tests
- Disproving Observation: targeted tests still fail after fixture syntax repair
- What Local Reasoning Cannot Prove: whether all checked-in generated claim packets were regenerated until the full claim workflow runs
- Generalization Pressure: medium because packet field removals touch runtime, schema, docs, examples, and generated artifacts together

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

After removing a JSON packet field, parse all checked-in JSON fixtures and run targeted tests before broad claim packet regeneration.
