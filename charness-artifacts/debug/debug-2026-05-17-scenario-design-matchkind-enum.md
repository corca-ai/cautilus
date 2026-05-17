# Debug Review
Date: 2026-05-17

## Problem

`./bin/cautilus discover claims validate --claims .cautilus/claims/evidenced-typed-runners.json --output /tmp/cautilus-claim-validation-after-scenario-design.json` exited 1 after applying the scenario-design review result.

## Correct Behavior

Given a scenario proposal packet that only decomposes claims into eval candidates, when the review result is applied, then claim validation should pass while leaving evidence status `unknown`.

## Observed Facts

The validation report had `issueCount: 8`.
Each issue said `matchKind "scenario-designed" is unsupported` at an applied `evidenceRefs[0].matchKind` path.
The claim validation code accepts only empty, `possible`, `direct`, or `verified` match kinds.
The scenario proposal packet was not direct or verified proof of behavior; it was candidate evidence for the next eval-planning step.

## Reproduction

Run `npm run claims:apply-review-results`, then run `./bin/cautilus discover claims validate --claims .cautilus/claims/evidenced-typed-runners.json --output /tmp/cautilus-claim-validation-after-scenario-design.json`.
With `matchKind: scenario-designed`, validation exits 1.
With `matchKind: possible`, validation exits 0 with `issueCount: 0`.

## Candidate Causes

- Unsupported enum value in the new review result.
- Incorrectly marking scenario proposals as satisfying evidence.
- Claim apply-result corrupting evidence refs during merge.

## Hypothesis

The failure is caused by the new review result inventing a `matchKind` enum value instead of using the existing non-satisfying `possible` kind.

## Verification

`rg` found the validation enum in `internal/runtime/claim_discovery.go`.
After changing the evidence bundle decision and review-result refs from `scenario-designed` to `possible`, reapplying review results, and regenerating projections, `./bin/cautilus discover claims validate --claims .cautilus/claims/evidenced-typed-runners.json --output /tmp/cautilus-claim-validation-after-scenario-design.json` passed with `valid: true`, `issueCount: 0`, and `warningCount: 0`.

## Root Cause

The review result tried to encode a useful semantic distinction in `matchKind`.
That field is a strict evidence-validation enum, not an open vocabulary for workflow phase labels.

## Detection Gap

- claim validation | did fire after apply-result, before commit | keep running `discover claims validate` after any review result that attaches evidence refs
- review-result authoring | no pre-apply enum validation fired | prefer existing `possible`, `direct`, and `verified` meanings when evidence is not satisfying proof

## Sibling Search

- Mental model: evidence refs can carry workflow labels.
- Scenario proposal refs: corrected to `possible` because they are candidate proof inputs, not proof.
- Eval-plan refs: should stay packet evidence and avoid claiming direct behavior proof unless an eval summary or observation packet supports the claim.
- Satisfied deterministic refs: continue using `verified` only when command evidence directly supports the claim boundary.

## Seam Risk

- Interrupt ID: none
- Risk Class: none
- Seam: claim review result authoring to claim validation
- Disproving Observation: validation produced exact enum errors after apply-result
- What Local Reasoning Cannot Prove: whether future schema versions should add a richer workflow-phase field
- Generalization Pressure: moderate; scenario design wants a phase label, but `matchKind` is not that field

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Use `possible` for evidence refs that identify a candidate evidence path without satisfying the claim.
Add a separate field only through a contract/code change if scenario-design phase labels need to become first-class.
