# Session Retro: Release Verifier Critique Miss

## Context

The session reviewed why the release verifier gaps were found only after a subagent critique rather than during the first hardening pass.

## Waste

The first pass treated the release workflow template and the public release verifier as separate concerns.
That let the publish-time audit become stronger than the post-publish verifier, even though both surfaces were supposed to defend the same operator promise.
The work also checked that release notes contained a checksum label but did not ask whether the rendered value was bound to the checksum asset.

## Critical Decisions

The useful decision was running a fresh-eye critique after closeout.
The costly decision was accepting tests that only mirrored the exact prior incident.
Those tests proved the old failure string was blocked but did not test nearby out-of-band release-note shapes.

## Expert Counterfactuals

A release engineer would have built a parity table between producer, preflight audit, and public verifier before considering the release surface closed.
A security reviewer would have asked which values were authenticated or cross-checked, not only whether the expected labels existed.

## Next Improvements

- workflow: For release hardening, inspect producer, preflight audit, and post-publish verifier as one contract before closing the slice.
- capability: Add parity tests when two audit surfaces claim to reject the same class of stale or mutable pointer.
- memory: Treat label-only checks in public artifacts as incomplete unless the value is compared to an independent source.

## Persisted

yes
