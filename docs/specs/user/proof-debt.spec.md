# Proof Debt

Cautilus separates finding a promise from proving that the promise is true.

## User Promise

Cautilus makes proof debt visible so maintainers can decide whether to add deterministic proof, plan evals, align docs, split broad claims, or defer work.

## Subclaims

- A claim packet is a work plan, not a certificate.
- Human review may approve wording or proof route, but review comments alone do not satisfy a claim.
- Evidence refs must be attached and valid before a claim is treated as satisfied.
- Unknown or missing evidence should stay visible in the public claim workflow.

## Evidence Gaps

- `claim validate` test proving possible-only evidence cannot satisfy a claim. Owner: maintainer. Next action: link the existing satisfied-evidence rejection test in `claim review apply-result` or extract a focused unit test.
- Evidence-bundle test proving review comments alone do not move a claim to satisfied without a direct or verified evidence ref. Owner: maintainer. Next action: link the existing review-result application path that enforces this guard.
- Status report binding proving unknown / missing evidence stays visible in `claim show` and the rendered claim status view rather than being silently dropped. Owner: maintainer. Next action: attach a fixture packet with mixed evidence states and verify both packet and rendered view expose the unknown buckets.
