# Live Invocation Runtime

Live invocation turns product-owned request packets into host-owned runtime calls.

Aligned user claims: U2, U5.
Proof route: deterministic plus live-run fixture.
Current evidence status: partial.
Next action: connect live invocation, batch invocation, persona prompt, request packet, result normalization, and backend handoff tests.
Absorbs: live run, batch run, invocation, persona prompt, simulator, request packet, result packet, samples per scenario, backend command handoff, provider-specific flags.

## Maintainer Promise

Cautilus owns the generic request and result packet shape and the loop boundary, while the host-owned adapter still owns provider calls, backend flags, route layout, model choice, credentials, and product-specific response semantics.

## Subclaims

- The product-owned request packet remains portable across hosts and does not encode provider-specific flags.
- The result packet exposes enough observed state for another agent or operator to reopen the live run.
- Batch invocation, single-run invocation, and persona prompt sit on the same product-owned loop boundary rather than diverging into preset-specific code paths.
- The adapter handoff to host-owned provider calls is explicit and inspectable, not hidden inside product logic.

## Evidence

- [internal/runtime/adapter_test.go](../../../internal/runtime/adapter_test.go) `TestValidateAdapterDataAcceptsLiveRunInvocation` validates the portable request/result packet shape against the live-run contract.
- [scripts/agent-runtime/run-app-eval.test.mjs](../../../scripts/agent-runtime/run-app-eval.test.mjs) covers fixture-backed app/chat and app/prompt observed packets so single-run invocation has end-to-end proof.

## Evidence Gaps

- Batch-run fixture proving the loop boundary handles multiple scenarios without leaking provider-specific state into the product-owned packet. Owner: maintainer. Next action: author a fixture-backed batch-run test against [docs/contracts/live-run-invocation-batch.md](../../contracts/live-run-invocation-batch.md); no checked-in batch test today.
- Negative test proving provider-specific flags do not appear in product-owned schema fields. Owner: maintainer. Next action: add a schema validation test that asserts provider-flag absence in the canonical request/result packet shape.
