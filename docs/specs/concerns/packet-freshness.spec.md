# Packet Freshness Concern

Concern ID: `concern.packet-freshness`.

Readable views should project current packets and source artifacts instead of becoming independent truth sources.
If a packet is stale, blocked, or missing, the rendered view should show that state.

## Projections

- User-facing attachments: [Reviewable Artifacts](../user/reviewable-artifacts.spec.md), [Evidence Gaps](../user/evidence-gaps.spec.md), [Behavior Evaluation](../user/evaluation.spec.md)
- Maintainer routes: [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md), [Reporting And Review Variants](../maintainer/reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](../maintainer/active-run-workspace.spec.md)

## Current Proof

Current proof is scattered across evidence-state tests, status-report renderer tests, and readable projection evidence bundles.
The concern lens exists to prevent packet freshness from disappearing into one workflow page.

```run:shell
# Verify the maintainer routes that currently own packet-freshness proof exist.
test -f docs/specs/maintainer/evidence-state-artifacts.spec.md
test -f docs/specs/maintainer/reporting-review-variants.spec.md
```
