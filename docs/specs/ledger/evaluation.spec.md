# Behavior Evaluation Promise

Promise ID: `promise.evaluation`.

Behavior Evaluation gives users a bounded way to evaluate intentful behavior across supported `dev` and `app` surfaces when deterministic tests alone do not explain the behavior.

## Links

- User workflow: [Behavior Evaluation](../user/evaluation.spec.md)
- Maintainer evidence routes: [Evaluation Surfaces And Runners](../contracts/evaluation-surfaces-runners.spec.md), [Reporting And Review Variants](../contracts/reporting-review-variants.spec.md), [Live Invocation Runtime](../contracts/live-invocation-runtime.spec.md)
- Related cross-cutting rules: [Reviewable Artifacts](../rules/reviewable-artifacts.spec.md), [Packet Freshness](../rules/packet-freshness.spec.md), [Cost And Proof Freshness](../rules/cost-and-proof-freshness.spec.md), [Host-Owned Execution](../rules/host-owned-execution.spec.md)

## Evidence State

Evidence status: open gap.
Selected evidence bundles are shown in the user view without rerunning expensive eval loops, and maintainer routes own fixture and runner proof.

```run:shell
# Verify evaluation links point to existing docs.
test -f docs/specs/user/evaluation.spec.md
test -f docs/specs/contracts/evaluation-surfaces-runners.spec.md
```
