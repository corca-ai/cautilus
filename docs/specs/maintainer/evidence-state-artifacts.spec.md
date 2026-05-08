# Evidence State And Review Artifacts

Review state and evidence state are separate transitions.

Aligned model anchors: `concern.reviewable-artifacts`, `concern.evidence-gaps`, `concern.packet-freshness`, `concern.vocabulary-consistency`.
Proof route: deterministic.
Current evidence status: partial.
Next action: keep review-result application, evidence validation, canonical maps, Markdown reports, and HTML/status views tied to packet freshness.
Absorbs: evidence refs, possible evidence, satisfied evidence, review labels, status summary, canonical claim map, Markdown report, HTML view, stale packet, drift handling.

## Maintainer Promise

Reviewer agreement can update wording, audience, proof route, readiness, and next action, but a claim becomes satisfied only when a direct or verified evidence ref supports it; readable reports stay projections over packets and never become independent truth sources.

## Subclaims

- Review-result application updates labels, proof route, readiness, and next action without flipping evidence status by itself.
- A claim becomes satisfied only when a direct or verified evidence ref supports it; possible evidence and review agreement alone do not satisfy.
- `claim validate` exits non-zero when packet shape or evidence refs are invalid.
- Stale packet state stays visible in `claim show`, `agent status`, and rendered reports rather than masked behind cached labels.

## Evidence

- [internal/runtime/claim_discovery_test.go](../../../internal/runtime/claim_discovery_test.go) `TestApplyClaimReviewResultRejectsSatisfiedWithoutVerifiedEvidence` enforces the satisfied-evidence boundary in `claim review apply-result`.
- [internal/runtime/claim_discovery_test.go](../../../internal/runtime/claim_discovery_test.go) `TestApplyClaimReviewResultAllowsStaleToRevokeSatisfiedEvidence` and `TestBuildClaimValidationReportValidatesEvidenceRefs` cover stale-state propagation upstream.
- [scripts/agent-runtime/render-claim-status-report.test.mjs](../../../scripts/agent-runtime/render-claim-status-report.test.mjs) covers the renderer side so stale Markdown / HTML / status views surface stale state instead of masking it.
- The `dev/skill` review-prepare-flow and reviewer-launch-flow audit fixtures under [fixtures/eval/dev/skill/](../../../fixtures/eval/dev/skill/) exercise the application path end-to-end.
