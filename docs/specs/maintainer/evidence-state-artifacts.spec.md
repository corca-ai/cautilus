# Evidence State And Review Artifacts

Review state and evidence state are separate transitions.

Aligned user claims: U6, U7.
Proof route: deterministic.
Current evidence status: partial.
Next action: keep review-result application, evidence validation, canonical maps, Markdown reports, and HTML/status views tied to packet freshness.
Absorbs: evidence refs, possible evidence, satisfied evidence, review labels, status summary, canonical claim map, Markdown report, HTML view, stale packet, drift handling.

## Maintainer Promise

Reviewer agreement can update wording, audience, proof route, readiness, and next action.
A claim is satisfied only when a direct or verified evidence ref supports it.
Readable reports are projections over packets and must not become independent truth sources.

## Proof Notes

`claim validate`, `claim show`, canonical-map generation, and report rendering should stay in one reproducible packet flow.
Freshness must be visible whenever packets point at an older commit.
