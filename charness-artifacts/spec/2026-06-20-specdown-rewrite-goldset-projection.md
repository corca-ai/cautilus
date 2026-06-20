# Specdown rewrite: the spec surface as a projection of the HITL-ratified gold set

Status: spec (canonical during implementation), 2026-06-20.
Design + critique only this session; implementation is the next session's pickup (maintainer instruction).
Decision route: the maintainer accepted the "project, don't patch" approach with the hybrid generate-vs-prose split, user-product track only, and `claimFingerprint` anchoring (this session's recommendation, ratified by "ok 이거").

First Implementation Slice — LANDED 2026-06-20 (read-only projector, zero gate/page change).
The projector, the explicit `fingerprint→badge` map, the structured proof-route override surface, the generated fingerprint-keyed inventory, the reconciliation, and the AC1–AC4 tests are in; `npm run verify` is green (AC6).
PQ1 and PQ2 are resolved against the real data (see below); evidence: `charness-artifacts/findings/2026-06-20-specdown-goldset-projection-first-slice.md`.
Remaining phases (the 2-axis ledger/evidence collapse, `docs/specs/old/**` neutralization + `lint:specs` exit criterion) are unchanged and still owned by SC4/SC5/AC5.

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
  GENERATE from the gold set: the claim inventory, the per-claim significance tier, the proof-route binding (which feeds the existing `surface-registry.json` + `evidenceSubstantive` audit floor), and the badge/tier state that the ledger and evidence-state pages currently restate by hand.
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
  `lint:specs` was re-enabled in `f1b4fc4b`, so the 11 archived `run:shell` blocks under `docs/specs/old/**` already run on every `npm run verify` — make them inert (delete or fence them) early because they execute live CLI commands that a CLI or spec-tree change can break.
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
- SC4 — The ledger and evidence-state pages present a generated tier/verdict/route state derived from the projection, removing the 3-axis hand-maintained divergence (later phase).
- SC5 — `docs/specs/old/**` proof blocks are inert and `lint:specs` is restored in `run-verify.mjs` (+ test), green over the projected tree (the exit criterion, FD6).
- SC6 — Throughout, no ratified verdict is altered and no badge honesty level changes without the audit gate agreeing.

## Acceptance Checks

- AC1 (SC1/SC2) — first slice: a projector script + test that emits the fingerprint-keyed inventory and asserts exactly the 7 T1 entries project, each bound to an apex badge via the explicit `fingerprint→badge` map (NOT by `primaryEpic`, which collides 3-way on APEX), and that the 56-vs-18 graded/non-graded split matches the closeout (accept 54 + relabel 1 + rewrite-source 1 = 56, all tiered; not-a-claim 11 + retire-source 5 + badly-bounded 2 = 18, all untiered).
- AC2 (SC2) — a regression test asserts that dropping or re-tiering a T1 claim in the projected inventory fails (the projection is load-bearing, not decorative).
- AC3 (PQ2) — the projector resolves the ratified proof route for the `relabel` and `rewrite-source` entries deterministically (from a structured field or a checked-in override surface), never by parsing the prose `note`; a test pins the README:8 relabel route.
- AC4 (SC3) — a check reconciles the projected ratified proof routes against `surface-registry.json`; any divergence is reported.
- AC5 (SC5) — early in the rewrite (because `lint:specs` is already on): `docs/specs/old/**`'s 11 `run:shell` blocks no longer execute under specdown, and `npm run verify` stays green with `lint:specs` over the projected tree.
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
