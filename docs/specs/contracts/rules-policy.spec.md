# Contract Cross-Cutting Rule Policy

Maintainer evidence stays organized by evidence route.
Shared concerns such as Evidence Gaps, Packet Freshness, and Host-Owned Execution are mapped to those routes instead of getting a second maintainer page tree.

This keeps maintainer reading task-oriented:
open the route that owns the contract, then use [Cross-Cutting Rules](../rules/index.spec.md) to see which workflow-wide rules attach to it.

## Policy Checks

Both sides of the map (contracts index and cross-cutting rules index) stay reachable from the apex; reachability is enforced by `specdown trace -strict` and `scripts/check-specs.mjs`, not a per-page existence guard.
