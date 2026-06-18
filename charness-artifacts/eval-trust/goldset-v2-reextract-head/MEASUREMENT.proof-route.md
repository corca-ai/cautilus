# Proof-Route Before/After — Edited Operative Template

Measurement date: 2026-06-18.
Question: did making the `080e7d0` proof-route generalization **operative** (commit `b2a7291`, templateHash `41323548` -> `b922fd5d`) shift the blind extractor's `recommendedProof` routing toward `deterministic`, as the gold-set proof-route harvest predicted?

This is the slice-4 "template effect" measurement the re-extraction was gated on.
It compares two **blind, pre-HITL** extractions of the **same 5 sources**, varying the operative template (and, honestly, the extraction method — see Caveats).

- **Before**: `../goldset-v2-head/claims-agent.json` — single blind extractor (`cautilus-agent-blind-extractor`, opus-4-8), templateHash `41323548`, 306 candidates, anchor `558cda7`.
- **After**: `./claims-agent.json` — five per-source blind extractors (same agent id + model), operative templateHash `b922fd5d` (carries the ownership/boundary/isolation + reviewable/reproducible generalization), 374 candidates, anchor `628ccc7`. apply-extraction: 374 submitted / 374 applied / **0 rejected** (every excerpt anchored verbatim).

## Global blind proof-route distribution

| recommendedProof | Before (306) | After (374) | share Before -> After |
| --- | --- | --- | --- |
| deterministic | 204 | 278 | 66.7% -> **74.3%** (+7.6pp) |
| human-auditable | 74 | 56 | 24.2% -> **15.0%** (-9.2pp) |
| cautilus-eval | 28 | 40 | 9.2% -> 10.7% (+1.5pp) |

Directionally exactly the predicted shift: more `deterministic`, fewer `human-auditable`.

## Per-source deterministic share (count-normalized — the cleaner signal)

Normalizing per source removes the 306-vs-374 count difference and isolates the routing tendency.

| source | det share Before -> After | human-auditable share Before -> After |
| --- | --- | --- |
| README.md | 45% -> 58% (**+13pp**) | 41% -> 17% (**-24pp**) |
| docs/guides/cli.md | 88% -> 94% (+6pp) | 9% -> 4% (-5pp) |
| docs/contracts/claim-discovery-workflow.md | 61% -> 81% (**+20pp**) | 20% -> 3% (**-18pp**) |
| docs/contracts/claim-extraction-template.md | 81% -> 89% (+8pp) | 19% -> 1% (**-18pp**) |
| docs/internal/working-patterns.md | 36% -> 28% (-8pp) | 54% -> 66% (+12pp) |

4 of 5 sources move as predicted, strongest on the dense structural contracts (`claim-discovery-workflow` +20pp deterministic / -18pp human-auditable; `claim-extraction-template` +8pp / -18pp) and README (-24pp human-auditable) — exactly where the ownership/boundary and reviewable/reproducible generalization should bite.
`working-patterns.md` is the lone exception (deterministic -8pp), discussed below.

## Caveats (why this is necessary-but-not-sufficient evidence)

- **Method changed alongside the template.** Before was one single-pass extractor; after was five per-source extractors (more exhaustive). So the absolute count jumped 306 -> 374 (cli 68 -> 101, working-patterns 28 -> 61, claim-extraction-template 74 -> 80), and the global share shift is partly a recall/composition effect, not template alone. The per-source share table is more robust to this but does not fully remove it.
- **`working-patterns.md` regression is likely composition, not a routing reversal.** Its claim count more than doubled (28 -> 61); the per-source high-recall pass surfaced many soft operating-policy/process statements (genuinely human-auditable), diluting the deterministic share. This is a recall artifact on a process-narrative doc, not the template routing the same claims worse.
- **The confirming measure is the after-HITL relabel rate, still pending.** The before-blind under-routed deterministic by ~10% (dev-track HITL relabeled 24/25 toward deterministic). Whether the edited template actually *fixed* that systematic error is confirmed only when the after-HITL relabel rate drops below the before's 10.8% — i.e. the maintainer has to correct fewer proof routes. The blind shift here is consistent with a fix but does not prove one on its own.

## Status

Recorded, not yet ratified.
The after set (374 raw blind candidates) is `allPending=true`; it becomes ground truth only after the source-by-source pre-grade + maintainer exception-ratification.
The after-HITL relabel-rate confirmation lands with that ratification and will be appended here.
