# Proof Gaps

This page records known missing or weak proof as first-class evidence state.
Where the gap is a concrete missing artifact, the page uses an expected-failing Specdown check so the report stays visibly red without making the suite unusable.

## How To Read A Gap

A proof gap means a promise or cross-cutting rule has an open evidence condition.
The [Evidence Gaps](../rules/evidence-gaps.spec.md) concern is the product rule that weak evidence stays visible; this page is the current ledger of those open proof conditions.
Some gaps are next implementation work; others are waiting for an explicit policy choice or an expensive proof run.
Expected-failing checks keep concrete missing artifacts visible in the report.

## Known Gaps

| gap id | affects | missing proof | unlock trigger | close condition | status |
| --- | --- | --- | --- | --- | --- |
| `gap.vocabulary-evidence-bundle` | `rule.vocabulary-consistency` | No dedicated vocabulary consistency evidence bundle across prose, JSON, tests, and agent guidance. | choose deterministic vocabulary probe scope | current vocabulary evidence packet exists | open |
| `gap.live-batch-fixture` | `promise.evaluation`, `rule.host-owned-execution` | Live invocation and batch invocation proof are still partial. | create host-owned runtime fixture with sanitized packets | live/batch fixture output is linked from evidence map | open |
| `gap.review-learning-active-run-aggregation` | `rule.agent-human-resumability` | `review feedback summarize` can count explicitly selected `cautilus.review_feedback.v1` packets, but no active-run or report surface discovers the packet set across runs. | decide active-run/default packet location and packet discovery rules | an active-run or report route selects review-feedback packets, runs the summary, and links the durable summary artifact from the evidence map | open |

## Expected-Failing Proof Checks

```run:shell !fail
# gap.vocabulary-evidence-bundle
test -f .cautilus/claims/evidence-vocabulary-consistency-current.json
```

```run:shell !fail
# gap.live-batch-fixture
test -f artifacts/self-dogfood/live-batch/latest/result-packet.json
```
