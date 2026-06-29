# Final Acceptance Set

Status: Implemented for [issue #51](https://github.com/spilist/cautilus/issues/51).
The first slice landed: the `acceptance` split and `all` redefinition, the `acceptance` scenario-results mode, `heldOutExposureCount` and `heldOutScenarioIds` on the search result, and the `cautilus evaluate acceptance` command with the contamination guard, generalization-gap report, and `acceptanceReads` history record.
It was revised after a bounded fresh-eye critique re-grounded the structural guarantee against the actual runtime, then hardened after an implementation review closed an empty-held-out-set bypass; see the Critique section.

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
- a contamination guard: the acceptance read excludes and flags any acceptance scenario id that also appears in the finalist's recorded held-out set, refusing only when no clean scenario remains
- one human-driven read command that evaluates the selected finalist on the acceptance set
- a durable `cautilus.acceptance_report.v1` packet carrying the generalization gap, a reliability flag, and the held-out exposure count
- held-out exposure-count reporting wired into the search result so the overfitting-risk proxy is available even when the acceptance set is skipped
- the acceptance read recorded in scenario history as a distinct `acceptanceReads` entry, with the finalist's acceptance results carrying scenario-results mode `acceptance`, so a re-read is visible rather than silent

Whether acceptance is required, optional, or skippable for a given behavior surface is a risk-tier policy decision deferred to a follow-up slice (see Deferred Decisions).

## Entities

- `final acceptance set`: a set of scenarios, authored after a search finishes, in a separate profile file, that the search loop never queried.
- `acceptance read`: one human-driven evaluation of the selected finalist on the final acceptance set.
- `generalization gap`: finalist held-out (valset) aggregate score minus finalist acceptance aggregate score, reported as an aggregate delta; per-scenario scores are listed for both the held-out and acceptance sides, but because the two sets are disjoint there is no paired per-scenario gap.
- `held-out exposure count`: the number of candidate-scenario held-out evaluations the search performed to produce the finalist, used as an overfitting-risk proxy.
- `reliability flag`: an honesty marker (`reliable` or `low_confidence`) derived from the clean (non-contaminated) acceptance-set size, since a small single read is unbiased but high-variance.
- `contamination`: any acceptance scenario id that also appears in the finalist's recorded held-out scenario set, which would void the "never queried" property.

## Stages

1. A search run completes and emits a finalist plus a `cautilus.improve_search_result.v1` record that now also surfaces the held-out exposure count and the finalist's held-out scenario ids.
2. A maintainer authors a final acceptance set as boundary cases the search never saw, in a separate acceptance profile file with `split: acceptance`.
3. The maintainer runs the acceptance read once, passing the `cautilus.improve_search_result.v1` record so the command can recover the selected finalist's prompt snapshot and its recorded held-out scenario ids.
4. `Cautilus` checks for contamination by intersecting acceptance scenario ids with the finalist's recorded held-out scenario ids, excludes any contaminated ids from the gap, lists them explicitly in the report, and refuses with a blocked result only when no clean acceptance scenario remains.
5. `Cautilus` evaluates the finalist on the clean acceptance scenarios through the same scoring path as held-out, computes the generalization gap, sets the reliability flag from the clean count, and records the read as a distinct `acceptanceReads` entry in scenario history.
6. The `cautilus.acceptance_report.v1` packet feeds the human accept/reject step in [operator-acceptance.md](../maintainers/operator-acceptance.md) as advisory evidence, not as an auto-decision.

## Fixed Decisions

- The final acceptance set is authored post-hoc, not pre-split from the existing held-out set.
  Splitting a scarce, expensive-to-author held-out set three ways thins each split and trades known selection power for a noisy detector; authoring fresh boundary cases after search keeps the "never queried" guarantee and leaves held-out selection power intact.
- Acceptance scenarios reuse the existing scenario definition shape so acceptance scoring is apples-to-apples with held-out scoring.
- Acceptance scenarios carry `split: acceptance` and live in a separate acceptance profile file authored after the search completes.
- The structural guarantee is enforced as a contamination check in code, not in documentation.
  The acceptance read must intersect its acceptance scenario ids with the finalist's recorded held-out scenario ids (from `cautilus.improve_search_result.v1`), exclude any contaminated ids from the gap, list them explicitly in the report, and refuse with a blocked result only when no clean acceptance scenario remains.
  This guards the actual leak vector (a shared scenario id), which a profile-split readiness check cannot, because search does not select held-out scenarios by profile split.
  Graceful degradation is chosen over hard refusal on any overlap so one accidentally reused id does not discard a whole scarce, hand-authored acceptance set, while a contaminated scenario can never silently inflate the gap.
- The acceptance read ships as a new `cautilus evaluate acceptance` subcommand in the existing `evaluate` command family, matching the registered `evaluate fixture` and `evaluate review variants` subcommands ([app.go](../../internal/app/app.go) lines 196 and 240).
  It reuses the `evaluate fixture` scoring path internally rather than overloading `evaluate fixture` with acceptance-specific flags and a second output schema, because the acceptance read has distinct inputs (the search-result record plus the acceptance profile), a distinct guardrail (the contamination check), and a distinct output (`cautilus.acceptance_report.v1`).
- `split: all` resolves to the union of `train` and `test` only, and never includes `acceptance`.
  This is a change to live `SelectProfileScenarioIDs` behavior ([scenario_history.go](../../internal/runtime/scenario_history.go) line 88) and its existing test, made deliberately, and it settles the open `split: all` probe question in [scenario-history.md](./scenario-history.md) line 234 for the acceptance case.
- Acceptance is a first-class selectable split for the read command, but it is structurally excluded from the search input-assembly path; the two flow through the same `split` vocabulary but different code paths.
- The generalization gap is reported as an aggregate delta, with per-scenario scores listed for both the held-out and acceptance sides.
  Because the held-out and acceptance sets are disjoint, there is no paired per-scenario gap; the per-scenario score lists preserve the product's per-scenario anti-Goodhart stance without inventing a meaningless cross-set diff.
- The acceptance read is advisory.
  It emits an `accept` or `review` recommendation (and `blocked` when fully contaminated); rejection stays a human act, so the read never auto-rejects or auto-applies a candidate.
  `accept` requires a `reliable` read with the aggregate gap within a provisional product gap-tolerance constant; otherwise the recommendation is `review`.
- A small acceptance set is reported honestly rather than treated as decisive.
  When the clean acceptance-set size is below the product reliability floor, the report marks the gap `low_confidence` instead of presenting a confident verdict.
- The reliability floor is a single fixed product constant in this slice, not adapter-configurable, matching the fixed-threshold precedent in [scenario-history.md](./scenario-history.md) line 233.
  The flag is `low_confidence` when the clean acceptance scenario count is below the floor and `reliable` otherwise; the provisional floor value is set in code (conservatively around ten scenarios) so tuning does not churn this contract, and adapter-configurability is deferred.
- The acceptance read is recorded in scenario history as a distinct `acceptanceReads` entry (candidate id, clean scenario ids, timestamp), separate from train graduation and from `held_out` runs, so a second read after seeing the result is visible, because re-reading and then re-tuning would reintroduce the same adaptive-overfitting risk the surface exists to detect.
  The finalist's acceptance evaluation results separately carry scenario-results mode `acceptance`, which is deliberately excluded from the evidence-input scenario modes so acceptance results can never feed improve.
- Held-out exposure-count reporting is always on, independent of whether an acceptance set exists.
  When acceptance is skipped, the exposure count is the standing detection-lite signal and the skip must be recorded as an explicit waiver.
- The held-out exposure count is a new, distinctly named field (`heldOutExposureCount`) defined as the count of candidate-scenario held-out evaluations, derived by summing the recorded held-out evaluation matrix.
  It is not the existing `heldOutEvaluationCount`, which counts candidates only ([improve_search.go](../../internal/runtime/improve_search.go) line 728).

## Probe Questions

The three decide-first probes (reliability floor, command surface, contamination handling) are resolved in Fixed Decisions.
The one implementation-discovery probe is also resolved.

- Resolved: `cautilus.improve_search_result.v1` now exposes a `heldOutScenarioIds` convenience field (the deduplicated held-out scenario set the search evaluated against), so a result-only reader runs the contamination check without recomputing from the held-out matrix.

## Deferred Decisions

- The risk-tier axis that makes acceptance required for high-risk surfaces and skippable for low-risk ones is now specified in [acceptance-risk-tier.md](./acceptance-risk-tier.md) (Status: Specified, implementation deferred).
  Product owns only the axis/label shape and the contract that a risk tier can mark acceptance `required`, `optional`, or `skippable`; the adapter owns which surfaces are which tier and the numeric thresholds, mirroring the budget-tier ownership split in [improvement-search.md](./improvement-search.md) lines 65-66.
- Adapter-configurability of the reliability floor: the trigger condition (a real consumer need for a different floor) is met by the risk-tier slice, so [acceptance-risk-tier.md](./acceptance-risk-tier.md) decides to make the floor an adapter-owned per-tier threshold; the floor stays a fixed product constant until that implementation slice lands.
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

- An acceptance scenario id that also appears in the finalist's recorded held-out set is excluded from the gap and listed as contaminated, and a fully-contaminated read is refused, proven by an executable test that injects the overlap into the real held-out inputs.
- A maintainer can produce a durable acceptance report for a selected finalist that states the aggregate generalization gap, per-scenario scores for both sides, the reliability flag, and the held-out exposure count.
- A small acceptance set yields a report explicitly marked `low_confidence` rather than a falsely confident pass.
- The held-out exposure count is visible from the search result even when no acceptance set is read, and it counts candidate-scenario evaluations rather than candidates.
- A second acceptance read is distinguishable in scenario history because it is recorded under the `acceptance` mode.

## Acceptance Checks

- Runtime test: an acceptance read with partial overlap excludes the contaminated ids, lists them in the report, and computes the gap on the clean remainder; an acceptance read with full overlap (no clean scenario) is refused with a blocked result. The overlap is injected via the report buckets or held-out results the search actually consumed, so the test is non-vacuous.
- Runtime test: `split: all` selection returns the union of `train` and `test` and excludes every `acceptance` scenario, updating the existing `SelectProfileScenarioIDs` test deliberately.
- CLI/fixture test: the acceptance read over a fixture finalist recovered from a `cautilus.improve_search_result.v1` record emits `cautilus.acceptance_report.v1` with a populated `generalizationGap.aggregate`, per-scenario score lists, `reliability`, and `heldOutExposureCount`.
- Negative test: an acceptance set below the provisional reliability floor produces `reliability: low_confidence`.
- History test: running the acceptance read appends a distinct `acceptanceReads` entry, so a re-read is distinguishable and never blends into a held-out run.
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

A subsequent decide-first pass resolved the three carried probes: the reliability floor is a single fixed product constant (provisional value in code, adapter-configurability deferred), the read ships as a new `cautilus evaluate acceptance` subcommand, and contamination degrades gracefully (exclude and flag the overlap, refuse only when no clean scenario remains).
The one residual probe is whether the search result already exposes the finalist's held-out scenario ids ergonomically or needs a small convenience field.

A bounded fresh-eye review of the implementation then found and closed an empty-held-out-set bypass: when `heldOutScenarioIds` was absent or empty the contamination guard silently passed and the read returned a confident `accept`.
The read now falls back to the held-out matrix scenario ids, marks the read `held_out_set_unverifiable` and blocks `accept` when the set is still empty, and also blocks `accept` when no held-out baseline exists so a missing baseline cannot masquerade as a clean negative gap.

## Canonical Artifact

This document is the canonical build contract for the final acceptance set during implementation.
It sits beside [improvement-search.md](./improvement-search.md) and [scenario-history.md](./scenario-history.md) and references them rather than restating their rules.
When the executable spec graph is wired, this contract should gain an `implemented-by` link from the improvement promise in [docs/specs/promises/improvement.spec.md](../specs/promises/improvement.spec.md).

## First Implementation Slice

1. Add the `split: acceptance` value to [scenario-history.md](./scenario-history.md) and the `SelectProfileScenarioIDs` validator, redefine `split: all` as train+test only, and update the existing selection test deliberately.
2. Add `heldOutExposureCount` to `cautilus.improve_search_result.v1`, derived by summing the recorded held-out evaluation matrix, plus the finalist's held-out scenario ids if not already recoverable, with a result test.
3. Add the `cautilus evaluate acceptance` subcommand and the `cautilus.acceptance_report.v1` schema with the per-scenario and aggregate generalization gap, the reliability flag from the clean count, the exposure count, and the graceful-degradation contamination check, backed by the contamination and fixture tests.
4. Add the `acceptance` mode to the scenario-results enum and wire the acceptance-read record into scenario history.

Slice 1 plus the contamination check in step 3 carry the load-bearing safety guarantee and should land before the report shape is fully refined.
