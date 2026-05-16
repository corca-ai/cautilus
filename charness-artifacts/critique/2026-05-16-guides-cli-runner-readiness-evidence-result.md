# Guides CLI Runner Readiness Evidence Critique

## Scope

Fresh-eye review for the claim evidence refresh that moves `claim-docs-guides-cli-md-114` from stale eval-planning work to satisfied deterministic proof.

Success means the evidence stays claim-id-bound to the `docs/guides/cli.md` doctor next-action claim, uses a real repo commit, and keeps generated claim projections consistent.

Out of scope: broad stale evidence cleanup, human buckets, release packaging, and claim discovery heuristic redesign.

## Fresh-Eye Satisfaction

parent-delegated.

Three bounded reviewers inspected the diff, new evidence bundle, review-result, generated projections, and focused doctor smoke test.

## Act Before Ship

- The first evidence bundle recorded `repoCommit` as `a37f72328d69952b5dd3815a30e9b144e5e55c75`, which was not the current commit and did not resolve with `git cat-file`.
  Fixed to `a37f723de8a6931b2dc57a302ca2a0f64987230e` and propagated the new evidence content hash through the review-result and generated claim projections.
- The new evidence and review-result files must be included with the generated projections because projections now reference the new evidence path.

## Bundle Anyway

- The claim boundary is narrow: `createdForClaimIds` lists only `claim-docs-guides-cli-md-114`, and `notClaimed` excludes runner assessment creation, live model execution, and universal adapter behavior.
- Moving the claim from `cautilus-eval` to deterministic proof is appropriate because the claim is about CLI doctor next-action packet behavior, not semantic model behavior.
- The regenerated counts are internally consistent: satisfied increases from 49 to 50, stale decreases from 24 to 23, `cautilus-eval` decreases from 123 to 122, and deterministic increases from 139 to 140.

## Over-Worry

- Existing `claims:audit-evidence` warnings are not blockers for this slice because the audit reports `issueCount=0` and `status=ok`.
- `fresh-with-head-drift` is not a blocker because no recorded claim source changed and the status packet marks `isStale=false`.
- Stale bucket sample rollover is expected after removing one stale claim from the queue.

## Valid But Defer

- Whether `create_runner_assessment` itself creates a runner assessment or a live first bounded eval loop succeeds remains separate proof.
- The canonical claim map's semantic sampling changes expose possible heuristic boundary questions, but that belongs to claim discovery heuristic work rather than this evidence refresh.
