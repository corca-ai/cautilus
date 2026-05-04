# Adapter And Host Ownership

Host repos own runtime-specific behavior.

Aligned user claims: U2, U5.
Proof route: deterministic plus consumer dogfood.
Current evidence status: proof-planning.
Next action: connect adapter contract tests and at least one consumer repo proof that Cautilus invokes host-owned runners without importing host-specific logic.
Absorbs: adapters, prompts, model choice, credentials, runtime launch, command templates, backend selection, fixtures, acceptance policy, repo-specific flags, portable schema.

## Maintainer Promise

Cautilus owns generic workflow contracts, packet shapes, readiness semantics, behavior-surface vocabulary, and normalization helpers, while host repos own prompts, runners, credentials, model or backend selection, fixtures, and policy.

## Subclaims

- Cautilus-owned schemas and packet shapes describe the workflow without encoding host-specific runtime details.
- Adapters expose host-owned commands and runtime decisions explicitly so they remain inspectable rather than hidden inside product logic.
- The same product workflow runs unchanged across two adapters because repo-specific behavior lives in adapters and fixtures.
- Cautilus does not import host-specific prompts, runners, credentials, or policy into product code paths.

## Evidence Gaps

- Adapter contract test that exercises a fixture adapter end-to-end and asserts that host-owned command templates remain explicit and product-owned schemas stay portable. Owner: maintainer. Next action: link the existing adapter contract test or author one against [docs/contracts/adapter-contract.md](../../contracts/adapter-contract.md).
- Consumer dogfood proof that the same product workflow runs unchanged across two adapters. Owner: maintainer. Next action: link the `npm run consumer:onboard:smoke` evidence packet for the canonical bootstrap path.
- Negative test proving product code paths do not import host-specific prompts, runners, credentials, or policy. Owner: maintainer. Next action: add a build-time grep guard against host-specific names in the product source tree.
