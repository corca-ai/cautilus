# Eval-Trust Snapshot Anchor — goldset-v2-reextract-head

This is the blind re-extraction of the 5-source claim corpus at the current HEAD, using the **now-operative** edited v2 template.
It is the "after" half of the slice-4 proof-route measurement; its sibling `../goldset-v2-head/` is the "before" (templateHash `41323548`, anchor `558cda7`) and stays frozen.

## Why this snapshot exists

The session-3 commit `080e7d0` added the proof-route lean generalization to the contract doc only; the operative template the binary emits to extractors was left stale (see `../../debug/2026-06-18-extraction-template-doc-binary-routing-drift.md`).
Commit `b2a7291` folded that generalization into the operative template and guarded it, recomputing templateHash `41323548` -> `b922fd5d`.
This snapshot re-extracts the same 5 sources under that operative template so the template's proof-route effect can actually be measured (`MEASUREMENT.proof-route.md`).

## Anchor

- **Source content anchor**: git `628ccc7`. The extraction-input was generated there; the 5 sources are byte-identical at current HEAD `b2a7291` (which only touched `claim_extraction.go`/its test + debug artifacts, no source doc), so the verbatim excerpt anchors hold at HEAD as well.
- **Operative template**: `b922fd5d`, made effective at commit `b2a7291`.
- **Scope**: the same 5-source gold corpus, reproduced with explicit `--source` (README.md, docs/guides/cli.md, docs/contracts/claim-discovery-workflow.md, docs/contracts/claim-extraction-template.md, docs/internal/working-patterns.md), `explicitSources=true`, `linkedDepth=0`. The adapter default (README/AGENTS/CLAUDE + depth 3) would scan 68 sources; that broader corpus is a different, larger ground set and is out of scope for this 306-comparable measurement.

## Status: RATIFIED GROUND TRUTH (375 entries, 0 pending)

Ratified 2026-06-18 (`hitl-reextract-v2head-20260618`); amended 2026-06-18 twice — Option C residual re-adjudication, then ② recuration (`cli-268` curator split): **accept 346 / relabel 19 / not-a-claim 10 / badly-bounded 0 = 375**.
This snapshot is now the current both-track answer key at HEAD and **supersedes** `../goldset-v2-head/` (306/306 at `558cda7`), which stays frozen as the proof-route measurement baseline.
See `HITL-CLOSEOUT.md` for the operating model (source pre-grade -> maintainer exception-ratify, 3 overrides) and the harvest.
The Option C amendment un-relabeled 6 residuals to accept (the blind route was correct; R3 had been over-applied) and re-aimed 1; see `residual-key-readjudication-cutC.md`.
The ② recuration split the one badly-bounded over-merge `cli-268` into `cli-268` (surface/preset catalog) + new `cli-266` (shipped-surface fact), and landed the deferred family-fold coverage note; see `family-fold-coverage.md` and `../../debug/2026-06-18-goldset-closeout-helper-fold-overclaim.md`.

## Counts (raw blind, pre-HITL)

- Total candidates: 374 (before: 306). apply-extraction: 374 submitted / 374 applied / 0 rejected.
- Per source: README 52, cli 101, claim-discovery-workflow 80, claim-extraction-template 80, working-patterns 61.
- Segmented by audience: user-product 75, developer 299 (before: 74 / 232). The developer growth is per-source high-recall (cli 68 -> 101, working-patterns 28 -> 61), to be curated at HITL (dedup, family-fold per the family-representative policy, not-a-claim drops).

## Contents

- `extraction-input.json` — the deterministic input packet (5 sources, operative template `b922fd5d`).
- `blind/<source>.json` — the five per-source `claim_extraction_result.v1` packets (blind, template-only).
- `extraction-result.json` — the merged 5-source extraction result handed to apply-extraction.
- `claims-agent.json` — the anchored `claim_proof_plan.v1` (374 candidates, 0 rejected).
- `gold-set-proposal.json` / `.user-product.json` / `.developer.json` — the segmented proposal, all entries `pending`.
- `epic-tree-proposal{,.user-product,.developer}.json` / `epic-dag-proposal{,.user-product,.developer}.json` — the R14 tree + R15 epic DAG realized over the gold claims from the template-emitted per-claim epic facets; see `EPIC-DAG.md`.
- `MEASUREMENT.proof-route.md` — the before/after proof-route analysis with caveats; the after-HITL relabel-rate confirmation is appended at ratification.

## Deferred

- **Epic DAG** — BUILT (③ Epic DAG, 2026-06-19); see `EPIC-DAG.md`. The R14 tree + R15 DAG are realized over the gold claims (365 = accept 346 + relabel 19; not-a-claim excluded) for both tracks plus a combined roll-up, read from the template-emitted per-claim epic facets rather than the old hand-routed `EDGE_MAP`. The epic STRUCTURE is DRAFT pending a maintainer ratification pass (the HITL ratified verdict + proof-route, not the epic assignments).
- **HITL ratification** — DONE (`HITL-CLOSEOUT.md`). It realized the line renumber (HEAD anchors) and resolved the deferred curator splits by re-extraction; the last one, `cli-268`, was split at the ② recuration. The 9 recall-gap helper sub-commands are folded under their family representatives per the ratified policy (`family-fold-coverage.md`) — the earlier note that they were captured "as separate claims" was a closeout overclaim, corrected in the ② recuration.
