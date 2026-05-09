# Cautilus Promise Model

The promise model is the compact reference for Cautilus promises, shared concerns, and evidence pages.
Start with the [User Workflow](../user/index.spec.md) when reading for the product story.
Use this page when you need a map.

Spec entry: [Cautilus Promise Specs](../index.spec.md).

## Model Files

- [Promise Ledger](promise-ledger.spec.md)
- [How The Views Relate](how-views-relate.spec.md)
- [Names And Keys](names-and-keys.spec.md)

## Workflow Promises

- [Readiness](readiness.spec.md)
- [Claim Discovery](claim-discovery.spec.md)
- [Behavior Evaluation](evaluation.spec.md)
- [Bounded Optimization](optimization.spec.md)

## Shared Concerns

- [Host-Owned Execution](../concerns/host-owned-execution.spec.md)
- [Shared Concerns](../concerns/index.spec.md)

## Evidence State

- [Evidence State](../proof/index.spec.md)

```run:shell
# Verify that the model's reading views exist.
test -f docs/specs/user/index.spec.md
test -f docs/specs/maintainer/index.spec.md
test -f docs/specs/concerns/index.spec.md
test -f docs/specs/proof/index.spec.md
test -f docs/specs/model/readiness.spec.md
test -f docs/specs/model/claim-discovery.spec.md
test -f docs/specs/model/evaluation.spec.md
test -f docs/specs/model/optimization.spec.md
test -f docs/specs/concerns/host-owned-execution.spec.md
```
