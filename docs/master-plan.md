# Cautilus Master Plan

## Goal

Turn `Cautilus` from a Ceal extraction scaffold into a standalone evaluation
product for agent runtime work.

The target product is:

- a standalone installable CLI plus bundled reusable skill
- host-repo adapters that define baselines, iterate loops, held-out checks,
  compare passes, and full gates
- optional executor-variant runners for bounded external review
- train-vs-held-out discipline backed by scenario history
- scenario proposal flows that mine runtime logs and audit traces into draft
  evaluation cases
- an intent-first workflow where prompts are mutable implementation details and
  evaluation contracts define success

## Current State

- Generic workflow, adapter, and reporting contracts are already extracted.
- Python adapter bootstrap scripts are already extracted.
- Minimal CLI and executor-variant runners now exist in this repo.
- A repo-local bundled `cautilus` skill surface now exists beside the CLI.
- A standalone `doctor` command now checks adapter readiness for host repos.
- A temp-repo smoke test now proves `adapter init -> doctor -> review variants`
  without Ceal-owned paths.
- Ceal still owns richer prompt-benchmark history logic, audit-workbench
  storage, scenario proposal generation, and operator web surfaces.

## Phase Plan

### Phase 1: Product Baseline

Done or nearly done:

- own generic workflow and contract docs
- own bootstrap scripts
- provide a repo-local CLI entrypoint
- provide lint and test surfaces
- stop relying on external Python YAML libraries

### Phase 2: Standalone Product Hardening

Next:

- make the binary and bundled skill feel like one product surface
- decide the durable runtime boundary for review prompts, schemas, and compare
  artifacts
- define a stable report packet file shape, not only a narrative shape

### Phase 3: Evaluation Engine

Move generic logic out of Ceal:

- scenario split selection rules
- train vs held-out vs full-gate execution semantics
- history update and scenario graduation logic
- baseline cache semantics where they are genuinely generic
- compare artifact conventions that downstream review prompts can reuse

Guardrail:

- do not import Ceal's built-in benchmark profiles unchanged if they encode
  Ceal-specific scenario packs

### Phase 4: Scenario Proposal Engine

Generalize the operator loop currently proven in Ceal:

- mine recent human conversations, recent live agent runs, and recent scenario
  coverage
- propose `refresh` vs `net-new` scenarios separately
- emit evidence-backed draft scenario JSON
- keep promotion as an explicit operator action

The extracted version should describe generic source ports rather than binding
itself to Slack or Ceal storage conventions.

### Phase 5: Intent-First Optimization Surface

Formalize the DSPy-like product story:

- evaluation contracts and scenario families define intent
- prompts, reducers, and wrappers are tunable artifacts
- compare runs report whether behavior improved, regressed, or overfit
- prompt revisions are acceptable if held-out and human review survive
- skill or runtime dogfooding becomes a first-class use case, not a side path

### Phase 6: Consumer Repoint And External Consumers

- repoint Ceal's generic workbench paths to `Cautilus`
- keep Ceal adapters, prompts, and operator policy local to Ceal
- add external-consumer instructions for repos like `charness`
- define release and versioning discipline before wider reuse

## Immediate Next Moves

1. Keep the standalone binary and bundled skill aligned on one checked-in
   workflow surface.
2. Repoint Ceal's generic adapter-resolution and review-variant tests to use
   `Cautilus` as one consumer.
3. Write a generic scenario/history contract spec that lifts the reusable parts
   of Ceal's prompt-benchmark profile engine.
