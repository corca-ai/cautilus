# Claim Discovery Workflow

Claim discovery is a high-recall proof-planning pass, not a verdict.

Aligned user claims: U1, U7.
Proof route: deterministic plus skill review.
Current evidence status: proof-planning.
Next action: keep source-scope tests, canonical-map generation, and review-result replay connected to the active spec tree.
Absorbs: source inventory, entry Markdown, linked Markdown, `.gitignore`, raw candidates, duplicate handling, canonical compression, review-result replay, false-positive review, false-negative boundary.

## Maintainer Promise

`claim discover` should emit source-ref-backed candidates from configured entry documents and linked Markdown.
It should prefer recall, preserve the scan boundary, and leave curation to packet-aware agent or maintainer review.

## Proof Notes

The current source packet proves the active scan excludes `docs/specs/old/**` and avoids the superseded `docs/claims/**` pages.
The next proof should attach this behavior to deterministic tests or an evidence bundle instead of leaving it as a one-session observation.
