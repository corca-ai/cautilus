# Proof Gaps

This page records known missing or weak proof as first-class evidence state.
Where the gap is a concrete missing artifact, the page uses an expected-failing Specdown check so the report stays visibly red without making the suite unusable.

## How To Read A Gap

A proof gap means a promise or shared concern has an open evidence condition.
The [Evidence Gaps](../concerns/evidence-gaps.spec.md) concern is the product rule that weak evidence stays visible; this page is the current ledger of those open proof conditions.
Some gaps are next implementation work; others are waiting for an explicit policy choice or an expensive proof run.
Expected-failing checks keep concrete missing artifacts visible in the report.

## Known Gaps

| gap id | affects | missing proof | unlock trigger | close condition | status |
| --- | --- | --- | --- | --- | --- |
| `gap.traceability-config` | model, all views | Specdown trace graph is not configured for typed promise/shared-concern/proof documents. | decide trace types and edge cardinality | `specdown trace -strict` passes without expected failure | open |
| `gap.optimize-held-out-cycle` | `promise.optimization`, `concern.cost-and-proof-freshness` | No checked-in end-to-end optimize cycle with held-out validation. | run or fixture a representative bounded optimize cycle | durable held-out cycle summary is linked from evidence map | open |
| `gap.vocabulary-evidence-bundle` | `concern.vocabulary-consistency` | No dedicated vocabulary consistency evidence bundle across prose, JSON, tests, and agent guidance. | choose deterministic vocabulary probe scope | current vocabulary evidence packet exists | open |
| `gap.live-batch-fixture` | `promise.evaluation`, `concern.host-owned-execution` | Live invocation and batch invocation proof are still partial. | create host-owned runtime fixture with sanitized packets | live/batch fixture output is linked from evidence map | open |

## Expected-Failing Proof Checks

```run:shell !fail
# gap.traceability-config
specdown trace -strict
```

```run:shell !fail
# gap.optimize-held-out-cycle
test -f artifacts/self-dogfood/optimize-held-out-cycle/latest/eval-summary.json
```

```run:shell !fail
# gap.vocabulary-evidence-bundle
test -f .cautilus/claims/evidence-vocabulary-consistency-current.json
```

```run:shell !fail
# gap.live-batch-fixture
test -f artifacts/self-dogfood/live-batch/latest/result-packet.json
```
