# Host-Owned Execution

Host repos own prompts, models, credentials, runtime wiring, fixtures, and acceptance policy.
Cautilus owns generic workflow contracts, packet shapes, command boundaries, and evidence routes.

User-facing name: [Host Ownership](../user/ownership.spec.md).
Key: `concern.host-owned-execution`.

## Where To Check This

- User-facing page: [Host Ownership](../user/ownership.spec.md)
- Maintainer evidence routes: [Adapter And Host Ownership](../maintainer/adapter-host-ownership.spec.md), [Live Invocation Runtime](../maintainer/live-invocation-runtime.spec.md), [Binary And Skill Boundary](../maintainer/binary-skill-boundary.spec.md)

## Evidence State

Live invocation and consumer parity proof remain open gaps and should stay visible rather than being hidden behind the host-ownership wording.

```run:shell
# Verify the host-owned execution pages and maintainer route exist.
test -f docs/specs/user/ownership.spec.md
test -f docs/specs/maintainer/adapter-host-ownership.spec.md
```
