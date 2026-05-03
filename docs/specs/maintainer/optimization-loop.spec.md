# Optimization Loop

Optimization is a bounded behavior-improvement loop.

Aligned user claims: U3, U7.
Proof route: deterministic plus held-out eval.
Current evidence status: proof-planning.
Next action: connect optimize packet tests to at least one held-out eval proof before treating improvement claims as satisfied.
Absorbs: optimize prepare-input, search budget, checkpoint, frontier, proposal, held-out validation, protected checks, runtime fingerprint, blocked readiness, reuse.

## Maintainer Promise

Optimization starts from an explicit behavior target and budget.
It records what changed, which checks were protected, which results were reused, and which held-out checks still guard regressions.

## Proof Notes

Command-surface smoke is not enough for improvement claims.
The product needs packet-level tests and at least one held-out eval route that can reopen the before and after evidence.
