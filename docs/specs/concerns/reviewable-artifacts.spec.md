# Reviewable Artifacts Concern

Concern ID: `concern.reviewable-artifacts`.

Every workflow should leave machine-readable packets and readable projections that another person or agent can reopen without trusting chat memory.

## Projections

- User-facing projection: [Reviewable Artifacts](../user/reviewable-artifacts.spec.md)
- Primary workflow attachments: [Claim Discovery](../model/claim-discovery.spec.md), [Behavior Evaluation](../model/evaluation.spec.md), [Bounded Optimization](../model/optimization.spec.md)
- Maintainer routes: [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md), [Reporting And Review Variants](../maintainer/reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](../maintainer/active-run-workspace.spec.md)

## Current Proof

The user-facing page projects durable-packet and readable-projection evidence bundles.
The maintainer routes prove packet/rendering boundaries in separate pages rather than in a dedicated concern page.

```run:shell
# Verify the current user-facing concern projection exists.
test -f docs/specs/user/reviewable-artifacts.spec.md
```

The missing maintainer concern page is tracked as `gap.maintainer-concern-pages` in [Proof Gaps](../proof/gaps.spec.md).
