# Bounded Improvement Promise

Promise ID: `promise.improvement`.

Bounded Improvement improves a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts.

## Links

- User workflow: [Bounded Improvement](../user/improvement.spec.md)
- Maintainer evidence routes: [Improvement Loop](../contracts/improvement-loop.spec.md), [Scenario History And Proposal Normalization](../contracts/scenario-history-normalization.spec.md), [Active Run And Workspace Lifecycle](../contracts/active-run-workspace.spec.md)
- Related cross-cutting rules: [Reviewable Artifacts](../rules/reviewable-artifacts.spec.md), [Evidence Gaps](../rules/evidence-gaps.spec.md), [Cost And Proof Freshness](../rules/cost-and-proof-freshness.spec.md), [Host-Owned Execution](../rules/host-owned-execution.spec.md)

## Evidence State

Evidence status: proven on the dev/skill surface.
The packet route is checked, and a live bounded improve cycle (`npm run proof:improve:live`) proves the loop recovers a held-out scenario it was never tuned on, with the operator-witnessed capture replayed deterministically.

```run:shell
# Verify the live improve proof capture exists (evidence-presence check; doc reachability is covered by specdown trace).
test -f fixtures/eval/dev/skill/improve/live/improve-live-proof-summary.json
```
