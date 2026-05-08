# Evidence Gaps Concern

Concern ID: `concern.evidence-gaps`.

Discovered or reviewed promises should not be treated as satisfied until valid evidence is attached, and missing or weak evidence should remain visible until the claim is proven, narrowed, deferred, or removed.

## Projections

- User-facing projection: [Evidence Gaps](../user/evidence-gaps.spec.md)
- Primary workflow attachments: [Readiness](../model/readiness.spec.md), [Claim Discovery](../model/claim-discovery.spec.md), [Bounded Optimization](../model/optimization.spec.md)
- Maintainer routes: [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md), [Optimization Loop](../maintainer/optimization-loop.spec.md), [Readiness And Runtime Status](../maintainer/readiness-runtime-status.spec.md)

## Current Proof

The user-facing page projects candidate-not-proof, reviewed-claim evidence, and next-work signals.
Maintainer pages already carry local `Evidence Gaps` sections, but there is no maintainer concern index that shows the invariant across routes.

```run:shell
# Verify the current user-facing concern projection exists.
test -f docs/specs/user/evidence-gaps.spec.md
```

The missing maintainer concern page is tracked as `gap.maintainer-concern-pages` in [Proof Gaps](../proof/gaps.spec.md).
