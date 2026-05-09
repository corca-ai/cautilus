# Behavior Evaluation Promise

Promise ID: `promise.evaluation`.

Behavior Evaluation gives users a bounded way to evaluate intentful behavior across supported `dev` and `app` surfaces when deterministic tests alone do not explain the behavior.

## Projections

- User projection: [Behavior Evaluation](../user/evaluation.spec.md)
- Maintainer routes: [Evaluation Surfaces And Runners](../maintainer/evaluation-surfaces-runners.spec.md), [Reporting And Review Variants](../maintainer/reporting-review-variants.spec.md), [Live Invocation Runtime](../maintainer/live-invocation-runtime.spec.md)
- Related concerns: [Reviewable Artifacts](../concerns/reviewable-artifacts.spec.md), [Packet Freshness](../concerns/packet-freshness.spec.md), [Cost And Proof Freshness](../concerns/cost-and-proof-freshness.spec.md), [Host-Owned Execution](../concerns/host-owned-execution.spec.md)

## Evidence Posture

Current status: partial.
Selected evidence bundles are projected into the user view without rerunning expensive eval loops, and maintainer routes own fixture and runner proof.

```run:shell
# Verify evaluation projections are linked to existing docs.
test -f docs/specs/user/evaluation.spec.md
test -f docs/specs/maintainer/evaluation-surfaces-runners.spec.md
```
