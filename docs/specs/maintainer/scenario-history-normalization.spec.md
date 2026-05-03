# Scenario History And Proposal Normalization

Scenario history and proposal normalization keep protected checks reusable across tuning loops.

Aligned user claims: U2, U3, U7.
Proof route: deterministic plus held-out eval.
Current evidence status: proof-planning.
Next action: connect scenario proposal sources, scenario history cadence, normalizer coverage, and held-out selection to eval and optimize packets.
Absorbs: scenario proposal, scenario history, protected check, held-out, iterate cadence, train cadence, normalizer, proposal packet, context recovery, skill failure episode.

## Maintainer Promise

Cautilus should preserve useful scenarios as durable candidates that can be reused for eval, held-out validation, and optimization loops.
Normalizers should produce inspectable proposal packets rather than hidden one-off shapers.

## Proof Notes

This area should absorb `docs/contracts/scenario-history.md`, `docs/contracts/scenario-proposal-sources.md`, and scenario normalizer claims.
It should stay separate from optimization unless the claim is specifically about budgeted behavior improvement.
