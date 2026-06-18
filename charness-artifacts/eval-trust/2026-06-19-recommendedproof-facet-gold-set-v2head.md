# recommendedProof facet gold-set proposal — regenerated against the HEAD answer key (D3 v2)

Status: agent-proposed, 2026-06-19, pending maintainer ratification (single labeler).
Every facet decomposition below is a proposal; record corrections in the JSON sibling (`maintainerVerdict` per entry), and tallies are recomputed after ratification, not hand-edited.

## Why this regeneration exists

The first D3 facet gold set (`2026-06-10-recommendedproof-facet-gold-set-proposal.{md,json}`) was measured against packet commit `2a75d88c`, which is now **108 commits behind HEAD**.
Since then the docs were rewritten and the 5-source corpus was blind re-extracted and HITL-ratified into `goldset-v2-reextract-head` (375 entries, ratified 2026-06-18).
A spot check confirmed the drift concretely: only 3 of 7 sampled D3 claimIds still exist in the current claim population, so ratifying the old proposal as-is would ratify facet decompositions of text that no longer exists at HEAD.
The maintainer chose to regenerate the facet gold set against the HEAD answer key rather than ratify the stale one.

What the HEAD answer key already carries and what it does not:
it carries per-*claim* `recommendedProof` verdicts (accept/relabel) and per-claim *epic* facets, but it does **not** carry the per-*facet* `recommendedProof` decomposition that per-facet routing wiring needs.
That gap is the reason this artifact still exists; only its population and its routing rules are refreshed to HEAD.

## What carries forward from the 2026-06-10 D3 set

Carried forward as **method** (the portable part the original proposal already flagged):
the per-facet schema and facet vocabulary, the verdict scheme (exact / too-coarse / wrong), and the recurring claim-shape patterns (ownership sentences, rationale bullets, definitions, doc-placement rules).

Re-derived on the current population (not carried forward):
the labels themselves and the measured accuracy rates.

## Answer key, population, and selection

- Answer key: `goldset-v2-reextract-head/gold-set-proposal.json` — 375 ratified entries (accept 346 / relabel 19 / not-a-claim 10), operative template `b922fd5d`, source anchor `628ccc7`.
- Gold population for sampling: the 365 gold claims (accept + relabel); not-a-claims are excluded by the HITL, so this facet gold set inherits a clean claim population — a measurable improvement over the 2026-06-10 set, which had to spend one entry on a rejected-alternative bullet that discovery mis-extracted.
- Stratification: by the blind extractor's per-claim `recommendedProof` (the analog of the old heuristic tag — the thing being graded). Gold-population distribution: deterministic 277, human-auditable 51, cautilus-eval 37.
- Selection rule (same as D3): per route, sort by claimId, pick indices `round(i*(n-1)/11)` for `i` in 0..11 (12 per route, 36 total).

## Ratified routing rules applied (the methodological evolution vs 2026-06-10)

The decompositions apply the HEAD answer key's ratified **R6/R12** discriminators, which postdate the 2026-06-10 D3 set.
R6/R12: an ownership, boundary, or sequencing assignment — or a static repo-owned check that could prove a capability — routes **deterministic**, because the actual agent behavior is a *different* claim's content.
So an ownership clause is **not** split off into a phantom `[deterministic] stated-in-doc` + `[cautilus-eval] actually-does-it` pair the way the 2026-06-10 set did.
This collapses several D3-era "too-coarse ownership splits" back to exact-deterministic; `claim-docs-contracts-claim-extraction-template-md-18` is the clearest case (the "agent does the model-backed work" clause is a seam boundary, not a behavior facet).
This is the single biggest reason the regenerated tallies are cleaner than 2026-06-10's, and it is a real rule change, not a labeler mood difference.

## Computed tallies (pre-ratification)

Verdict compares the proposed dominant facet route against the blind per-claim `recommendedProof`.

| blind route | n | exact | too-coarse | wrong |
|---|---|---|---|---|
| deterministic | 12 | 12 | 0 | 0 |
| cautilus-eval | 12 | 2 | 7 | 3 |
| human-auditable | 12 | 6 | 3 | 3 |
| **all** | 36 | 20 | 10 | 6 |

- Dominant-correct (per-claim route == dominant facet route): **30/36 (83%)**, versus the 2026-06-10 set's 18/35 (51%).
- Facet route counts across all entries: 43 deterministic, 14 human-auditable, 10 cautilus-eval — even in a sample stratified to over-represent the two non-deterministic routes, genuinely-semantic facets are the minority.

The accuracy jump is consistent with the proof-route measurement: the operative template v2 plus the ratified R6/R12 discipline reduced both the `cautilus-eval` over-assignment and the `human-auditable`-hides-deterministic pattern that dominated the 2026-06-10 set.

## Cross-check against the ratified per-claim relabels

The sample contains the 3 ratified relabels (`cet-261`, `cet-68`, `cdw-82`).
All 3 land as **wrong** in the facet verdict, each in the same direction as the maintainer's per-claim relabel:
`cet-261` eval→human, `cet-68` eval→deterministic, `cdw-82` human→deterministic.
The facet decomposition agreeing with every ratified relabel in the sample is the validity check that the routing is not drifting from the answer key.

## The high-value review targets: facet view diverges from ratified per-claim accept

Three entries were ratified **accept** at the per-claim level but the facet view proposes a different dominant route.
These are the entries where the maintainer's facet ratification matters most, because they test whether per-facet granularity is sharper than the accepted per-claim route or whether the proposal is over-routing.

- `claim-docs-contracts-claim-discovery-workflow-md-23` ("primary user flow starts from an agent session") — ratified accept-as-`cautilus-eval`; facet view says dominant **human-auditable** (an R16/R9 positioning premise) with no substantive eval facet. The ratified note itself flagged it "borderline R16/R9 positioning premise," which supports the divergence. Dominance debatable.
- `claim-docs-internal-working-patterns-md-45` ("rejected/not-done decisions live only under explicit decision-section headings") — ratified accept-as-`human-auditable`; facet view says dominant **deterministic**, because this *is* the `non_claim_section_headings` placement rule that a scanner already enforces. Directly relevant to the classification_hints wiring. Dominance debatable.
- `claim-docs-internal-working-patterns-md-61` ("cross-cutting concerns are not exposed in AOP terms in public docs") — ratified accept-as-`human-auditable`; facet view says dominant **deterministic** (a negative lexical check: no AOP vocabulary in public docs), with the positive "speak concretely" as the human half. Dominance debatable.

## Patterns the regeneration surfaces (to verify in review)

1. `deterministic` is now essentially fully reliable on this corpus (12/12 exact), up from 8/12. The operative template v2 plus R6/R12 stopped splitting ownership/seam clauses into phantom eval facets.
2. `cautilus-eval` over-assignment shrank but did not vanish: 5 of 12 are misroutes (3 wrong + the 2 that are too-coarse only because a deterministic facet hides under a genuine eval dominant), down from the 2026-06-10 set where 8 of 12 were wrong. `cet-68` is the measured `claim-extraction-template` documented-content residual (route a template-content fact as behavior) that MEASUREMENT.proof-route.md flagged at 8.75%.
3. `human-auditable` is correct far more often here (6/12 exact) because the `working-patterns.md`-heavy sample contains genuine operating-policy and process claims that are correctly human; the 3 misroutes are doc-placement and lexical-constraint claims that hide a deterministic check (pattern 2).
4. Every claim whose dominant facet is `cautilus-eval` still carries at least one deterministic (or human) facet underneath, consistent with the facet-decomposition template's core rule — except the two pure-behavior eval claims (`wp-10`, `readme-60`), which are exact precisely because they have no separable mechanical facet.
5. No not-a-claim entries, because the HITL already removed them from the gold population — the facet gold set inherits the answer key's curation discipline instead of re-litigating it.

## How to review

The durable thing under review is each entry's **facet decomposition** (the facets and their routes); dominant route and tag verdict are derived scoring.
Confirm or correct the facet list and routes in the JSON sibling (`maintainerVerdict` per entry); flag any facet that is missing, mislabeled, or not honestly checkable on its proposed route.
Start with the 3 divergence entries above and the 7 `dominanceConfidence: debatable` entries (`cdw-23`, `cdw-437`, `readme-139`, `readme-95`, `cdw-82`, `wp-45`, `wp-61`) — the clear-confidence exacts need only a spot check.
The full per-entry facet text lives in `2026-06-19-recommendedproof-facet-gold-set-v2head.json`; this prose carries the reading, not the authoritative record.

## Critique

Bounded fresh-eye subagent review 2026-06-19 returned **ready-with-edits, no blockers**.
It verified routing soundness on all 36 entries under R6/R12, the tally table against the JSON byte-for-byte, that all 3 ratified relabels land `wrong` in the maintainer's relabel direction, and that the 3 divergence and 7 debatable flags are the right entries (grounding `wp-45`/`wp-61` against the `working-patterns.md` source).
One concrete nit folded: the `readme-139` note now states the deterministic "ships X capability-existence" reading is the *stronger* R12 reading (verdict-flipping to `wrong`), not merely an alternative.
The remaining nits were defensible-either-way and already covered by the `debatable` flag.

## Portability

Portable (gives a consumer repo something): the per-facet schema and facet vocabulary, the R6/R12 routing discriminators, and the recurring claim-shape patterns.
Not portable yet: the measured accuracy rates themselves — this is still Cautilus's own meta-documentation corpus, so the `cautilus-eval`-is-rare result is repo-local until a consumer-shaped corpus replicates the 12-per-route protocol (external-validity backlog carried from the 2026-06-10 set).
