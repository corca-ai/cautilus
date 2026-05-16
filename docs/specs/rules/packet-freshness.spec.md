# Packet Freshness

Readable views should show current packets and source artifacts instead of becoming independent truth sources.
If a packet is stale, blocked, or missing, the rendered view should show that state.

Key: `rule.packet-freshness`.

## Where To Check This

- User-facing attachments: [Reviewable Artifacts](../user/reviewable-artifacts.spec.md), [Evidence Gaps](../user/evidence-gaps.spec.md), [Behavior Evaluation](../user/evaluation.spec.md)
- Maintainer evidence routes: [Evidence State And Review Artifacts](../contracts/evidence-state-artifacts.spec.md), [Reporting And Review Variants](../contracts/reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](../contracts/active-run-workspace.spec.md)

## Link Checks

Current evidence details live in [Evidence State](../evidence/index.spec.md).

```run:shell
# Verify the maintainer routes that currently own packet-freshness proof exist.
node -e 'const fs = require("node:fs"); for (const path of ["docs/specs/contracts/evidence-state-artifacts.spec.md", "docs/specs/contracts/reporting-review-variants.spec.md"]) { if (!fs.existsSync(path)) throw new Error("missing " + path); }'
```
