# Cautilus Promise Model

This directory owns canonical promise identity, projection rules, and ID policy.
The ledger is the source of truth; per-promise pages explain the current promise shape in more detail.

Claim-spec report entry: [Cautilus Claim Specs](../index.spec.md).
User view: [User-Facing Specs](../user/index.spec.md).
Maintainer view: [Maintainer-Facing Specs](../maintainer/index.spec.md).
Concern lens: [Cross-Cutting Concerns](../concerns/index.spec.md).
Proof view: [Proof View](../proof/index.spec.md).

## Canonical Files

- [Promise Ledger](promise-ledger.spec.md)
- [Projection Contract](projection-contract.spec.md)
- [ID Policy](id-policy.spec.md)

## Primary Workflow Promises

- [Readiness](readiness.spec.md)
- [Claim Discovery](claim-discovery.spec.md)
- [Behavior Evaluation](evaluation.spec.md)
- [Bounded Optimization](optimization.spec.md)

## Product Constraints

- [Host-Owned Execution](host-ownership.spec.md)

```run:shell
# Verify that the canonical model's projection entrypoints exist.
test -f docs/specs/user/index.spec.md
test -f docs/specs/maintainer/index.spec.md
test -f docs/specs/concerns/index.spec.md
test -f docs/specs/proof/index.spec.md
```
