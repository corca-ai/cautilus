# Build contract: relax the claim-extraction rune upper bound to honor high-recall Pass 1 (2026-06-21)

Pairs with the measurement [2026-06-21-rune-bound-recall-measurement.md](./2026-06-21-rune-bound-recall-measurement.md).
Slice shape ratified by the maintainer (2026-06-21): **remove the tight upper bound; keep only a high pathological-input sanity cap.**
Canonical living contract this realigns: [docs/contracts/claim-discovery-workflow.md](../../docs/contracts/claim-discovery-workflow.md):189 ("20–260 sentence budget").

## Problem

`claimLineLooksUseful` (`internal/runtime/claim_discovery.go`:1402) drops any claim-shaped block whose normalized text is `> 260` runes.
Because `claimTextBlocks` flushes on sentence-ending punctuation and the repo writes prose with semantic line breaks (one sentence per line), a "block" is almost always a **single sentence** — so the upper bound is a length filter on single sentences, not a guard against multi-claim concatenation.

Measured 2026-06-21 against the real claim source population (`internal/runtime/zz_runebound_measure_test.go`, throwaway):

- 929 useful-shaped blocks (lexicon + shape filters, runes ≥ 20); 815 are ≤ 260.
- **114 blocks are dropped *solely* by the `> 260` upper bound.**
- Of those 114, **76 carry a portable route** (`classifyClaimLine` returns ok) — genuine promise/capability claims, including the README GEPA-seam capability claim (`claim-readme-md-140`, 280 runes), `binary-skill-boundary` ownership (305), and many `evaluation`/`improvement`/`claim-discovery` spec promises.
- The other 38 are route-unclassified — mostly `docs/contracts/live-run-invocation*.md` "Acceptance Checks" fixture-path lines ("X example at [fixtures/…] validates against [fixtures/…]"). These are noise.

Root-cause interaction (decisive): **this repo's adapter declares no `claim_lexicon_terms`**, so `claimLineLooksUseful`'s adapter-lexicon return is always false, so the `adapterLexiconFallbackClassification` lane in `extractClaimCandidates` (1261) never fires here.
Therefore a block that `classifyClaimLine` cannot route is dropped regardless of length.
**Relaxing the upper bound recovers only the 76 routable claims; the 38 unclassified noise blocks stay dropped by the existing no-route filter.**
The route filter, not the length bound, is the real noise gate.

This contradicts the already-encoded design intent: `claim-discovery.spec.md`:14 pins Pass 1 as high-recall — "it intentionally accepts some false positives so it does not miss declared promises" — with Pass 2 (the Cautilus Agent) curating false positives. A tight 260 upper bound silently drops 76 real declared promises, the opposite of high-recall Pass 1.

The longest dropped block observed is 1089 runes (`audit.spec.md`:57, a real `deterministic`-routed claim); no dropped block is garbage.

## Current Slice

Replace the `> 260` upper bound with a high sanity cap that exists only to reject runaway block accumulation from malformed / non-prose input — not to bound claim length.
The lower bound (`< 20`, fragment guard) is unchanged.
Realign the workflow contract in the same slice.

## Fixed Decisions

1. **Upper bound → `2000` runes (sanity cap, not a claim-length bound).**
   `2000` is ≈2× the largest observed real claim (1089), so it never threatens a real single sentence; it only catches a block that accumulated many lines without a sentence break (malformed prose, non-prose pasted blob).
   The lower bound stays `< 20`.
2. **No new noise filter ships.**
   The recovered population is gated by the existing `classifyClaimLine` route filter (no route + no adapter lexicon → dropped), proven by the 38 unclassified blocks staying out. We do **not** add a fixture-path or acceptance-check filter in this slice — that would be unmeasured scope creep, and Pass 2 owns residual false-positive curation by design.
3. **R12 needs BOTH the bound relax AND a lexicon term (debug 2026-06-21).**
   A debug pass (`charness-artifacts/debug/2026-06-21-r12-ships-lexicon-gate-dead.md`) found R12 (`capabilityExistenceClaim`) keys exclusively on `" ships "`, which was absent from `defaultClaimLexiconTerms` — so R12 was structurally dead on the live path regardless of length (even a <260 `" ships "` line was dropped at the gate). The handoff's "dormant only because of length" premise was incomplete. Fix is therefore two portable defaults: the bound relax **plus** adding `" ships "` to `defaultClaimLexiconTerms` so R12's verb reaches the router it already handles. The frozen golden (`TestClaimClassificationPortableDefaultsAreFrozen`) is updated in-slice. No `classifyClaimLine` change.
4. **Tests in the same slice** (mirror existing claim-discovery test structure):
   - recall-positive: the GEPA-seam block (a 280-rune capability-existence line) is now `useful` and routes `deterministic` — a fixture-level assertion, not a snapshot of repo counts;
   - sanity-cap negative: a synthetic `> 2000`-rune block is dropped;
   - noise-stays-dropped control: a `> 260` block that `classifyClaimLine` cannot route and that matches no adapter lexicon is still excluded (proves the route filter, not the length bound, gates noise);
   - lower-bound preserved: a `< 20` fragment is still dropped.
5. **Contracts realigned in-slice (critique 2026-06-21):**
   - `docs/contracts/claim-discovery-workflow.md`:189 — replace "20–260 sentence budget" with the relaxed bound and its rationale (sanity cap, route filter is the noise gate).
   - `docs/contracts/facet-decomposition.md`:63 — the "R12 is correct-but-dormant here because its gold example exceeds the 260-rune extraction bound" sentence becomes false once G1 holds; realign it to "R12 now fires live on the recovered GEPA-seam claim."
   - Update the `claimLineLooksUseful` summary note (`internal/runtime/claim_discovery.go`:324, the `extraction-input`/template implementation-function summary) if it pins 260.
6. **Re-measure after impl:** record before/after live route distribution, the count of newly-recovered claims, the R6/R12 48-fingerprint overlap agreement (must not drop), and the GEPA-seam dormant→live transition in the paired measurement artifact. Run `npm run claims:refresh:all` (engine change alters the extracted population; `latest.json` records source state).

## Falsifiable Gates (binding)

- **G1 (R12 lives):** `claim-readme-md-140` (GEPA seam, README.md:140) appears in `.cautilus/claims/latest.json` with `recommendedProof: deterministic`. Before: absent.
- **G2 (recall, route-clean):** the live population grows by the count of newly-recovered routable blocks (~76, exact number recorded), and **every** newly-admitted candidate carries a portable route — i.e. no route-unclassified block is admitted (the 38 noise blocks stay out).
- **G3 (no overlap regression), count-based (critique 2026-06-21):** the R6/R12 overlap **agreeing count (26)** does not decrease. Count is the real signal — the prior slice already shrank the denominator 49→48 via an in-slice doc-fingerprint change, and this slice also realigns docs, so the denominator may shift by ±1; the agreeing count must not drop. The ≤260 fingerprints' routes are bit-for-bit untouched, so the agreeing count can only hold or rise.
- **G4 (noise gate intact):** none of the `live-run-invocation*.md` fixture-path acceptance-check lines enter the live population.
- **G5 (sanity cap works):** a synthetic >2000-rune block is rejected by `claimLineLooksUseful`.

## Non-Goals / Deliberately Not Doing

- NOT adding a fixture-path / acceptance-check noise filter (Pass 2 curates; unmeasured here).
- NOT changing `classifyClaimLine` routing (Fork B / item 1 owns residual `cautilus-eval → deterministic`).
- NOT making the bound adapter-tunable — length is not a repo-varying convention; a portable sanity cap is correct.
- NOT fixing the pre-existing byte-slice excerpt truncation in `truncateReviewSourceRefs` (`claim_discovery.go`:~3318, `excerpt = excerpt[:excerptChars]` is a byte slice, not rune slice — can split a multibyte rune in review-input rendering). Flagged by the spec critique: it is pre-existing, on the review-input path (not the extraction path this slice touches), and relaxing the bound only marginally raises its hit probability for non-ASCII content. Recorded as a follow-up, not expanded into this slice.
