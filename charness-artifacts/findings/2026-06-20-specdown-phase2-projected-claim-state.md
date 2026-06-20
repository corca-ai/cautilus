# Specdown rewrite — Phase 2 first slice: projected claim state page

Date: 2026-06-20.
Spec (canonical): `charness-artifacts/spec/2026-06-20-specdown-rewrite-goldset-projection.md` (SC4, PQ3).
Builds on the Phase 1 read-only projector (`.cautilus/specdown/claim-inventory.json`).

## What landed

PQ3 is resolved: thin generated state + retained hand prose, via the repo's established generate+check precedent rather than per-page injected regions.

- Pure lib `scripts/agent-runtime/projected-claim-state-lib.mjs` renders the fingerprint-keyed claim inventory into one human-readable state page (no fs/git/process).
- Thin shell `scripts/agent-runtime/render-projected-claim-state.mjs` (build + `--check`), mirroring `build-goldset-projection.mjs` and `render-claim-evidence-state.mjs`.
- Generated page `docs/specs/evidence/projected-claim-state.md`: source-of-truth provenance, claim-state summary, proof-route distribution, the 7 T1 headline claims + apex badge bindings, the apex badge reconciliation, and the full 56-claim inventory in document order within tier.
- npm `specdown:claim-state` / `specdown:claim-state:check`.
- Linked from `docs/specs/evidence/index.spec.md` (Pages + existence `run:shell`) and `docs/specs/ledger/index.spec.md`.
- The inventory is consumed read-only — the renderer never recomputes the projection, it only presents it.

## Gate chain now closed

`npm run verify` now wires the full chain (both phases newly added after `lint:specs`, fail-fast):

```
gold set --(specdown:project:check)--> claim-inventory.json --(specdown:claim-state:check)--> projected-claim-state.md
```

Before this slice, `specdown:project:check` was absent from verify, so the Phase 1 inventory could drift from the gold set uncaught; that gap is now closed alongside the page check. No gate was weakened or removed (FD6 honored); `run-verify.test.mjs` PHASES list updated in lockstep.

## Verification

- `npm run verify` green (all phases, ~274s).
- New-file coverage: lib 99.13%, shell 98.44% (both above the 95% warn ceiling).
- 21 executable tests across `projected-claim-state-lib.test.mjs` + `render-projected-claim-state.test.mjs`: 56/18 graded split, exactly 7 T1 badge-bound, route distribution sums to durableGraded, document-order sort, pipe-escaping, unexpected-route surfacing, empty-reconciliation, page==renderer drift, and all shell exit-code branches.
- Fresh-eye Sonnet subagent critique (foreground): READY-WITH-EDITS, no blocker, no correctness bug, no gate weakening. The one edit (lib comment ran ahead of reality on the "three-way collapse") was applied.

## Remaining SC4 / FD5 (next slice)

- Retire the not-a-claim(11)/retire-source(5) source prose (README.md / docs/guides/cli.md) — touches claim sources, so it triggers `npm run claims:refresh:all`; deferred to keep this slice's blast radius bounded.
- Point the remaining hand-authored ledger/evidence state at the generated page where it still restates claim state.
- SC5/AC5 (`docs/specs/old/**` neutralization + `lint:specs` exit criterion) unchanged — Phase 3.
