# Packet Freshness

Readable views should show current packets and source artifacts instead of becoming independent truth sources.
If a packet is stale, blocked, or missing, the rendered view should show that state.

Key: `concern.packet-freshness`.

## Where To Check This

- User-facing attachments: [Reviewable Artifacts](../user/reviewable-artifacts.spec.md), [Evidence Gaps](../user/evidence-gaps.spec.md), [Behavior Evaluation](../user/evaluation.spec.md)
- Maintainer evidence routes: [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md), [Reporting And Review Variants](../maintainer/reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](../maintainer/active-run-workspace.spec.md)

## Link Checks

Current evidence details live in [Evidence State](../proof/index.spec.md).

```run:shell
# Verify the maintainer routes that currently own packet-freshness proof exist.
test -f docs/specs/maintainer/evidence-state-artifacts.spec.md
test -f docs/specs/maintainer/reporting-review-variants.spec.md
```
