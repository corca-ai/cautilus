# Improvement Loop

Improvement is a bounded behavior-improvement loop.

Map keys: `promise.improvement`, `rule.evidence-gaps`, `rule.cost-and-proof-freshness`, `rule.reviewable-artifacts`.
Evidence path: deterministic packet tests plus a live held-out improve cycle.
Evidence status: satisfied on the dev/skill surface.
Next action: extend the live held-out improve proof beyond the dev/skill orientation surface as new improvement targets are adopted.
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
- `npm run proof:improve:live` ([scripts/on-demand/improve-live-proof.mjs](../../../scripts/on-demand/improve-live-proof.mjs)) runs a real live bounded improve cycle on the dev/skill orientation surface: it constructs a degraded seed control, confirms its live held-out failure, runs codex mutation plus a worktree candidate eval, and asserts the mutated candidate recovers the held-out scenario. The operator-witnessed capture under `fixtures/eval/dev/skill/improve/live/` is replayed deterministically by [scripts/on-demand/improve-live-proof.test.mjs](../../../scripts/on-demand/improve-live-proof.test.mjs) and projected by [the Bounded Improvement spec](../user/improvement.spec.md).

## Evidence Gaps

- The live held-out improve proof currently covers the dev/skill orientation prompt target. Owner: maintainer. Next action: extend the live held-out improve proof to additional improvement targets as they are adopted.
