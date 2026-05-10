# Claim Derived Artifacts Stale Debug
Date: 2026-05-10

## Problem

`npm run verify` failed after the Cautilus adapter gained new claim-status and evidence-state paths.
The first stale artifact was the evidence-state summary, and after regenerating it the next stale artifact was the claim status report.

## Correct Behavior

Given `.agents/cautilus-adapter.yaml` changes the claim discovery context, when `npm run verify` runs, then checked-in claim-derived artifacts should either already match the current adapter input or be regenerated before verification.

## Observed Facts

- `npm run verify` failed in the `lint · claim evidence state` step.
- The exact error was `.cautilus/claims/status-summary.json is stale; run npm run claims:evidence-state`.
- After `npm run claims:evidence-state` and `npm run claims:evidence-state:check` passed, `npm run verify` failed in the `lint · claim status report` step.
- The second exact error was `.cautilus/claims/claim-status-report.md is stale; run npm run claims:status-report`.
- The current slice changed `.agents/cautilus-adapter.yaml` by adding semantic claim terms and artifact paths for evidence state, status summary, and claim status report.
- The failures occurred after earlier gates passed, including eslint, spec lint, scenario normalizer lint, contract lint, and claim evidence hash audit.

## Reproduction

Run:

```bash
npm run verify
```

## Candidate Causes

- Adapter metadata participates in the generated claim evidence-state summary and claim status report.
- Adding artifact paths changed the expected status projection without regenerating `.cautilus/claims/status-summary.json`.
- Adding artifact paths changed the expected report projection without regenerating `.cautilus/claims/claim-status-report.md`.
- The verifier intentionally treats checked-in claim-derived artifact drift as a failing stale-artifact condition.

## Hypothesis

If the adapter change altered generated claim-derived artifacts, then running `npm run claims:evidence-state` and `npm run claims:status-report` should update the checked-in artifacts and allow both stale checks to pass.

## Verification

Ran `npm run claims:evidence-state`, which refreshed `.cautilus/claims/status-summary.json`, `.cautilus/claims/evidence-state.json`, and `docs/specs/proof/claim-evidence-state.md`.
Then `npm run claims:evidence-state:check` passed.
Ran `npm run claims:status-report`, which refreshed `.cautilus/claims/claim-status-report.md`.
Then `npm run claims:status-report:check` passed.

## Root Cause

The checked-in claim-derived artifacts were generated before the current adapter and claim-status documentation changes.
The verifier correctly rejected stale derived artifacts until they were regenerated.

## Seam Risk

- Interrupt ID: claim-derived-artifacts-stale-after-adapter-update
- Risk Class: none
- Seam: Cautilus adapter metadata to checked-in claim-derived artifacts
- Disproving Observation: `npm run claims:evidence-state:check` and `npm run claims:status-report:check` pass after regenerating the artifacts.
- What Local Reasoning Cannot Prove: whether unrelated checked-in evidence hash warnings should be cleaned in this slice.
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When `.agents/cautilus-adapter.yaml` changes claim discovery terms or artifact paths, run `npm run claims:evidence-state` and `npm run claims:status-report` before the full verify gate.

## Related Prior Incidents

- [debug-2026-05-03-status-report-max-lines.md](debug-2026-05-03-status-report-max-lines.md): claim status report changes can require regenerating checked-in claim artifacts before verification.
