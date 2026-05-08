# Host-Owned Execution Concern

Concern ID: `concern.host-owned-execution`.

Host repos own prompts, models, credentials, runtime wiring, fixtures, and acceptance policy.
Cautilus owns generic workflow contracts, packet shapes, command boundaries, and proof routes.

This is a cross-cutting concern rather than a primary workflow story because it constrains readiness, discovery, evaluation, and optimization at the same time.

## Projections

- User-facing projection: [Host Ownership](../user/ownership.spec.md)
- Model constraint: [Host-Owned Execution Constraint](../model/host-ownership.spec.md)
- Maintainer routes: [Adapter And Host Ownership](../maintainer/adapter-host-ownership.spec.md), [Live Invocation Runtime](../maintainer/live-invocation-runtime.spec.md), [Binary And Skill Boundary](../maintainer/binary-skill-boundary.spec.md)

## Current Proof

Adapter contract tests, command-discovery checks, and product-import isolation prove the deterministic boundary.
Live invocation and consumer parity proof remain partial and should stay visible as proof gaps rather than being hidden behind the host-ownership wording.

```run:shell
# Verify the current host-owned execution projections exist.
test -f docs/specs/user/ownership.spec.md
test -f docs/specs/model/host-ownership.spec.md
test -f docs/specs/maintainer/adapter-host-ownership.spec.md
```
