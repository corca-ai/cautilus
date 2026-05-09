# Evidence Gaps

Discovered or reviewed promises should not be treated as satisfied until valid evidence is attached, and missing or weak evidence should remain visible until the claim is proven, narrowed, deferred, or removed.

Key: `concern.evidence-gaps`.

## Where To Check This

- User-facing page: [Evidence Gaps](../user/evidence-gaps.spec.md)
- Primary workflow attachments: [Readiness](../model/readiness.spec.md), [Claim Discovery](../model/claim-discovery.spec.md), [Bounded Optimization](../model/optimization.spec.md)
- Maintainer evidence routes: [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md), [Optimization Loop](../maintainer/optimization-loop.spec.md), [Readiness And Runtime Status](../maintainer/readiness-runtime-status.spec.md)

## Link Checks

```run:shell
# Verify the user-facing evidence-gaps page exists.
test -f docs/specs/user/evidence-gaps.spec.md
```

Current open proof gaps live in [Proof Gaps](../proof/gaps.spec.md).
