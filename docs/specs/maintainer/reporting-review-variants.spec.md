# Reporting And Review Variants

Reports and review variants keep evaluator-backed judgment inspectable.

Map keys: `concern.reviewable-artifacts`, `concern.packet-freshness`, `concern.agent-human-resumability`.
Evidence path: deterministic plus evaluator review.
Evidence status: open gap.
Next action: connect reporting packets, review packets, compare questions, schemas, variant verdicts, and rendered summaries to stale-state checks.
Terms covered here: report packet, HTML report, Markdown report, review packet, review-feedback packet, review variants, compare questions, verdict schema, review-useful disposition, executor variant, numeric telemetry, human-visible failure.

## Maintainer Promise

Cautilus writes machine-readable review packets first and renders readable reports over the same data; variant review points both human and machine reviewers at the same durable artifacts.

## Subclaims

- Review packets, report packets, and compare-question packets are the source of truth; rendered reports are generated from them.
- Review-feedback packets normalize source-reviewed proposal outcomes into method-family and disposition fields without collapsing review usefulness into evaluator pass/fail status.
- Variant verdicts route both human and machine reviewers to the same durable artifact rather than to view-specific state.
- Numeric telemetry and human-visible failure shapes are inspectable in the packet, not only in the rendered view.
- Stale review or report state surfaces as stale rather than being masked by cached rendering.

## Evidence

- [internal/runtime/report_html_test.go](../../../internal/runtime/report_html_test.go) and [internal/runtime/review_html_test.go](../../../internal/runtime/review_html_test.go) exercise rendered-from-packet determinism for the report and review HTML views.
- [scripts/agent-runtime/run-review-variant.test.mjs](../../../scripts/agent-runtime/run-review-variant.test.mjs) and [scripts/agent-runtime/run-executor-variants.test.mjs](../../../scripts/agent-runtime/run-executor-variants.test.mjs) cover variant routing so human and machine reviewer flows reach the same durable artifact.
- [internal/app/cli_smoke_test.go](../../../internal/app/cli_smoke_test.go) `TestCLIReviewFeedbackBuildEmitsSourceBoundLearningPacket` and related invalid-disposition, missing-proposal, and `missing_critical` cases cover the `cautilus.review_feedback.v1` packet contract.
- [docs/cli-reference.md](../../cli-reference.md) documents `cautilus review feedback build` as the command that preserves source review refs, normalized method and proposal fields, review-useful dispositions, and source-review normalization basis.

## Evidence Gaps

- Stale-state rendering test proving the renderer surfaces stale review or report state rather than masking it. Owner: maintainer. Next action: add a fixture with explicit stale state and assert both packet and rendered view expose the staleness; existing report/review HTML tests cover content/escaping/links but not stale-state pass-through.
- Later report or CLI aggregation can count `cautilus.review_feedback.v1` dispositions by method family across review-learning packets. Owner: maintainer. Next action: decide the aggregation surface and add deterministic coverage before treating cross-run review-learning summaries as current.
