# Cautilus Proof View

This view asks what evidence currently supports the [Promise Ledger](../model/promise-ledger.spec.md), which evidence is intentionally selected instead of rerun, and which missing proof should remain visibly red.

The proof view is not a planning backlog.
It is the reader-facing evidence projection for current product claims.

## Proof Pages

- [Evidence Map](evidence-map.spec.md)
- [Proof Gaps](gaps.spec.md)
- [Latest Selected Evidence](latest-selected-evidence.spec.md)

```run:shell
# Verify proof pages are present.
test -f docs/specs/proof/evidence-map.spec.md
test -f docs/specs/proof/gaps.spec.md
test -f docs/specs/proof/latest-selected-evidence.spec.md
```
