# Improvement

`Cautilus` should expose one bounded improvement seam above explicit report, review, and history evidence.

The goal is not an open-ended self-improvement loop.
The goal is to turn explicit evaluation evidence into one conservative next revision brief that still respects held-out, comparison, and structured review gates.

For a bounded `GEPA`-inspired prompt-search seam that sits above this contract, see [improvement-search.md](./improvement-search.md).

## Problem

The current improvement seam can propose one bounded revision brief, but it does not yet make three things explicit enough:

- which improvement style is being used
- how much evidence and review surface the improver is allowed to consume
- why a specific subset of evidence was selected for the brief

This makes the proposal less reproducible than the surrounding evaluation packets and leaves too much improver behavior implicit.

## Current Slice

This slice adds a small DSPy-inspired control surface without importing a DSPy runtime:

- a declared bounded budget
- a materialized trial plan derived from that budget
- proposal telemetry that explains how much evidence was seen, selected, and converted into the next bounded revision brief
- evidence provenance so later review can trace each proposal back to an explicit packet and locator
- one durable revision artifact packet above the proposal

## Fixed Decisions

- Improvement stays packet-first and file-based.
- `Cautilus` does not own a prompt-programming runtime or LM module framework.
- The improver still emits one bounded next-revision brief, not a compile loop.
- Consumer prompts, adapter files, and policy remain consumer-owned targets.
- Review findings, compare results, and scenario history remain the evidence sources for this seam.
- Runtime fingerprint changes can become improvement context without becoming a separate refresh workflow; see [runtime-fingerprint-improvement.md](./runtime-fingerprint-improvement.md).
- Shorter and less specialized prompts should win only after behavior, held-out, comparison, and review guardrails remain satisfied.

## Probe Questions

- Is the shared behavior-intent profile thin enough to stay repo-agnostic while still keeping review and improve packets aligned?
## Deferred Decisions

- consumer-integrated fine-tuning or weight-update orchestration

## Non-Goals

- importing DSPy's `Module`, `Predict`, `ReAct`, or teleprompt runtime
- automatic prompt edits or automatic adapter patches
- an unbounded retry loop
- host-owned raw log mining or storage-reader logic

## Constraints

- keep the existing `improve prepare-input` and `improve propose` command shape
- preserve `cautilus.improve_inputs.v1` and `cautilus.improve_proposal.v1` schema ids
- keep the default improver behavior conservative when the operator does not specify new fields

## Input Packet

Use `cautilus.improve_inputs.v1` for the prepare-input boundary.

The packet should include:

- repo root
- improvement target: `prompt` or `adapter`
- shared behavior intent profile: `cautilus.behavior_intent.v1`
  - uses the product-owned `behaviorSurface` and dimension catalogs
- optional current target file reference
- one explicit `cautilus.report_packet.v2`
- optional executor-variant review summary
- optional `cautilus.scenario_history.v1`
- product-owned objective and guardrail constraints
- improver configuration
  - `budget`: `light`, `medium`, or `heavy`
  - `plan`: bounded limits derived from the budget, such as evidence and review consumption caps

Revision reasons and evidence focus are derived from the evidence shape itself, not from a user-selected improver kind.

Current surface:

```bash
cautilus improve prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --review-summary /tmp/cautilus-review/review-summary.json \
  --history-file /tmp/cautilus-history/scenario-history.snapshot.json \
  --target prompt \
  --budget medium
```

## Proposal Packet

Use `cautilus.improve_proposal.v1` for the deterministic next-revision brief.

The proposal should include:

- improvement target and optional target file reference
- shared behavior intent profile copied from the input packet
- improver configuration copied from the input packet
- current report recommendation
- a bounded decision: `hold`, `revise`, or `investigate`
- prioritized evidence derived from regressions, noisy surfaces, report-level review findings, residual compare reasons, executor review findings, and recent history misses
- evidence provenance that points back to the source packet and locator
- suggested changes with explicit change kinds such as `prompt_revision`, `adapter_revision`, `sampling_increase`, or `history_followup`
- one revision brief
- trial telemetry
  - how many evidence items were seen
  - how many were selected under the current budget
  - how many high-signal items bound the brief
  - how many suggestions survived the bounded plan
  - which residual hotspots were considered but not selected under the current budget
- stop conditions and follow-up checks

Current surface:

```bash
cautilus improve propose \
  --input /tmp/cautilus-improve/input.json
```

The resulting proposal can be materialized into one durable revision artifact:

```bash
cautilus improve build-artifact \
  --proposal-file /tmp/cautilus-improve/proposal.json
```

## Success Criteria

- `improve prepare-input` can declare improver budget explicitly.
- `improve prepare-input` keeps a shared behavior-intent profile above raw prompt or adapter mechanics.
- The input packet materializes a bounded plan instead of leaving budget behavior implicit.
- `improve propose` records improver telemetry that explains why the final revision brief is bounded the way it is.
- Prioritized evidence includes source provenance for later audit.
- `improve build-artifact` emits one durable packet that can be reopened without rediscovering improve inputs by hand.

## Acceptance Checks

- `cautilus improve prepare-input --report-file ./fixtures/reports/report-input.json --target prompt --budget light`
- `cautilus improve propose --input ./fixtures/improve/example-input.json`
- `cautilus improve build-artifact --proposal-file ./fixtures/improve/example-proposal.json --input-file ./fixtures/improve/example-input.json`
- `node --test ./scripts/agent-runtime/improve-flow.test.mjs`

## Canonical Artifact

This document is the canonical contract for the improvement seam in this slice.

## First Implementation Slice

Update the improve input builder, improve proposal generator, revision artifact builder, schemas, fixtures, and flow tests so the improve seam keeps one durable packet for the next bounded revision.

## Guardrails

- Do not treat improver output as permission to weaken held-out, comparison, or structured review gates.
- Do not turn one bounded revision brief into an infinite retry loop.
- Prefer repairing cited regressions over widening scope.
- Do not add a new improver kind when the concept is really a revision reason, evidence focus, mutation behavior, or selection objective.
- Keep consumer prompts, policies, and target files consumer-owned even when packet assembly and proposal framing are product-owned.
