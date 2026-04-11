# Optimization

`Cautilus` should expose one bounded optimization seam above explicit report,
review, and history evidence.

The goal is not an open-ended self-improvement loop.
The goal is to turn explicit evaluation evidence into one conservative next
revision brief that still respects held-out, comparison, and structured review
gates.

## Problem

The current optimization seam can propose one bounded revision brief, but it
does not yet make three things explicit enough:

- which optimization style is being used
- how much evidence and review surface the optimizer is allowed to consume
- why a specific subset of evidence was selected for the brief

This makes the proposal less reproducible than the surrounding evaluation
packets and leaves too much optimizer behavior implicit.

## Current Slice

This slice adds a small DSPy-inspired control surface without importing a DSPy
runtime:

- a declared optimizer kind
- a declared bounded budget
- a materialized trial plan derived from that budget
- proposal telemetry that explains how much evidence was seen, selected, and
  converted into the next bounded revision brief
- evidence provenance so later review can trace each proposal back to an
  explicit packet and locator
- one durable revision artifact packet above the proposal

## Fixed Decisions

- Optimization stays packet-first and file-based.
- `Cautilus` does not own a prompt-programming runtime or LM module framework.
- The optimizer still emits one bounded next-revision brief, not a compile
  loop.
- Consumer prompts, adapter files, and policy remain consumer-owned targets.
- Review findings, compare results, and scenario history remain the evidence
  sources for this seam.

## Probe Questions

- Is the shared behavior-intent profile thin enough to stay repo-agnostic while
  still keeping review and optimize packets aligned?
## Deferred Decisions

- consumer-integrated fine-tuning or weight-update orchestration

## Non-Goals

- importing DSPy's `Module`, `Predict`, `ReAct`, or teleprompt runtime
- automatic prompt edits or automatic adapter patches
- an unbounded retry loop
- host-owned raw log mining or storage-reader logic

## Constraints

- keep the existing `optimize prepare-input` and `optimize propose` command
  shape
- preserve `cautilus.optimize_inputs.v1` and
  `cautilus.optimize_proposal.v1` schema ids
- keep the default optimizer behavior conservative when the operator does not
  specify new fields

## Input Packet

Use `cautilus.optimize_inputs.v1` for the prepare-input boundary.

The packet should include:

- repo root
- optimization target: `prompt` or `adapter`
- shared behavior intent profile: `cautilus.behavior_intent.v1`
  - uses the product-owned `behaviorSurface` and dimension catalogs
- optional current target file reference
- one explicit `cautilus.report_packet.v1`
- optional executor-variant review summary
- optional `cautilus.scenario_history.v1`
- product-owned objective and guardrail constraints
- optimizer configuration
  - `kind`: `repair`, `reflection`, or `history_followup`
  - `budget`: `light`, `medium`, or `heavy`
  - `plan`: bounded limits derived from the budget, such as evidence and review
    consumption caps

Current surface:

```bash
node ./bin/cautilus optimize prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --review-summary /tmp/cautilus-review/review-summary.json \
  --history-file /tmp/cautilus-history/scenario-history.snapshot.json \
  --target prompt \
  --optimizer reflection \
  --budget medium
```

## Proposal Packet

Use `cautilus.optimize_proposal.v1` for the deterministic next-revision brief.

The proposal should include:

- optimization target and optional target file reference
- shared behavior intent profile copied from the input packet
- optimizer configuration copied from the input packet
- current report recommendation
- a bounded decision: `hold`, `revise`, or `investigate`
- prioritized evidence derived from regressions, review findings, noisy
  surfaces, and recent history misses
- evidence provenance that points back to the source packet and locator
- suggested changes with explicit change kinds such as `prompt_revision`,
  `adapter_revision`, `sampling_increase`, or `history_followup`
- one revision brief
- trial telemetry
  - how many evidence items were seen
  - how many were selected under the current budget
  - how many high-signal items bound the brief
  - how many suggestions survived the bounded plan
- stop conditions and follow-up checks

Current surface:

```bash
node ./bin/cautilus optimize propose \
  --input /tmp/cautilus-optimize/input.json
```

The resulting proposal can be materialized into one durable revision artifact:

```bash
node ./bin/cautilus optimize build-artifact \
  --proposal-file /tmp/cautilus-optimize/proposal.json
```

## Success Criteria

- `optimize prepare-input` can declare optimizer kind and budget explicitly.
- `optimize prepare-input` keeps a shared behavior-intent profile above raw
  prompt or adapter mechanics.
- The input packet materializes a bounded plan instead of leaving budget
  behavior implicit.
- `optimize propose` records optimizer telemetry that explains why the final
  revision brief is bounded the way it is.
- Prioritized evidence includes source provenance for later audit.
- `optimize build-artifact` emits one durable packet that can be reopened
  without rediscovering optimize inputs by hand.

## Acceptance Checks

- `node ./bin/cautilus optimize prepare-input --report-file ./fixtures/reports/report-input.json --target prompt --optimizer repair --budget light`
- `node ./bin/cautilus optimize propose --input ./fixtures/optimize/example-input.json`
- `node ./bin/cautilus optimize build-artifact --proposal-file ./fixtures/optimize/example-proposal.json --input-file ./fixtures/optimize/example-input.json`
- `node --test ./scripts/agent-runtime/optimize-flow.test.mjs`

## Canonical Artifact

This document is the canonical contract for the optimization seam in this
slice.

## First Implementation Slice

Update the optimize input builder, optimize proposal generator, revision
artifact builder, schemas, fixtures, and flow tests so the optimize seam keeps
one durable packet for the next bounded revision.

## Guardrails

- Do not treat optimizer output as permission to weaken held-out, comparison,
  or structured review gates.
- Do not turn one bounded revision brief into an infinite retry loop.
- Prefer repairing cited regressions over widening scope.
- Keep consumer prompts, policies, and target files consumer-owned even when
  packet assembly and proposal framing are product-owned.
