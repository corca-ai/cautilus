# Spec: Agent Extraction, Curation, and Gold-Set Layering

Status: ratified design, REVISED 2026-06-16 by the user-product HITL (rules R1-R15). The "build-or-not a curator" framing is superseded by a claim-graph model (user-value apex + DAG of epics) — see "HITL Findings + Revised Design" below. Next real slice = slice 3 (revised). Earlier ground-truth-first plan and ratified decisions D1/D2/D3 are kept below as the record that led here.
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
- **Measurement = A, corrected — then re-corrected 2026-06-16 (recall).** The gold set is built over the segmented RAW extraction. **Correction (HITL finding):** reviewing extracted claims measures PRECISION + per-claim label/routing accuracy + tier, but it does NOT measure recall — you cannot find claims the agent MISSED by reading the list of what it extracted. The earlier "measures extraction directly (recall + ...)" wording over-claimed. Recall requires a separate bounded probe (pick a source region, independently enumerate the claims that should be there, diff against the agent's extraction) or the DAG epic-coverage signal (a thinly-supported or empty epic = candidate false-negative). **Probe done 2026-06-17 (plan item 2):** `charness-artifacts/eval-trust/goldset-v2-agent-extraction/recall-probe-readme-1-70.{md,blind.json}` ran the blind-enumerator method on README:1-70 — assertion-level recall is high on the agent's strongest surface (6 of 8 uncovered lines are MERGES of multi-assertion sentences, only 2 genuine false negatives, both principle/boundary-shaped: README:8 "agents are first-class users" + README:30 "not for ..."). Directional (n=1, best surface); a cli.md probe should follow. The thin-epic DAG signal materialized too (A2-curation, I1-improve), confirming the coverage-gap reading. Curation, if later built, is measured separately as "does it reproduce the maintainer's drop/merge/relabel verdicts."

## HITL Findings + Revised Design (2026-06-16, user-product track)

The user-product gold-set HITL (session `hitl-20260611-082742`, rules R1-R15) ran a deterministic stratified sample over the 121-claim user-product track and surfaced a design that supersedes the bare "build-or-not a curator" framing.

### What the sample actually showed (15/24 reviewed, precision clean)

- **No over-extraction signal in the sample (15/121, ~12%; deterministic stratified).** 0 `not-a-claim` and 1 `badly-bounded` in 15 sampled claims — the over-extraction-as-garbage hypothesis is unsupported on the sampled user-product surface (not a full disconfirmation; the remaining 9 sampled cards + the 97 unsampled claims are not yet reviewed). On what was sampled, the agent finds claims well.
- **The agent's real weakness is PROOF ROUTING (~20%, 3/15 relabels):** it over-uses `human-auditable` for structurally-provable capability claims (README:13, cli.md:391 — both relabel to `deterministic`), and over-trusts `deterministic` for an agent-behavior claim (README:113 -> `cautilus-eval`, because a deterministic schema check passes even on the 292 over-extraction). See R12.
- **The "292 too many" feeling was untiered FLATNESS, not over-extraction:** trivial spec-detail sits at the same layer as load-bearing promises. Full-set evidence: the 121 claims carry **55 distinct `claimSemanticGroup`s** (avg 2.2/group, many near-duplicates like `claim-discovery`/`claims-discovery`).
- So the "292" decomposes, on the evidence so far, into: audience-mix (already segmented) + count optics + flatness + ~20% proof-route noise — **not a garbage-over-extraction signal in the sample.**

### Revised model: a user-value APEX + a DAG of epics (supersedes the flat tier idea)

The maintainer defined the missing axis as a **claim graph**, not an importance score:

- **APEX = an authored user-value positioning statement** (DSPy-README style), NOT a tool-centric/mechanism line and NOT extracted verbatim from the docs (current docs lead with mechanism). Locked text:
  > Cautilus is the framework for discovering, evaluating, and improving agent behavior. It lets you pin down the behavior that matters, prove it survives every change to your prompts, skills, and models, and improve it within explicit budgets — whether you're protecting an AGENTS.md, a single skill, a prompt, or a full agent loop.
  Full-vision (discover/evaluate/improve) with honest proof badges (`proven`/`declared`/`promised`) carrying the current eval-only release boundary; this is exactly what `docs/specs/index.spec.md` ("Cautilus, Proven On Itself") apex should lead with.
- **EPICS** = the layer under the apex, organized by the product's top-level shape: the Cautilus Agent (skill) branch + the binary command groups (setup / discover / eval / improve) + a Meta/Cross-concern branch (Cautilus proven on itself: specs, dogfood, held-out, review). ~2 epics/branch, ~11 total. Epics LEAN toward user-story framing to surface value, but not dogmatically (user stories are one spec method among several).
- **CLAIMS attach to epics as a DAG, not a tree (R15) — REALIZED 2026-06-17 (plan item 1).** A claim may support MULTIPLE epics via a `supportingEpics: [...]` facet (many-to-many, acyclic). Rationale: a tree forces a dominant hierarchy and hides cross-cutting aspects; claims like "no LLM / deterministic" or "the agent curates" legitimately support several epics. The DAG is now demonstrated in data: `scripts/build-epic-dag.mjs` (+ test, deterministic/idempotent) turns the tree-form proposal into `epic-dag-proposal.json` with 121 claims, 0 orphans, and 16 assertion-grounded multi-epic edges covering the flagged ambiguous groups (minus review-feedback) + the cross-actor README:68 case. A fresh-eye edge audit dropped the review-feedback->Improve edges as inferred-not-asserted (now singleton D2), which is why I1 stays thin; thin A2/I1 support are recorded as honest under-documentation signals, not drawing gaps. "No orphans" holds; coverage = each epic's support set (the inverse of supportingEpics).
- Grounding artifacts: `epic-tree-proposal.json` (R14 tree, primaryEpic source) and the realized `epic-dag-proposal.json` (R15 DAG), both under `charness-artifacts/eval-trust/goldset-v2-agent-extraction/`. The DAG preserves primaryEpic as the audited tree home, so the tree-to-DAG move stays reviewable.

### Deliverables this implies (for slice 3 and product work)

- **Extraction template (intent-first):** emit per-claim facets `{audience, recommendedProof, tier-or-epic, supportingEpics[]}` directly, and collapse the 55 sprawling `claimSemanticGroup`s to the ~11 epics. Deriving epic from `claimSemanticGroup` is lossy — do not do it.
- **Tighten proof-routing guidance** so the agent stops over-assigning `human-auditable` to structurally-provable capability claims (R12 is the rubric: route by what the ENABLER is — static contract -> deterministic; agent behavior -> cautilus-eval).
- **Docs/README rewrite (product deliverable):** lead with the user-value apex instead of the current mechanism-first framing, so the reason-to-adopt lands immediately. Wire the apex into `docs/specs/index.spec.md` with honest proof badges.
- **Recall probe** (separate from this HITL) before claiming recall anywhere.

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
- The gold set measures raw extraction directly — precision + per-claim label/proof-routing + tier/epic accuracy — not a curated derivative. Recall is NOT measured by reviewing the extracted list; it needs a separate bounded probe or the DAG epic-coverage signal (see the corrected Measurement decision).
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

Delegated fresh-eye critique of THIS revision (the HITL-findings + claim-graph fold, 2026-06-16): returned NEEDS CHANGES with 3 blockers, all fixed here: (1) a leftover "recall" over-claim in Success Criteria contradicting the corrected Measurement decision — fixed; (2) the DAG benefit was written as achieved when the grounding artifact is still tree-form — relabeled PROPOSED/not-yet-realized; (3) "292 over-extraction DISCONFIRMED" overstated for a ~12% sample — hedged to "no over-extraction signal in the sample." The critique verified the quantitative claims (121/171 split, 11 epics, 55 groups, 0 orphans, 15/24 reviewed, ~20% proof-route relabels) against the artifacts. It confirmed apex honesty (full-vision + proof badges) and curation-deferral coherence. NOTE carried forward: the claim-graph model is design-to-validate (promoted on a 12% sample), not a settled contract. UPDATE 2026-06-17: the DAG is now realized in the artifact (item 1, `epic-dag-proposal.json`) and the recall gap has a first bounded probe (item 2); both passed a second delegated fresh-eye critique (NEEDS CHANGES → 2 blockers fixed: review-feedback->I1 over-connection dropped, recall L8 promoted to a confirmed second false negative).

## Canonical Artifact

This file (`charness-artifacts/spec/2026-06-16-agent-extraction-curation-layering.md`) during implementation.

## Implementation Slices (post-compaction order)

1. **DONE (commit 1ecdf32).** Segment the 292 packet by `claimAudience` into user-product (121) + developer (171) tracks (deterministic, reversible — `scripts/segment-goldset-by-audience.mjs` + test; delegated critique SAFE). Re-scope the paused HITL queue to the user-product track.
2. **DONE / in progress.** Resume the gold-set HITL over the user-product track. Stratified sample reviewed 15/24; precision clean (0 not-a-claim); the design findings above (proof-route ~20%, flatness, DAG epic model) are the real yield. Remaining 9 sample cards optional.
3. **DONE (commit `19a053d`, template v2) — REVISED from "build a curator?" to "fold the claim model into extraction."** The HITL found no over-extraction signal in the sample (so a drop/dedup curator is low-value on current evidence), so the priority was NOT a drop/dedup curator but the **claim-graph model**: (a) the extraction template now emits per-claim facets `{audience, recommendedProof, primaryEpic, supportingEpics[]}` and collapses the 55 groups onto the ~11 epics via an adapter-owned `epic_catalog` channel (DONE); (b) proof-routing tightened by enabler (R12, DONE); (c) the user-value apex was wired into `docs/specs/index.spec.md` with proof badges under item 3 (DONE); authoring the epics as user stories is captured in the `epic_catalog` titles/userStories now in `.agents/cautilus-adapter.yaml`. Curation-as-drop stays deferred (low evidence it is needed on the user-product surface); review-seam reuse remains the lean if dedup is ever needed.
4. Measurement against the ratified gold set: precision + label/proof-routing accuracy + epic/tier correctness on raw extraction. **Recall is separate** (bounded recall probe or DAG epic-coverage), per the corrected Measurement decision.
5. Living-doc realignment as decisions land: README/docs rewrite to lead with the user-value apex; `docs/specs/index.spec.md` apex + badges; extraction-template/workflow contract for the facets; developer track HITL later; SKILL.md within disclosure budget and the consumer-intent freeze.

## First Implementation Slice (post-compact)

Segmentation, the HITL sample, the realized DAG (item 1), the first recall probe (item 2), the README/docs user-value lead rewrite (item 3), and the slice-3 faceted extraction template (item 4) are landed. Item 3 aligned the README opening and the `docs/specs/index.spec.md` apex to the locked user-value apex (the index proof badges proven/declared/promised were already wired); landing it shifted the README line anchors that the eval-trust snapshot (`gold-set-proposal*.json`, `epic-dag-proposal.json`, `recall-probe-readme-1-70.*`) references, so that snapshot is now frozen against README@`d20e043` and is re-anchored when slice 3's v2 template is re-run, not before.

Item 4 (slice 3 as revised) landed the faceted/DAG claim model in the extraction template itself rather than a drop/dedup curator: the binary now emits a v2 template (commit `19a053d`) whose claims carry `primaryEpic` + `supportingEpics` collapsed onto the repo's ~11 epics, route `recommendedProof` by enabler (R12), and are explicitly prompted for the design-principle and negative/scope-boundary claim shapes the recall probe caught the agent missing. The epic vocabulary is repo-specific, so it arrives through a new adapter channel (`claim_discovery.epic_catalog`) hashed into the template, never hardcoded; this repo's 11 epics from `epic-dag-proposal.json` are wired into `.agents/cautilus-adapter.yaml` as the dogfood proof. Catalog membership is recorded for review, never enforced, so an unmapped epic surfaces instead of dropping a real claim. The next slice is the deferred re-extraction + comparison measurement: re-run the v2 template over the corpora and score the faceted output (precision + label/proof-routing + epic correctness) against the ratified gold set, re-anchoring the frozen snapshot then. The drop/dedup curator stays deferred (low evidence it is needed on the user-product surface).
