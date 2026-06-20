# Evidence State

Read this when you need to know which Cautilus claims are supported now, which proof was selected instead of rerun, and which gaps remain open.
Evidence State keeps current support, stale evidence, selected durable proof, and visible Specdown gaps in one place.

## Pages

- [Evidence Map](evidence-map.spec.md)
- [Projected Claim State](projected-claim-state.md)
- [Claim Evidence State](claim-evidence-state.md)
- [Proof Gaps](gaps.spec.md)
- [Latest Selected Evidence](latest-selected-evidence.spec.md)

[Projected Claim State](projected-claim-state.md) is the generated tier/verdict/route view of the HITL-ratified gold set, rendered once from the fingerprint-keyed claim inventory so the ledger and evidence surface read claim state instead of restating it by hand.

```run:shell
# Verify evidence pages are present.
node -e 'const fs = require("node:fs"); for (const path of ["docs/specs/evidence/evidence-map.spec.md", "docs/specs/evidence/projected-claim-state.md", "docs/specs/evidence/claim-evidence-state.md", "docs/specs/evidence/gaps.spec.md", "docs/specs/evidence/latest-selected-evidence.spec.md", ".cautilus/claims/evidence-state.json", ".cautilus/specdown/claim-inventory.json"]) { if (!fs.existsSync(path)) throw new Error("missing " + path); }'
```
