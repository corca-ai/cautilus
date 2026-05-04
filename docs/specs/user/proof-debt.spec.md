# Proof Debt

Cautilus separates finding a promise from proving that the promise is true.

## User Promise

Cautilus makes proof debt visible so maintainers can decide whether to add deterministic proof, plan evals, align docs, split broad claims, or defer work.

## Subclaims

- A claim packet is a work plan, not a certificate.
- Human review may approve wording or proof route, but review comments alone do not satisfy a claim.
- Evidence refs must be attached and valid before a claim is treated as satisfied.
- Unknown or missing evidence should stay visible in the public claim workflow.

## Evidence

- [internal/runtime/claim_discovery_test.go](../../../internal/runtime/claim_discovery_test.go) `TestApplyClaimReviewResultRejectsSatisfiedWithoutVerifiedEvidence` enforces that review agreement alone cannot move a claim to `satisfied` without a direct or verified evidence ref.
- [internal/runtime/claim_discovery_test.go](../../../internal/runtime/claim_discovery_test.go) `TestBuildClaimValidationReportValidatesEvidenceRefs` and `TestBuildClaimStatusSummaryIncludesSatisfiedEvidence` keep unknown / missing evidence visible in the validation report and status summary rather than silently dropped.
- [scripts/agent-runtime/render-claim-status-report.test.mjs](../../../scripts/agent-runtime/render-claim-status-report.test.mjs) covers the renderer side so unknown evidence buckets stay visible in the rendered claim status view.
