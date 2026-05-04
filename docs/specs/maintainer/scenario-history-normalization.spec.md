# Scenario History And Proposal Normalization

Scenario history and proposal normalization keep protected checks reusable across tuning loops.

Aligned user claims: U2, U3, U7.
Proof route: deterministic plus held-out eval.
Current evidence status: proof-planning.
Next action: connect scenario proposal sources, scenario history cadence, normalizer coverage, and held-out selection to eval and optimize packets.
Absorbs: scenario proposal, scenario history, protected check, held-out, iterate cadence, train cadence, normalizer, proposal packet, context recovery, skill failure episode.

## Maintainer Promise

Cautilus preserves useful scenarios as durable candidates that can be reused for eval, held-out validation, and optimization loops, and normalizers produce inspectable proposal packets rather than hidden one-off shapers.

## Subclaims

- Scenario proposals are stored as durable candidates that another agent or operator can reopen.
- Held-out selection and protected-check rules stay explicit so iterate-vs-train cadence does not silently drift.
- Normalizers produce inspectable proposal packets rather than hidden one-off shape transformations.
- Scenario history cadence is observable so reuse across tuning loops is auditable.

## Evidence

- `npm run lint:scenario-normalizers` enforces runtime completeness of the surviving normalization helpers via [scripts/check-scenario-normalization-completeness.mjs](../../../scripts/check-scenario-normalization-completeness.mjs).

## Evidence Gaps

- Test proving held-out selection rules choose the same scenarios for the same input across tuning loops, so iterate-vs-train cadence does not silently drift. Owner: maintainer. Next action: extract a focused unit test from the existing held-out selection logic.
- Test proving normalizer output is reproducible and inspectable, not a hidden one-off shape transformation. Owner: maintainer. Next action: add fixture inputs and assert normalizer output is byte-stable across runs.
- Held-out eval result packet attached to a scenario-history cycle so the reuse contract has a reopenable end-to-end proof. Owner: maintainer. Next action: capture a self-dogfood scenario-history cycle with held-out validation and link the summary.
