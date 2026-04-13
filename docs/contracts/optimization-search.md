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
- prompt mutation is reflective, not random string editing
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
- Candidate retention uses a Pareto frontier over per-scenario validation
  scores, not only one aggregate score.
- Prompt mutation is reflective prompt rewriting based on explicit evidence,
  not random token- or substring-level crossover.
- The search output recommends a best next candidate and preserves lineage, but
  does not auto-apply prompt edits.

## Probe Questions

- Should review variants run only for the final candidate, or for every
  candidate promoted onto the held-out frontier?
- Should v1 validation use only scenario success/failure scores, or should it
  also include explicit cost and latency objectives when those metrics are
  available?
- When the host repo has sparse scenario telemetry, should `Cautilus` fall
  back to compare-artifact verdicts and human-review findings only, or require
  richer scenario packets before enabling search?

## Deferred Decisions

- multi-prompt or multi-component coupled updates
- `adapter` target search
- weight updates, fine-tuning, or external trainer orchestration
- automatic prompt patch application to consumer-owned files
- fully system-aware merge or crossover in the first implementation slice

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
- allow a small first generation sequence while keeping the packet shape
  extensible to frontier retention and merge later

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
- `merge`: a later seam that synthesizes one new prompt from complementary
  frontier strengths without raw string splicing

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
  - optional `mergeEnabled`
- mutation evidence policy
  - which report buckets can seed mutation
  - how many review findings can enter one reflective batch
  - whether scenario history can appear in reflective feedback
- explicit scenario sets
  - `trainScenarioSet`
  - `heldOutScenarioSet`
- evaluation surface references
  - report file
  - optional review summary file
  - optional scenario history file
  - optional scenario result files used to materialize scenario ids and past
    failures
- objective and guardrail constraints copied from the source optimize input

Current intended surface:

```bash
cautilus optimize search prepare-input \
  --optimize-input /tmp/cautilus-optimize/input.json \
  --target-file .agents/review.prompt.md \
  --budget light
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
  - later `merge`
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
   - sample one candidate from the current Pareto frontier
   - sample one bounded reflection batch from the train scenario set
   - build a reflective dataset from explicit evidence
   - generate one or more mutated prompt candidates
   - evaluate mutated candidates on the train scenario batch
   - promote only promising candidates to held-out evaluation
   - update the Pareto frontier using held-out per-scenario scores
   - run review checkpoints according to the declared policy
4. Stop when the budget, generation limit, or stop condition is reached.
5. Emit one selected best next candidate plus the durable search record.

In v1, "promising" should mean:

- not worse than the parent on the sampled train batch
- not in conflict with bound review findings already attached to the mutation
  batch

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
  - full-gate checkpoint result for the final candidate when run
- search telemetry
  - candidate count
  - generation count
  - mutation invocation count
  - held-out evaluation count
  - review checkpoint count
  - stop reason
- proposal bridge
  - the selected candidate snapshot reference
  - the bounded rationale for why it should feed `optimize propose`

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
- `cautilus optimize search run --input ./fixtures/optimize/search-input.json`
- `cautilus optimize propose --from-search ./fixtures/optimize/search-result.json`
- one checked-in flow test that proves:
  - candidate lineage is preserved
  - Pareto frontier metadata is emitted
  - the selected candidate remains reopenable as a bounded revision artifact

## Canonical Artifact

This document is the canonical contract for the bounded prompt-search seam in
this slice.

## First Implementation Slice

Implement the smallest generation sequence that can later grow into fuller
GEPA-style search:

- one seed candidate
- one reflective mutation step that can emit 2-3 mutated prompt candidates
- train-batch evaluation for those candidates
- held-out Pareto retention
- selected-candidate emission
- no merge in v1
- proposal bridge back into the existing optimize artifact flow

This first slice should prove the shape of:

- explicit candidate lineage
- per-scenario held-out score vectors
- bounded reflective mutation
- durable search artifacts

without claiming full merge-aware GEPA behavior yet.

## Guardrails

- Do not treat search as permission to train on held-out or review outputs.
- Do not reduce candidate selection to one aggregate score when per-scenario
  vectors are available.
- Do not inline large prompt bodies into product-owned search packets.
- Do not run review or full-gate checkpoints on every candidate by default.
- Do not let the search loop auto-apply consumer-owned prompt edits.
- Do not weaken held-out, comparison, or structured review gates to make a
  frontier candidate survive.
