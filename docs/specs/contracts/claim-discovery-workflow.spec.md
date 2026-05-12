# Claim Discovery Workflow

Claim discovery is a high-recall proof-planning pass, not a verdict.

Map keys: `promise.claim-discovery`, `rule.reviewable-artifacts`, `rule.evidence-gaps`, `rule.agent-human-resumability`.
Evidence path: deterministic plus skill review.
Evidence status: open gap.
Next action: keep source-scope tests, canonical-map generation, and review-result replay connected to the active spec tree.
Terms covered here: source inventory, entry Markdown, linked Markdown, `.gitignore`, raw candidates, duplicate handling, canonical compression, review-result replay, false-positive review, false-negative boundary.

## Maintainer Promise

`claim discover` emits source-ref-backed candidates from configured entry documents and the linked Markdown they reach, preferring recall and preserving the scan boundary so curation can distinguish binary false negatives from out-of-scope narrative gaps.

## Subclaims

- Discovery emits source-ref-backed candidates from configured entry documents and linked Markdown within the declared depth bounds.
- Discovery favors recall; a missed declaration inside the scan boundary is a binary bug, while missing behavior outside the boundary is catalog, narrative, or alignment work.
- Duplicate handling and false-positive curation remain packet-aware review responsibilities rather than deterministic verdicts.
- The active scan boundary excludes archived spec trees and superseded claim pages so they do not dilute current proof planning.
- Canonical compression and review-result replay consume the discovery packet without mutating discovery's recall behavior.

## Evidence

- [internal/runtime/claim_discovery_test.go](../../../internal/runtime/claim_discovery_test.go) `TestDiscoverClaimProofPlanHonorsAdapterExcludesForLinkedMarkdown` exercises the active scan boundary against a fixture repo and asserts adapter excludes drop archived and superseded paths from the inventory.
- [scripts/agent-runtime/build-canonical-claim-map.test.mjs](../../../scripts/agent-runtime/build-canonical-claim-map.test.mjs) covers canonical compression against checked-in user/maintainer catalogs.
- [internal/runtime/claim_discovery_test.go](../../../internal/runtime/claim_discovery_test.go) `TestApplyClaimReviewResult*` family covers review-result replay including missing IDs, fingerprint guards, and reused-id rejection.
