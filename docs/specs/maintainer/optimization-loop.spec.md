# Optimization Loop

Optimization is a bounded behavior-improvement loop.

Aligned user claims: U3, U7.
Proof route: deterministic plus held-out eval.
Current evidence status: proof-planning.
Next action: connect optimize packet tests to at least one held-out eval proof before treating improvement claims as satisfied.
Absorbs: optimize prepare-input, search budget, checkpoint, frontier, proposal, held-out validation, protected checks, runtime fingerprint, blocked readiness, reuse.

## Maintainer Promise

Optimization starts from an explicit behavior target and budget, and records what changed, which checks were protected, which results were reused, and which held-out checks still guard regressions.

## Subclaims

- `optimize prepare-input` records the target claim, budget, and protected checks before the search loop runs.
- `optimize search run` and revision-artifact assembly preserve checkpoint state and frontier promotions so the loop is resumable.
- Blocked-readiness conditions surface through the optimize packet rather than being hidden behind repeated retries.
- Held-out evaluation guards regressions; an improvement claim is not treated as satisfied without a held-out proof.

## Evidence Gaps

- Optimize input and search-result schema tests proving budget, checkpoint, and frontier fields stay populated end-to-end. Owner: maintainer. Next action: link existing optimize schema tests or extract a focused unit test against the canonical input/output packets.
- At least one held-out eval result packet attached to a real optimize run so improvement claims have a reopenable before/after evidence pair. Owner: maintainer. Next action: capture a self-dogfood optimize run with held-out validation and link both summaries.
- Test proving blocked readiness states surface in the optimize packet rather than being masked. Owner: maintainer. Next action: add a fixture-backed test that triggers a blocked-readiness condition and asserts it appears in the output.
