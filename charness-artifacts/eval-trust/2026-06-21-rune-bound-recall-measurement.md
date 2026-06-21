# Rune upper-bound recall gap in claim extraction (2026-06-21)

Measurement date: 2026-06-21.
Question (item 2, handoff "Next Session"): real product capability claims (the README GEPA seam, spec promises) disappear from discovery because of length. Is the `claimLineLooksUseful` upper bound (`> 260` runes) too tight, and does relaxing it flood the population with noise?

Cheap, fully deterministic measurement (no LLM). Method: a throwaway test (`internal/runtime/zz_runebound_measure_test.go`) walks the real claim source population via `resolveClaimDiscoveryConfig` + `discoverClaimSources`, runs the real `claimTextBlocks`, applies every `claimLineLooksUseful` filter **except** the upper bound, and isolates blocks dropped *solely* by `> 260`, classifying each with the real `classifyClaimLine`.

## The bound and why blocks are single sentences

`claimLineLooksUseful` (`claim_discovery.go`:1402): `if runeCount < 20 || runeCount > 260 { return false }` on the normalized block text.
`claimTextBlocks` flushes a block on a blank line, a table/`---` line, a new list/heading start, **and when the previous line ends with `.`/`?`/`!`** (`previousLineEndsClaimBlock`).
The repo writes prose with semantic line breaks (one sentence per line; CLAUDE.md), so a block is almost always a **single sentence**. The 260 upper bound therefore filters single-sentence length, not multi-claim concatenation.

## Recall gap (before)

| metric | value |
| --- | --- |
| useful-shaped blocks (lexicon + shape filters, runes ≥ 20) | 929 |
| of those, ≤ 260 runes (currently kept) | 815 |
| **dropped *solely* by `> 260`** | **114** |
| — of which carry a portable route (`classifyClaimLine` ok) | **76** |
| — of which route-unclassified (mostly fixture-path noise) | 38 |

Dropped-block route distribution (would-be route if extracted):

| would-route | n |
| --- | --- |
| deterministic | 32 |
| cautilus-eval | 25 |
| human-auditable | 19 |
| (unclassified) | 38 |

Rune buckets of the dropped 114: 261–300 → 46, 301–360 → 27, 361–480 → 20, > 480 → 21. Largest dropped block: 1089 runes (`audit.spec.md`:57, a real `deterministic` claim). No dropped block is garbage.

## Decisive interaction: the route filter, not the length bound, is the noise gate

This repo's adapter (`.agents/cautilus-adapter.yaml`) declares **no `claim_lexicon_terms`**.
So in `claimLineLooksUseful`, `adapterMatched` is always false → `extractClaimCandidates`'s `adapterLexiconFallbackClassification` lane (1261) never fires here.
A block that `classifyClaimLine` cannot route is dropped regardless of length.

Consequence: **relaxing the upper bound recovers only the 76 routable claims; the 38 unclassified noise blocks (the `live-run-invocation*.md` "X example at [fixtures/…] validates against [fixtures/…]" acceptance-check lines) stay dropped by the existing no-route filter.** Raising the bound does not flood the population with that noise.

## Sample of high-value dropped claims

- `README.md`:140 (280 runes) — the GEPA-style bounded-prompt-search **capability claim**; routes `deterministic` (R12). Dormant only because of length — this is the handoff's "R12 correct-but-dormant" archetype.
- `docs/specs/contracts/binary-skill-boundary.spec.md`:17 (305) — binary/agent ownership boundary; `human-auditable`.
- `docs/specs/promises/evaluation.spec.md`:22 / :38 / improvement.spec.md:17 — live-proof promise claims; `deterministic`/`cautilus-eval`.
- `docs/specs/promises/claim-discovery.spec.md`:14 (323) — the Pass-1 high-recall promise itself; `deterministic`.

## Finding

The `> 260` upper bound contradicts the encoded high-recall Pass-1 intent (`claim-discovery.spec.md`:14, "intentionally accepts false positives so it does not miss declared promises"; workflow contract: "high-recall inventory"). It silently drops 76 real declared promises, disproportionately the longest/most carefully worded capability and promise claims, while the actual length-correlated noise is already gated separately by the route filter.

Maintainer decision (2026-06-21): remove the tight upper bound; keep a high pathological-input sanity cap only. Build contract: [2026-06-21-rune-bound-recall.spec.md](./2026-06-21-rune-bound-recall.spec.md).

## After: bound relaxed to 2000-rune cap + `" ships "` lexicon term added (2026-06-21)

A debug pass (`charness-artifacts/debug/2026-06-21-r12-ships-lexicon-gate-dead.md`) found the bound was not the only filter dropping the GEPA seam: R12 (`capabilityExistenceClaim`) keys exclusively on `" ships "`, which was absent from `defaultClaimLexiconTerms`, so R12 was structurally dead on the live path regardless of length. The ratified fix is therefore two portable defaults: (1) upper bound `260 → 2000` sanity cap, (2) add `" ships "` to the lexicon. Both kept deterministic.

Re-measured after `npm run claims:refresh:all`:

| metric | before (R6/R12 final) | after (this slice) |
| --- | --- | --- |
| total live candidates | 397 | **476** (+79) |
| deterministic | 148 | **183** (+35) |
| cautilus-eval | 145 | **170** (+25) |
| human-auditable | 104 | **123** (+19) |
| overlap vs answer key | 48 | **54** |
| overlap agreeing **count** | 26 | **30** |
| over-correction signature (live `deterministic`, key `human-auditable`) | 0 | **0** |
| GEPA seam `claim-readme-md-140` route | absent | **deterministic** (ready-for-proof) |

Of the +79 total, **+77 is the item-2 mechanism** (76 recovered by the bound relax — 32 deterministic, 25 cautilus-eval, 19 human-auditable — plus 1 GEPA seam recovered by `" ships "`); the remaining **+2 deterministic** are claim-shaped sentences in this slice's own in-slice contract realignment (`claim-discovery-workflow.md`, `facet-decomposition.md`), the same self-extraction effect the R6/R12 slice noted. Neither of the +2 falls in the answer-key overlap, so the overlap (54) and agreeing count (30) are unchanged by them.

All binding gates met:

- **G1 (R12 lives):** `claim-readme-md-140` (README.md:140) now extracts and routes `deterministic`. R12 fired live for the first time.
- **G2 (recall, route-clean):** +77 candidates = 76 recovered by the bound relax (32 deterministic, 25 cautilus-eval, 19 human-auditable) + 1 recovered by `" ships "` (the GEPA seam). Every newly-admitted candidate carries a portable route; no route-unclassified block entered the population.
- **G3 (no overlap regression):** the agreeing count rose 26 → 30 (the recall fix also improved accuracy — 4 recovered claims match the ratified `deterministic` key). The denominator grew 48 → 54 as predicted (recovered fingerprints joined the overlap).
- **G4 (noise gate intact):** 0 `live-run-invocation*.md` fixture-path acceptance-check lines entered the population — the route filter, not the length bound, gates noise (confirmed: this repo declares no `claim_lexicon_terms` and no `proof_route_hints`, so the no-route drop is the operative gate).
- **G5 (sanity cap works):** the largest admitted summary is 1089 runes; 0 blocks exceed the 2000-rune cap (so the cap drops nothing real here — it is pure pathological-input defense).

Residual after this slice (Fork B / item 1 target): the overlap disagreements are now `cautilus-eval → deterministic` ×10 (the eval over-assignment), `human-auditable → deterministic` ×9 (R6/R12 did not flip these), `deterministic → cautilus-eval` ×5. The dominant `cautilus-eval → deterministic` class is the Fork B per-facet target.

## Reproduction

Throwaway measurement test (removed after the slice):

```
go test ./internal/runtime/ -run TestMeasureRuneUpperBoundRecall -v
```

Live distribution: `jq -r '[.claimCandidates[]?.recommendedProof] | group_by(.) | map({route:.[0],n:length})[] | .route+" "+(.n|tostring)' .cautilus/claims/latest.json`
