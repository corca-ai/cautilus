# Claim Discovery Promise

Promise ID: `promise.claim-discovery`.

Claim Discovery turns selected source docs into broad source-referenced candidates, then leaves curation, false-positive reduction, likely false-negative questions, and proof planning visible for the Cautilus Agent or a human.

## Links

- User workflow: [Claim Discovery](../user/claim-discovery.spec.md)
- Maintainer evidence routes: [Claim Discovery Workflow](../contracts/claim-discovery-workflow.spec.md), [Evidence State And Review Artifacts](../contracts/evidence-state-artifacts.spec.md), [Binary And Skill Boundary](../contracts/binary-skill-boundary.spec.md)
- Related cross-cutting rules: [Reviewable Artifacts](../rules/reviewable-artifacts.spec.md), [Evidence Gaps](../rules/evidence-gaps.spec.md), [Agent-Human Resumability](../rules/agent-human-resumability.spec.md), [Host-Owned Execution](../rules/host-owned-execution.spec.md)

## Evidence State

Evidence status: open gap.
The deterministic `claim discover` surface has executable proof, while full Cautilus Agent curation proof remains prepared or fixture-backed rather than a completed live dogfood verdict.

```run:shell
# Verify claim-discovery links point to existing docs.
test -f docs/specs/user/claim-discovery.spec.md
test -f docs/specs/contracts/claim-discovery-workflow.spec.md
```
