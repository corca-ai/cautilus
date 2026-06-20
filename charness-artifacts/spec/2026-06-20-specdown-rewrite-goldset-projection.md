# Specdown rewrite: the spec surface as a projection of the HITL-ratified gold set

Status: spec (canonical during implementation), 2026-06-20.
Design + critique only this session; implementation is the next session's pickup (maintainer instruction).
Decision route: the maintainer accepted the "project, don't patch" approach with the hybrid generate-vs-prose split, user-product track only, and `claimFingerprint` anchoring (this session's recommendation, ratified by "ok 이거").

First Implementation Slice — LANDED 2026-06-20 (read-only projector, zero gate/page change).
The projector, the explicit `fingerprint→badge` map, the structured proof-route override surface, the generated fingerprint-keyed inventory, the reconciliation, and the AC1–AC4 tests are in; `npm run verify` is green (AC6).
PQ1 and PQ2 are resolved against the real data (see below); evidence: `charness-artifacts/findings/2026-06-20-specdown-goldset-projection-first-slice.md`.
Remaining phases (the 2-axis ledger/evidence collapse, `docs/specs/old/**` neutralization + `lint:specs` exit criterion) are unchanged and still owned by SC4/SC5/AC5.

Phase 2 First Slice — LANDED 2026-06-20 (SC4 generated-state foundation, no source-prose retirement yet).
PQ3 is resolved (below): the inventory is rendered ONCE into a standalone generated `docs/specs/evidence/projected-claim-state.md` (pure lib `projected-claim-state-lib.mjs` + thin shell `render-projected-claim-state.mjs`, mirroring `render-claim-evidence-state.mjs`), linked from the evidence and ledger indexes, with the full gold-set→inventory→page chain now gated in `npm run verify` (`specdown:project:check` + `specdown:claim-state:check`, both newly wired).
21 executable tests + coverage (lib 99.1%/shell 98.4%); `npm run verify` green; fresh-eye Sonnet critique READY-WITH-EDITS, no blocker.
Phase 2 Remainder — LANDED 2026-06-20 (execution session; SC4 closed by reconciliation, zero source edits, zero page deletions).
Source-prose retirement (FD5/D1/D2) needed no edit at HEAD: the 5 `retire-source` lines were already removed in `3080482`, the 2 `badly-bounded` curator splits were explicitly deferred to the gold-set re-extraction session in `3bc1b06` ("curator splits fold into the deferred re-extraction session"), and the 11 `not-a-claim` lines are tracking-only good prose kept in place — so no claim source changed and `claims:refresh:all` was not triggered.
The D3 delete/replace target is empty under its own guardrail: a full read of every table in `docs/specs/` found NO hand-maintained per-claim tier/verdict/route table — the ledger and evidence pages carry distinct, non-subsumed lenses (promise→contract ownership in `ledger/promise-ledger.spec.md`, evidence-route ownership in `evidence/evidence-map.spec.md`, the generated 398-candidate backlog in `evidence/claim-evidence-state.md`, proof gaps, and naming), so FD3's premise that those pages "restate the badge/tier state by hand" was empirically false.
The projection FILLS the previously-missing gold-set tier/verdict/route facet rather than replacing a redundant table, so SC4's single-source intent is satisfied by the first slice's generated page + links plus this reconciliation; nothing was deleted because the guardrail forbids dropping non-subsumed content.
Phase 3 (FD6/SC5/AC5) also LANDED this session: the `old/**` blocks were already inert (unreachable from the apex entry, so FD6's "live risk" premise was likewise false), and a reachability guard in `check-specs.mjs` (+ tests) now fails the gate if the apex graph ever reaches `old/**`/`archive/**`, making the inertness a guaranteed one.

### Phase 2 Remaining — Ratified Decisions (2026-06-20, maintainer)

These were confirmed with the maintainer in the Phase-2-first-slice closeout session and govern the next (execution) session.

- D1 — Verdict→action for the 18 non-graded entries is NOT uniform.
  Only `retire-source` (5: `claim-readme-md-16`/`-19`/`-47`/`-110`, `claim-docs-guides-cli-md-32`) authorizes removing/correcting the source prose.
  `not-a-claim` (11) is tracking-only — leave the README/cli prose intact (a not-a-claim line is often good prose that simply is not a product claim); do NOT delete it.
  `badly-bounded` (2: `claim-readme-md-129`, `claim-docs-guides-cli-md-207`) gets a narrowing rewrite, not deletion.
- D2 — The source-prose retirement happens IN the Phase 2 remainder, together with `npm run claims:refresh:all` before push (it edits claim sources `README.md`/`docs/guides/cli.md`).
  Anchor the live target lines by fingerprint/summary content, not the gold set's stale line numbers (some targets may already be trimmed at HEAD by `3080482`/`3bc1b06`); reconcile "still-live at HEAD" first.
- D3 — SC4 "done" requires actually DELETING/REPLACING the hand-maintained claim-STATE tables that the projection now subsumes, not merely adding the generated page and linking it.
  Guardrail: the generated `projected-claim-state.md` carries ONLY the gold-set-ratified 56-claim tier/verdict/route state. It does NOT carry the claims-packet 398-candidate evidence backlog (`evidence/claim-evidence-state.md`, a different generated source) nor the evidence-route ownership map (`evidence/evidence-map.spec.md`). So delete/replace applies only to hand-maintained tables whose content is genuinely subsumed by the projection; content with no projection equivalent must be migrated or kept, never silently dropped. The next session confirms the exact table list against this boundary before deleting.
- D4 — PQ3 stays resolved as a standalone generated `.md` + links (NOT per-page injected regions).

Execution outcome (2026-06-20, this session, confirming the handoff's "confirm the exact list before deleting" step):
D1/D2 needed no source edit — all 5 `retire-source` lines were already trimmed in `3080482`, the 2 `badly-bounded` curator splits were deferred to the re-extraction session in `3bc1b06`, and the 11 `not-a-claim` lines were kept — so `claims:refresh:all` did not run.
D3's confirmed delete-list is EMPTY under its own guardrail: no hand-maintained tier/verdict/route table exists to subsume (the candidate pages carry ownership/route/backlog/gap/naming lenses, all explicitly "kept" by the guardrail).
So SC4 closes via the projection + links already landed plus this reconciliation, not a deletion; the literal "must delete something" rested on FD3's premise, which a full page read found false.

## Problem

The spec surface under `docs/specs/` is hand-authored across three framings of the same claim set — the apex promise page (`index.spec.md`, 7 badges), the promise ledger (`ledger/`), and the evidence state (`evidence/`).
The same unproven state is expressed three different ways, which is the documented "2축(실은 3축) 불일치" pain the paused specdown redesign was meant to absorb (handoff `b6feefe0`).
Two more debts ride with it.
`lint:specs` was temporarily disabled in `ee4616fe` and RE-ENABLED in `f1b4fc4b` (2026-06-20), so the full specdown gate is now active again in `npm run verify` — the earlier "disabled" framing is stale.
With it on, `docs/specs/old/**` (8 files, ~1025 lines) carries 11 live `run:shell` blocks (real CLI commands against the binary: `standalone-surface` 3, `html-report` 3, plus `self-dogfood`/`index`/`git-precondition`/`current-product`/`command-surfaces` 1 each) that execute on every `npm run verify` despite being archival.
That is live risk during the rewrite — any slice that changes the CLI surface or spec tree can break those archived blocks — not silent drift.

Meanwhile a single canonical source now exists that the hand-authored tree does not derive from: the HITL-ratified gold set `charness-artifacts/eval-trust/goldset-v2-head/gold-set-proposal.user-product.json` (74 user-product entries, 306/306 reviewed across both tracks, session `hitl-userprod-v2head-20260617`).
Every entry carries `claimFingerprint` (sha256, 74/74), `summary` (the assertion), `agentLabels.recommendedProof` / `primaryEpic` / `claimAudience`, `maintainerVerdict`, `note`, and `significanceTier`.
The ratified tier model (R13/R14, confirmed in `HITL-CLOSEOUT.md`) is that users read the ~11 epics plus the proven-on-itself apex badges, NOT the raw claims: T1 = 7 headline claims (one per major theme), T2 = 41 backing mechanisms, T3 = 8 cli spec-detail; the 18 untiered entries are not-a-claim (11), retire-source (5), and badly-bounded (2).
The 7 T1 claims relate to the apex badges but NOT 1:1: three T1 entries share `primaryEpic: APEX` (value-prop `claim-readme-md-4`, three-jobs `…-5`, intent-first `…-136`), the other four epics (`S1-install`, `A2-curation-review`, `E2-scenarios-experiments`, `I1-bounded-improvement`) are a vocabulary disjoint from the badge IDs (`readiness`, `claim-discovery`, `behavior-evaluation`, `bounded-improvement`, `reviewable-artifacts`, `host-ownership`, `a-testable-agent`), and some badges (e.g. Readiness) have no T1 claim at all.
So the apex badge taxonomy and the gold-set T1 taxonomy are RELATED but distinct, and an explicit `fingerprint→badge` reconciliation map is required from the first slice — surfacing exactly where the apex page and the ratified claim set diverge is part of the projection's value.

Because the gold set already encodes, per claim, is-it-a-claim + audience + tier + proof route + boundary, the rewrite can make the spec surface a PROJECTION of that one source instead of three hand-maintained framings, so the 3-axis inconsistency disappears by construction.

## Current Slice

This session: produce this design contract and a bounded critique, then hand off impl to the next session.
The contract defines the projection (what is generated from the gold set vs hand-authored), the anchoring mechanism, the phased rewrite, and the first implementation slice.
No spec pages, no scripts, and no gate changes land this session beyond this artifact.

## Fixed Decisions

- FD1 — Project, don't patch.
  The rewritten spec surface's CLAIM INVENTORY, significance tier, and proof-route binding are a projection of the ratified gold set `goldset-v2-head/gold-set-proposal.user-product.json`, consumed as a checked-in artifact (read by a small projector script), never imported into the Go engine/runtime.
  The old hand-authored tree is reference for wording, not a structural constraint; this is a regeneration of the inventory layer, not a page-by-page port.

- FD2 — Anchor by `claimFingerprint`, never by line number.
  The gold set's `sourceRef: README.md:N` anchors are stale relative to HEAD (anchored at `558cda7`; doc edits in `3080482`/`3bc1b06` shifted lines) and the ratified verdicts deliberately carry by `claimFingerprint` (`ANCHOR.md` → "Re-anchor status").
  Fingerprint keying is the loose-coupling mechanism that keeps the projection from breaking on every doc edit; a slice that keyed on line numbers would re-introduce the brittleness the gold set already escaped.

- FD3 — Hybrid generate-vs-prose.
  GENERATE from the gold set: the claim inventory, the per-claim significance tier, the proof-route binding (which feeds the existing `surface-registry.json` + `evidenceSubstantive` audit floor), and the gold-set tier/verdict/route state.
  (This decision originally framed that state as what "the ledger and evidence-state pages currently restate by hand"; the Phase 2 Remainder note corrects that premise — those pages in fact carry distinct ownership/route/backlog lenses, so the projection ADDS this facet rather than replacing a hand-maintained table. The hybrid generate-vs-prose decision itself stands.)
  HAND-AUTHOR: the per-badge narrative persuasion prose on the apex page.
  Rejected: full-generate (loses the persuasion-prose quality the apex reading surface needs); all-hand (keeps the 3-axis drift this rewrite exists to remove).

- FD4 — Scope is the user-product track (74) only this rewrite.
  T1 (7) projects to the apex badge reading surface; T2/T3 project to the backing/detail views.
  The developer track (232, `gold-set-proposal.developer.json`) is deferred — the closeout states the user reading surface is epics + apex, and the dev track is a separate audience with its own HITL closeout.

- FD5 — The ratified maintainer verdict overrides the agent labels.
  The durable-graded set is `maintainerVerdict ∈ {accept, relabel, rewrite-source}` (56 entries; the 18 not-a-claim / retire-source / badly-bounded do not project as claims).
  For `relabel`, the projection must honor the corrected route, not `agentLabels.recommendedProof` verbatim (e.g. README:8 was relabeled deterministic → cautilus-eval per R6, recorded in the entry `note`).
  Where the corrected route lives only in prose `note` and not in a structured field, surfacing that override is PQ2.
  `not-a-claim` and `retire-source` verdicts mark prose to retire; some source trims already landed in `3080482`/`3bc1b06`.

- FD6 — The gate is already ON; the exit criterion is the projected tree green under it, and neutralizing `docs/specs/old/**` is first-slice (or pre-slice) work, not deferred.
  `lint:specs` was re-enabled in `f1b4fc4b`; this decision assumed the 11 archived `run:shell` blocks under `docs/specs/old/**` therefore run on every `npm run verify` and are a live risk.
  (Phase 3 reconciliation, 2026-06-20: that premise was empirically false. specdown traverses the link graph from the apex entry, and NOTHING reachable links to `docs/specs/archive/index.spec.md` — the only bridge to `old/` — so neither `old/**` (11 blocks) nor `archive/**` (1 block) is reached or executed; the fresh `lint:specs` report references zero `old/`/`archive/` files, and `check-specs.mjs` already skips both dirs. They were already inert via unreachability — but accidentally, so a future re-link would silently make all 12 blocks live again. Phase 3 closes that by adding a gated reachability guard in `check-specs.mjs` instead of fencing each block, turning accidental inertness into a guaranteed one.)
  The rewrite's done-signal is that the projected tree (apex + ledger + evidence views) passes the already-active `lint:specs` green; do not weaken or re-disable the gate to land intermediate slices.

- FD7 — The projector is a product-owned script, gold set stays an artifact.
  It lives under `scripts/` (mirroring the `surface-registry` / `build-surface-audit` pattern), keeps gold-set-specific logic out of the generic engine, and emits a checked-in projected inventory the spec pages and audit registry consume.

## Probe Questions

- PQ1 — Empirically resolved by the critique: the mapping is NOT 1:1 by `primaryEpic` (three T1 share `APEX`; epic vocabulary is disjoint from badge IDs; some badges have no T1 claim), so an explicit `fingerprint→badge` map is required.
  The residual probe is the exact contents of that map and whether T2 mechanisms also bind to badges, decided by the first slice's projector against the real data (AC1).
  RESOLVED (impl): the explicit map is `docs/specs/audit/claim-badge-map.json` (7 bindings, each with rationale) — the three APEX-epic claims route to distinct badges (`behavior-evaluation`, `claim-discovery`, `behavior-evaluation`), two different-epic claims (`-5`, `-67`) share `claim-discovery`, and `readiness`/`a-testable-agent` get no T1 headline claim (surfaced by the reconciliation, not hidden).
  T2 mechanisms do NOT bind to badges this slice; only T1 carries a badge.

- PQ2 — Where does the ratified proof route live for `relabel`/`rewrite-source` entries — only in the prose `note`, or in a structured field the projector can read deterministically?
  If only in prose, the projection needs a structured override surface (a small checked-in fingerprint→route map, or a one-time enrichment of the gold set) so the projector does not parse free text.
  Resolved during the first slice while reading the 56 durable-graded entries.
  RESOLVED (impl): only `claim-readme-md-8` (relabel) carries a route correction, and it lives ONLY in the prose `note` (`agentLabels.recommendedProof` keeps the pre-relabel `deterministic`); `claim-readme-md-54` (rewrite-source) corrects the source, not the route, so its `cautilus-eval` route needs no override.
  The structured override surface is `docs/specs/audit/claim-proof-route-overrides.json` (`claim-readme-md-8` → `cautilus-eval`, R6/R12); `resolveProofRoute` reads the override then falls back to `recommendedProof`, never the `note`.

- PQ3 — What exactly do the `ledger/` and `evidence/` pages become: fully generated views, or a thin generated state block plus retained prose?
  Expected: a generated tier/verdict/route state table per page, with the surrounding prose hand-authored, consistent with FD3.
  Resolved as the later phases project those pages.
  RESOLVED (impl, Phase 2 first slice): thin generated state + retained hand prose, implemented via the repo's established generate+check precedent (`render-claim-evidence-state.mjs` → a generated `.md`) rather than per-page injected regions.
  The generated tier/verdict/route/reconciliation state is rendered ONCE from the inventory into a standalone `docs/specs/evidence/projected-claim-state.md`, which the evidence index and the ledger index link to; the surrounding prose stays hand-authored in the existing `.spec.md` pages.
  This keeps generated content out of the executable spec graph (no fragile mixing with `run:shell`/link validation) and honors FD7 ("spec pages consume the projected inventory").
  The gold-set claim taxonomy (fingerprint/epic/badge) is distinct from the promise/rule ownership taxonomy the ledger tables carry, so those ownership tables legitimately stay hand-authored; what is now generated-once is the ratified tier/verdict/route claim state.

## Deferred Decisions

- Developer-track (232) projection — a separate audience with its own closeout; fold in after the user-product projection is proven.
- The gold set's line re-anchor to HEAD — verdicts carry by `claimFingerprint`, so the mechanical renumber folds into the next full both-track re-extraction, not this rewrite (`ANCHOR.md`).
- The audit residual semantic intent-judge (from the just-landed `evidenceSubstantive` floor) — orthogonal; the projection feeds the structural proof-route binding, not the semantic value judgment.
- CI Go-version pin freshness and improve `①a` — unrelated carried deferrals.

## Non-Goals

- Re-running HITL, re-extracting claims, or changing any ratified verdict; the gold set is consumed as-is.
- Touching the developer track or the gold set's line anchors.
- Flipping or re-proving any apex badge's honesty level; the audit gate stays the arbiter of proven/declared/promised.
- App-surface liveness or any Proof Debt item; this rewrite restructures the spec surface, it does not add new proof.

## Deliberately Not Doing

- A page-by-page port of the existing `docs/specs/` tree — the inventory layer is regenerated from the gold set; only prose is referenced.
- Importing the gold set into the Go engine/runtime — it stays a checked-in artifact behind a script (FD7).
- Restoring `lint:specs` before the projection is faithful — the gate returns as the exit criterion (FD6), not mid-flight.
- Parsing free-text `note` fields at runtime to recover proof routes — if the route is not structured, add a structured override surface first (PQ2).

## Constraints

- This session lands only this design artifact plus its critique; implementation is the next session.
- The projector is a new runtime surface: it needs executable tests and must clear the coverage floor under `npm run verify` when it lands.
- The gold set is consumed as a checked-in artifact; no repo-specific gold-set logic enters the generic engine/runtime.
- Anchor strictly by `claimFingerprint` (FD2).
- If the rewrite edits claim-source files (specs, AGENTS, scanners), run `npm run claims:refresh:all` before pushing; push stays the user's.
- The full specdown gate is currently disabled in `verify`; until FD6 restores it, rely on `npm run audit:surface:check` plus targeted `npm run lint:specs -- <file>` runs for spec checks.
- Any bug, error, or regression encountered during impl routes to `charness:debug` before further fixes.

## Success Criteria

- SC1 — A projector reads `gold-set-proposal.user-product.json`, filters to the 56 durable-graded entries, and emits a checked-in inventory keyed by `claimFingerprint` carrying `{significanceTier, ratifiedProofRoute, primaryEpic, summary, sourceRef, audience}`.
  Field paths (verified against the gold set): `significanceTier` is a TOP-LEVEL entry field (not under `agentLabels`); `recommendedProof`/`primaryEpic`/`claimAudience` are under `agentLabels`; `claimFingerprint`/`sourceRef`/`summary`/`maintainerVerdict`/`note` are top-level.
- SC2 — The 7 T1 claims project and bind to the 7 apex badges (PQ1 resolved), and the binding is asserted by a test, so a future gold-set change that drops or re-tiers a T1 claim is caught.
- SC3 — The apex badge proof routes (the `surface-registry.json` the audit gate consumes) are reconciled with the projected ratified proof routes — any divergence is surfaced, not silently tolerated.
- SC4 — DONE 2026-06-20. The ledger and evidence surface read a generated tier/verdict/route state from `docs/specs/evidence/projected-claim-state.md` (rendered once from the fingerprint-keyed inventory, linked from the evidence + ledger indexes), instead of maintaining claim state by hand.
  The "remaining SC4 work" (retire the hand-authored restatement + the not-a-claim/retire-source source prose) resolved to no-ops on reconciliation: no hand-maintained tier/verdict/route table existed to retire (the pages carry distinct non-subsumed lenses), and the FD5 source prose was already trimmed in `3080482` (`badly-bounded` deferred in `3bc1b06`), so no claim source changed and `claims:refresh:all` was not triggered.
  See the Phase 2 Remainder note for the full reconciliation.
- SC5 — DONE 2026-06-20. `docs/specs/old/**` proof blocks are inert and `lint:specs` is restored in `run-verify.mjs`, green over the projected tree (the exit criterion, FD6).
  Reconciliation: the blocks were already inert (unreachable from the apex entry), and `lint:specs` was already in the verify PHASES; Phase 3 made the inertness a gated guarantee by adding a reachability guard to `check-specs.mjs` (+ tests) that fails the gate if the apex graph ever reaches `old/**` or `archive/**`.
- SC6 — Throughout, no ratified verdict is altered and no badge honesty level changes without the audit gate agreeing.

## Acceptance Checks

- AC1 (SC1/SC2) — first slice: a projector script + test that emits the fingerprint-keyed inventory and asserts exactly the 7 T1 entries project, each bound to an apex badge via the explicit `fingerprint→badge` map (NOT by `primaryEpic`, which collides 3-way on APEX), and that the 56-vs-18 graded/non-graded split matches the closeout (accept 54 + relabel 1 + rewrite-source 1 = 56, all tiered; not-a-claim 11 + retire-source 5 + badly-bounded 2 = 18, all untiered).
- AC2 (SC2) — a regression test asserts that dropping or re-tiering a T1 claim in the projected inventory fails (the projection is load-bearing, not decorative).
- AC3 (PQ2) — the projector resolves the ratified proof route for the `relabel` and `rewrite-source` entries deterministically (from a structured field or a checked-in override surface), never by parsing the prose `note`; a test pins the README:8 relabel route.
- AC4 (SC3) — a check reconciles the projected ratified proof routes against `surface-registry.json`; any divergence is reported.
- AC5 (SC5) — DONE: `docs/specs/old/**`'s 11 `run:shell` blocks no longer execute under specdown (they never did at HEAD — unreachable from the entry), `npm run verify` stays green with `lint:specs` over the projected tree, and the new `check-specs.mjs` reachability guard + its two tests pin that the apex graph cannot reach `old/**`/`archive/**` (a re-link fails the gate instead of silently executing the archived blocks).
- AC6 — `npm run verify` and `npm run test` stay green at every slice boundary; the projector clears the coverage floor.

## Critique

A bounded fresh-eye subagent critique is delegated before this contract is treated as final, per the repo's subagent-delegation rule; its returned status is recorded here and in the closeout.
`plan_risk_interrupt` is consulted; no forced debug interrupt is expected for a design-only slice.

Load-bearing risks the critique should probe:
whether "project, don't patch" is the right primitive or whether a hybrid that keeps more hand-authored structure is safer given the gold set's stale line anchors;
whether `claimFingerprint` is genuinely stable across the doc edits already applied (`3080482`/`3bc1b06`) or whether some T1 fingerprints have already drifted, which would undercut FD2;
whether the 7-T1 → 7-badge mapping is actually 1:1 or whether several claims share a badge (PQ1), since the first slice's acceptance depends on it;
the relabel-override risk (FD5/PQ2) — that the ratified route may only exist in prose, making deterministic projection harder than assumed;
and the sequencing — that restoring the gate as the exit (FD6) does not leave the surface unguarded for too long, and whether an interim targeted-spec gate should run during the rewrite.

A bounded fresh-eye Sonnet subagent critique returned READY-WITH-EDITS with no blocker (2026-06-20), empirically verified against the gold set, apex, and `run-verify.mjs`.
It confirmed the load-bearing mechanism: `claimFingerprint` is a frozen key in the artifact (not recomputed from drifting source), so FD2 holds even though four T1 source lines have already drifted at HEAD; and the 56/18 graded/non-graded split and T1=7/T2=41/T3=8 tiers are exact.
It caught and corrected four things, all folded above: (1) the stale gate premise — `lint:specs` is ON again (`f1b4fc4b`) and `docs/specs/old/**` runs 11 live `run:shell` blocks every verify, so neutralizing them is early not deferred (FD6/AC5, Problem); (2) the T1→badge mapping is NOT 1:1 — three T1 share `primaryEpic: APEX` and epic vocabulary is disjoint from badge IDs, so an explicit `fingerprint→badge` map is mandatory (Problem/PQ1/AC1); (3) the `relabel` route for `claim-readme-md-8` is prose-only (`agentLabels.recommendedProof` keeps the pre-relabel `deterministic`), so the structured override surface is day-one work (FD5/AC3/First Slice step 2); (4) `significanceTier` is a top-level entry field, not under `agentLabels` (SC1).
No edit changed the spec's direction; they sharpen the first slice so the next session starts from the real data, not a rosier picture.

## Canonical Artifact

This document is canonical during implementation.
The next session picks it up via the handoff Workflow Trigger; the durable evidence record and handoff realignment land as the rewrite slices close.

## First Implementation Slice

For the next session — a read-only projection seam with zero gate change, chosen to de-risk PQ1/PQ2 before any page or gate moves.

1. Write `scripts/<projector>.mjs` (pure core + thin fs shell, mirroring `surface-audit-lib` + `build-surface-audit`) that reads `gold-set-proposal.user-product.json`, filters to the 56 durable-graded entries, and emits a checked-in fingerprint-keyed inventory artifact with `{significanceTier, ratifiedProofRoute, primaryEpic, summary, sourceRef, audience}`.
2. Add the structured override surface BEFORE writing the projector (confirmed mandatory): for `claim-readme-md-8` the ratified route is prose-only — `agentLabels.recommendedProof` stays `deterministic` (the pre-relabel value) and the corrected `cautilus-eval (dev/skill)` lives only in `note` — so a small checked-in `claimFingerprint→ratifiedProofRoute` override map is required (AC3); also build the explicit `fingerprint→badge` map (AC1).
3. Unit-test the projector: the 7 T1 entries project and bind to the 7 apex badges (AC1), the graded/non-graded split matches the closeout, and the README:8 relabel route is pinned (AC3); add the load-bearing regression (AC2).
4. Reconcile the projected routes against `surface-registry.json` and report divergence (AC4) — read-only, no registry edit yet.
5. `npm run verify` + `npm run test` green; clear the coverage floor; record a short evidence note. No spec page or `lint:specs` change in this slice.
