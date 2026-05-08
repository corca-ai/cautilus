# Promise And Concern ID Policy

Stable IDs prevent projections from depending on local list order or retired user-claim numbers.
The ID namespace is intentionally small and readable.

## Current Namespaces

| namespace | owner | examples | rule |
| --- | --- | --- | --- |
| `promise.*` | [Promise Ledger](promise-ledger.spec.md) | `promise.readiness`, `promise.claim-discovery` | primary workflow promises only |
| `concern.*` | [Promise Ledger](promise-ledger.spec.md) and [Cross-Cutting Concerns](../concerns/index.spec.md) | `concern.evidence-gaps`, `concern.host-owned-execution` | non-primary acceptance concerns that constrain several routes |
| `gap.*` | [Proof Gaps](../proof/gaps.spec.md) | `gap.traceability-config`, `gap.optimize-held-out-cycle` | known missing or weak proof that must stay visible |
| `evidence.*` | [Evidence Map](../proof/evidence-map.spec.md) | `evidence.readiness-cli`, `evidence.claim-discovery-fixtures` | durable evidence bundles or executable proof routes |

## Retired Local IDs

Legacy `U*` IDs are no longer canonical.
They may appear in archived text, but active maintainer specs should align to `promise.*` and `concern.*` IDs.

```run:shell
# Verify active maintainer specs do not keep legacy U-number alignment lines.
! grep -R "Aligned user claims: U" docs/specs/maintainer/*.spec.md
```
