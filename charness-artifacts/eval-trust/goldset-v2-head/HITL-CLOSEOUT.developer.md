# Developer-Track Gold Set — HITL Closeout

HITL session: `hitl-devtrack-v2head-20260618` (2026-06-18).
Target: `gold-set-proposal.developer.json` (+ parent `gold-set-proposal.json` mirror).
Anchor: git commit `558cda7` (see `ANCHOR.md`); sibling of the user-product closeout `HITL-CLOSEOUT.md`.

This ratifies the **developer-audience** segment (232 claims) of the same blind v2 re-extraction the user-product
track came from. It completes the both-track ground truth begun in `hitl-userprod-v2head-20260617`: the parent
`gold-set-proposal.json` is now **306/306 reviewed, 0 pending** (74 user-product + 232 developer).

## Anchor decision (maintainer, 2026-06-18)

Ran the HITL against the **existing 232 as-anchored at `558cda7`**; mechanical line re-number stays **deferred**
(same precedent as the user-product track). Rationale grounded in the actual diff `558cda7..HEAD`: of the 232,
only the 78 entries on `docs/contracts/claim-discovery-workflow.md` had their source reworded this session (the
apex "Problem"->"Workflow" reframe + `linked Markdown`->`linked docs`); `claim-extraction-template.md` (74) and
`working-patterns.md` (28) are content-unchanged, and `cli.md` (50) had only a pure Homebrew deletion above all
its anchors. All 232 were `pending`, so re-extraction would have preserved no verdict while re-opening the
finished user-product track (README fingerprints changed). The 7 `sourceMoved` entries were each checked
558cda7<->HEAD: every assertion is intact (the reframe **affirmed** the discovery claims rather than removing
them), so they graded on present substance. Verdicts carry by `claimFingerprint`; the line re-number folds into
the next full both-track regeneration.

## Operating model: agent pre-grade -> human exception-ratify

Distinct from the user-product track's one-card-at-a-time pass, because R1–R18 are now **locked** and the
developer track is 3x the volume and skews T3 spec-detail. Six sub-agents (one per source document, each reading
its doc in full) pre-graded all 232 by applying R1–R18, emitting per-claim `{verdict, confidence, tier, doubt,
sourceMoved}` to `pregrade/*.json`. The maintainer then ratified by **exception**: the dominant proof-route
pattern as one decision, the 16 substance cards individually, the 192 accepts as a batch with reservations
recorded. **Zero overrides** — every final verdict equals the pre-graded proposal (the maintainer held `cli:314`
for a separate micro-decision, then ratified it as proposed). Pre-grade inputs preserved under
`.charness/hitl/runtime/hitl-devtrack-v2head-20260618/`.

## Result: 232 / 232 reviewed, 0 pending

| disposition | n | meaning |
| --- | --- | --- |
| accept | 192 | correct extraction + correct labels (46 carried a recorded reservation, kept accept under R5/R11) |
| relabel | 25 | correct claim, label corrected (proof route only; correction in note, agentLabels left as-extracted) |
| not-a-claim | 7 | pointer / restatement / framing premise (R9/R17) |
| badly-bounded | 5 | over-merge -> curator split |
| rewrite-source | 3 | correct claim, source sentence trimmed |

Durable graded claims = 220 (accept 192 + relabel 25 + rewrite-source 3). Tiers among graded: **T1 13 / T2 85 / T3 122**.
The T3-heavy shape confirms R13's prediction (contract/CLI sources skew spec-detail; contrast user-product T1 7 / T2 41 / T3 8).

## Key harvest

- **The proof-route weakness is the dominant, quantified signal.** 24 of 25 relabels move toward `deterministic`
  (18 human-auditable->deterministic, 6 cautilus-eval->deterministic; one outlier `workflow:91`
  human-auditable->cautilus-eval). This is the exact "agent finds claims well but under-routes proof ~20%"
  weakness the 292 analysis and the user-product README:8 catch predicted — now measured at **10.8% relabel /
  ~10.3% proof-misroute** on a 232-claim contract corpus, almost entirely the agent keeping
  human-auditable/cautilus-eval where R6 (ownership/boundary) and R12 (static/structural enabler, R3
  checkability-in-principle) say deterministic. This is the systematic error that, per R16/R12's locked scope,
  could justify a lean generalization into the extraction template at slice 3 — the answer key now has the
  evidence the template change was gated on.
- **not-a-claim rate is far lower than user-product (3% vs 15%).** Contract/spec sources carry dense real
  spec-detail, not positioning prose; the 7 drops are R17 pointers ("X lives in [file]") and R9 success-criteria /
  doc-convention premises, not audience-fit framing.
- **Over-merges concentrate in the reworded contract.** 4 of 5 badly-bounded are in `claim-discovery-workflow.md`
  (`:95` 3-way, `:289` 8 routing rules fused, `:497` two CLI contracts, `:729` claim+pointer); `cli:81` fuses
  `doctor binary`+`doctor commands` — the same over-merge class as the user-product `cli:207` catch. The blind
  per-source fan-out cannot see that a long sentence packs several assertions; this is a curator/boundary job.

## Deferred follow-ups (source-edit + structural, NOT applied this session)

### A. Source edits (record now, apply in a later doc pass + re-anchor)
- **rewrite-source (3):** `README:163` drop the "shortest" superlative -> "an end-to-end adoption proof";
  `template:196` trim the "(ratified 2026-06-10)" metadata tail; `template:358` the "Until the deferred
  claims:refresh:all gate decision lands…" transitional caveat (re-evaluate when that gate lands).

### B. Curator (split the over-merges into separate claims)
- `workflow:95`, `workflow:289`, `workflow:497`, `workflow:729`, `cli:81` — see each `badly-bounded` note for the
  intended split. `cli:81` -> two deterministic claims (`doctor binary --json` health vs `doctor commands --json`
  discovery), mirroring the `cli:207` split already queued on the user-product side.

### C. Out of scope this session (next milestones)
- **Mechanical line re-number** of both tracks to HEAD (deferred again here; folds into the next full regeneration).
- **`cli.md` recall probe** — **DONE 2026-06-18** (`RECALL-PROBE-cli.md`). Result: gold recall of its own claims 68/68 (no phantoms); over-split hypothesis **refuted** (blind oracle split finer than gold in all 23 clustered regions); only real gaps are **9 deterministic helper sub-commands** (4x T2, 5x T3) in the scenarios/review/evidence/plugin families — no principle/boundary blind spot. The 9 are recorded, not added; they fold into the regeneration with a granularity-policy decision (one-claim-per-sub-command vs family-representative).
- **Full both-track regeneration** at a clean future HEAD once the source edits (A) + curator splits (B) land, also closing the 9 recall-gap sub-commands per the granularity-policy decision.

## Reproduce / inspect

- Verdicts + rationale per claim: `gold-set-proposal.developer.json` (maintainerVerdict + note + significanceTier on every graded entry).
- Pre-grade inputs, per-source slices, apply script: `.charness/hitl/runtime/hitl-devtrack-v2head-20260618/`.
- Grading rules R1–R18 (locked, carried from the user-product session): same runtime dir `rules.yaml`.
