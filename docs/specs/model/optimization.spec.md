# Bounded Optimization Promise

Promise ID: `promise.optimization`.

Bounded Optimization improves a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts.

## Projections

- User projection: [Bounded Optimization](../user/optimization.spec.md)
- Maintainer routes: [Optimization Loop](../maintainer/optimization-loop.spec.md), [Scenario History And Proposal Normalization](../maintainer/scenario-history-normalization.spec.md), [Active Run And Workspace Lifecycle](../maintainer/active-run-workspace.spec.md)
- Related concerns: [Reviewable Artifacts](../concerns/reviewable-artifacts.spec.md), [Evidence Gaps](../concerns/evidence-gaps.spec.md), [Cost And Proof Freshness](../concerns/cost-and-proof-freshness.spec.md), [Host-Owned Execution](../concerns/host-owned-execution.spec.md)

## Evidence Posture

Current status: partial.
The packet route is checked, but maintainer evidence still calls out held-out proof gaps for real optimize cycles.

```run:shell
# Verify optimization projections are linked to existing docs.
test -f docs/specs/user/optimization.spec.md
test -f docs/specs/maintainer/optimization-loop.spec.md
```
