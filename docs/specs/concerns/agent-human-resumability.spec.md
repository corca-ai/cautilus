# Agent-Human Resumability Concern

Concern ID: `concern.agent-human-resumability`.

Cautilus should leave enough source refs, packets, next actions, and readable projections that a human or agent can resume the workflow without relying on chat memory.

## Projections

- User-facing attachments: [Readiness](../user/doctor-readiness.spec.md), [Claim Discovery](../user/claim-discovery.spec.md), [Host Ownership](../user/ownership.spec.md)
- Maintainer routes: [Binary And Skill Boundary](../maintainer/binary-skill-boundary.spec.md), [Active Run And Workspace Lifecycle](../maintainer/active-run-workspace.spec.md), [Reporting And Review Variants](../maintainer/reporting-review-variants.spec.md)

## Current Proof

Current proof exists through readiness next actions, claim discovery source refs, active-run state, review packets, and report rendering.
This concern stays separate so agent-first behavior does not collapse into hidden chat state.

```run:shell
# Verify the maintainer routes that currently own resumability proof exist.
test -f docs/specs/maintainer/binary-skill-boundary.spec.md
test -f docs/specs/maintainer/active-run-workspace.spec.md
```
