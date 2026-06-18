# Re-Extraction Gold Set — HITL Closeout

HITL session: `hitl-reextract-v2head-20260618` (2026-06-18).
Target: `gold-set-proposal.json` (+ `.user-product.json` / `.developer.json`).
Anchor: source content `628ccc7`; operative template `b922fd5d` (made effective in `b2a7291`); see `ANCHOR.md`.

This is the **full both-track re-extraction** the goldset-v2-head closeouts deferred — re-extracting the same 5-source corpus under the now-operative edited v2 template, re-segmenting, and re-ratifying.
It supersedes `../goldset-v2-head/` (306/306 at `558cda7`) as the current answer key; the before stays frozen as the proof-route measurement baseline.

## What changed vs goldset-v2-head, and why a re-extraction at all

The session-3 commit `080e7d0` edited the contract doc but left the operative template (the string the binary emits to extractors) stale — the "edited template" was never in effect.
`b2a7291` fixed that doc<->binary drift (diagnosis: `../../debug/2026-06-18-extraction-template-doc-binary-routing-drift.md`), recomputing templateHash `41323548 -> b922fd5d`.
This re-extraction is the first that actually runs under the edited routing guidance, so it both establishes fresh ground truth at HEAD and measures the edit's proof-route effect (`MEASUREMENT.proof-route.md`).

## Operating model: source pre-grade -> maintainer exception-ratify

Six per-source sub-agents (cli split a/b) pre-graded all 374 candidates under the locked R1-R18, emitting `{proposedVerdict, confidence, tier, labelChange, boundaryNote, sourceMoved, doubt, judgmentCall}` to `.charness/hitl/runtime/hitl-reextract-v2head-20260618/pregrade/`.
The maintainer ratified by exception: the dominant proof-route relabel pattern as one decision, the not-a-claim batch, and **6 borderline not-a-claims individually**.
**3 overrides** at the borderline pass (the only deviations from the pre-grade):

- `claim-extraction-template-md-18` not-a-claim -> **accept** (R8: the extraction-seam-mirrors-review-seam composition has its own checkable content, not pure R9 framing).
- `working-patterns-md-127` not-a-claim -> **accept** (the "standalone binary plus Cautilus Agent" product-surface promise is a load-bearing S1-install structural claim, not positioning).
- `claim-extraction-template-md-346` not-a-claim -> **relabel** human-auditable -> deterministic (the conflict-precedence half is an R6 ownership/boundary assignment).

The other 3 borderline (`readme-29` "Not for…" R16 carve-out, `cli-40` reader-caveat, `working-patterns-md-56` decomposition design-stance) were kept **not-a-claim** as pre-graded.

## Result: 374 / 374 reviewed, 0 pending

| disposition | n | meaning |
| --- | --- | --- |
| accept | 338 | correct extraction + correct labels (15 carried a recorded reservation, kept accept under R5/R11) |
| relabel | 25 | correct claim, proof route corrected (22 toward deterministic; agentLabels left as-extracted, correction in note) |
| not-a-claim | 10 | framing / positioning / pointer / external-example premise (R9/R16/R17/R18) |
| badly-bounded | 1 | `cli-268` over-merge (shipped-surface fact fused with the preset catalog) -> curator split |

Segmented: user-product 75 (accept 61 / relabel 6 / not-a-claim 7 / badly-bounded 1), developer 299 (accept 277 / relabel 19 / not-a-claim 3).

**Amendment 2026-06-18 (Option C residual re-adjudication).** A sharpened-R3 re-adjudication of the 16 residual relabels (forcing a substance-level check, not a "the doc contains this sentence" string check) found R3 had been over-applied on 6 of them: the blind route was correct and the relabel was the error.
Those 6 are un-relabeled to accept (user-product: readme-16, readme-128; developer: readme-8, readme-96, readme-134, template-78), and 1 is re-aimed (template-261 eval->human-auditable).
New tally: **accept 344 / relabel 19 / not-a-claim 10 / badly-bounded 1** (user-product accept 63 / relabel 4; developer accept 281 / relabel 15).
Basis and per-claim dispositions: `residual-key-readjudication-cutC.md`.

**Amendment 2026-06-18 (② recuration — cli-268 split + family-fold correction).** The one badly-bounded over-merge `cli-268` was curator-split: re-bounded to the two-surfaces/four-presets catalog (268-269, accept/deterministic) and the over-merged shipped-surface fact (line 266) peeled into a new claim `cli-266` (accept/deterministic, T3, user track).
New tally: **accept 346 / relabel 19 / not-a-claim 10 / badly-bounded 0 = 375** (user-product accept 65 / relabel 4 / not-a-claim 7 = 76; developer 299 unchanged).
The same pass corrected a narrative defect this closeout carried (see the next bullet) and landed the deferred family-fold coverage note (`family-fold-coverage.md`); diagnosis in `../../debug/2026-06-18-goldset-closeout-helper-fold-overclaim.md`.

## Headline harvest: the operative template reduced the measured systematic error

- **Developer-track proof-route relabel rate 10.8% -> 6.4%** (clean comparison, both graded under locked R1-R18). The dense behavioral contract `claim-discovery-workflow.md` dropped to **2.5%** (2/80) — the generalization bit hardest exactly where the proof-route harvest concentrated.
- **Two residual pockets** the edit did not fully resolve, now themselves measured: `claim-extraction-template.md` 11.3% (meta template-content claims read as behavioral) and `README.md` 13.5% (structural scope/boundary claims left on human-auditable). These are the next-iteration signal, recorded for a future confirming cut — NOT yet a template edit (R16: act on measured systematic error, but confirm these small concentrated residuals first).
- Full analysis + caveats (denominator dilution; the user-product before baseline being pre-locked-rules) in `MEASUREMENT.proof-route.md`.

## What this re-extraction closes (deferred from goldset-v2-head)

- **Line renumber** — realized. Every excerpt is anchored at HEAD; no 558cda7-relative anchors remain.
- **Curator splits §B** (the workflow over-merges) — resolved by re-extraction: blind per-source extraction re-bounded them as separate claims, and the pre-grade found only **1** badly-bounded (`cli-268`), not the 5 over-merges from before. The dense `claim-discovery-workflow.md` "split cleanly along distinct source lines."
- **9 recall-gap helper sub-commands** — folded, per the ratified family-representative policy. CORRECTION (② recuration, 2026-06-18): the original wording here claimed the high-recall pass "surfac[ed] the `prepare-input`/`render-*`/`summarize`/`validate` helpers as graded claims" — that was false. The blind extractor surfaced 0 of the 9 (they sit inside bash code fences it skips), so the gold set has 0; the +33 cli growth (68 -> 101) came from other detail. The 9 stay folded under their family representatives, now explicitly recorded in `family-fold-coverage.md`. RCA: `../../debug/2026-06-18-goldset-closeout-helper-fold-overclaim.md`.

## Deferred follow-ups

- **`cli-268` curator split** — DONE (② recuration, 2026-06-18): split into `cli-268` (surface/preset catalog) + new `cli-266` (shipped-surface fact); see the amendment above.
- **Granularity / family-fold** — DONE (② recuration, 2026-06-18): realigned to the ratified family-representative fold; the 9 helper sub-commands stay folded under their representatives, recorded in `family-fold-coverage.md`.
- **Two residual misroute pockets** — one more confirming cut of `claim-extraction-template.md` (meta-content) and `README.md` (structural-scope) before deciding whether the lean generalization needs a second R16-gated refinement.
- **Epic DAG** — not built (goldset-v2-head carried none either); build over the ratified tracks as a slice-3 follow-up.

## Reproduce / inspect

- Verdicts + rationale per claim: `gold-set-proposal.json` (maintainerVerdict + note + significanceTier on every entry).
- Pre-grade inputs + slices + apply script: `.charness/hitl/runtime/hitl-reextract-v2head-20260618/` (gitignored local scratch).
- Grading rules R1-R18 (locked, carried from the goldset-v2-head sessions): same runtime dir `rules.yaml`.
- Blind oracle outputs: `blind/<source>.json`; merged result: `extraction-result.json`; anchored proof plan: `claims-agent.json`.
