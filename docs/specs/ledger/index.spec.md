# Cautilus Promise Ledger

Read this for the current Cautilus promise map: which cross-cutting rules govern and which contracts implement each promise.
The relationships are carried by the typed trace edges on each promise leaf, so the ledger reads them instead of restating them by hand.

Spec entry: [Cautilus](../index.spec.md).

## Pages

- [Promise Ledger](../generated/promise-ledger.spec.md): the promise → rules/contracts map, generated from the typed trace graph.
- [Names And Keys](names-and-keys.spec.md): naming rules, the stable-name/user-facing-name aliases, compact keys, and the rename rule.
- [Projected Claim State](../generated/projected-claim-state.md): the generated tier/verdict/route view of the ratified claim set.

## Related Views

- [User Workflow](../user/index.spec.md)
- [Contracts](../contracts/index.spec.md)
- [Cross-Cutting Rules](../rules/index.spec.md)
- [Evidence State](../evidence/index.spec.md)
