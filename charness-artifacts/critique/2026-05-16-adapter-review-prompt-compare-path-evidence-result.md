# Adapter Review Prompt Compare Path Evidence Critique
Date: 2026-05-16

## Execution

- Fresh-Eye Satisfaction: parent-delegated
- Packet Consumed: transient `charness-artifacts/critique/2026-05-16-085216-packet.md`; no deterministic packet findings, generated packet files removed before commit to avoid timestamp-only churn.
- Target: code/evidence critique

## Change

Protect and apply deterministic evidence for `claim-docs-contracts-adapter-contract-md-432`, the adapter-contract claim that review prompts point at the same compare output path so human and machine review can refer to the same compare output.

## Angles

- Provenance/hash/test-protection review
- Claim-boundary and overclaim review
- Counterweight review

## Findings

### Act Before Ship

None.

### Bundle Anyway

The tests protect the core path.
`internal/runtime/review_test.go` keeps `artifacts/compare-report.json`, `comparison_questions`, and `human_review_prompts` on one review packet boundary, while `scripts/agent-runtime/review-prompt-flow.test.mjs` preserves the compare artifact path and human review lens into prompt input and rendered prompt.
The evidence bundle hash `sha256:8da3ce0b1c9e4fda46bddea23392caa181f805ab6e56ca9ed82b919411c24850` matches the review-result ref, checked-in evidence hashes match `repoCommit` `6ad1068`, and generated projections mark the claim satisfied/agent-reviewed.

### Over-Worry

Do not require every consumer adapter to emit `compare-report.json`, every executor variant to read the artifact directly, or the compare verdict to be semantically correct.
This slice proves path propagation through the shared review packet/prompt boundary.

### Valid but Defer

A stronger future proof could chain `evaluate review prepare-input -> build-prompt-input -> render-prompt` in one CLI integration test and assert that the rendered prompt ties the compare artifact summary and file path to the same generated `compare-report.json`.
Current Node/runtime tests cover that seam in smaller pieces, which is sufficient for this claim.

## Next Move

Run full repo gates, update handoff counts, then commit the evidence bundle, review result, refreshed claim projections, critique result, and the already committed test hardening as a follow-on proof slice.
