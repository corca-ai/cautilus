# Evidence State And Review Artifacts

Review state and evidence state are separate transitions.

Aligned user claims: U6, U7.
Proof route: deterministic.
Current evidence status: partial.
Next action: keep review-result application, evidence validation, canonical maps, Markdown reports, and HTML/status views tied to packet freshness.
Absorbs: evidence refs, possible evidence, satisfied evidence, review labels, status summary, canonical claim map, Markdown report, HTML view, stale packet, drift handling.

## Maintainer Promise

Reviewer agreement can update wording, audience, proof route, readiness, and next action, but a claim becomes satisfied only when a direct or verified evidence ref supports it; readable reports stay projections over packets and never become independent truth sources.

## Subclaims

- Review-result application updates labels, proof route, readiness, and next action without flipping evidence status by itself.
- A claim becomes satisfied only when a direct or verified evidence ref supports it; possible evidence and review agreement alone do not satisfy.
- `claim validate` exits non-zero when packet shape or evidence refs are invalid.
- Stale packet state stays visible in `claim show`, `agent status`, and rendered reports rather than masked behind cached labels.

## Evidence

- `claim review apply-result` enforces the satisfied-evidence boundary in the implementation and is exercised through the `dev/skill` review-prepare-flow and reviewer-launch-flow fixtures under [fixtures/eval/dev/skill/](../../../fixtures/eval/dev/skill/).
- `claim validate` is wired into `lint:specs` indirectly through downstream verification flows; the command itself is documented in [docs/contracts/claim-discovery-workflow.md](../../contracts/claim-discovery-workflow.md).

## Evidence Gaps

- Focused unit test proving review agreement alone cannot move a claim to satisfied without a direct or verified evidence ref. Owner: maintainer. Next action: extract a unit test from the existing `claim review apply-result` guard.
- Stale-packet rendering test proving the rendered Markdown / HTML / status views surface stale state rather than masking it. Owner: maintainer. Next action: link the existing freshness logic in `claim show` and add a renderer-side test.
