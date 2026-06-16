# Spec Seed: Agent Extraction, Curation, and Gold-Set Layering

Status: seed (handoff from `charness-artifacts/debug/latest.md`, 2026-06-16).
This is the named spec handoff for the forced debug interrupt `extraction-granularity-seam-2026-06-16`.
It records the decision frame; the spec session refines it before any `impl`.

## Problem

Agent extraction over five refreshed discovery docs produced 292 claims for the regenerated gold set.
Investigation (`debug/latest.md`) found the alarm was partly a measurement artifact (the heuristic under-reads, so 292-vs-111 is contaminated), but two genuine design gaps surfaced:

1. The raw high-recall extraction packet was conflated with the curated gold-set/review surface, collapsing the separation the product design already states (README: raw packets are high-recall planning input, not the review document; the Cautilus Agent curates before review).
2. The gold-set source scope mixed user-facing product docs with an internal maintainer-process doc (`docs/internal/working-patterns.md`), so the packet mixes product behavior promises with developer-process rules at a different claim layer (48 developer claims, 19 mis-routed to `cautilus-eval`).

## Decisions To Make

- **D1 — extraction vs curation vs gold-set surface.** Is agent extraction high-recall-then-curate (a separate curation/triage pass produces the reviewable set), or filtered-at-extraction (the template itself applies a worth-proving/layer filter)? What artifact is the gold-set surface? Evidence to weigh: on identical inputs the agent extracts 2.6x denser than the heuristic (cli.md 3.7x, template 7.4x), and the claims are mostly distinct but "distinct" is not "worth proving as a product claim" — so the triage gate is real, not cosmetic.
- **D2 — scan-scope/layer treatment of internal docs (prerequisite; the fresh-eye review weighted this highest).** Should `docs/internal/**` be in claim-discovery scope at the same granularity as user-facing docs? The cheap immediate option is a one-line source-scope gate excluding `docs/internal/*` from product-claim discovery unless explicitly toggled — this prevents recurrence on the next run and could land before the broader D1/D3 redesign. If internal docs stay in scope, how are developer-process rules layered or separated from product behavior promises? Is the gold set itself product-claim-only?
- **D3 — triage signal placement.** Should a "worth proving as a product claim" + audience/layer triage signal live in the extraction template revision, in a downstream curation pass, or in scan scope? How does it interact with `claimAudience` and `recommendedProof` that the agent already assigns?

## Required Constraints (from the debug diagnosis critique)

The spec must keep these two forks explicitly visible and decided, not deferred:
1. Whether internal docs stay in gold-set / product-claim scope (D2).
2. Whether the over-emission triage happens at extraction-template revision or in a downstream curation pass (D1 + D3).
This slice is design plus a likely cheap impl (the D2 source-scope gate), not pure design.

## Fixed (carried from prior decisions, do not reopen here)

- Agent extraction is the agent-primary direction; the binary stays deterministic (no model calls in extraction-input/apply-extraction).
- Anchoring/validate gates are working as specified; they prove excerpt shape, not meaningfulness/layer — this spec does not change them.
- Verbatim-excerpt fingerprints are the stable claim identity (from `debug-2026-06-10-claim-review-id-drift-refresh-loss.md`).

## Evidence

- `charness-artifacts/debug/latest.md` — full root-cause record, count comparison, sample inspection, audience/proof distribution.
- `charness-artifacts/eval-trust/goldset-v2-agent-extraction/` — the 292-claim agent packet, input, and result under investigation.
- The paused gold-set HITL `hitl-20260611-082742` (2 of 292 ratified: #0 accept/R8, #1 not-a-claim/R9) is blocked on this decision; rules R1-R9 carry forward.

## Critique

The design decision in this spec affects workflow and the extraction/curation contract, so a delegated fresh-eye critique is required before the spec is finalized (per repo subagent-delegation rule). The debug diagnosis that produced this seed was itself fresh-eye reviewed before closeout.

## Next Step

A `spec` session refines D1-D3 into a build contract, then `impl`. The gold-set HITL resumes only after the gold-set surface is redefined by D1/D2.
