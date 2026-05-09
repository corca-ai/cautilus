# Cautilus Promise Model

The promise model names the product concepts that the rest of the spec tree reads.
Each concept has a human name first.
Machine keys appear only where tables, packets, or checks need compact references.

Spec entry: [Cautilus Promise Specs](../index.spec.md).

## Model Files

- [Promise Ledger](promise-ledger.spec.md)
- [Projection Contract](projection-contract.spec.md)
- [Naming And Addressing](naming-and-addressing.spec.md)

## Workflow Promises

- [Readiness](readiness.spec.md)
- [Claim Discovery](claim-discovery.spec.md)
- [Behavior Evaluation](evaluation.spec.md)
- [Bounded Optimization](optimization.spec.md)

## Cross-Cutting Concerns

- [Host-Owned Execution](host-ownership.spec.md)
- [Concern View](../concerns/index.spec.md)

## Evidence State

- [Evidence And Gap View](../proof/index.spec.md)

```run:shell
# Verify that the canonical model's projection entrypoints exist.
test -f docs/specs/user/index.spec.md
test -f docs/specs/maintainer/index.spec.md
test -f docs/specs/concerns/index.spec.md
test -f docs/specs/proof/index.spec.md
test -f docs/specs/model/readiness.spec.md
test -f docs/specs/model/claim-discovery.spec.md
test -f docs/specs/model/evaluation.spec.md
test -f docs/specs/model/optimization.spec.md
test -f docs/specs/model/host-ownership.spec.md
```
