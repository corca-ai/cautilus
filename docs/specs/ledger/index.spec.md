# Cautilus Promise Ledger

Read this when you need the current list of Cautilus behavior claims and the ownership map behind them.
The ledger shows which workflow, contract, cross-cutting rule, and evidence page owns each claim.
Start with the [User Workflow](../user/index.spec.md) when reading for the product story.

Spec entry: [Cautilus](../index.spec.md).

## Ledger Files

- [Promise Ledger](promise-ledger.spec.md)
- [How The Views Relate](how-views-relate.spec.md)
- [Names And Keys](names-and-keys.spec.md)

## Workflow Promises

- [Readiness](readiness.spec.md)
- [Claim Discovery](claim-discovery.spec.md)
- [Behavior Evaluation](evaluation.spec.md)
- [Bounded Improvement](improvement.spec.md)

## Cross-Cutting Rules

- [Host-Owned Execution](../rules/host-owned-execution.spec.md)
- [Cross-Cutting Rules](../rules/index.spec.md)

## Evidence State

- [Evidence State](../evidence/index.spec.md)

```run:shell
# Verify that the ledger's reading views exist.
node -e 'const fs = require("node:fs"); for (const path of ["docs/specs/user/index.spec.md", "docs/specs/contracts/index.spec.md", "docs/specs/rules/index.spec.md", "docs/specs/evidence/index.spec.md", "docs/specs/ledger/readiness.spec.md", "docs/specs/ledger/claim-discovery.spec.md", "docs/specs/ledger/evaluation.spec.md", "docs/specs/ledger/improvement.spec.md", "docs/specs/rules/host-owned-execution.spec.md"]) { if (!fs.existsSync(path)) throw new Error("missing " + path); }'
```
