# Spec: Agent Extraction, Curation, and Gold-Set Layering

Status: ratified design (maintainer 2026-06-16, revised after fresh-eye critique). Ready for impl after compaction.
Handoff from `charness-artifacts/debug/latest.md` (forced repeated-symptom interrupt `extraction-granularity-seam-2026-06-16`).

## Problem

Agent extraction over five refreshed discovery docs produced 292 claims for the regenerated gold set.
Debug found this is not an extraction failure but a missing-layer symptom: the product has two different "reviews" and the design collapsed them.

- Label review (per-claim recommendedProof / audience / readiness): agent extraction does this inline. Working.
- Curation review (is this claim worth keeping; cross-source dedup, granularity, false-positive, missing-claim): no seam does this. README #10/#11 promise "the Cautilus Agent curates that packet," but for agent-extracted claims there is no curation seam, and `review-input` default-excludes `agent-reviewed` claims.

The agent extraction itself is mostly sound (it caught 48 legitimate developer claims in `working-patterns.md` the heuristic could not read; ~19/20 sampled claims are genuinely distinct). The 292 is the curation gap, plus an undifferentiated audience mix, plus a real per-file over-emission signal (2.6x denser than heuristic on identical inputs, cli 3.7x).

## Structural Constraint (drives the decisions)

Cross-source dedup and granularity judgment require a whole-set view. Extraction is per-source (and was run per-source-subagent), so it structurally cannot dedup or re-granularize across sources. A whole-set stage is needed wherever that work lands — IF that work is needed at all (see the ground-truth-first sequencing below).

## Ground-Truth-First Sequencing (the meta decision, revised)

The earlier draft said "build a curation seam first, then resume HITL." A fresh-eye critique showed that is over-built and mis-sequenced: it would build a curator from imagination (curation policy was admitted-unknown), and it would contaminate the measurement (grading curated output, never grading raw extraction against a real gold set).

Revised meta decision: **do not build curation yet. Generate ground truth first, cheaply.**

1. Segment the existing 292 packet by `claimAudience` into a user-product track (~95) and a developer-repo-behavior track (~197) — post-hoc segmentation of the gold-set proposal, no new seam.
2. Resume the paused HITL over the user-product track first (rules R1-R9, verdicts #0 accept/R8, #1 not-a-claim/R9 carry forward).
3. The HITL verdicts (`not-a-claim` / `relabel` / `badly-bounded` / `accept`) ARE the raw-extraction measurement and the definition of what curation would have to do.
4. Only then decide whether and how to build curation, informed by the verdict mix: many `not-a-claim`/`badly-bounded` -> over-extraction is real -> build a curator; few -> no curator needed. The HITL is the experiment that decides whether the curator is worth building.

## Ratified Decisions (Fixed)

- **D1 = A (extraction stays high-recall).** Extraction remains exhaustive; recall is the agent's demonstrated strength and matches README #10/#11. Curation as a built step is DEFERRED until the HITL proves it is needed and defines it.
- **D2 = B (segment by `claimAudience` into separate tracks, user-product first).** Done now by post-hoc segmentation of the 292 packet, NOT by a new seam. Internal docs are NOT excluded (maintainer: `working-patterns.md` is CLAUDE.md-linked, so its rules are legitimate developer-facing behavior claims). `audience: unclear` claims go to a holding bucket reviewed with the developer track unless the maintainer reassigns. Rejected D2 one-surface-segment-field: one rubric cannot fairly grade both product promises and repo-behavior rules.
- **D3 = C in spirit, but DEFERRED.** If curation is built, triage splits (template lightly tightened so one rule is not split into sub-bullet claims; curation owns cross-set dedup + worth-proving + granularity, all drops audited). Not built until step 4 above.
- **Measurement = A, corrected.** The gold set is built over the segmented RAW extraction, so it measures extraction directly (recall + per-claim label/routing accuracy). Curation, if later built, is measured separately as "does it reproduce the maintainer's drop/merge/relabel verdicts." Rejected the earlier "raw recall on informal samples + curated precision on gold set" framing — it never grades raw extraction against a real gold set.

## Deferred Decision: curation seam vs review-seam reuse

If step 4 says build a curator, FIRST decide whether the existing `review-input`/`apply-review` seam can serve curation by relaxing its `agent-reviewed` default-exclusion (it already clusters, merges, removes false-positives, corrects labels), rather than adding a new `curate-input`/`apply-curation` seam. The critique flagged that a new seam was proposed without justifying it against review-seam reuse. Default lean: reuse the review seam unless it structurally cannot carry whole-set dedup/granularity; only then add a new seam.

## Dynamic Workflow Use

If a curator is built (step 4), the dynamic Workflow is the natural home for the curation execution: fan out claims by audience/semantic-group, dedup within and across groups, triage worth-proving, adversarially verify proposed drops (define N and conflict resolution at build time), synthesize the curated set. It may also drive the comparison-measurement fan-out. Not central to the immediate ground-truth-first path.

## Probe Questions (answered by the HITL itself, not pre-decided)

- Is over-extraction a real problem on the product surface? -> the `not-a-claim`/`badly-bounded` rate on the user-product track answers it.
- What does correct granularity look like? -> the `badly-bounded` verdicts give concrete examples.
- Curation granularity/audience policy, `audience: unclear` mechanics, curation idempotency, adversarial-drop N -> settled only if/when a curator is built, from real verdicts.

## Non-Goals / Deliberately Not Doing

- NOT excluding `docs/internal/*` from discovery (maintainer correction: AGENTS/CLAUDE-linked internal docs carry legitimate developer claims).
- NOT building a curation seam before HITL ground truth exists (critique: builds the wrong curator).
- NOT grading curated output as the extraction measurement (critique: contaminates the signal; the gold set is over raw extraction).
- NOT re-extracting — the existing 292-claim packet (`charness-artifacts/eval-trust/goldset-v2-agent-extraction/claims-agent.json`) is the source for segmentation.
- NOTE: segmentation does not fix granularity; granularity issues surface as `badly-bounded` verdicts in the HITL, which is the point.

## Constraints (repo norms carried)

Korean to the user; English docs with semantic line breaks; the binary stays deterministic; SKILL.md 180-nonempty-line disclosure budget and the slice-2 consumer-intent freeze still apply if the agent flow later gains curation; agent/dogfood packets avoid the adapter's `state_path`; `claims:refresh:all` after claim-source edits; `git push` stays user-owned; any new runtime surface ships an executable test in the same slice.

## Success Criteria

- The user-product track contains only user-audience product claims and is small enough to ratify in batches.
- The gold set measures raw extraction directly (recall + label accuracy), not a curated derivative.
- The decision to build (or not build) a curator is made from real HITL verdicts, not from imagination.
- The paused HITL resumes over the user-product track with R1-R9 and verdicts #0/#1 intact.

## Acceptance Checks

- Segmentation is deterministic and reversible: union of the user-product and developer tracks equals the 292 packet (no claim lost, none duplicated).
- The user-product track excludes developer-audience claims (assertion over the track).
- HITL resumes with the carried rules/verdicts visible and the queue re-scoped to the user-product track.

## Critique

Forced debug interrupt consumed:
- Interrupt Source: `extraction-granularity-seam-2026-06-16` (charness-artifacts/debug/latest.md).
- Seam Summary: claim-extraction granularity/layer; over-extraction recurs from heuristic to agent on the same seam.
- Chosen Next Step: spec (this contract), then impl starting with segmentation + HITL.
- Impl Status: ready for the segmentation + HITL slices; curation is deferred behind HITL ground truth.
- Impl Status Reason: building a curator before verdicts builds the wrong curator and contaminates the measurement.
- What Disproving Observation Is Resolved: a layered, product-claim-scoped, ratifiable gold set that measures raw extraction directly.

Delegated fresh-eye critique of the prior (build-curation-first) draft: returned NOT SAFE AS WRITTEN with four required changes (justify seam vs review-seam reuse; settle ground truth before building; fix the measurement boundary; shrink scope). All four are folded into this revision: curation deferred behind HITL ground truth, measurement is over raw extraction, seam-vs-reuse is an explicit deferred decision, scope shrunk to segmentation + HITL.

## Canonical Artifact

This file (`charness-artifacts/spec/2026-06-16-agent-extraction-curation-layering.md`) during implementation.

## Implementation Slices (post-compaction order)

1. Segment the existing 292 packet by `claimAudience` into a user-product track and a developer track (deterministic split of `gold-set-proposal.json`; reversible-union acceptance check). Re-scope the paused HITL queue to the user-product track.
2. Resume the gold-set HITL over the user-product track (R1-R9, verdicts #0/#1 carry). Record verdicts; watch the `not-a-claim`/`badly-bounded` rate as the over-extraction signal.
3. Decide from verdicts whether a curator is worth building. If yes, spec the curation step preferring review-seam reuse over a new seam; if no, record that extraction needs no curator and proceed.
4. Comparison measurement (slice 4) against the ratified gold set: recall + label accuracy on raw extraction; curation reproduction separately if a curator was built.
5. Living-doc realignment as decisions land (workflow contract, extraction template, README #10/#11 confirmation, SKILL.md within disclosure budget and the consumer-intent freeze).

## First Implementation Slice (post-compact)

Slice 1: deterministic audience segmentation of the 292 packet + HITL queue re-scope to the user-product track. Then slice 2 resumes the HITL. No new product seam until slice 3 says so.
