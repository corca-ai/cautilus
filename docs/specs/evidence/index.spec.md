# Evidence State

Read this when you need to know which Cautilus claims are supported now, which proof was selected instead of rerun, and which gaps remain open.
Evidence State keeps current support, stale evidence, selected durable proof, and visible Specdown gaps in one place.

## Pages

- [Evidence Map](evidence-map.spec.md)
- [Claim Evidence State](claim-evidence-state.md)
- [Proof Gaps](gaps.spec.md)
- [Latest Selected Evidence](latest-selected-evidence.spec.md)

```run:shell
# Verify evidence pages are present.
test -f docs/specs/evidence/evidence-map.spec.md
test -f docs/specs/evidence/claim-evidence-state.md
test -f docs/specs/evidence/gaps.spec.md
test -f docs/specs/evidence/latest-selected-evidence.spec.md
test -f .cautilus/claims/evidence-state.json
```
