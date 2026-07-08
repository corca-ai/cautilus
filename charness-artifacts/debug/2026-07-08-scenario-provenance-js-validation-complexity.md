# Debug Review
Date: 2026-07-08

## Problem

`npm run verify` failed after adding scenario proposal provenance validation.
ESLint reported `validateEvidenceItem` in `scripts/agent-runtime/scenario-proposals.mjs` exceeded both cyclomatic and cognitive complexity limits.

## Correct Behavior

Given optional provenance validation is part of the runtime absorption slice, when the validation rules are added, the implementation should stay inside the repo's maintainability gates while preserving the same error behavior.

## Observed Facts

- `npm run verify` failed in the eslint phase.
- The reported file was `scripts/agent-runtime/scenario-proposals.mjs`.
- The reported function was `validateEvidenceItem`.
- The validation logic checked required evidence strings, source kind, optional origin, optional `activityProvenance`, optional split, optional score, and unsupported provenance fields.

## Reproduction

- Run `npm run verify` after the initial validation implementation.
- Observed result: eslint exits 1 with complexity and cognitive-complexity errors for `validateEvidenceItem`.

## Candidate Causes

- The validation rules themselves are too broad for this slice.
- The JavaScript validator is missing helper functions, so independent checks are nested in one function.
- The lint threshold is too low for validation-heavy code.

## Hypothesis

- Falsifiable claim: the failure is structural complexity in one function, not excess product scope.
- Disconfirmer: if splitting validation into helper functions still fails eslint or changes focused validation tests, the rules themselves need narrowing.

## Verification

- Result: confirmed pending final broad verify.
- The implementation was split into `validateNonEmptyString`, `validateEnumValue`, and `validateActivityProvenance`, leaving `validateEvidenceItem` as the coordinator.
- Focused Node validation tests are rerun before closeout.

## Root Cause

The root cause was implementing several independent field checks in one JavaScript function.
The repo's lint gate correctly caught the maintainability regression.

## Invariant Proof

- Invariant: runtime validators should keep independent field checks in small helpers when more than one optional subobject is validated.
- Producer Proof: eslint complexity gate identified the overloaded function.
- Final-Consumer Proof: focused scenario proposal tests cover the same invalid-origin, invalid-split, and unsupported-field behavior after the helper split.
- Interface-Shape Sibling Scan: Go validation already uses a separate `validateProposalEvidence` helper and did not hit the JavaScript lint gate.
- Non-Claims: this debug note does not claim the final broad `npm run verify` has passed; that is recorded separately in the goal closeout.

## Detection Gap

- surface: scenario proposal JS validation | what did not fire: focused Node tests do not enforce maintainability complexity | smallest change to fire it: existing eslint gate already fires in `npm run verify`; no new gate needed.

## Sibling Search

- Mental model: validation can be added as a direct sequence of checks in one function.
- helper-extraction axis: Node validator | decision: split checks by field class | proof: eslint targeted the monolithic function.
- parity axis: Go validator | decision: keep Go validation helper-oriented | proof: Go focused tests passed before the eslint failure.
- cross-file: `internal/runtime/proposals.go` and `scripts/agent-runtime/scenario-proposals.mjs` both own provenance validation and should stay structurally readable.

## Seam Risk

- Interrupt ID: scenario-provenance-js-validation-complexity-2026-07-08
- Risk Class: none
- Seam: runtime validation implementation to maintainability gate
- Disproving Observation: lint caught the issue before commit
- What Local Reasoning Cannot Prove: n/a
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep scenario proposal provenance validation helper-oriented in both runtimes.
Do not weaken the eslint complexity gate for validation code unless a later slice can name a stronger structural reason.
