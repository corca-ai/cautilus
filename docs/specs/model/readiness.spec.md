# Readiness Promise

Promise ID: `promise.readiness`.

Readiness means a user can tell whether Cautilus can safely operate in the selected repo and what setup is still missing before spending workflow budget.

## Links

- User workflow: [Readiness](../user/doctor-readiness.spec.md)
- Maintainer evidence routes: [Readiness And Runtime Status](../maintainer/readiness-runtime-status.spec.md), [Adapter And Host Ownership](../maintainer/adapter-host-ownership.spec.md)
- Related shared concerns: [Evidence Gaps](../concerns/evidence-gaps.spec.md), [Vocabulary Consistency](../concerns/vocabulary-consistency.spec.md), [Agent-Human Resumability](../concerns/agent-human-resumability.spec.md), [Host-Owned Execution](../concerns/host-owned-execution.spec.md)

## Evidence State

Evidence status: open gap.
The user view has strong executable readiness examples, while the maintainer view still calls out absence proof for readiness not implying behavior-claim satisfaction.

```run:shell
# Verify readiness links point to existing docs.
test -f docs/specs/user/doctor-readiness.spec.md
test -f docs/specs/maintainer/readiness-runtime-status.spec.md
```
