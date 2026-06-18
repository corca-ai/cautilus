# Debug Review
Date: 2026-06-18

## Problem

The ratified re-extraction closeout (`charness-artifacts/eval-trust/goldset-v2-reextract-head/HITL-CLOSEOUT.md` L54) and the handoff (`docs/internal/handoff.md` L21) state that the per-source high-recall re-extraction surfaced the `prepare-input`/`render-*`/`summarize`/`validate` helper sub-commands "as graded claims" and "realizes them as separate claims."
The gold set contains zero such claims, so the closeout asserts a state of the ratified answer key that is false.

## Correct Behavior

Given the recall probe (`goldset-v2-head/RECALL-PROBE-cli.md`) identified 9 helper sub-commands as recall gaps and set the granularity policy to family-representative fold, deferring a coverage note to "the recuration session."
When the re-extraction session wrote its closeout describing the ratified gold set.
Then the closeout should state the actual disposition of those 9 — still folded/absent, coverage note pending — and every factual assertion a closeout makes about what the gold set contains must hold against the gold set.

## Observed Facts

HITL-CLOSEOUT.md L54 verbatim:
"**9 recall-gap helper sub-commands** — captured: the per-source high-recall pass grew cli 68 -> 101, surfacing the `prepare-input`/`render-*`/`summarize`/`validate` helpers as graded claims. NOTE this realizes them as *separate* claims rather than the family-representative fold the recall probe recommended; if the maintainer wants a leaner set, a family-fold recuration is a follow-up (see below)."

Measured against the actual artifacts:
- The gold set has 0 claims for any of the 9 helper commands (`scenarios prepare-input`, `render-conversation-review-html`, `summarize-telemetry`, `review prepare-input`, `build-prompt-input`, `render-prompt`, `evidence prepare-input`, `plugins validate`, `check-codex-marketplace`).
- No claim is anchored within ±3 lines of those helper command source lines (232/249/253/402/407/426/496/503/519/551/555 at HEAD); the regions hold only their family-representative claims (`propose`, `variants`, `feedback`).
- The blind extractor raw output (`blind/cli.json`) surfaced 101 claims but **zero** of the 9 helpers — the gap is at extraction, not curation.
- The discover-claims-family helpers that *are* present (`extraction-input`, `apply-extraction`, `review-input`, `apply-review`, `claims validate`) were already in goldset-v2-head, so they are not what the re-extraction "surfaced" either.
- cli grew 68 -> 101 (+33) from other detail (doctor / eval-live / review / comparison density), not from the 9 helpers.

Sibling closeout facts that *do* hold (blast-radius bound):
- cli-268 is the sole badly-bounded claim across the whole set (matches the closeout).
- The verdict tally is exactly accept 344 / relabel 19 / not-a-claim 10 / badly-bounded 1 (matches the amended closeout).

## Reproduction

```bash
GS=charness-artifacts/eval-trust/goldset-v2-reextract-head
# 0 graded claims for the 9 helpers
for t in "scenarios prepare-input" "build-prompt-input" "render-prompt" "summarize-telemetry" "plugins validate" "check-codex-marketplace" "evidence prepare-input"; do
  jq --arg t "$t" '[.entries[]|select(.claimId|test("cli-md"))|select((.summary//"")|test($t;"i"))]|length' "$GS/gold-set-proposal.json"
done
# 0 in the blind raw output too (gap is at extraction)
rg -ci "build-prompt-input|render-prompt|scenarios prepare-input" "$GS/blind/cli.json"
```

## Candidate Causes

- The author conflated "cli grew via the high-recall pass" (true, +33) with "the recall-probe's specific 9 helpers were surfaced" (false), assuming the predicted gaps were the growth without checking the gold set.
- The "captured" follow-up bullet was written from the recall probe's forward prediction (a high-recall pass *would* surface these) rather than measured against the actual extracted set after the fact.
- The blind per-source extractor genuinely skipped the helper command lines because they sit inside bash code fences (de-prioritized as examples — exactly the "co-skipped regions out of reach" the recall probe disclosed), so the gap persisted and the closeout did not detect it.
- No deterministic check reconciles closeout narrative claims ("X surfaced as claims") against the packet, so the false statement passed every gate and propagated into the handoff.

## Hypothesis

If the closeout statement is an unverified prediction-restatement rather than a measured outcome, then the 9 helpers are absent not only from the gold set but also from the blind extractor's raw output — i.e. the extractor never surfaced them, so the closeout could not have observed them being graded.

## Verification

Confirmed.
`blind/cli.json` contains 101 extracted claims and zero of the 9 helper commands (direct token grep = 0 for each).
The extractor never surfaced them, so the closeout's "surfacing ... as graded claims" cannot describe an observed outcome; it restates the recall probe's prediction.
The gold set is internally correct (tally 344/19/10/1; cli-268 sole badly-bounded), so this is a narrative-accuracy defect over a correct answer key, not a corruption of the answer key.

## Root Cause

The re-extraction closeout follow-up bullet for the 9 recall-gap helpers was authored from the recall probe's forward expectation and never reconciled against the actual blind output or gold set.
The coverage note the recall probe deferred to "the recuration session" was never landed, so the family-representative fold is real but undocumented; the closeout papered over that silent gap with a false "surfaced as separate claims" statement, which then propagated verbatim into the handoff and mis-framed the ② recuration task as a "fold vs keep-separate" decision when the helpers are already folded by extraction omission.

## Invariant Proof

- Invariant: every factual assertion a ratified closeout makes about the contents of its gold set must be satisfiable against that gold set (and, for "surfaced/captured" claims, against the producing extractor output).
- Producer Proof: blind extractor output (`blind/cli.json`) has 0 of the 9 helpers among 101 claims.
- Final-Consumer Proof: ratified gold set has 0 of the 9 helpers; the closeout narrative (a derived consumer of that packet) asserts they are present — invariant violated at the narrative layer.
- Interface-Shape Sibling Scan: the other "captured/resolved" bullets in the same closeout section (line renumber realized; curator splits -> cli-268 only) and the verdict tally all satisfy the invariant; only the 9-helper bullet fails.
- Non-Claims: the gold set's verdicts, anchors, and tally are correct and not in scope of this defect.

## Detection Gap

- closeout authoring | no reconciliation fires when a closeout names specific claims/commands as "surfaced/captured" | the smallest change is a closeout discipline rule: any "surfaced/captured as claims" assertion must be backed by a jq query against the gold set (and the blind output for "surfaced"), recorded inline, before ratification — restating a prior probe's prediction as an outcome is the banned move.

## Sibling Search

- Mental model: "the recall probe predicted these gaps and the re-extraction was more thorough, therefore it caught them" — predicting-forward substituted for measuring-after.
- same-artifact axis: HITL-CLOSEOUT.md L51-61 sibling bullets | decision: line-renumber and curator-split bullets are verified true; the 9-helper bullet is the lone false one | proof: anchors at HEAD, cli-268 sole badly-bounded.
- propagation axis: docs/internal/handoff.md L21 | decision: inherited the same false statement verbatim — must be corrected with the closeout | proof: identical "별도 claim" wording.
- cross-file: MEASUREMENT.proof-route.md and ANCHOR.md reference the same residual/curation story | decision: MEASUREMENT is measurement-derived and independently verified, ANCHOR carries only the tally (correct) | proof: no "surfaced helpers" assertion in either, so no sibling defect there.
- follow-up: the deferred coverage note for the family-representative fold is genuinely owed and was never landed — `follow-up: land-helper-fold-coverage-note`.

## Seam Risk

- Interrupt ID: none
- Risk Class: none
- Seam: none — internal audit-record accuracy over a correct packet
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: this debug record plus the ② recuration plan

The repair amends ratified-adjacent audit records (closeout, handoff) and feeds the ② recuration that touches ground-truth shape, so a bounded fresh-eye review of the recuration is owed before closeout.
The impl step is the recuration itself: correct the closeout and handoff narrative, land the deferred family-representative coverage note, and do the cli-268 split, under maintainer confirmation since these touch ratified ground truth.

## Prevention

- Closeout discipline: any "surfaced / captured / realized as claims" assertion must be reconciled against the actual packet (and the producing extractor output for "surfaced") with the query recorded inline, before ratification — never restate a prior probe's forward prediction as a measured outcome.
- Land the deferred coverage note now: record the family-representative fold explicitly (the 9 helpers are covered by their `propose`/`variants`/`feedback`/`bundle` representatives) so the fold is auditable rather than a silent extraction omission a later narrative can misrepresent.

## Related Prior Incidents

- `debug-2026-06-18-extraction-template-doc-binary-routing-drift.md` — same class: a "DONE" narrative diverged from the actual operative artifact; doc-vs-reality drift.
- `debug-2026-06-16-agent-extraction-over-extraction-curation.md` — extraction/curation discipline (the boundary that makes "what was extracted" the falsifiable substrate here).
- `goldset-v2-head/RECALL-PROBE-cli.md` — the source of the family-representative policy and the forward prediction this closeout restated as an outcome.
