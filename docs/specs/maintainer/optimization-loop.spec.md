# Optimization Loop

Optimization is a bounded behavior-improvement loop.

Aligned user claims: U3, U7.
Proof route: deterministic plus held-out eval.
Current evidence status: partial.
Next action: connect optimize packet tests to at least one held-out eval proof before treating improvement claims as satisfied.
Absorbs: optimize prepare-input, search budget, checkpoint, frontier, proposal, held-out validation, protected checks, runtime fingerprint, blocked readiness, reuse.

## Maintainer Promise

Optimization starts from an explicit behavior target and budget, and records what changed, which checks were protected, which results were reused, and which held-out checks still guard regressions.

## Subclaims

- `optimize prepare-input` records the target claim, budget, and protected checks before the search loop runs.
- `optimize search run` and revision-artifact assembly preserve checkpoint state and frontier promotions so the loop is resumable.
- Blocked-readiness conditions surface through the optimize packet rather than being hidden behind repeated retries.
- Held-out evaluation guards regressions; an improvement claim is not treated as satisfied without a held-out proof.

## Evidence

- [scripts/agent-runtime/optimization-contract-schemas.test.mjs](../../../scripts/agent-runtime/optimization-contract-schemas.test.mjs) verifies checked-in optimize input, proposal, and revision packets against schemas; [scripts/agent-runtime/optimize-search-contract-schemas.test.mjs](../../../scripts/agent-runtime/optimize-search-contract-schemas.test.mjs) does the same for search input/result, including budget, checkpoint, and frontier fields.
- [internal/runtime/evaluation_proof_test.go](../../../internal/runtime/evaluation_proof_test.go) `TestOptimizeInputRejectsBlockedProductRunnerProof` and `TestEvaluationProofPreservesBlockersThroughSummary` show blocked-readiness states reaching the optimize packet rather than being masked.

## Evidence Gaps

- Held-out eval result packet attached to a real optimize run so improvement claims have a reopenable before/after evidence pair. Owner: maintainer. Next action: capture a self-dogfood optimize cycle with held-out validation under `artifacts/self-dogfood/` and link both summaries.
