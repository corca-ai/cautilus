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

## Status: RAW BLIND, NOT YET GROUND TRUTH

The 374 candidates are `allPending=true`.
This snapshot is **not** ratified ground truth yet — it becomes ground truth only after the source-by-source pre-grade (R1-R18) + maintainer exception-ratification (the same operating model as the developer-track `hitl-devtrack-v2head-20260618`).
Until then `../goldset-v2-head/` remains the ratified 306/306 answer key.

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
- `MEASUREMENT.proof-route.md` — the before/after proof-route analysis with caveats; the after-HITL relabel-rate confirmation is appended at ratification.

## Deferred

- **Epic DAG** — not built here. The DAG (`epic-tree-proposal.json` -> `epic-dag-proposal.json`) was only ever a slice-3 design artifact over `../goldset-v2-agent-extraction/`; `../goldset-v2-head/` itself carried no DAG. Building it over the ratified tracks is a post-ratification follow-up, same precedent.
- **HITL ratification** — the next move (pre-grade -> maintainer exception-ratify), which also closes the deferred curator splits, the 9 recall-gap helper sub-commands (family-representative), and the line renumber from the goldset-v2-head closeouts.
