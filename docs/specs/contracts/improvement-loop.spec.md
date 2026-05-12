# Improvement Loop

Improvement is a bounded behavior-improvement loop.

Map keys: `promise.improvement`, `rule.evidence-gaps`, `rule.cost-and-proof-freshness`, `rule.reviewable-artifacts`.
Evidence path: deterministic plus held-out eval.
Evidence status: open gap.
Next action: connect improve packet tests to at least one held-out eval proof before treating improvement claims as satisfied.
Terms covered here: improve prepare-input, search budget, checkpoint, frontier, proposal, held-out validation, protected checks, runtime fingerprint, blocked readiness, reuse.

## Maintainer Promise

Improvement starts from an explicit behavior target and budget, and records what changed, which checks were protected, which results were reused, and which held-out checks still guard regressions.

## Subclaims

- `improve prepare-input` records the target claim, budget, and protected checks before the search loop runs.
- `improve search run` and revision-artifact assembly preserve checkpoint state and frontier promotions so the loop is resumable.
- Blocked-readiness conditions surface through the improve packet rather than being hidden behind repeated retries.
- Held-out evaluation guards regressions; an improvement claim is not treated as satisfied without a held-out proof.

## Evidence

- [scripts/agent-runtime/improvement-contract-schemas.test.mjs](../../../scripts/agent-runtime/improvement-contract-schemas.test.mjs) verifies checked-in improve input, proposal, and revision packets against schemas; [scripts/agent-runtime/improve-search-contract-schemas.test.mjs](../../../scripts/agent-runtime/improve-search-contract-schemas.test.mjs) does the same for search input/result, including budget, checkpoint, and frontier fields.
- [internal/runtime/evaluation_proof_test.go](../../../internal/runtime/evaluation_proof_test.go) `TestImproveInputRejectsBlockedProductRunnerProof` and `TestEvaluationProofPreservesBlockersThroughSummary` show blocked-readiness states reaching the improve packet rather than being masked.

## Evidence Gaps

- Held-out eval result packet attached to a real improve run so improvement claims have a reopenable before/after evidence pair. Owner: maintainer. Next action: capture a self-dogfood improve cycle with held-out validation under `artifacts/self-dogfood/` and link both summaries.
