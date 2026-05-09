# Reviewable Artifacts

Every workflow should leave machine-readable packets and readable reports that another person or agent can reopen without trusting chat memory.

Key: `concern.reviewable-artifacts`.

## Where To Check This

- User-facing page: [Reviewable Artifacts](../user/reviewable-artifacts.spec.md)
- Primary workflow attachments: [Claim Discovery](../model/claim-discovery.spec.md), [Behavior Evaluation](../model/evaluation.spec.md), [Bounded Optimization](../model/optimization.spec.md)
- Maintainer evidence routes: [Evidence State And Review Artifacts](../maintainer/evidence-state-artifacts.spec.md), [Reporting And Review Variants](../maintainer/reporting-review-variants.spec.md), [Active Run And Workspace Lifecycle](../maintainer/active-run-workspace.spec.md)

## Link Checks

```run:shell
# Verify the current user-facing reviewable-artifacts page exists.
test -f docs/specs/user/reviewable-artifacts.spec.md
```

Current evidence details live in [Evidence State](../proof/index.spec.md).
