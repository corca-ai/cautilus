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
- Ceal now repoints generic adapter-resolution and review-variant runner seams
  to `Cautilus` as a consumer.
- A first generic scenario/history contract draft now exists in
  `docs/contracts/scenario-history.md`.
- A first generic scenario-proposal source contract draft now exists in
  `docs/contracts/scenario-proposal-sources.md`.
- A first product-owned scenario/history runtime seam now exists in
  `scripts/agent-runtime/scenario-history.mjs`.
- A first product-owned scenario-proposal runtime seam now exists in
  `scripts/agent-runtime/scenario-proposals.mjs`.
- A standalone `scenario propose` command now turns normalized proposal input
  packets into operator-reviewable proposal packets.
- A checked-in contract now describes the normalized input packet consumed by
  `cautilus scenario propose`.
- A file-based `scenario prepare-input` reference surface now demonstrates the
  host-owned normalization seam before proposal generation.
- The next design step now treats `chatbot` and `skill` as the first
  use-case-specific normalization helpers worth productizing.
- A first product-owned `chatbot` normalization runtime seam now exists for
  Ceal-shaped conversation and blocked-run summaries.
- A standalone `scenario normalize chatbot` command now emits proposal
  candidates from a checked-in chatbot input packet.
- A first product-owned `skill` normalization runtime seam now exists for
  charness-like validation regressions and crill-like blocked workflow
  artifacts.
- A standalone `scenario normalize skill` command now emits proposal
  candidates from a checked-in skill/workflow input packet.
- Checked-in schema artifacts now pin the `chatbot` and `skill` helper input
  packets beside their fixtures.
- Checked-in `ceal`, `charness`, and `crill` shaped packet examples now show
  what consumer-owned normalized input should look like without importing raw
  reader logic.
- [consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md)
  now fixes the honest live-consumer status: `ceal` is ready today, while
  `charness` and `crill` are normalization references until those repos gain a
  real `cautilus-adapter` surface.
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

The first helper targets should be:

- `chatbot`
  - Ceal-like conversation continuity and blocked-follow-up patterns
- `skill`
  - charness-like validation scenarios plus crill-like durable workflow
    artifact regressions

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
2. Keep both `chatbot` and `skill` normalization wired into the
   `prepare-input -> propose` standalone chain with checked-in fixtures.
3. Keep expanding normalization-pattern coverage while preserving one official
   adapter contract: `cautilus-adapter.yaml`.
4. Prepare explicit consumer migration steps for `charness` and `crill`
   instead of widening discovery rules.
