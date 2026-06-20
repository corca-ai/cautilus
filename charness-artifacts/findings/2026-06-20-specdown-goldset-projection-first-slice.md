# Specdown rewrite: gold-set projection, first implementation slice landed

Date: 2026-06-20.
Spec (canonical during impl): `charness-artifacts/spec/2026-06-20-specdown-rewrite-goldset-projection.md` (spec commit `2ba82e3e`).
Slice: read-only projector + explicit maps + reconciliation, zero gate/page change (First Implementation Slice steps 1–5).

## What landed

A product-owned projector turns the HITL-ratified gold set into a single fingerprint-keyed claim inventory, so the spec surface's inventory layer derives from one answer key instead of three hand-maintained framings.

- `scripts/agent-runtime/goldset-projection-lib.mjs` — pure core (no fs/git/process), mirroring the `surface-audit-lib` pattern: filter to the 56 durable-graded entries, project a fingerprint-keyed record carrying `{significanceTier, ratifiedProofRoute, primaryEpic, summary, sourceRef, audience}` (+ `claimId`, `maintainerVerdict`, `recommendedProof`, `routeOverridden`, `badge`), resolve the proof route through the override surface, bind each T1 to an apex badge, and reconcile the projected routes against `surface-registry.json`.
- `scripts/agent-runtime/build-goldset-projection.mjs` — thin fs shell (`--build`/`--check`/`--json`), mirroring `build-surface-audit`. Emits the checked-in artifact and self-validates in `--check`.
- `docs/specs/audit/claim-badge-map.json` — the explicit `claimFingerprint→badge` map (7 bindings, each with rationale). PQ1 resolved: the mapping is NOT 1:1 by `primaryEpic`, so it is declared as reviewable data.
- `docs/specs/audit/claim-proof-route-overrides.json` — the structured `claimFingerprint→ratifiedProofRoute` override surface. PQ2 resolved: the relabel route for `claim-readme-md-8` is pinned here, never parsed from the prose `note`.
- `.cautilus/specdown/claim-inventory.json` — the generated, checked-in inventory.
- `npm run specdown:project` / `specdown:project:check` — operator entrypoints (NOT wired into `verify`; the load-bearing assertions live in `npm run test`).

## Probe questions resolved against the real data

- **PQ1 — the T1→badge map is not 1:1 by epic.** Three T1 entries share `primaryEpic: APEX` (`claim-readme-md-4` value-prop, `-5` three-jobs, `-136` intent-first); the epic vocabulary is disjoint from the badge IDs. The explicit map routes the three APEX-epic claims to distinct badges (behavior-evaluation, claim-discovery, behavior-evaluation), and routes two different-epic claims (`-5`, `-67`) onto the same badge (claim-discovery) — both of which an epic-driven binding could not express. `readiness` and `a-testable-agent` receive no T1 headline claim. A test pins that the binding is by the map, not by `primaryEpic`.
- **PQ2 — the relabel route is prose-only and is now structured.** `claim-readme-md-8` carries `agentLabels.recommendedProof = deterministic` (the pre-relabel value); the ratified `cautilus-eval` route survives only in the entry `note` (R6/R12). The projector reads it from the override surface; `recommendedProof` stays untouched, `ratifiedProofRoute` becomes `cautilus-eval`, `routeOverridden = true`. A test pins the route and a second test proves removing the override falls back to `deterministic` (never to the note's `cautilus-eval`).

## The split is exact (matches HITL closeout)

`durableGraded = 56` (accept 54 + relabel 1 + rewrite-source 1), all tiered `T1=7 / T2=41 / T3=8`.
`nonGraded = 18` (not-a-claim 11 + retire-source 5 + badly-bounded 2), all untiered.
`totalEntries = 74`. A test asserts each count.

## Reconciliation surfaces real divergence, read-only (SC3/AC4)

The gold-set proof-route vocabulary (`deterministic`, `cautilus-eval`, `human-auditable`) and the apex registry proof-class vocabulary (`deterministic`, `live-replayed`, `projected-bundle`, `none`) are distinct axes: the gold-set route is the ratified recommendation for HOW a claim should be proven; the registry proof class is what the apex's chosen leaf spec delivers today.
The reconciliation maps `deterministic↔deterministic`, `cautilus-eval↔live-replayed`, and `human-auditable↔(none)`, then reports per badge.
Result on the current ratified state: 7/7 badges diverge — `readiness` and `a-testable-agent` have no ratified T1 headline claim, and the other five carry a route-class mismatch (e.g. `reviewable-artifacts` is ratified `cautilus-eval` but the apex routes it `projected-bundle`/declared).
Only `claim-readme-md-4`'s binding inside `behavior-evaluation` is internally aligned, which proves the correspondence machinery can report `aligned` and is not trivially always-mismatch.
This is the predicted "apex badge taxonomy and gold-set T1 taxonomy are RELATED but distinct" (spec Problem section) — surfaced for the later phases, not silently tolerated and not gated this slice.

## Load-bearing, not decorative (AC2)

`validateInventory` pins exactly 7 T1, each bound to a known badge, every badge-map binding pointing at a real durable-graded T1 fingerprint, and the tier/graded sums internal-consistent.
Two regression tests mutate a clone of the gold set: dropping a T1 and re-tiering a T1 to T2 each fail validation. So a future gold-set re-extraction that drops or re-tiers a T1 is caught by `npm run test`.

## Boundary kept (FD2/FD6/FD7, zero gate/page change)

Anchored strictly by `claimFingerprint` (no line numbers). Gold set consumed as a checked-in artifact (read by a script, never imported into the Go engine). No `run-verify.mjs` PHASES change, no `lint:specs` change, no spec-page edit, no `surface-registry.json` edit. `docs/specs/old/**` neutralization (AC5) and the ledger/evidence 2-axis collapse (SC4) remain later-phase work.

## Verification

- `node --test scripts/agent-runtime/goldset-projection-lib.test.mjs` — 26/26 pass (AC1–AC4 + drift guard + shell build/check paths).
- `npm run specdown:project:check` — OK (`56 durable-graded … 7/7 T1 badge-bound; 7/7 badges divergent`).
- `npm run verify` — all phases passed (307.6s); coverage floor green (lib 97.6%, shell 95.5%, both clear the 80% fail floor with no warn-band).
- Critique: a bounded fresh-eye Sonnet subagent returned **READY** (no blockers, no edits), empirically verifying all seven load-bearing questions — the 7 badge bindings are defensible with no better alternative, `7/7 badges divergent` is honest (not a `ROUTE_TO_PROOF_CLASS` bug: `projected-bundle` has no gold-set route counterpart), all map fingerprints are present with no drift, `resolveProofRoute` never reads `note`, both AC2 regression tests are non-tautological, the zero gate/page-change boundary held (no PHASES/spec/registry edit, gold set read-only and not imported into Go), and the 56/18 split is exact.
