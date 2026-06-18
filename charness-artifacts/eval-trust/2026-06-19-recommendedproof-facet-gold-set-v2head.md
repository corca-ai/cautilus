# recommendedProof facet gold-set proposal — regenerated against the HEAD answer key (D3 v2)

Status: maintainer-ratified 2026-06-19 (interactive, single session, exception-ratify model).
32 entries ratified as proposed; `readme-139` corrected (dominant → deterministic); `wp-61` flagged retire-candidate.
The authoritative per-entry record (with `maintainerVerdict`, `ratifiedDominantRoute`, `ratifiedTagVerdict`) is the JSON sibling; tallies are computed, not hand-edited.

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

## Computed tallies (ratified)

Verdict compares the dominant facet route against the blind per-claim `recommendedProof`.
The table is the ratified state; the two changes from the agent proposal are `readme-139` (too-coarse → wrong, dominant corrected to deterministic) and `wp-61` (was wrong, now retire-candidate, excluded from the routing tally).

| blind route | n | exact | too-coarse | wrong | retire |
|---|---|---|---|---|---|
| deterministic | 12 | 12 | 0 | 0 | 0 |
| cautilus-eval | 12 | 2 | 6 | 4 | 0 |
| human-auditable | 12 | 6 | 3 | 2 | 1 |
| **all** | 36 | 20 | 9 | 6 | 1 |

- Dominant-correct (per-claim route == dominant facet route): **29/35 (83%)** with the retire-candidate excluded, versus the 2026-06-10 set's 18/35 (51%).
- Facet route counts across all entries: 43 deterministic, 14 human-auditable, 10 cautilus-eval — even in a sample stratified to over-represent the two non-deterministic routes, genuinely-semantic facets are the minority.

The accuracy jump is consistent with the proof-route measurement: the operative template v2 plus the ratified R6/R12 discipline reduced both the `cautilus-eval` over-assignment and the `human-auditable`-hides-deterministic pattern that dominated the 2026-06-10 set.

## Cross-check against the ratified per-claim relabels

The sample contains the 3 ratified relabels (`cet-261`, `cet-68`, `cdw-82`).
All 3 land as **wrong** in the facet verdict, each in the same direction as the maintainer's per-claim relabel:
`cet-261` eval→human, `cet-68` eval→deterministic, `cdw-82` human→deterministic.
The facet decomposition agreeing with every ratified relabel in the sample is the validity check that the routing is not drifting from the answer key.

## Ratification outcomes on the contested entries

Three entries were accepted at the per-claim level in the answer key but the facet view proposed a different dominant route; a fourth was a corrected dominance call.
The maintainer decided each individually (the other 32 were ratified as proposed under the exception model).

- `claim-docs-contracts-claim-discovery-workflow-md-23` ("primary user flow starts from an agent session") — answer-key accept-as-`cautilus-eval`; facet re-routing to dominant **human-auditable** (an R16/R9 positioning premise, no substantive eval facet) **accepted**. The answer-key note itself flagged it "borderline R16/R9 positioning premise."
- `claim-docs-internal-working-patterns-md-45` ("rejected/not-done decisions live only under explicit decision-section headings") — answer-key accept-as-`human-auditable`; facet re-routing to dominant **deterministic accepted**, because this *is* the `non_claim_section_headings` placement rule a scanner already enforces. Directly informs the classification_hints wiring.
- `claim-readme-md-139` (GEPA-style bounded prompt search seam) — **corrected**: dominant `cautilus-eval` → **deterministic**. Under R12, the six named mechanisms shipping is a static capability-existence check (the stronger reading), consistent with how other "ships X" claims route; the does-it-actually-improve outcome stays a separate eval facet. Verdict moves too-coarse → wrong.
- `claim-docs-internal-working-patterns-md-61` ("cross-cutting concerns are not exposed in AOP terms in public docs") — flagged **retire-candidate** rather than routed. The maintainer's principle: *statements about what the system does not do are almost all retirement targets*. The dominant facet here is a whole-claim negative, so it is a discovery-curation retire signal, not a det/human routing decision; it is excluded from the routing-accuracy tally (the residual positive facet — public docs speak in concrete contracts — is human-auditable).

### Retire principle — resolved 2026-06-19

The retire signal on `wp-61` was resolved the same session, and it is narrower than "add an engine rule":

- It is **not** a discovery-curation engine rule. It is the already-ratified prose rule at `working-patterns.md:43-46` (2026-06-11): negative / transition-history behavior prose is unnecessary for first-time users and a stale-claim source. `wp-61` was that rule slipping through in the very doc that states it.
- Scope (maintainer): retire only **transition / defensive / style** negatives. Capability-boundary and exclusion negatives (`does not execute skills`, `not for …`, intent-first prompt-freeze) are **kept** as first-class claims, because `claim-extraction-template.md:58` deliberately captures them as a measured recall target.
- Action taken: the source statement at `working-patterns.md:61` was rewritten from the negative heading ("does not expose cross-cutting concerns in AOP terms") to the positive ("public docs speak in concrete contracts and evidence routes"). A scan of the five source docs found this was the only clear category-1 retirement target; the rest are intentional capability boundaries or agent-guideline imperatives.
- The answer key `goldset-v2-reextract-head` stays **frozen** at its snapshot (`628ccc7`); the fix lands at HEAD so future re-extraction does not resurface the negative.

## Patterns the regeneration surfaces (to verify in review)

1. `deterministic` is now essentially fully reliable on this corpus (12/12 exact), up from 8/12. The operative template v2 plus R6/R12 stopped splitting ownership/seam clauses into phantom eval facets.
2. `cautilus-eval` over-assignment shrank but did not vanish: 5 of 12 are misroutes (3 wrong + the 2 that are too-coarse only because a deterministic facet hides under a genuine eval dominant), down from the 2026-06-10 set where 8 of 12 were wrong. `cet-68` is the measured `claim-extraction-template` documented-content residual (route a template-content fact as behavior) that MEASUREMENT.proof-route.md flagged at 8.75%.
3. `human-auditable` is correct far more often here (6/12 exact) because the `working-patterns.md`-heavy sample contains genuine operating-policy and process claims that are correctly human; the 3 misroutes are doc-placement and lexical-constraint claims that hide a deterministic check (pattern 2).
4. Every claim whose dominant facet is `cautilus-eval` still carries at least one deterministic (or human) facet underneath, consistent with the facet-decomposition template's core rule — except the two pure-behavior eval claims (`wp-10`, `readme-60`), which are exact precisely because they have no separable mechanical facet.
5. No not-a-claim entries, because the HITL already removed them from the gold population — the facet gold set inherits the answer key's curation discipline instead of re-litigating it. Ratification did surface one retire-candidate (`wp-61`), a whole-claim negative the maintainer flagged under the "what-it-does-not-do statements are mostly retirement targets" principle — a curation signal that points back at the answer key, not a routing miss.

## Review record

The durable thing reviewed was each entry's **facet decomposition** (the facets and their routes); dominant route and tag verdict are derived scoring.
The maintainer ratified under the exception model: the 32 clear/batch entries were ratified as proposed, and the contested entries (the 3 answer-key divergences plus the 7 `dominanceConfidence: debatable` entries — `cdw-23`, `cdw-437`, `readme-139`, `readme-95`, `cdw-82`, `wp-45`, `wp-61`) were decided individually; the four that changed or were called out are in *Ratification outcomes* above.
The authoritative per-entry record (`maintainerVerdict`, `ratifiedDominantRoute`, `ratifiedTagVerdict`, `maintainerNote`) lives in `2026-06-19-recommendedproof-facet-gold-set-v2head.json`; this prose carries the reading, not the record.

## Critique

Bounded fresh-eye subagent review 2026-06-19 returned **ready-with-edits, no blockers**.
It verified routing soundness on all 36 entries under R6/R12, the tally table against the JSON byte-for-byte, that all 3 ratified relabels land `wrong` in the maintainer's relabel direction, and that the 3 divergence and 7 debatable flags are the right entries (grounding `wp-45`/`wp-61` against the `working-patterns.md` source).
One concrete nit folded: the `readme-139` note now states the deterministic "ships X capability-existence" reading is the *stronger* R12 reading (verdict-flipping to `wrong`), not merely an alternative.
The remaining nits were defensible-either-way and already covered by the `debatable` flag.

## Portability

Portable (gives a consumer repo something): the per-facet schema and facet vocabulary, the R6/R12 routing discriminators, and the recurring claim-shape patterns.
Not portable yet: the measured accuracy rates themselves — this is still Cautilus's own meta-documentation corpus, so the `cautilus-eval`-is-rare result is repo-local until a consumer-shaped corpus replicates the 12-per-route protocol (external-validity backlog carried from the 2026-06-10 set).
