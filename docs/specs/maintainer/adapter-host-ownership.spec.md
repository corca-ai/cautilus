# Adapter And Host Ownership

Host repos own runtime-specific behavior.

Aligned user claims: U2, U5.
Proof route: deterministic plus consumer dogfood.
Current evidence status: proof-planning.
Next action: connect adapter contract tests and at least one consumer repo proof that Cautilus invokes host-owned runners without importing host-specific logic.
Absorbs: adapters, prompts, model choice, credentials, runtime launch, command templates, backend selection, fixtures, acceptance policy, repo-specific flags, portable schema.

## Maintainer Promise

Cautilus owns generic workflow contracts, packet shapes, readiness semantics, behavior-surface vocabulary, and normalization helpers.
The host repo owns prompts, runners, credentials, model or backend selection, fixtures, and policy.

## Proof Notes

This boundary should be proven with adapter contract tests and consumer dogfood rather than by prose alone.
Repo-specific behavior should stay in adapters and fixtures, not in product logic.
