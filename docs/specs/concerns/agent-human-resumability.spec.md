# Agent-Human Resumability

Cautilus should leave enough source refs, packets, next actions, and readable reports that a human or agent can resume the workflow without relying on chat memory.

Key: `concern.agent-human-resumability`.

## Where To Check This

- User-facing attachments: [Readiness](../user/doctor-readiness.spec.md), [Claim Discovery](../user/claim-discovery.spec.md), [Host Ownership](../user/ownership.spec.md)
- Maintainer evidence routes: [Binary And Skill Boundary](../maintainer/binary-skill-boundary.spec.md), [Active Run And Workspace Lifecycle](../maintainer/active-run-workspace.spec.md), [Reporting And Review Variants](../maintainer/reporting-review-variants.spec.md)

## Link Checks

Current evidence details live in [Evidence State](../proof/index.spec.md).

```run:shell
# Verify the maintainer routes that currently own resumability proof exist.
test -f docs/specs/maintainer/binary-skill-boundary.spec.md
test -f docs/specs/maintainer/active-run-workspace.spec.md
```
