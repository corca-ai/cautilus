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

Which promise each contract implements, and which rules each promise carries, is the [Promise Ledger](../generated/promise-ledger.spec.md) map generated from the `implemented-by::` / `governed-by::` trace edges.
