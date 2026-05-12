# Bounded Improvement Promise

Promise ID: `promise.improvement`.

Bounded Improvement improves a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts.

## Links

- User workflow: [Bounded Improvement](../user/improvement.spec.md)
- Maintainer evidence routes: [Improvement Loop](../contracts/improvement-loop.spec.md), [Scenario History And Proposal Normalization](../contracts/scenario-history-normalization.spec.md), [Active Run And Workspace Lifecycle](../contracts/active-run-workspace.spec.md)
- Related cross-cutting rules: [Reviewable Artifacts](../rules/reviewable-artifacts.spec.md), [Evidence Gaps](../rules/evidence-gaps.spec.md), [Cost And Proof Freshness](../rules/cost-and-proof-freshness.spec.md), [Host-Owned Execution](../rules/host-owned-execution.spec.md)

## Evidence State

Evidence status: open gap.
The packet route is checked, but maintainer evidence still calls out held-out proof gaps for real improve cycles.

```run:shell
# Verify improvement links point to existing docs.
test -f docs/specs/user/improvement.spec.md
test -f docs/specs/contracts/improvement-loop.spec.md
```
