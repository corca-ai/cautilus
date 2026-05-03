# Live Invocation Runtime

Live invocation turns product-owned request packets into host-owned runtime calls.

Aligned user claims: U2, U5.
Proof route: deterministic plus live-run fixture.
Current evidence status: proof-planning.
Next action: connect live invocation, batch invocation, persona prompt, request packet, result normalization, and backend handoff tests.
Absorbs: live run, batch run, invocation, persona prompt, simulator, request packet, result packet, samples per scenario, backend command handoff, provider-specific flags.

## Maintainer Promise

Cautilus owns the generic request/result packet and loop boundary.
The host-owned adapter still owns provider calls, backend flags, route layout, model choice, credentials, and product-specific response semantics.

## Proof Notes

This area should absorb `docs/contracts/live-run-invocation.md` and `docs/contracts/live-run-invocation-batch.md`.
It is separate from adapter ownership because it names the product runtime seam that adapters plug into.
