# Cautilus Master Plan

## Goal

Turn `Cautilus` from an extraction scaffold into a standalone intentful behavior evaluation product.

The target product is:

- a standalone installable CLI plus bundled reusable skill
- declared-claim discovery that turns repo-owned truth surfaces into proof backlogs
- host-repo adapters that define baselines, iterate loops, held-out checks, compare passes, and full gates
- optional executor-variant runners for bounded external review
- product-owned helper scripts and bundled-skill references for bounded evidence mining and optimization loops
- train-vs-held-out discipline backed by scenario history
- scenario proposal flows that mine runtime logs and audit traces into draft evaluation cases
- first-class evaluation surfaces for chatbot, skill, and durable workflow behavior
- agent-first command and packet surfaces that reveal user intent while hiding lower-level helper detail
- an intent-first workflow where prompts are mutable implementation details and evaluation contracts define success

The product has three connected jobs:

1. discover declared behavior claims worth proving from adapter-owned entry docs, README.md, AGENTS.md, CLAUDE.md, and linked repo-local Markdown
2. verify selected claims through bounded evaluation fixtures, observed packets, summaries, reports, and review surfaces
3. improve behavior through bounded optimization and GEPA-style search after the proof surface is honest

README proof is one instance of the first job, not a product-specific concept.
Cautilus owns the generic claim-to-proof workflow; consumer repos own their local fixtures, runners, prompts, wrappers, and policy.
Each job now has a first-class command family: `claim`, `eval`, and `optimize`.
The product surface should keep following the same discipline as `charness`: expose the user's intent at the public command boundary, keep tool-specific mechanics underneath it, and preserve durable artifacts that another agent can resume.
Do not hide arbitrary caps or host-specific defaults inside generic discovery; use explicit packet fields, adapter-owned policy, or explicit command options when selection is needed.

## Current State

Current `core validated surface`:

- generic workflow, adapter, and reporting contracts
- `cautilus.behavior_intent.v1` contract scoring operator-facing behavior surfaces (`operator_behavior`, `operator_workflow_recovery`, `operator_guidance_clarity`, `repair_explicit_regressions_first`)
- Go CLI entrypoint (`toolchain go1.26.2`) with checked-in `golangci-lint`, `govulncheck`, and an attestation-backed release artifact workflow
- registry-backed command discovery (`cautilus commands`, `cautilus healthcheck`) for safe probing and wrapper tooling
- Node adapter bootstrap scripts
- a minimal CLI plus a bundled `cautilus` skill entrypoint embedded through `skills/bundled.go`
- repo-local Codex and Claude plugin packages, marketplace wiring, and local proof paths for the bundled skill
- adapter readiness checks through `doctor`
- bounded runtime execution through `eval test`
- scenario-history-aware profile selection and history updates for profile-backed mode runs
- comparison-mode baseline-cache seed materialization for profile-backed runs
- explicit workspace preparation through `workspace prepare-compare`
- explicit artifact-root pruning through `workspace prune-artifacts`
- explicit per-run artifact-root materialization through `workspace start`, with a `CAUTILUS_RUN_DIR` env var contract documented in [active-run.md](./contracts/active-run.md).
  `eval test` is wired into `resolveRunDir`; remaining consumer commands are being pulled in one slice at a time.
- report packet assembly, review packet assembly, and review-variant fanout
- native self-dogfood HTML rendering through `cautilus self-dogfood render-html` and `render-experiments-html`
- tagged-release install surface (`install.sh`, checksum + `actions/attest` subject attestation) plus product-owned public-release verification and `release:smoke-install` helpers
- checked-in local gates, GitHub workflows that run `verify`, and an external consumer onboarding smoke (`consumer:onboard:smoke`) that proves install → adapter init → minimal wiring → adapter resolve → doctor ready → one bounded `eval test`

Current `product-owned helper surface`:

- `eval test` with the `repo/skill` preset wraps adapter-owned local skill runners, including consensus-based repeated tests and output-review warning surfacing
- `eval evaluate` packet summarizer dispatches to `cautilus.skill_evaluation_summary.v1` for trigger and execution behavior when the observed packet's schema is `cautilus.skill_evaluation_inputs.v1`
- `chatbot`, `skill`, and `workflow` `scenario normalize` helpers feeding the proposal-input pipeline; their archetype-shaped framing in evaluation no longer applies (see [evaluation-surfaces.spec.md](./specs/evaluation-surfaces.spec.md))
- scenario proposal packet assembly and proposal generation
- scenario-adjacent conversation review packet and HTML surface over normalized chatbot threads plus proposal candidates
- scenario-level telemetry summaries for cost and token transparency
- normalized evidence-bundle input and merge helpers
- bounded optimization input and proposal helpers
- durable revision-artifact builder (`cautilus.revision_artifact.v1`) above optimize proposals
- GEPA-style bounded prompt-search helpers (`optimize-search v2`) with multi-generation reflective mutation, optional bounded two- or three-parent merge synthesis, frontier-promotion review checkpoints, scenario-aware checkpoint feedback reinjection, severity-aware rejected-sibling merge tie-breaking, concern-level repair-first mutation prioritization, selection-cap reason codes, and final-only full-gate fallback

Dogfood and migration evidence now lives separately from the product concept.
Use [consumer-readiness.md](./maintainers/consumer-readiness.md) for checked-in host evidence instead of treating any one consumer repo as the product definition.

The three command-family contract lives in [specs/command-surfaces.spec.md](./specs/command-surfaces.spec.md): `claim` for declared-claim discovery and proof planning, `eval` for verification, and `optimize` for bounded improvement.
The first `claim` slice ships as deterministic `cautilus claim discover`, which emits a source-ref-backed proof plan rather than a verdict.
The next claim-discovery workflow contract lives in [claim-discovery-workflow.md](./contracts/claim-discovery-workflow.md): the binary owns deterministic skeletons, scan scope, state paths, refresh plans, and packet semantics; the bundled skill owns user confirmation, LLM review, grouping, evidence interpretation, and next-action conversation.
The deterministic binary slice, first bundled-skill control-flow slice, and deterministic review-input helper slice are now implemented.
LLM-backed review-result application and evidence reconciliation remain the next claim-discovery hardening seam.
The current evaluation contract lives in [specs/evaluation-surfaces.spec.md](./specs/evaluation-surfaces.spec.md): two surfaces (`repo`, `app`), four presets (`whole-repo`, `skill`, `chat`, `prompt`), and four fixture composition primitives.
The earlier first-class archetype boundary (chatbot / skill / workflow) was retired with that redesign.
`npm run lint:specs` and `npm run lint:archetypes` still gate the runtime completeness of the surviving `scenario normalize` helpers; new user-facing copy must reconcile with the surface/preset contract before landing.

## Phase Plan

### Phase 1: Product Baseline — done

- own generic workflow and contract docs
- own bootstrap scripts
- provide a repo-local CLI entrypoint
- provide lint and test surfaces
- keep adapter bootstrap and readiness helpers inside the product-owned runtime

### Phase 2: Standalone Product Hardening — done

- standalone Go binary and bundled skill feel like one product surface
- durable runtime boundary for review prompts, schemas, and compare artifacts
- stable versioned JSON contracts (`cautilus.report_packet.v2`, review/evidence/optimize/revision/scenario variants)
- tagged-release installer surface without npm publication, including checksums, attestations, and post-release verification helpers

### Phase 3: Evaluation Engine — mostly done

Moved into the product runtime:

- scenario split selection rules (train / held-out / full-gate)
- history update and scenario graduation logic for profile-backed runs
- baseline-cache key materialization for profile-backed comparison runs
- compare artifact conventions shared by `eval test` and `review variants`

Still open (both deferred 2026-04-15 pending dogfood evidence — see [scenario-history.md § Deferred Expansion](./contracts/scenario-history.md) for premortem findings and the triggers that would unlock the slice):

- reusable baseline result store beyond the first profile-backed cache-key path
- broader compare ownership (more scenario-history entry points plus reusable baseline results)

Guardrail: do not import a host repo's built-in benchmark profiles unchanged if they encode host-specific scenario packs.

### Phase 4: Scenario Proposal Engine — mostly done

Product-owned pieces shipped:

- `chatbot`, `skill`, and `workflow` `scenario normalize` commands plus candidate helpers (proposal-input pipeline; the evaluation-surface archetype framing was retired)
- `scenario prepare-input`, `scenario propose`, `scenario summarize-telemetry`
- checked-in schema artifacts and archetype fixtures (chatbot, skill-validation, durable-workflow)
- bundled-skill reference prompts point at these helpers

Still open:

- keep raw log readers, storage access, and host-specific trace retrieval consumer-owned
- expand normalization coverage as new consumer archetypes show up

### Phase 5: Intent-First Optimization Surface — mostly done

Product-owned pieces shipped:

- `cautilus.behavior_intent.v1` framing for chatbot, skill, and durable-workflow
- report, compare, review, history, evidence, optimize, and revision packets flow end-to-end
- GEPA-style `optimize-search v2` with reflective mutation, bounded merge, checkpoint feedback, severity-aware rejected-sibling handling, and selection caps — implementation and dogfood evidence both closed
- bundled-skill meta-prompts read report packets, compare artifacts, review verdicts, and scenario history
- product-owned helper scripts carry the bounded optimization loop orchestration (input build, propose, build-artifact)

Still open:

- decide whether richer merge heuristics are actually needed — dogfood evidence should justify the next seam rather than adding heuristics speculatively
- keep every optimizer surface bounded by held-out, comparison, and structured review gates

Still intentionally excluded:

- multi-prompt or multi-component coupled updates
- fine-tuning or trainer orchestration
- consumer prompt auto-apply

### Phase 6: Consumer Repoint And External Consumers — in progress

Shipped:

- [docs/guides/consumer-adoption.md](./guides/consumer-adoption.md) plus `npm run consumer:onboard:smoke` prove install → adapter init → minimal runnable wiring → adapter resolve → doctor ready → one bounded `eval test` in a temp git repo
- release discipline boundary documented in [release-boundary.md](./maintainers/release-boundary.md)

Still open:

- archetype-specific starter kits beyond the generic onboarding smoke
- keep the supported install smoke focused on `install.sh`
- continue moving host-specific runtime seams (raw log readers, host storage conventions) out of the product boundary

## Immediate Next Moves

1. Decide and implement the next optimize-search held-out/full-gate path on top of the `eval test` surface, or keep it explicitly skipped while C2/C3/C4 composition lands.
2. Ship the remaining evaluation-surface composition primitives in spec order: C2 `extends`, C3 `steps`, and C4 `expected.snapshot`. See [docs/specs/evaluation-surfaces.spec.md](./specs/evaluation-surfaces.spec.md).
3. Implement the review-result application half of the LLM-backed claim review seam from [claim-discovery-workflow.md](./contracts/claim-discovery-workflow.md): versioned review-result packets, provenance, duplicate merge decisions, and evidence-status review without letting possible matches become satisfied proof.
4. Pick the next bounded improvement seam for the optimization layer: either close a specific richer merge heuristic that dogfood evidence asks for, or move to another roadmap slice rather than extending heuristics speculatively.
5. Expand scenario-history beyond the first profile-backed comparison cache-key path toward reusable baseline results and broader compare ownership.
6. Continue moving host-specific runtime seams out of the product boundary into consumer-owned adapters, prompts, and storage readers.
7. Keep expanding normalization-pattern coverage as new consumer archetypes appear, while preserving one official adapter contract (`cautilus-adapter.yaml`).
8. Decide whether to grow external-consumer onboarding into archetype-specific starter kits while keeping the supported installer surface centered on `install.sh`.
9. Keep widening HTML surfaces only when the packet boundary stays stable and the page meaningfully improves human review; agents should consume durable packets first.
