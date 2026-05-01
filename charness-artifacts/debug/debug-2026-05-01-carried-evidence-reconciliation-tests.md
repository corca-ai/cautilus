# Debug Review: carried evidence reconciliation tests
Date: 2026-05-01

## Problem

The first implementation of stricter `claim discover --previous` evidence reconciliation failed the new focused tests.

## Correct Behavior

Given a previous claim packet carries direct or verified evidence with an evidence `contentHash`, when `claim discover --previous` refreshes the proof plan, then unchanged valid evidence should remain satisfied and changed or mismatched evidence should become stale.

## Observed Facts

- Exact command: `go test ./internal/runtime -run 'TestDiscoverClaimProofPlanCarriesPreviousEvidenceByFingerprint|TestDiscoverClaimProofPlanMarksChangedCarriedEvidenceStale|TestDiscoverClaimProofPlanMarksEvidenceBundleClaimMismatchStale'`
- Existing carry-forward test failed because the evidence ref path `internal/runtime/claim_discovery_test.go` was resolved inside the temporary repo, where that file does not exist.
- Exact failure text included: `expected reviewed evidence to carry forward`.
- New changed-evidence test panicked with `runtime error: index out of range [0] with length 0`.
- The panic happened before the intended stale-evidence assertion.

## Reproduction

```bash
go test ./internal/runtime -run 'TestDiscoverClaimProofPlanCarriesPreviousEvidenceByFingerprint|TestDiscoverClaimProofPlanMarksChangedCarriedEvidenceStale|TestDiscoverClaimProofPlanMarksEvidenceBundleClaimMismatchStale'
```

## Candidate Causes

- The existing test used a repo-local-looking evidence path without creating that path inside the temporary repo.
- The new test sentence did not match deterministic claim extraction heuristics, so discovery returned zero candidates.
- The reconciliation implementation could be incorrectly downgrading all carried evidence, including valid evidence.

## Hypothesis

If the tests create evidence files inside the temporary repo and use claim-like sentences that deterministic discovery extracts, unchanged evidence will carry forward while changed or mismatched evidence will become stale.

## Verification

Repaired the fixtures to create repo-local evidence files and use an extractor-supported behavior sentence, then reran:

```bash
go test ./internal/runtime -run 'TestDiscoverClaimProofPlanCarriesPreviousEvidenceByFingerprint|TestDiscoverClaimProofPlanMarksChangedCarriedEvidenceStale|TestDiscoverClaimProofPlanMarksEvidenceBundleClaimMismatchStale'
```

The focused test selection passed.

## Root Cause

The implementation tightened evidence refs to repo-local files, but the carry-forward fixture still used a path that only exists in the source checkout.
The changed-evidence test also used a sentence shaped like implementation intent rather than a deterministic behavior claim, so it did not create a candidate to refresh.

## Seam Risk

- Interrupt ID: carried-evidence-reconciliation-tests
- Risk Class: none
- Seam: claim packet carry-forward test fixtures
- Disproving Observation: the observed failures happen before product behavior assertions can be evaluated.
- What Local Reasoning Cannot Prove: none; the issue is local fixture shape.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Carry-forward tests that assert repo-local evidence reconciliation must materialize every referenced evidence path inside the temporary repo.
Claim-discovery tests must use sentences that the deterministic extractor is expected to treat as claims, or assert zero candidates explicitly.
