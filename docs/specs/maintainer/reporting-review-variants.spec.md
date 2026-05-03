# Reporting And Review Variants

Reports and review variants keep evaluator-backed judgment inspectable.

Aligned user claims: U6, U7.
Proof route: deterministic plus evaluator review.
Current evidence status: proof-planning.
Next action: connect reporting packets, review packets, compare questions, schemas, variant verdicts, and rendered summaries to stale-state checks.
Absorbs: report packet, HTML report, Markdown report, review packet, review variants, compare questions, verdict schema, executor variant, numeric telemetry, human-visible failure.

## Maintainer Promise

Cautilus should write machine-readable review packets first and render readable projections over the same data.
Variant review should point both human and machine reviewers at the same durable artifacts.

## Proof Notes

This area should absorb `docs/contracts/reporting.md`, `docs/contracts/review-packet.md`, and review-variant adapter claims.
It should not claim behavior proof by itself; reports are views over evidence.
