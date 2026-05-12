# Reviewable Artifacts

Every workflow should leave machine-readable packets and readable reports that another person or agent can reopen without trusting chat memory.

Key: `rule.reviewable-artifacts`.

## Where To Check This

- User-facing page: [Reviewable Artifacts](../user/reviewable-artifacts.spec.md)
- Primary workflow attachments: [Claim Discovery](../ledger/claim-discovery.spec.md), [Behavior Evaluation](../ledger/evaluation.spec.md), [Bounded Improvement](../ledger/improvement.spec.md)
- Maintainer evidence routes: [Evidence State And Review Artifacts](../contracts/evidence-state-artifacts.spec.md), [Reporting And Review Variants](../contracts/reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](../contracts/active-run-workspace.spec.md)

## Link Checks

```run:shell
# Verify the current user-facing reviewable-artifacts page exists.
test -f docs/specs/user/reviewable-artifacts.spec.md
```

Current evidence details live in [Evidence State](../evidence/index.spec.md).
