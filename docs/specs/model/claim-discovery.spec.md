# Claim Discovery Promise

Promise ID: `promise.claim-discovery`.

Claim Discovery turns selected source docs into broad source-referenced candidates, then leaves curation, false-positive reduction, likely false-negative questions, and proof planning visible for the Cautilus Agent or a human.

## Projections

- User projection: [Claim Discovery](../user/claim-discovery.spec.md)
- Maintainer routes: [Claim Discovery Workflow](../maintainer/claim-discovery-workflow.spec.md), [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md), [Binary And Skill Boundary](../maintainer/binary-skill-boundary.spec.md)
- Related concerns: [Reviewable Artifacts](../concerns/reviewable-artifacts.spec.md), [Evidence Gaps](../concerns/evidence-gaps.spec.md), [Agent-Human Resumability](../concerns/agent-human-resumability.spec.md), [Host-Owned Execution](../concerns/host-owned-execution.spec.md)

## Evidence Posture

Current status: partial.
The deterministic `claim discover` surface has executable proof, while full Cautilus Agent curation proof remains prepared or fixture-backed rather than a completed live dogfood verdict.

```run:shell
# Verify claim-discovery projections are linked to existing docs.
test -f docs/specs/user/claim-discovery.spec.md
test -f docs/specs/maintainer/claim-discovery-workflow.spec.md
```
