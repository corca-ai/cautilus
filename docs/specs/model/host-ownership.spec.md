# Host-Owned Execution Constraint

Concern ID: `concern.host-owned-execution`.

Host Ownership keeps prompts, models, credentials, runtime wiring, and acceptance policy in the host repo while Cautilus standardizes workflow packets, command boundaries, and proof routes.

## Projections

- User projection: [Host Ownership](../user/ownership.spec.md)
- Maintainer routes: [Adapter And Host Ownership](../maintainer/adapter-host-ownership.spec.md), [Live Invocation Runtime](../maintainer/live-invocation-runtime.spec.md)
- Concern projection: [Host-Owned Execution](../concerns/host-owned-execution.spec.md)
- Related concerns: [Vocabulary Consistency](../concerns/vocabulary-consistency.spec.md), [Agent-Human Resumability](../concerns/agent-human-resumability.spec.md)

## Evidence Posture

Current status: partial.
The adapter and onboarding surfaces have proof, while some host-owned field boundaries still need focused evidence.

```run:shell
# Verify host-ownership projections are linked to existing docs.
test -f docs/specs/user/ownership.spec.md
test -f docs/specs/maintainer/adapter-host-ownership.spec.md
```
