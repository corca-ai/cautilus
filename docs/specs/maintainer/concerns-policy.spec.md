# Maintainer Shared Concern Policy

Maintainer evidence stays organized by evidence route.
Shared concerns such as Evidence Gaps, Packet Freshness, and Host-Owned Execution are mapped to those routes instead of getting a second maintainer page tree.

This keeps maintainer reading task-oriented:
open the route that owns the contract, then use [Shared Concerns](../concerns/index.spec.md) to see which workflow-wide rules attach to it.

## Policy Checks

```run:shell
# Verify the policy has both sides of the map available.
test -f docs/specs/maintainer/index.spec.md
test -f docs/specs/concerns/index.spec.md
```
