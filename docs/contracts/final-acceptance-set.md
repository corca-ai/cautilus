# Final Acceptance Set

Status: Draft spec slice for [issue #51](https://github.com/spilist/cautilus/issues/51).
This contract is proposed, not yet implemented.
It was revised after a bounded fresh-eye critique re-grounded the structural guarantee against the actual runtime; see the Critique section.

`Cautilus` should expose one optional, optimizer-untouchable evaluation surface that detects held-out overfitting in `improve search` before a finalist is accepted.

## Problem

`improve search` uses held-out (valset) as the selection surface.
Each promoted candidate is re-evaluated on held-out scenarios, and finalist selection optimizes `selectionPolicy.primaryObjective: held_out_behavior` across generations (see [improvement-search.md](./improvement-search.md) lines 62, 150, and 357-366).

Direct leakage is already prevented.
Held-out never feeds reflective mutation, and "training on held-out failures" is an explicit Non-Goal ([improvement-search.md](./improvement-search.md) line 98).

The remaining gap is indirect, adaptive overfitting.
Repeatedly querying the same valset through the selection channel turns it into a de facto training signal over many generations, so the selected finalist's held-out score can drift away from true generalization.
There is currently no untouched surface to detect this drift, because valset is itself the selection surface.

The only mitigation today is query-count bounding through `generationLimit`, `populationLimit`, and the budget tiers in [internal/runtime/improve_search.go](../../internal/runtime/improve_search.go) lines 17-42.
That is prevention by limiting exposure, not detection of drift.
`full_gate` is an evaluation mode and a final checkpoint, not a surface that is structurally withheld from selection, so it cannot estimate the generalization gap either.

## How Search Actually Selects Held-Out (Grounding)

This contract's safety claim depends on how `improve search` chooses held-out scenarios, so it is stated here against the runtime rather than assumed.

`improve search` does not select held-out scenarios from a profile's `split` field.
It derives the held-out scenario set from the improve report's `regressed`/`noisy` buckets (`improveSearchHeldOutScenarioSet`, [improve_search.go](../../internal/runtime/improve_search.go) lines 134 and 413) or from an explicit held-out results file (`improveSearchHeldOutScenarioSetFromResults`, lines 174 and 436).
`SelectProfileScenarioIDs` in [scenario_history.go](../../internal/runtime/scenario_history.go) is never called by the search loop.

The real leakage vector is therefore not "a profile carries an acceptance scenario."
It is "an acceptance scenario id appears in the report buckets or the held-out results file the search consumed, and so also lands in the finalist's recorded held-out set."
The structural guarantee in this contract is grounded on that vector, not on profile-split selection.

## Capability Contract

A maintainer can read one optimizer-untouchable acceptance surface exactly once, at the human accept/reject step, to report the point-delta generalization gap between the selected finalist's valset score and its acceptance score, with an honest reliability flag, and to see how heavily held-out was queried to produce that finalist.

This is a detection surface added on top of the existing exposure-limiting model.
It does not replace held-out discipline, the bounded-search budget model, or the existing train/val split.

## Current Slice

This slice ships the acceptance mechanism, not the risk-tier policy that decides when it is mandatory.

- a post-hoc authored final acceptance set, authored after a search finishes so the search loop cannot have queried it
- a contamination guard: the acceptance read refuses or flags any acceptance scenario id that also appears in the finalist's recorded held-out scenario set
- one human-driven read command that evaluates the selected finalist on the acceptance set
- a durable `cautilus.acceptance_report.v1` packet carrying the generalization gap, a reliability flag, and the held-out exposure count
- held-out exposure-count reporting wired into the search result so the overfitting-risk proxy is available even when the acceptance set is skipped
- the acceptance read recorded in scenario history under a distinct `acceptance` mode so a re-read is visible rather than silent

Whether acceptance is required, optional, or skippable for a given behavior surface is a risk-tier policy decision deferred to a follow-up slice (see Deferred Decisions).

## Entities

- `final acceptance set`: a set of scenarios, authored after a search finishes, in a separate profile file, that the search loop never queried.
- `acceptance read`: one human-driven evaluation of the selected finalist on the final acceptance set.
- `generalization gap`: finalist held-out (valset) score minus finalist acceptance score, reported per-scenario and as an aggregate.
- `held-out exposure count`: the number of candidate-scenario held-out evaluations the search performed to produce the finalist, used as an overfitting-risk proxy.
- `reliability flag`: an honesty marker (`reliable` or `low_confidence`) derived from acceptance-set size, since a small single read is unbiased but high-variance.
- `contamination`: any acceptance scenario id that also appears in the finalist's recorded held-out scenario set, which would void the "never queried" property.

## Stages

1. A search run completes and emits a finalist plus a `cautilus.improve_search_result.v1` record that now also surfaces the held-out exposure count and the finalist's held-out scenario ids.
2. A maintainer authors a final acceptance set as boundary cases the search never saw, in a separate acceptance profile file with `split: acceptance`.
3. The maintainer runs the acceptance read once, passing the `cautilus.improve_search_result.v1` record so the command can recover the selected finalist's prompt snapshot and its recorded held-out scenario ids.
4. `Cautilus` first checks for contamination by intersecting acceptance scenario ids with the finalist's recorded held-out scenario ids, and refuses or flags the read when the intersection is non-empty.
5. `Cautilus` evaluates the finalist on the acceptance set through the same scoring path as held-out, computes the generalization gap, sets the reliability flag, and records the read in scenario history under the `acceptance` mode.
6. The `cautilus.acceptance_report.v1` packet feeds the human accept/reject step in [operator-acceptance.md](../maintainers/operator-acceptance.md) as advisory evidence, not as an auto-decision.

## Fixed Decisions

- The final acceptance set is authored post-hoc, not pre-split from the existing held-out set.
  Splitting a scarce, expensive-to-author held-out set three ways thins each split and trades known selection power for a noisy detector; authoring fresh boundary cases after search keeps the "never queried" guarantee and leaves held-out selection power intact.
- Acceptance scenarios reuse the existing scenario definition shape so acceptance scoring is apples-to-apples with held-out scoring.
- Acceptance scenarios carry `split: acceptance` and live in a separate acceptance profile file authored after the search completes.
- The structural guarantee is enforced as a contamination check in code, not in documentation.
  The acceptance read must intersect its acceptance scenario ids with the finalist's recorded held-out scenario ids (from `cautilus.improve_search_result.v1`) and refuse or flag the read when the intersection is non-empty.
  This guards the actual leak vector (a shared scenario id), which a profile-split readiness check cannot, because search does not select held-out scenarios by profile split.
- `split: all` resolves to the union of `train` and `test` only, and never includes `acceptance`.
  This is a change to live `SelectProfileScenarioIDs` behavior ([scenario_history.go](../../internal/runtime/scenario_history.go) line 88) and its existing test, made deliberately, and it settles the open `split: all` probe question in [scenario-history.md](./scenario-history.md) line 234 for the acceptance case.
- Acceptance is a first-class selectable split for the read command, but it is structurally excluded from the search input-assembly path; the two flow through the same `split` vocabulary but different code paths.
- The generalization gap is reported per-scenario and as an aggregate, consistent with the product's existing per-scenario Pareto anti-Goodhart stance.
- The acceptance read is advisory.
  It produces a generalization-gap point delta and an accept/reject recommendation; it never auto-rejects or auto-applies a candidate.
- A small acceptance set is reported honestly rather than treated as decisive.
  When acceptance-set size is below the product reliability floor, the report marks the gap `low_confidence` instead of presenting a confident verdict.
- The acceptance read is recorded in scenario history under a distinct `acceptance` mode, separate from `held_out`, so a second read after seeing the result is visible, because re-reading and then re-tuning would reintroduce the same adaptive-overfitting risk the surface exists to detect.
- Held-out exposure-count reporting is always on, independent of whether an acceptance set exists.
  When acceptance is skipped, the exposure count is the standing detection-lite signal and the skip must be recorded as an explicit waiver.
- The held-out exposure count is a new, distinctly named field (`heldOutExposureCount`) defined as the count of candidate-scenario held-out evaluations, derived by summing the recorded held-out evaluation matrix.
  It is not the existing `heldOutEvaluationCount`, which counts candidates only ([improve_search.go](../../internal/runtime/improve_search.go) line 728).

## Probe Questions

These should be answered through the first implementation slice or a small spike, not guessed in prose.

- What is the product reliability floor for acceptance-set size below which the report is forced to `low_confidence`, and should it be a fixed product constant or adapter-configurable like the perfect-result thresholds in [scenario-history.md](./scenario-history.md) line 233?
  The first slice fixes a provisional product constant so the negative acceptance check is deterministic; adapter-configurability stays the open question.
- Should the acceptance command be a new `cautilus evaluate acceptance` verb, or a mode on an existing `evaluate` surface?
- Should contamination be a hard refusal or a `contaminated` flag on the report, or both depending on overlap size?

## Deferred Decisions

- The risk-tier axis that makes acceptance required for high-risk surfaces and skippable for low-risk ones.
  Product owns only the axis/label shape and the contract that a risk tier can mark acceptance `required`, `optional`, or `skippable`; the adapter owns which surfaces are which tier and the numeric thresholds, mirroring the budget-tier ownership split in [improvement-search.md](./improvement-search.md) lines 65-66.
- Any reusable-holdout or differential-privacy "thresholdout" mechanism that would let held-out be reused more times before degrading instead of adding a separate set.
- Multi-finalist acceptance comparison; v1 reads one selected finalist.
- A defense-in-depth readiness rejection if profile-driven held-out selection is ever added to the search loop; it is unnecessary while search selects held-out from report buckets and results files only.

## Non-Goals

- Pre-splitting the existing held-out set into train/val/test.
- Auto-rejecting or auto-applying a candidate based on the acceptance read.
- Feeding acceptance results back into search, reflective mutation, or candidate shaping in any form.
  This would convert the acceptance set into a selection channel and destroy the entire guarantee.
- Making acceptance mandatory for every repo in this slice.
- Changing the existing train/val discipline or the bounded-search budget model.

## Deliberately Not Doing

- Guarding the search loop with a profile-split readiness rejection.
  Search does not select held-out scenarios by profile split, so such a check would pass without proving anything; the contamination check against the recorded held-out set is the testable guarantee instead.
- Treating `full_gate` mode or the final full-gate checkpoint as the acceptance surface.
  They can run on the same scenarios selection already touched, so they cannot measure a generalization gap.
- Reusing the existing `heldOutEvaluationCount` field as the exposure proxy; it counts candidates, not candidate-scenario evaluations.
- Hardcoding a global minimum acceptance-set size as a hard gate.
  The product enforces an honesty floor (the `low_confidence` flag), and the required-size policy belongs to the deferred risk-tier slice.
- Inventing risk-tier categories inside the product.
  Risk tiers stay host/adapter-owned policy to keep the product repo-agnostic.

## Constraints

- Keep the product boundary packet-first and file-based, consistent with [improvement-search.md](./improvement-search.md) lines 103-108.
- Reuse the existing `evaluate fixture` scoring path for acceptance evaluation rather than building a parallel scorer.
- The acceptance command must take the selected finalist's snapshot reference from the `cautilus.improve_search_result.v1` record as its evaluation target, not an ad-hoc working tree.
- Keep acceptance scenarios, their authoring, and the risk-tier policy consumer-owned.
- Schema changes land with explicit contract-version registration in both the Node and Go contract-version surfaces, matching the discipline noted in [scenario-history.md](./scenario-history.md) lines 283-284.
  This slice touches three schema surfaces: the `split: acceptance` enum value, a new `acceptance` value in the scenario-results `mode` enum ([scenario_results.go](../../internal/runtime/scenario_results.go) line 12 and [results.schema.json](../../fixtures/scenario-results/results.schema.json)), and the new `cautilus.acceptance_report.v1` packet.

## Success Criteria

- An acceptance scenario id that also appears in the finalist's recorded held-out set is detected and the read is refused or flagged, proven by an executable test that injects the overlap into the real held-out inputs.
- A maintainer can produce a durable acceptance report for a selected finalist that states the per-scenario and aggregate generalization gap, the reliability flag, and the held-out exposure count.
- A small acceptance set yields a report explicitly marked `low_confidence` rather than a falsely confident pass.
- The held-out exposure count is visible from the search result even when no acceptance set is read, and it counts candidate-scenario evaluations rather than candidates.
- A second acceptance read is distinguishable in scenario history because it is recorded under the `acceptance` mode.

## Acceptance Checks

- Runtime test: an acceptance read whose acceptance scenario ids intersect the finalist's recorded held-out scenario ids is refused or flagged as contaminated; the overlap is injected via the report buckets or held-out results the search actually consumed, so the test is non-vacuous.
- Runtime test: `split: all` selection returns the union of `train` and `test` and excludes every `acceptance` scenario, updating the existing `SelectProfileScenarioIDs` test deliberately.
- CLI/fixture test: the acceptance read over a fixture finalist recovered from a `cautilus.improve_search_result.v1` record emits `cautilus.acceptance_report.v1` with a populated `generalizationGap` (per-scenario and aggregate), `reliability`, and `heldOutExposureCount`.
- Negative test: an acceptance set below the provisional reliability floor produces `reliability: low_confidence`.
- History test: running the acceptance read appends a record under the `acceptance` mode, so a re-read is distinguishable from a held-out run.
- Result test: `heldOutExposureCount` on the search result equals the summed held-out evaluation matrix and differs from `heldOutEvaluationCount` when more than one held-out scenario exists.

## Critique

A bounded fresh-eye critique ran against the first draft and found four blockers clustered on one root cause: the draft modeled search scenario selection as profile-split-driven when the runtime selects held-out scenarios from the report buckets and held-out results file.
The critique was verified directly against `improve_search.go` (lines 134, 174, 413, 436, 728), `scenario_history.go` (lines 88, 280), and `scenario_results.go` (line 12).

Resolved in this revision:

- The structural guarantee was re-grounded from a vacuous profile-split readiness rejection to a contamination check against the finalist's recorded held-out scenario ids, and the acceptance check now injects overlap into the real held-out inputs so a green test proves something.
- The acceptance read is recorded under a new distinct `acceptance` mode rather than `held_out`, preserving the re-read visibility guarantee; the mode-enum change is now listed in Constraints.
- `heldOutExposureCount` is named distinctly from the existing `heldOutEvaluationCount` and defined as a candidate-scenario count derived from the held-out matrix.
- The acceptance command's finalist input (the `cautilus.improve_search_result.v1` snapshot) is now explicit.
- `split: all` redefinition is flagged as a change to live behavior with an existing test.
- The generalization-gap aggregation is fixed (per-scenario plus aggregate) rather than left as a probe that the entity definition pre-empted.
- The reliability-floor acceptance check is made deterministic by fixing a provisional product constant in the first slice while leaving adapter-configurability as the probe.
- Loose line-number citations were corrected (`primaryObjective` lives at line 150, not 120-122).

Open, intentionally carried as probes: the reliability-floor value and its configurability, the acceptance command verb, and whether contamination is a hard refusal or a flag.

## Canonical Artifact

This document is the canonical build contract for the final acceptance set during implementation.
It sits beside [improvement-search.md](./improvement-search.md) and [scenario-history.md](./scenario-history.md) and references them rather than restating their rules.
When the executable spec graph is wired, this contract should gain an `implemented-by` link from the improvement promise in [docs/specs/promises/improvement.spec.md](../specs/promises/improvement.spec.md).

## First Implementation Slice

1. Add the `split: acceptance` value to [scenario-history.md](./scenario-history.md) and the `SelectProfileScenarioIDs` validator, redefine `split: all` as train+test only, and update the existing selection test deliberately.
2. Add `heldOutExposureCount` to `cautilus.improve_search_result.v1`, derived by summing the recorded held-out evaluation matrix, plus the finalist's held-out scenario ids if not already recoverable, with a result test.
3. Add the acceptance read command and the `cautilus.acceptance_report.v1` schema with the per-scenario and aggregate generalization gap, the reliability flag, the exposure count, and the contamination check, backed by the contamination and fixture tests.
4. Add the `acceptance` mode to the scenario-results enum and wire the acceptance-read record into scenario history.

Slice 1 plus the contamination check in step 3 carry the load-bearing safety guarantee and should land before the report shape is fully refined.
