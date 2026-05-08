# Vocabulary Consistency Concern

Concern ID: `concern.vocabulary-consistency`.

The same product concept should keep the same name in user-facing prose, maintainer specs, CLI JSON, Cautilus Agent guidance, and tests.
If names diverge, readers should assume the concepts may have diverged too.

## Projections

- User-facing attachments: [Readiness](../user/doctor-readiness.spec.md), [Claim Discovery](../user/claim-discovery.spec.md), [Host Ownership](../user/ownership.spec.md)
- Maintainer routes: [Binary And Skill Boundary](../maintainer/binary-skill-boundary.spec.md), [Adapter And Host Ownership](../maintainer/adapter-host-ownership.spec.md), [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md)
- Durable operating rule: [Working Patterns](../../internal/working-patterns.md)

## Current Proof

This concern is mostly policy-backed today.
The recent HITL terminology work improved `cautilus-agent`, command-surface vocabulary, and candidate-not-proof wording, but there is no dedicated executable vocabulary consistency proof yet.
The missing dedicated vocabulary bundle is tracked as `gap.vocabulary-evidence-bundle` in [Proof Gaps](../proof/gaps.spec.md).
