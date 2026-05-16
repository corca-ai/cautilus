# Agent-Human Resumability

Cautilus should leave enough source refs, packets, next actions, source-bound review feedback, and readable reports that a human or agent can resume the workflow without relying on chat memory.

Key: `rule.agent-human-resumability`.

## Where To Check This

- User-facing attachments: [Readiness](../user/doctor-readiness.spec.md), [Claim Discovery](../user/claim-discovery.spec.md), [Host Ownership](../user/ownership.spec.md)
- Maintainer evidence routes: [Evidence State And Review Artifacts](../contracts/evidence-state-artifacts.spec.md), [Binary And Skill Boundary](../contracts/binary-skill-boundary.spec.md), [Active Run And Workspace Lifecycle](../contracts/active-run-workspace.spec.md), [Reporting And Review Variants](../contracts/reporting-review-variants.spec.md)

## Link Checks

Current evidence details live in [Evidence State](../evidence/index.spec.md).

```run:shell
# Verify the maintainer routes that currently own resumability proof exist.
node -e 'const fs = require("node:fs"); for (const path of ["docs/specs/contracts/binary-skill-boundary.spec.md", "docs/specs/contracts/evidence-state-artifacts.spec.md", "docs/specs/contracts/active-run-workspace.spec.md", "docs/specs/contracts/reporting-review-variants.spec.md"]) { if (!fs.existsSync(path)) throw new Error("missing " + path); }'
```
