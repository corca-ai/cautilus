# Reporting And Review Variants

Reports and review variants keep evaluator-backed judgment inspectable.

Aligned user claims: U6, U7.
Proof route: deterministic plus evaluator review.
Current evidence status: proof-planning.
Next action: connect reporting packets, review packets, compare questions, schemas, variant verdicts, and rendered summaries to stale-state checks.
Absorbs: report packet, HTML report, Markdown report, review packet, review variants, compare questions, verdict schema, executor variant, numeric telemetry, human-visible failure.

## Maintainer Promise

Cautilus writes machine-readable review packets first and renders readable projections over the same data; variant review points both human and machine reviewers at the same durable artifacts.

## Subclaims

- Review packets, report packets, and compare-question packets are the source of truth; rendered reports are projections over them.
- Variant verdicts route both human and machine reviewers to the same durable artifact rather than to view-specific state.
- Numeric telemetry and human-visible failure shapes are inspectable in the packet, not only in the rendered view.
- Stale review or report state surfaces as stale rather than being masked by cached rendering.

## Evidence Gaps

- Test proving the rendered Markdown / HTML report is a deterministic projection over the source review or report packet. Owner: maintainer. Next action: add a focused renderer-from-packet test that asserts identical packet input produces identical rendered output.
- Test proving variant verdict routing reaches the same durable artifact for both human and machine reviewer flows. Owner: maintainer. Next action: extract a unit test from the existing review-variants surface against a fixture verdict.
- Stale-state rendering test proving the renderer surfaces stale review or report state rather than masking it. Owner: maintainer. Next action: add a fixture with explicit stale state and assert both packet and rendered view expose the staleness.
