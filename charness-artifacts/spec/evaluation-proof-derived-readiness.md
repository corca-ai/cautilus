# Evaluation Proof Derived Readiness Spec Handoff

Date: 2026-04-30

## Trigger

The evaluation proof implementation exposed a contract-freeze risk: caller-provided `proof.productProofReady` could be mistaken for a Cautilus-owned readiness verdict.

## Decision

Product proof readiness is derived, not packet-authored.
Cautilus may carry proof facts from observed packets, runner readiness, and report inputs, but `productProofReady` must be recomputed from product-owned constraints.

## Contract Anchors

- [docs/contracts/runner-verification.md](../../docs/contracts/runner-verification.md)
- [docs/contracts/runner-readiness.md](../../docs/contracts/runner-readiness.md)
- [docs/contracts/active-run.md](../../docs/contracts/active-run.md)
- [docs/contracts/claim-discovery-workflow.md](../../docs/contracts/claim-discovery-workflow.md)

## Required Behavior

- Ignore caller-provided `productProofReady` during proof normalization.
- Require `runnerAssessmentRecommendation=ready-for-selected-surface` before app product proof can be ready.
- Require `runnerVerification.capabilityState=ready` before app product proof can be ready.
- Block runner assessment evidence when its assessed surface does not match the evaluated target surface.
- Keep claim eval plans as proof requirements, not readiness verdicts.

## Verification

The implementation slice should keep unit coverage for forged readiness booleans, not-ready assessment recommendations, cross-surface assessment mismatches, report proof summaries, and optimize preflight blocking.
