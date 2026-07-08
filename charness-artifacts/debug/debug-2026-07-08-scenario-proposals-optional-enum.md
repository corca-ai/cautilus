# Debug: scenario proposal optional enum validation

## Trigger

Focused Node tests failed after adding scenario proposal provenance guardrails.

## Symptom

`generateScenarioProposals validates optional evidence provenance enums` expected `activityProvenance.split must be a non-empty string` for an invalid string enum value, but the runtime returned `activityProvenance.split must be one of proposal, train, review`.

## Root Cause

Two issues overlapped.
The test expectation was stale: a non-empty but unsupported split value should produce the enum error.
Separately, the JavaScript helper `validateNonEmptyString` validated strings but returned `undefined`, so callers that needed the normalized value, especially the replay/origin compatibility check, could not rely on the helper result.

## Fix

`validateNonEmptyString` now returns the trimmed string after validation.
The Node test expectations now distinguish unsupported enum values from null or non-string values.
That keeps optional enum validation aligned with the Go runtime and keeps normalized values available to the replay/origin compatibility check.

## Verification

Focused Node tests were rerun after the fix.
