# Cautilus Contracts

Read this when you need to build, review, or change the implementation behind the user workflow.
These pages connect Cautilus behavior claims and cross-cutting rules to command contracts, packet shapes, adapter boundaries, fixtures, evidence routes, and known evidence gaps.

User workflow: [Cautilus User Workflow View](../user/index.spec.md).
Spec entry: [Cautilus](../index.spec.md).
Cross-cutting rules: [Cross-Cutting Rules](../rules/index.spec.md).
Evidence state: [Evidence State](../evidence/index.spec.md).

Each contract page names the aligned claims or rules, the implementation promise, concrete subclaims, current evidence, and remaining evidence gaps.

## Contract Evidence Routes

- [Contract Cross-Cutting Rule Policy](rules-policy.spec.md)
- [Claim Discovery Workflow](claim-discovery-workflow.spec.md)
- [Binary And Skill Boundary](binary-skill-boundary.spec.md)
- [Adapter And Host Ownership](adapter-host-ownership.spec.md)
- [Evaluation Surfaces And Runners](evaluation-surfaces-runners.spec.md)
- [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md)
- [Improvement Loop](improvement-loop.spec.md)
- [Readiness And Runtime Status](readiness-runtime-status.spec.md)
- [Active Run And Workspace Lifecycle](active-run-workspace.spec.md)
- [Live Invocation Runtime](live-invocation-runtime.spec.md)
- [Reporting And Review Variants](reporting-review-variants.spec.md)
- [Scenario History And Proposal Normalization](scenario-history-normalization.spec.md)

## Rule Mapping

| cross-cutting rule | key | contract evidence routes |
| --- | --- | --- |
| [Reviewable Artifacts](../rules/reviewable-artifacts.spec.md) | `rule.reviewable-artifacts` | [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md), [Reporting And Review Variants](reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](active-run-workspace.spec.md) |
| [Evidence Gaps](../rules/evidence-gaps.spec.md) | `rule.evidence-gaps` | [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md), [Improvement Loop](improvement-loop.spec.md), [Readiness And Runtime Status](readiness-runtime-status.spec.md) |
| [Host-Owned Execution](../rules/host-owned-execution.spec.md) | `rule.host-owned-execution` | [Adapter And Host Ownership](adapter-host-ownership.spec.md), [Live Invocation Runtime](live-invocation-runtime.spec.md), [Binary And Skill Boundary](binary-skill-boundary.spec.md) |
| [Vocabulary Consistency](../rules/vocabulary-consistency.spec.md) | `rule.vocabulary-consistency` | [Binary And Skill Boundary](binary-skill-boundary.spec.md), [Adapter And Host Ownership](adapter-host-ownership.spec.md), [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md) |
| [Packet Freshness](../rules/packet-freshness.spec.md) | `rule.packet-freshness` | [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md), [Reporting And Review Variants](reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](active-run-workspace.spec.md) |
| [Cost And Proof Freshness](../rules/cost-and-proof-freshness.spec.md) | `rule.cost-and-proof-freshness` | [Evaluation Surfaces And Runners](evaluation-surfaces-runners.spec.md), [Improvement Loop](improvement-loop.spec.md), [Scenario History And Proposal Normalization](scenario-history-normalization.spec.md) |
| [Agent-Human Resumability](../rules/agent-human-resumability.spec.md) | `rule.agent-human-resumability` | [Evidence State And Review Artifacts](evidence-state-artifacts.spec.md), [Binary And Skill Boundary](binary-skill-boundary.spec.md), [Active Run And Workspace Lifecycle](active-run-workspace.spec.md), [Reporting And Review Variants](reporting-review-variants.spec.md) |
