# Cautilus Master Plan

## Goal

Turn `Cautilus` from an extraction scaffold into a standalone intentful
behavior evaluation product.

The target product is:

- a standalone installable CLI plus bundled reusable skill
- host-repo adapters that define baselines, iterate loops, held-out checks,
  compare passes, and full gates
- optional executor-variant runners for bounded external review
- product-owned helper scripts and bundled-skill references for bounded
  evidence mining and optimization loops
- train-vs-held-out discipline backed by scenario history
- scenario proposal flows that mine runtime logs and audit traces into draft
  evaluation cases
- first-class evaluation surfaces for chatbot, skill, and CLI behavior
- an intent-first workflow where prompts are mutable implementation details and
  evaluation contracts define success

## Current State

Current `core validated surface`:

- generic workflow, adapter, and reporting contracts
- Python adapter bootstrap scripts
- a minimal CLI plus bundled `cautilus` skill entrypoint
- repo-local Codex and Claude plugin packages, marketplace wiring, and local
  proof paths for the bundled skill
- adapter readiness checks through `doctor`
- bounded runtime execution through `mode evaluate`
- scenario-history-aware profile selection and history updates for
  profile-backed mode runs
- comparison-mode baseline-cache seed materialization for profile-backed runs
- explicit workspace preparation through `workspace prepare-compare`
- explicit artifact-root pruning through `workspace prune-artifacts`
- report packet assembly, review packet assembly, and review-variant fanout
- bounded CLI behavior evaluation through `cli evaluate`
- tagged-release install and release-helper surfaces
- checked-in local gates and GitHub workflows that run `verify`

Current `product-owned helper surface`:

- `chatbot`, `cli`, and `skill` normalization helpers
- scenario proposal packet assembly and proposal generation
- scenario telemetry summaries
- normalized evidence-bundle input and merge helpers
- bounded optimization input and proposal helpers

Dogfood and migration evidence now lives separately from the product concept.
Use [consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md)
for checked-in host evidence instead of treating any one consumer repo as the
product definition.

## Phase Plan

### Phase 1: Product Baseline

Done or nearly done:

- own generic workflow and contract docs
- own bootstrap scripts
- provide a repo-local CLI entrypoint
- provide lint and test surfaces
- stop relying on external Python YAML libraries

### Phase 2: Standalone Product Hardening

Done or nearly done:

- make the binary and bundled skill feel like one product surface
- define a durable runtime boundary for review prompts, schemas, and compare
  artifacts
- define a stable report packet file shape, not only a narrative shape
- establish a first tagged-release installer surface without npm publication

### Phase 3: Evaluation Engine

Move generic logic into the product runtime:

- scenario split selection rules
- train vs held-out vs full-gate execution semantics
- history update and scenario graduation logic
- baseline cache semantics where they are genuinely generic
- compare artifact conventions that downstream review prompts can reuse

Guardrail:

- do not import a host repo's built-in benchmark profiles unchanged if they
  encode host-specific scenario packs

### Phase 4: Scenario Proposal Engine

Generalize the operator loop without binding to one host repo:

- mine recent human conversations, recent live agent runs, and recent scenario
  coverage
- propose `refresh` vs `net-new` scenarios separately
- emit evidence-backed draft scenario JSON
- keep promotion as an explicit operator action
- keep raw log readers, storage access, and host-specific trace retrieval
  consumer-owned
- ship bundled-skill reference prompts plus product-owned helper scripts that
  teach agents how to mine host-normalized evidence bundles into proposal
  inputs without each host copying the same meta-prompt loop

The product should describe generic source ports rather than binding itself to
one chat transport, one audit store, or one host storage convention.

The first helper targets should be:

 - `chatbot`
  - conversation continuity and blocked-follow-up patterns
- `cli`
  - operator-facing command intent plus guidance/behavior-contract regressions
    in bounded fixture environments
- `skill`
  - validation scenarios plus durable workflow artifact regressions

### Phase 5: Intent-First Optimization Surface

Formalize the DSPy-like product story:

- evaluation contracts and scenario families define intent
- intentful behavior includes operator-visible CLI surfaces, not only agent
  transcripts
- prompts, reducers, and wrappers are tunable artifacts
- compare runs report whether behavior improved, regressed, or overfit
- prompt revisions are acceptable if held-out and human review survive
- skill or runtime dogfooding becomes a first-class use case, not a side path
- bundled-skill meta-prompts should be able to read report packets, compare
  artifacts, review verdicts, and scenario history and propose the next
  bounded prompt or adapter revision
- product-owned helper scripts should carry the repetitive orchestration for
  bounded optimization loops so hosts do not re-implement the same control
  plane
- any optimizer surface must stay explicitly bounded by held-out,
  comparison, and structured review gates rather than open-ended retries

### Phase 6: Consumer Repoint And External Consumers

- repoint legacy host workbench paths to `Cautilus`
- keep host adapters, prompts, and operator policy local to each host repo
- add external-consumer instructions for reusable host archetypes
- define release and versioning discipline before wider reuse

The current release boundary is documented in
[release-boundary.md](/home/ubuntu/cautilus/docs/release-boundary.md).

## Immediate Next Moves

1. Keep the standalone binary, bundled skill, Codex and Claude plugin
   packaging, and installer surface aligned on one checked-in workflow story.
2. Keep expanding normalization-pattern coverage while preserving one official
   adapter contract: `cautilus-adapter.yaml`.
3. Keep expanding scenario-history beyond the first profile-backed comparison
   cache-key path, especially toward reusable baseline results and broader
   compare ownership.
4. Turn raw-evidence mining into bundled-skill reference prompts plus
   product-owned helper scripts instead of letting each host reinvent the same
   meta-prompt orchestration.
5. Add bounded optimization helpers that can propose prompt or adapter changes
   from report, compare, review, and history packets without weakening held-out
   discipline.
6. Keep HTML report rendering on the roadmap, but defer product-owned HTML
   output until the JSON/YAML packet and report boundaries stay stable across
   multiple consumers.
7. Turn the first install story into a real release discipline: tagged
   archives, checksums, tap publication, and public-repo release docs.
8. Keep moving host-specific runtime seams out of the product boundary and into
   consumer-owned adapters, prompts, and storage readers.
