# Cautilus Master Plan

## Goal

Turn `Cautilus` from an extraction scaffold into a standalone intentful behavior evaluation product.

The target product is:

- a standalone installable CLI plus bundled reusable skill
- host-repo adapters that define baselines, iterate loops, held-out checks, compare passes, and full gates
- optional executor-variant runners for bounded external review
- product-owned helper scripts and bundled-skill references for bounded evidence mining and optimization loops
- train-vs-held-out discipline backed by scenario history
- scenario proposal flows that mine runtime logs and audit traces into draft evaluation cases
- first-class evaluation surfaces for chatbot, skill, and durable workflow behavior
- an intent-first workflow where prompts are mutable implementation details and evaluation contracts define success

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
- bounded runtime execution through `mode evaluate`
- scenario-history-aware profile selection and history updates for profile-backed mode runs
- comparison-mode baseline-cache seed materialization for profile-backed runs
- explicit workspace preparation through `workspace prepare-compare`
- explicit artifact-root pruning through `workspace prune-artifacts`
- explicit per-run artifact-root materialization through `workspace start`, with a `CAUTILUS_RUN_DIR` env var contract documented in [active-run.md](./contracts/active-run.md).
  `mode evaluate` is wired into `resolveRunDir`; remaining consumer commands are being pulled in one slice at a time.
- report packet assembly, review packet assembly, and review-variant fanout
- native self-dogfood HTML rendering through `cautilus self-dogfood render-html` and `render-experiments-html`
- tagged-release install surface (curl installer, Homebrew formula render and tap publication, checksum + `actions/attest` subject attestation) plus product-owned `release:verify-public` and `release:smoke-install` helpers
- checked-in local gates, GitHub workflows that run `verify`, and an external consumer onboarding smoke (`consumer:onboard:smoke`) that proves install → adapter init → minimal wiring → adapter resolve → doctor ready

Current `product-owned helper surface`:

- `skill test` workflow seam above adapter-owned local skill runners, including consensus-based repeated tests and output-review warning surfacing
- `skill evaluate` packet summarizer (`cautilus.skill_evaluation_summary.v1`) for trigger and execution behavior
- `chatbot`, `skill`, and `workflow` normalization helpers (one per first-class archetype; see [archetype-boundary.spec.md](./specs/archetype-boundary.spec.md))
- scenario proposal packet assembly and proposal generation
- scenario-level telemetry summaries for cost and token transparency
- normalized evidence-bundle input and merge helpers
- bounded optimization input and proposal helpers
- durable revision-artifact builder (`cautilus.revision_artifact.v1`) above optimize proposals
- GEPA-style bounded prompt-search helpers (`optimize-search v2`) with multi-generation reflective mutation, optional bounded two- or three-parent merge synthesis, frontier-promotion review checkpoints, scenario-aware checkpoint feedback reinjection, severity-aware rejected-sibling merge tie-breaking, concern-level repair-first mutation prioritization, selection-cap reason codes, and final-only full-gate fallback

Dogfood and migration evidence now lives separately from the product concept.
Use [consumer-readiness.md](./maintainers/consumer-readiness.md) for checked-in host evidence instead of treating any one consumer repo as the product definition.

The first-class evaluation archetype boundary (chatbot / skill / workflow) is pinned as a standing contract in [specs/archetype-boundary.spec.md](./specs/archetype-boundary.spec.md) and enforced by `npm run lint:specs`.
New user-facing copy must reconcile with that contract before landing.

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
- tagged-release installer surface without npm publication, including checksums, attestations, Homebrew tap, and post-release verification helpers

### Phase 3: Evaluation Engine — mostly done

Moved into the product runtime:

- scenario split selection rules (train / held-out / full-gate)
- history update and scenario graduation logic for profile-backed runs
- baseline-cache key materialization for profile-backed comparison runs
- compare artifact conventions shared by `mode evaluate` and `review variants`

Still open (both deferred 2026-04-15 pending dogfood evidence — see [scenario-history.md § Deferred Expansion](./contracts/scenario-history.md) for premortem findings and the triggers that would unlock the slice):

- reusable baseline result store beyond the first profile-backed cache-key path
- broader compare ownership (more scenario-history entry points plus reusable baseline results)

Guardrail: do not import a host repo's built-in benchmark profiles unchanged if they encode host-specific scenario packs.

### Phase 4: Scenario Proposal Engine — mostly done

Product-owned pieces shipped:

- `chatbot`, `skill`, and `workflow` normalization commands plus candidate helpers (one per first-class archetype)
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

- [docs/guides/consumer-adoption.md](./guides/consumer-adoption.md) plus `npm run consumer:onboard:smoke` prove install → adapter init → minimal runnable wiring → adapter resolve → doctor ready in a temp git repo
- release discipline boundary documented in [release-boundary.md](./maintainers/release-boundary.md)

Still open:

- archetype-specific starter kits beyond the generic onboarding smoke
- optional managed Homebrew install smoke helper (current smoke covers `install.sh`)
- continue moving host-specific runtime seams (raw log readers, host storage conventions) out of the product boundary

## Immediate Next Moves

1. Pick the next bounded improvement seam for the optimization layer: either close a specific richer merge heuristic that dogfood evidence asks for, or move to another roadmap slice rather than extending heuristics speculatively.
2. Expand scenario-history beyond the first profile-backed comparison cache-key path toward reusable baseline results and broader compare ownership.
3. Continue moving host-specific runtime seams out of the product boundary into consumer-owned adapters, prompts, and storage readers.
4. Keep expanding normalization-pattern coverage as new consumer archetypes appear, while preserving one official adapter contract (`cautilus-adapter.yaml`).
5. Decide whether to grow external-consumer onboarding into archetype-specific starter kits, and whether to upgrade the Homebrew install smoke into a managed helper.
6. Keep wider HTML report rendering on the roadmap (self-dogfood HTML is already native), deferring product-owned HTML output for other packet types until the JSON/YAML packet and report boundaries stay stable across multiple consumers.
