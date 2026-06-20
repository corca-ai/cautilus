# Specdown rewrite — Phase 3: old/** inertness made a gated guarantee

Date: 2026-06-20 (execution session).
Spec (canonical): `charness-artifacts/spec/2026-06-20-specdown-rewrite-goldset-projection.md` (FD6, SC5, AC5).
Follows the SC4 close (`b082597a`).

## Premise FD6 asserted vs. reality

FD6 / the Problem statement said `lint:specs` was re-enabled in `f1b4fc4b`, so the 11 archived
`run:shell` blocks under `docs/specs/old/**` "already run on every `npm run verify`" and are a live
risk during the rewrite — make them inert early.

Empirically false (the second false premise this rewrite carried, after FD3's):

- specdown traverses the **link graph** from the apex entry (`specdown.json` entry =
  `docs/specs/index.spec.md`).
- The only link into `old/` is `docs/specs/archive/index.spec.md` → `../old/index.spec.md`, and
  **nothing anywhere in `docs/` links to `archive/index.spec.md`** — so `archive/**` and `old/**`
  are unreachable from the apex.
- The fresh `npm run lint:specs` report (`.artifacts/specdown/report.json`, 21:50) executed 46 reachable
  spec files and referenced **zero** `old/` and **zero** `archive/` files.
- `check-specs.mjs` `listSpecFiles()` already skips `old` and `archive` for orphan validation.
- No npm script or second specdown config targets `old/` (the only `entry` config is `specdown.json`).

So the 11 blocks were already inert — but **accidentally**: the inertness rests on nobody linking
`archive/index.spec.md` (or an `old/*.spec.md`) back into the reachable graph. A future re-link would
silently make all 12 archived blocks (`old/` ×11 + `archive/` ×1) execute live CLI commands against the
binary on every gate — exactly the risk FD6 named.

## What landed (maintainer-chosen: gated reachability guard, not per-block fencing)

- `scripts/check-specs.mjs`: a reachability guard in `checkSpecs` that fails when the apex link graph
  reaches any spec under `docs/specs/old/` or `docs/specs/archive/`, with a message telling the editor
  to remove the link or de-archive the page deliberately. Runs on every `lint:specs` (full and focused
  target mode), so `npm run verify` enforces it.
- `scripts/check-specs.test.mjs`: two new tests — (1) a reachable spec linking `old/index.spec.md` fails
  with the guard message; (2) archived specs that exist on disk but stay unreachable still pass.
- No edits to the archived prose: inertness is now a **gated guarantee** rather than fence-by-fence
  patching, and it also catches archived blocks added in the future, not just today's 12.

## Why a guard over fencing

Fencing (`run:shell` → `bash`) only neutralizes the 12 current blocks; a guard catches the actual
failure mode (re-linking the archive into the apex graph) for any archived block, present or future,
without churning archived prose, and adds an executable proof of inertness (repo rule: new runtime
surface gets a test).

## Verification

- `node --test scripts/check-specs.test.mjs`: 6/6 pass (4 pre-existing + 2 new guard tests).
- `npm run lint:specs`: green (43 spec checks; guard passes because `old/`/`archive/` stay unreachable).
- `npm run verify`: green, all 21 phases (307s); coverage floor cleared (`check-specs.mjs` 81.28% > 77.33% floor).
- Fresh-eye Sonnet critique (foreground subagent): READY-WITH-EDITS, no blocker. Independently verified the
  guard correctness, both reconciliations (SC4 nothing-to-delete; old/ unreachable via report + link-graph
  trace), spec-realignment honesty, and SC6 badge integrity (audit unchanged; refresh `candidateCount` 398).
  Two non-blocking edits applied: the `old//archive/` error-message typo and these evidence placeholders.
  Noted limitation: the guard's `.spec.md`-only traversal does not model a non-`.spec.md` intermediary link,
  but the two generated non-spec pages carry no outbound links, so it is currently unexploitable (handoff note).

## Spec realignment

FD6 premise corrected (the blocks never ran — unreachable); SC5 and AC5 marked DONE with the
reconciliation and the guard recorded. No ratified verdict or badge honesty level changed (SC6).
