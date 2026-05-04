# Claim Discovery Workflow

Claim discovery is a high-recall proof-planning pass, not a verdict.

Aligned user claims: U1, U7.
Proof route: deterministic plus skill review.
Current evidence status: proof-planning.
Next action: keep source-scope tests, canonical-map generation, and review-result replay connected to the active spec tree.
Absorbs: source inventory, entry Markdown, linked Markdown, `.gitignore`, raw candidates, duplicate handling, canonical compression, review-result replay, false-positive review, false-negative boundary.

## Maintainer Promise

`claim discover` emits source-ref-backed candidates from configured entry documents and the linked Markdown they reach, preferring recall and preserving the scan boundary so curation stays a packet-aware agent or maintainer responsibility.

## Subclaims

- Discovery emits source-ref-backed candidates from configured entry documents and linked Markdown within the declared depth bounds.
- Discovery favors recall; duplicate handling, false-positive curation, and false-negative boundaries belong to review surfaces, not to the deterministic scan.
- The active scan boundary excludes archived spec trees and superseded claim pages so they do not dilute current proof planning.
- Canonical compression and review-result replay consume the discovery packet without mutating discovery's recall behavior.

## Evidence Gaps

- Deterministic test or evidence bundle proving the active scan excludes `docs/specs/old/**` and `docs/claims/**` so the current source-packet observation stops being a one-session note. Owner: maintainer. Next action: link the existing source-scope test or extract a focused unit test against a fixture repo.
- Per-subclaim binding from review-result replay, canonical compression, and false-positive review claims back to their respective deterministic or fixture-backed proofs. Owner: maintainer. Next action: enumerate the absorbed surfaces and attach the corresponding existing tests or audit packets.
