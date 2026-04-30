# Debug Review: runner assessment schema gating
Date: 2026-04-30

## Problem

Implementation premortem found that `fixtures/runner-readiness/assessment.schema.json` rejected the same missing-`verificationCapabilities` packet shape that runtime readiness intentionally diagnoses as `upgrade_runner_assessment`.

## Correct Behavior

Given a `cautilus.runner_assessment.v1` packet with `proofClass: in-process-product-runner` and `recommendation: ready-for-selected-surface`, when `verificationCapabilities` is omitted, then the packet should remain shape-readable enough for `doctor` and `agent status` to report runner readiness as blocked with missing capability diagnostics.

Given a packet includes `verificationCapabilities`, when a leg has an unknown state, then schema/runtime validation should reject the malformed leg.

## Observed Facts

- `internal/runtime/runner_readiness.go` reports missing product-proof legs as `reason: runner-assessment-missing-verification-capabilities` and `nextBranch.id: upgrade_runner_assessment`.
- `docs/contracts/runner-verification.md` says omitted required legs should be blocked with diagnostics.
- `fixtures/runner-readiness/assessment.schema.json` used conditional `allOf` to require `verificationCapabilities` and the four product-proof legs before the runtime could produce that blocked readiness state.
- The happy-path example includes `verificationCapabilities`, so example validation did not catch the mismatch.

## Reproduction

Create a product-proof assessment packet with:

```json
{
  "schemaVersion": "cautilus.runner_assessment.v1",
  "proofClass": "in-process-product-runner",
  "recommendation": "ready-for-selected-surface"
}
```

and the other required base fields, but omit `verificationCapabilities`.
Runtime readiness reports an upgrade branch, while the published schema rejects the packet before readiness can diagnose it.

## Candidate Causes

- Schema authoring encoded semantic readiness as shape validity.
- Runtime and schema tests covered different cases: runtime tested blocked missing legs, schema tested only happy-path example validity.
- The contract phrasing “requires” was read as JSON Schema required instead of readiness-gating required.

## Hypothesis

If the schema allows omitted `verificationCapabilities` but validates leg shape whenever provided, and a parity test covers the omitted-leg product-proof case, then schema validation and runtime readiness can both express the same blocked state.

## Verification

Run targeted tests after repair:

```bash
go test ./internal/runtime ./internal/app -run 'RunnerReadiness|DoctorReportsReadyWithExecutionSurface|FixtureExamplesValidateAgainstPublishedSchemas'
```

Then run full repository gates:

```bash
npm run verify
npm run hooks:check
```

## Root Cause

The schema crossed the product boundary from packet shape validation into semantic readiness validation.
Runner readiness needs malformed capability legs to be invalid, but missing product-proof capability evidence to be diagnosable as an incomplete assessment.

## Seam Risk

- Interrupt ID: runner-assessment-schema-gating
- Risk Class: contract-freeze-risk
- Seam: published assessment schema versus runtime readiness diagnosis
- Disproving Observation: a product-proof packet with omitted `verificationCapabilities` can be runtime-diagnosable but schema-invalid
- What Local Reasoning Cannot Prove: whether external consumers validate assessment packets before invoking `doctor`
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Add parity coverage for readiness-blocked but shape-readable assessment packets, and avoid encoding readiness verdicts as JSON Schema conditional requirements unless runtime also treats the condition as malformed input.
