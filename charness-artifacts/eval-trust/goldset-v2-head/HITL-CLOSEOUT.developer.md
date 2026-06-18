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

### A. Source edits (rewrite-source) — 2 of 3 APPLIED 2026-06-18 (commit `3bc1b06`)
- **APPLIED** `README:163` "shortest" superlative dropped -> "an end-to-end adoption proof"; `template:196`
  "(ratified 2026-06-10)" metadata tail trimmed from the Anchoring rule heading.
- **STILL DEFERRED** `template:358` "Until the deferred claims:refresh:all gate decision lands…" transitional
  caveat — its gate (the `claims:refresh:all` regenerate-vs-validate decision, still open in the template's
  Deferred Decisions) has not landed, so the caveat stays live; re-evaluate when that gate lands.
- These edits changed the HEAD verbatim of the two rewrite-source claims; their ratified verdicts carry by
  `claimFingerprint` and reconcile at the re-extraction re-anchor.

### B. Curator (split the over-merges) — DEFERRED to the re-extraction session (maintainer, 2026-06-18)
- `workflow:95` (3-way), `workflow:289` (8 heterogeneous routing rules, each a separate routing claim OR a
  framing premise — per-item claim/premise judgment), `workflow:497` (refresh-entry vs validate, two seams),
  `workflow:729` (behavior claim + an R17 evidence-pointer tail to drop), `cli:81` (`doctor binary --json`
  health vs `doctor commands --json` discovery, mirroring the user-product `cli:207` split).
- Folded into the re-extraction session rather than hand-applied now: the re-extraction with the edited v2
  template produces correctly-bounded claims through blind-extract-then-ratify, where `workflow:289`'s
  per-item claim-vs-premise calls belong; hand-authoring them now would bypass that discipline and be
  replaced by the re-extraction anyway (maintainer decision 2026-06-18).

### C. Out of scope this session (next milestones)
- **Mechanical line re-number** of both tracks to HEAD (deferred again here; folds into the next full regeneration).
- **`cli.md` recall probe** — **DONE 2026-06-18** (`RECALL-PROBE-cli.md`). Result: gold recall of its own claims 68/68 (no phantoms); over-split hypothesis **refuted** (blind oracle split finer than gold; gold finer than both extractors in only 2 of 23 clusters); only real gaps are **9 deterministic helper sub-commands** (4x T2, 5x T3) in the scenarios/review/evidence/plugin families — no principle/boundary blind spot. **Granularity policy decided: family-representative** (keep the 9 folded under their family claim with a coverage note, not separate claims — R16 lean). The 9 fold into the re-extraction session, not added now.
- **Extraction-template lean edit** — **DONE 2026-06-18** (commit `080e7d0`): the measured proof-route weakness folded into the template's routing guidance as one R16-locked lean generalization (ownership/boundary/isolation + reviewable/reproducible -> deterministic).
- **Binary doubled-verb bug** — **FIXED 2026-06-18** (commit `dc1837c`): the cli.md typo was root-caused to the binary's command registry advertising the unroutable `evaluate evaluate review`; fixed across the binary + 23 doc/skill sites with a structural regression guard (`charness-artifacts/debug/2026-06-18-evaluate-review-doubled-verb.md`).
- **Full both-track re-extraction** at a clean future HEAD — the remaining big move: re-extract 306 with the edited v2 template, re-segment, rebuild the DAG, re-ratify, and realize the line renumber; closes the deferred curator splits (B), the 9 recall-gap sub-commands (family-representative), and the renumber in one pass.

## Reproduce / inspect

- Verdicts + rationale per claim: `gold-set-proposal.developer.json` (maintainerVerdict + note + significanceTier on every graded entry).
- Pre-grade inputs, per-source slices, apply script: `.charness/hitl/runtime/hitl-devtrack-v2head-20260618/`.
- Grading rules R1–R18 (locked, carried from the user-product session): same runtime dir `rules.yaml`.
