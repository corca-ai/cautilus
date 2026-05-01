# Debug Review: claim evidence ref claimId drift
Date: 2026-05-01

## Problem

`./bin/cautilus claim validate --claims .cautilus/claims/evidenced-typed-runners.json` failed after refreshing claim packets for the fixture-authoring guidance docs change.

## Correct Behavior

Given a source edit only shifts a claim display id while preserving the same claim fingerprint and meaning, when reviewed/evidenced claim state is carried forward, then direct or verified evidence refs must support the current claim id and validation must pass.

## Observed Facts

- Exact command: `./bin/cautilus claim validate --claims .cautilus/claims/evidenced-typed-runners.json --output .cautilus/claims/validation-evidenced-typed-runners.json`
- Exact failure: `exit status 1`
- Validation issue: `evidenceStatus satisfied requires a direct or verified evidenceRef with path, kind, commit or contentHash, and supportsClaimIds containing the claim`
- Validation issue path: `$.claimCandidates[181].evidenceRefs`
- The affected claim moved from `claim-docs-contracts-claim-discovery-workflow-md-611` to `claim-docs-contracts-claim-discovery-workflow-md-612`.
- The affected claim fingerprint stayed `sha256:e1f238b94302fc34437333c1a961bf8ea0289588ea97402ae9be1b6b733217c9`.
- The preserved evidence ref still had `supportsClaimIds: ["claim-docs-contracts-claim-discovery-workflow-md-611"]`.

## Reproduction

```bash
./bin/cautilus claim validate --claims .cautilus/claims/evidenced-typed-runners.json --output /tmp/cautilus-validation-debug.json
```

## Candidate Causes

- The local state-carry-forward merge preserved evidence refs by fingerprint but did not rewrite `supportsClaimIds` when the display `claimId` changed.
- The evidence bundle itself still targeted the old line-number-derived claim id.
- The claim meaning changed and the old evidence should have been dropped instead of preserved.

## Hypothesis

If the claim fingerprint is unchanged, the claim meaning is unchanged and the evidence can be carried forward; updating the evidence bundle target id and evidence ref `supportsClaimIds` to the current claim id should make validation pass.

## Verification

Updated `.cautilus/claims/evidence-review-to-eval-flow.json` to target `claim-docs-contracts-claim-discovery-workflow-md-612`, recomputed the bundle content hash in `.cautilus/claims/evidenced-typed-runners.json`, and reran claim validation successfully.

## Root Cause

The manual claim packet refresh merge treated `claimFingerprint` as the correct continuity key for candidate state but left nested evidence support ids as old display handles.
Because claim ids include line-number-derived source location, a nearby docs edit can shift the id even when the claim fingerprint and meaning remain stable.

## Seam Risk

- Interrupt ID: claim-evidence-ref-claimid-drift
- Risk Class: contract-freeze-risk
- Seam: claim packet carry-forward between deterministic discovery and reviewed/evidenced state
- Disproving Observation: claim fingerprint remained unchanged while only the display id shifted
- What Local Reasoning Cannot Prove: whether a future first-class refresh helper should automatically rewrite evidence refs or instead mark this as stale for reviewer confirmation
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Prefer a product-owned carry-forward helper before this workflow spreads to consumer repos.
Until then, after claim source docs move line-number-derived ids, run `claim validate` and repair preserved evidence refs to support the current claim id only when the claim fingerprint and meaning are unchanged.
