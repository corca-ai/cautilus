# Optimization Search

`Cautilus` should expose one bounded prompt-search seam above explicit
evaluation, review, and history evidence.

The goal is not to import DSPy's runtime.
The goal is to bring the useful shape of `dspy.GEPA` into `Cautilus`'s
packet-first product boundary so an operator can run bounded prompt evolution
without weakening held-out, comparison, or structured review discipline.

## Problem

The current optimization seam turns one evaluated candidate into one bounded
revision brief.
That is useful, but it leaves a gap between:

- "the current candidate has explicit failures"
- and "which alternate prompt candidate should we try next"

When prompt search remains outside the product boundary, hosts end up
re-implementing the same control plane:

- how many candidate prompts to try
- which failures to reflect on
- which candidate survives train versus held-out
- how to preserve complementary strengths instead of collapsing to one scalar
  score too early

`dspy.GEPA` is a strong reference here because it keeps three things explicit:

- per-example or per-task scores, not only aggregate scores
- textual feedback that explains why a candidate failed
- Pareto-frontier retention so complementary strategies are not discarded too
  early

## Current Slice

This slice defines a first `GEPA`-inspired search contract for `Cautilus`:

- v1 is `prompt`-only
- v1 assumes one consumer-owned target prompt file
- search remains packet-first and file-based
- candidate evaluation is bounded by declared budgets and checkpoint policies
- candidate selection is Pareto-based over per-scenario validation scores
- the current implementation closes packet assembly, readiness gating,
  multi-generation reflective mutation, bounded merge synthesis, held-out
  reevaluation, frontier-promotion review execution, final-only checkpoint
  fallback, and the proposal bridge
- reflective mutation is evidence-aware rewriting, not random string editing
- the search output stays reopenable as a durable artifact and can feed the
  existing bounded `optimize propose` seam

## Fixed Decisions

- `Cautilus` keeps the existing `optimize prepare-input`, `optimize propose`,
  and `optimize build-artifact` seams.
- Search is an additional seam above the current optimize input, not a
  replacement for it.
- v1 targets `prompt` only.
- v1 targets exactly one consumer-owned prompt file at a time.
- Held-out scenarios remain selection and validation surfaces, not mutation
  training material.
- Review findings are binding evidence for search checkpoints and candidate
  selection.
- The default review checkpoint policy is budget-aware:
  `final_only` for `light`, `frontier_promotions` for `medium` and `heavy`.
- Candidate retention uses a Pareto frontier over per-scenario validation
  scores, not only one aggregate score.
- Cost and latency telemetry are mandatory when available, but are not primary
  Pareto frontier dimensions in v1.
- Declared selection `constraintCaps` keep a candidate eligible for frontier
  search, mutation, and merge, but make it ineligible for final selection when
  the candidate breaches the cap.
- When merge synthesis is enabled, the default three-parent activation policy
  is `coverage_expansion`: keep the smaller two-parent merge unless adding a
  third review-admissible parent expands frontier coverage across held-out
  scenarios.
- Selection-policy failures must stay machine-readable.
  - top-level blocked search results use stable public reason codes such as
    `no_selection_policy_eligible_candidate`
  - per-candidate `selectionTelemetry.rejectionReasons` entries for declared
    selection caps are also stable public codes
  - the current stable cap-breach code set is:
    - `selection_constraint_max_cost_exceeded`
    - `selection_constraint_max_duration_exceeded`
  - future codes may be added, so consumers must tolerate unknown values
- Prompt mutation is reflective prompt rewriting based on explicit evidence,
  not random token- or substring-level crossover.
- The search output recommends a best next candidate and preserves lineage, but
  does not auto-apply prompt edits.
- If search-readiness evidence is insufficient, `Cautilus` must stop before
  candidate generation and emit a machine-readable blocked result.
- Inline JSON ingress is allowed, but `Cautilus` must materialize it into a
  canonical input file before continuing.

## Deferred Decisions

- multi-prompt or multi-component coupled updates
- `adapter` target search
- weight updates, fine-tuning, or external trainer orchestration
- automatic prompt patch application to consumer-owned files
- richer merge selection beyond the current bounded two- or three-parent
  synthesis and smarter crossover heuristics

## Non-Goals

- importing DSPy's `Module`, `Predict`, `ReAct`, or teleprompt runtime
- mutating consumer-owned prompts without a durable candidate artifact
- evaluating every candidate through full gate on every search step
- training on held-out failures
- open-ended autonomous retries without explicit budget and stop conditions

## Constraints

- keep the product boundary packet-first and file-based
- preserve the current `cautilus.optimize_inputs.v1`,
  `cautilus.optimize_proposal.v1`, and `cautilus.revision_artifact.v1`
  contracts
- keep consumer prompts, adapters, and policy language consumer-owned
- prefer explicit candidate snapshot files and fingerprints over inlining large
  prompt bodies into search packets
- keep the packet shape extensible to richer frontier heuristics and broader
  checkpoint execution later
- when JSON is provided directly over CLI or stdin, materialize the raw input
  and the normalized canonical packet under the active run before running
  readiness checks or search

## Reference Mapping

`dspy.GEPA` concepts should map into `Cautilus` terms like this:

- `candidate`: one prompt candidate snapshot plus its fingerprint and lineage
- `trainset`: iterate or train scenarios used for reflective mutation
- `valset`: held-out scenarios used for Pareto retention and candidate
  selection
- `metric + feedback`: explicit per-scenario score plus bounded textual
  failure digest assembled from compare artifacts, review findings, and
  scenario history
- `Pareto frontier`: the set of candidates that remain best on at least one
  held-out scenario
- `reflective mutation`: rewriting the target prompt using structured evidence
  about where a candidate succeeded or failed
- `merge`: bounded synthesis of one new prompt from complementary frontier
  strengths without raw string splicing

This keeps the useful GEPA shape while staying honest about `Cautilus`'s
different product boundary.

## Search Input Packet

Use `cautilus.optimize_search_inputs.v1` for the search boundary.

The packet should include:

- repo root
- the source `cautilus.optimize_inputs.v1` packet or explicit file reference
- optimization target
  - v1 must be `prompt`
- one explicit consumer-owned target file reference
- one seed candidate snapshot reference and fingerprint
- search configuration
  - `algorithm`: `reflective_pareto`
  - `budget`: `light`, `medium`, or `heavy`
  - `generationLimit`
  - `populationLimit`
  - `mutationBatchSize`
  - `candidateSelection`: `pareto`
  - `reviewCheckpointPolicy`: `final_only` or `frontier_promotions`
  - `fullGateCheckpointPolicy`: `final_only`
  - optional `selectionPolicy`
    - `primaryObjective`: `held_out_behavior`
    - optional `tieBreakers`, such as `lower_cost` and `lower_latency`
    - optional `constraintCaps`, such as `maxCostUsd` or `maxDurationMs`
  - optional `mergeEnabled`
  - optional `threeParentPolicy`
    - `coverage_expansion`
    - `disabled`
- mutation evidence policy
  - which report buckets can seed mutation
  - how many review findings can enter one reflective batch
  - whether scenario history can appear in reflective feedback
  - whether frontier-promotion checkpoint feedback should be reinjected into
    later mutation prompts
- explicit scenario sets
  - `trainScenarioSet`
  - `heldOutScenarioSet`
- evaluation surface references
  - report file
  - optional review summary file
  - optional scenario history file
  - optional held-out scenario-results file
  - optional scenario result files used to materialize scenario ids and past
    failures
- objective and guardrail constraints copied from the source optimize input

Current intended surface:

```bash
cautilus optimize search prepare-input \
  --optimize-input /tmp/cautilus-optimize/input.json \
  --held-out-results-file /tmp/cautilus-mode/held_out-scenario-results.json \
  --target-file .agents/review.prompt.md \
  --budget light
```

For agent-driven ingress, `Cautilus` may also accept direct JSON input, but it
must immediately materialize:

- the raw input payload
- the normalized canonical search input packet

under the active run directory before returning success or blocked status.

This keeps the ingress convenient without giving up replayable file-based
artifacts.

## Search Readiness

`Cautilus` should refuse candidate generation when the repo is not
search-ready.

The minimum search-ready evidence for v1 is:

- held-out scenario ids
- per-scenario score or pass/fail outcomes for the selected evaluation surface
- at least one textual feedback source that can ground reflective mutation
  - compare-artifact reason
  - human-review finding
  - scenario-history instability note

If these are missing, `Cautilus` must stop before candidate generation and
emit a blocked result with:

- non-zero exit status in normal CLI mode
- a machine-readable JSON payload when `--json` is requested
- a canonical input file reference so an operator or agent can reopen the same
  blocked state and discuss what evidence should be created next

The blocked payload should make the next discussion possible instead of merely
reporting generic failure.

Example shape:

```json
{
  "status": "blocked",
  "inputFile": "/tmp/cautilus-run/optimize-search-input.json",
  "reasonCodes": [
    "missing_held_out_scenarios",
    "missing_per_scenario_scores",
    "missing_textual_feedback"
  ],
  "missingEvidence": [
    "held_out scenario ids",
    "per-scenario score or pass/fail records",
    "compareArtifact reasons or humanReviewFindings"
  ],
  "suggestedNextSteps": [
    "run held_out evaluation with scenario results enabled",
    "build a report packet with compare artifacts",
    "collect at least one review summary for the target behavior"
  ]
}
```

## Candidate Artifact

Each candidate should materialize as a small explicit snapshot bundle under the
active run directory, not only as an in-memory string.

Candidate metadata should include:

- candidate id
- generation index
- parent candidate ids
- candidate origin
  - `seed`
  - `mutation`
  - `merge`
- target file snapshot path
- fingerprint
- concise mutation rationale
- reflective evidence references used to create the candidate

The point is to keep lineage and rollback explicit without inlining large
prompt bodies into the top-level search packet.

## Reflective Dataset

The reflective dataset should stay grounded in explicit artifacts.

Each reflective example should be assembled from:

- scenario id
- mode and split identity
- candidate output status
- candidate score for that scenario
- optional baseline delta from compare artifacts
- bounded textual feedback assembled from:
  - compare-artifact reasons
  - report regressions or noisy signals
  - matching review findings
  - matching scenario-history instability notes

This is the `Cautilus` equivalent of GEPA's "inputs, outputs, feedback"
reflection set.

If the repo cannot provide enough explicit scenario evidence to assemble this
dataset honestly, `Cautilus` should refuse search rather than hallucinating a
reflection surface from loose logs.

## Search Loop

The bounded loop should work like this:

1. Start with one seed candidate from the current target prompt file.
2. Evaluate the seed candidate on the held-out scenario set to establish the
   initial per-scenario score vector and frontier.
3. For each generation:
   - retain a bounded parent set from the current Pareto frontier
   - sample one bounded reflection batch per parent from the train scenario
     set
   - build a reflective dataset from explicit evidence
   - generate one or more mutated prompt candidates from frontier parents
   - optionally generate one bounded merge candidate from complementary
     frontier parents
   - evaluate generated candidates on held-out scenarios
   - update the Pareto frontier using held-out per-scenario scores
   - defer non-final checkpoints unless the operator enables a stricter policy
4. Stop when the budget, generation limit, or stop condition is reached.
5. Evaluate ranked frontier finalists against the declared final checkpoints.
6. Emit one selected best next candidate plus the durable search record, or a
   blocked result when no checkpoint-admissible finalist survives.

Current implementation note:

- v1 executes the bounded multi-generation loop, including reflective mutation,
  optional merge generation, held-out reevaluation, frontier retention,
  optional frontier-promotion review checkpoints, final-only full-gate
  checkpoints, declared selection-cap filtering across ranked frontier
  finalists, and proposal bridging
- when the frontier leader fails a final checkpoint, `optimize search run`
  falls back to the next ranked frontier candidate
- when every frontier finalist fails the final checkpoints, `optimize search
  run` emits a blocked result with checkpoint rejection reasons

In v1, review checkpoint policy means:

- `final_only`
  - run review variants and full-gate evaluation while walking the ranked
    frontier finalists
- `frontier_promotions`
  - run review variants whenever a candidate is promoted onto the held-out
    frontier
  - if the review rejects that candidate, preserve the rejection reasons and
    feedback messages on the candidate record
  - when a rejection message names one or more known scenarios, preserve it as
    scenario-scoped checkpoint feedback and inject only the relevant scenario
    entries into that candidate's later mutation prompts
  - when a rejection message does not name a known scenario, preserve it as
    candidate-scoped checkpoint feedback and keep it eligible for later
    mutation prompts
  - review-rejected frontier candidates may still seed later mutation, but
    merge-parent selection remains limited to review-admissible candidates
  - a concern-level review rejection gets at most one later repair generation
    as a mutation parent before frontier parent selection prunes that stale
    rejected lineage
  - a blocker-level review rejection is pruned from mutation-parent selection
    before the next generation
  - the current bounded slice keeps this two-bucket pruning policy; finer
    review-pruning buckets stay deferred until larger search budgets or live
    telemetry show a repeatable need

In the current bounded slice, merge synthesis stays bounded to two or three
review-admissible parents and should prefer:

- stronger combined held-out frontier coverage first
- then smaller parent sets unless `threeParentPolicy=coverage_expansion` and
  an extra parent materially expands combined frontier coverage across
  held-out scenarios
- then explicit candidate signals such as `expectedImprovements`,
  `preservedStrengths`, and lower `riskNotes`, with scenario-aware weighting
  toward the weakest current frontier scenarios
- when the frontier also contains review-rejected siblings, the merge prompt
  may carry their scenario-relevant checkpoint feedback forward as bounded
  context so the synthesis can avoid repeating the same rejected gap
- then cost and duration telemetry as late tie-breakers

The current bounded default is budget-aware: `light` stays `final_only` to
preserve a cheaper bounded path, while `medium` and `heavy` default to
`frontier_promotions` so larger searches reinvest their extra budget into
earlier review-bound pruning and feedback reinjection.

## Cost And Latency

Cost and latency telemetry should be recorded for every candidate whenever the
evaluation surface exposes them.

In v1:

- they are mandatory telemetry when available
- they are not primary Pareto frontier dimensions by default
- they should act as:
  - explicit constraint caps
  - or tie-breakers between behaviorally similar candidates
- when a declared `constraintCaps` limit is breached, the candidate stays in
  the frontier search record but becomes ineligible for final selection in the
  ranked-frontier walk

This avoids selecting a prompt merely because it is short or cheap when the
behavior objective is worse.

If two candidates are behaviorally near-equivalent on held-out scenarios and
review checkpoints, the cheaper or faster one may win final selection.

## Search Result Packet

Use `cautilus.optimize_search_result.v1` for the durable search record.

The packet should include:

- repo root
- source search input file reference
- search configuration
- selected candidate id
- candidate registry
  - candidate ids
  - lineage
  - snapshot references
  - mutation rationales
- generation summaries
  - candidate ids proposed
  - candidates promoted to held-out
  - frontier membership after each generation
- held-out evaluation matrix
  - per-candidate per-scenario scores
- Pareto metadata
  - frontier candidate ids
  - per-scenario best candidate ids
  - optional frontier coverage counts
- checkpoint outcomes
  - review checkpoint results
  - full-gate checkpoint result for each attempted finalist when run
- selection telemetry
  - ranked frontier candidate ids
  - rejected finalist candidate ids
  - selection-policy-ineligible candidate ids
  - per-candidate machine-readable rejection reasons
- search telemetry
  - candidate count
  - generation count
  - mutation invocation count
  - held-out evaluation count
  - review checkpoint count
  - full-gate checkpoint count
  - stop reason
- proposal bridge
  - the selected candidate snapshot reference
  - the bounded rationale for why it should feed `optimize propose`

Selection-policy blocked results should use `no_selection_policy_eligible_candidate`
when every ranked frontier finalist is excluded by declared selection caps,
and they should preserve the per-candidate stable rejection codes under
`selectionTelemetry.rejectionReasons`.

## Proposal Bridge

The search seam should compose with the current optimize seam like this:

1. `optimize prepare-input` still materializes the generic optimize context.
2. `optimize search prepare-input` derives a bounded search plan from that
   context.
3. `optimize search run` emits a durable search result and selected candidate.
4. `optimize propose --from-search` or an equivalent helper emits one bounded
   next-revision brief for the selected candidate.
5. `optimize build-artifact` stays the durable handoff object for operator
   review and follow-up implementation.

This preserves the current "one bounded revision brief" contract while adding
search before the final proposal.

## Success Criteria

- `Cautilus` can run a bounded prompt-search loop from explicit packets and
  explicit target-file snapshots.
- The first search surface is honest about `prompt`-only ownership and single
  target-file scope.
- Candidate selection preserves complementary strengths through a Pareto
  frontier over per-scenario held-out scores.
- Reflective mutation uses explicit textual feedback derived from report,
  review, compare, and history artifacts.
- Search output preserves enough lineage and per-scenario scoring detail for an
  operator to understand why the selected candidate won.
- The selected candidate can feed the existing bounded optimize proposal seam
  without weakening held-out or review discipline.

## Acceptance Checks

- `cautilus optimize search prepare-input --optimize-input ./fixtures/optimize/example-input.json --target-file ./fixtures/prompts/example.prompt.md --budget light`
- `cautilus optimize search prepare-input --optimize-input ./fixtures/optimize/example-input.json --held-out-results-file ./fixtures/scenario-results/example-results.json --target-file ./fixtures/prompts/example.prompt.md --budget light`
- `cautilus optimize search prepare-input --input-json '{...}' --json`
- `cautilus optimize search run --input ./fixtures/optimize/search-input.json`
- `cautilus optimize propose --from-search ./fixtures/optimize/search-result.json`
- one checked-in flow test that proves:
  - candidate lineage is preserved
  - multi-generation frontier evolution is preserved
  - optional merge candidates preserve multiple parents
  - Pareto frontier metadata is emitted
  - final review rejection can fall back to the next frontier candidate
  - final full-gate rejection can fall back to the next frontier candidate
  - no checkpoint-admissible finalist yields a blocked result
  - the selected candidate remains reopenable as a bounded revision artifact
  - blocked readiness emits machine-readable reason codes and the canonical
    input file path

## Canonical Artifact

This document is the canonical contract for the bounded prompt-search seam in
this slice.

## Implemented Bounded Slice

The current bounded slice already proves:

- one explicit seed candidate plus durable descendant candidates
- explicit search input and result packets
- held-out readiness blocking with machine-readable JSON output
- multi-generation Pareto frontier retention over per-scenario scores
- reflective mutation from explicit evidence
- optional bounded merge generation from complementary frontier parents
- optional frontier-promotion review checkpoint execution
- scenario-aware checkpoint rejection feedback reinjection into later mutation
  prompts
- scenario-aware bounded two- or three-parent merge selection using candidate
  metadata, weakest-frontier weighting, telemetry tie-breakers, and explicit
  three-parent activation policy
- scenario-aware merge-prompt checkpoint feedback from relevant rejected
  frontier siblings
- severity-aware retention for review-rejected lineage: one repair generation
  for concern-level review rejection, immediate pruning for blocker-level
  rejection
- final-only full-gate checkpoint execution with ranked-frontier fallback
- selected-candidate emission and proposal bridging back into the existing
  optimize artifact flow

The next slice can build on this by feeding checkpoint rejections back into
specific scenarios or merge selection more system-aware, without reshaping the
packet boundary.

## Guardrails

- Do not treat search as permission to train on held-out or review outputs.
- Do not reduce candidate selection to one aggregate score when per-scenario
  vectors are available.
- Do not inline large prompt bodies into product-owned search packets.
- Do not run review or full-gate checkpoints on every candidate by default.
- Do not let the search loop auto-apply consumer-owned prompt edits.
- Do not weaken held-out, comparison, or structured review gates to make a
  frontier candidate survive.
- Do not silently continue past sparse-evidence readiness failures.
