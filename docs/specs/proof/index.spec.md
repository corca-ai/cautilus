# Evidence State

This view shows what evidence currently supports the [Promise Ledger](../model/promise-ledger.spec.md), which evidence is selected rather than rerun, and which proof gaps remain open.
It answers which promises are currently supported, stale, selected from durable evidence, or visibly red in the Specdown report.

## Pages

- [Evidence Map](evidence-map.spec.md)
- [Proof Gaps](gaps.spec.md)
- [Latest Selected Evidence](latest-selected-evidence.spec.md)

```run:shell
# Verify proof pages are present.
test -f docs/specs/proof/evidence-map.spec.md
test -f docs/specs/proof/gaps.spec.md
test -f docs/specs/proof/latest-selected-evidence.spec.md
```
