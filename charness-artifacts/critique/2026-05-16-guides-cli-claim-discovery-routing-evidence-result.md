# Guides CLI Claim Discovery Routing Evidence Critique

## Scope

Fresh-eye review for the claim evidence refresh that moves `claim-docs-guides-cli-md-122` from unknown heuristic deterministic backlog to satisfied deterministic proof.

Success means the evidence stays current-claim-id-bound to the `docs/guides/cli.md` guidance that `cautilus discover claims` is the proof-routing inventory step before eval fixture authoring.

Out of scope: proving runtime enforcement that every operator runs discovery first, proving perfect future natural-language classification, and broader canonical-map confidence cleanup.

## Fresh-Eye Satisfaction

parent-delegated.

Three bounded reviewers inspected the pending evidence bundle, review-result, generated projections, focused test commands, and scanner prepare packet context.

## Act Before Ship

- Remove `charness-artifacts/critique/2026-05-16-054835-packet.{json,md}` before commit because it was a findings-free timestamped prepare packet consumed only as scanner context.

## Bundle Anyway

- The evidence bundle is coherent: `repoCommit` resolves to `eb8d1051ed65e6d7e418343882bce039857aa91d`, checked-in content hashes match current files, and the review-result evidence ref hash matches `sha256:8b6d2812ecfddde3b874c68af180bd1356fb708594187a40430c4ce9d57187aa`.
- `createdForClaimIds`, `supportsClaimIds`, and the projection update target only `claim-docs-guides-cli-md-122`.
- Focused verification passed:
  - `go test ./internal/runtime -run 'TestDiscoverClaimProofPlanClassifiesFixtureClaims|TestDiscoverClaimProofPlanAvoidsExampleAndBroadRouting|TestBuildClaimStatusSummarySummarizesExistingPacket|TestBuildClaimReviewInputCanFocusActionBucket' -count=1`
  - `go test ./internal/app -run TestRunClaimDiscoverWritesProofPlanFromTinyRepo -count=1`
- Projection counts are internally consistent: satisfied `52 -> 53`, unknown `286 -> 285`, agent-reviewed `123 -> 124`, heuristic `235 -> 234`, already-satisfied `52 -> 53`, and `agent-add-deterministic-proof` `87 -> 86`.
- The bundle's `notClaimed` list prevents overclaiming fixture writing, runtime sequencing enforcement, final verdict semantics, and perfect classifier behavior.

## Over-Worry

- The docs phrase "before writing eval fixtures" does not require binary-enforced sequencing proof; the current claim is operator guidance, and deterministic proof-routing command evidence is enough.
- The classifier does not need to prove perfect coverage for all future prose to satisfy this bounded claim.
- The scanner prepare packet has no findings and does not undermine the evidence bundle as long as it is not treated as claim proof or committed as durable result state.

## Valid But Defer

- `canonical-claim-map.json` now maps this claim to U2 with `mappingConfidence: medium` and `requiresSemanticReview: true`; improving that confidence is useful but does not block this evidence slice.
- Broader critique workflow cleanup for timestamp-only prepare packets belongs outside this claim evidence commit.
