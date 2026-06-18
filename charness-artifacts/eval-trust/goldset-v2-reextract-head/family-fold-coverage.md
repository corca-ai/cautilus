# Family-Fold Coverage Note — cli.md Helper Sub-Commands

Date: 2026-06-18 (② recuration).
This is the coverage note the recall probe (`../goldset-v2-head/RECALL-PROBE-cli.md` L73-79) deferred to "the recuration session."
It records explicitly which `docs/guides/cli.md` helper sub-commands are intentionally folded under a family-representative claim, so the fold is auditable instead of a silent extraction omission.

## Ratified granularity policy: family-representative

The maintainer ratified family-representative granularity on 2026-06-18 (`RECALL-PROBE-cli.md` L77).
Each command family keeps its representative claim (`propose` / `variants` / `bundle` / `review-conversations`); the deterministic `prepare-input` / `render-*` / `summarize` / `validate` helper sub-commands of the same family stay folded under it with this coverage note rather than each becoming its own claim.
The rationale is R16 ("less but better"): these 9 are the low-significance deterministic packet-assembly, static-render, and release-surface tail, not load-bearing behavior, and exercising the family representative covers them.

This note realigns the gold set to that policy after the ② recuration confirmed the re-extraction did **not** in fact surface these helpers as separate claims (the blind extractor skipped them because they live inside bash code fences — see `../../debug/2026-06-18-goldset-closeout-helper-fold-overclaim.md`).
The prior closeout statement that they were "surfaced as graded claims" was a forward-prediction restated as outcome; it is corrected here and in `HITL-CLOSEOUT.md`.

## The 9 folded helpers and their representatives

Line anchors are at HEAD (`docs/guides/cli.md`).

| helper sub-command | HEAD line | family representative (gold claim) | proof |
| --- | --- | --- | --- |
| `discover scenarios prepare-input` | 232 | `discover scenarios propose` (cli-259) | deterministic |
| `discover scenarios render-conversation-review-html` | 249 | `discover scenarios review-conversations` (cli-261) | deterministic |
| `discover scenarios summarize-telemetry` | 253 | `discover scenarios` family (cli-257/259) | deterministic |
| `evaluate review prepare-input` | 402 | `evaluate review variants` (cli-470) | deterministic |
| `evaluate review build-prompt-input` | 407 | `evaluate review variants` (cli-470) | deterministic |
| `evaluate review render-prompt` | 426 | `evaluate review variants` (cli-470) | deterministic |
| `evaluate evidence prepare-input` | 496 | `evaluate evidence bundle` (evidence family) | deterministic |
| `claude plugins validate` | 551 | release / marketplace surface | deterministic |
| `check-codex-marketplace.mjs` | 555 | release / marketplace surface | deterministic |

## Status

Coverage note landed.
The fold is now an explicit, auditable curation decision rather than a gap.
If a future maintainer wants these as first-class proof targets, the path is a scoped recall-add (extract → grade R1-R18 → ratify), not a silent re-extraction; the recall probe judged them the low-significance tail, so the standing decision is fold.
