# Cautilus Master Plan

## Goal

Turn `Cautilus` from an extraction scaffold into a standalone intentful behavior evaluation product.

The target product is:

- a standalone installable CLI plus Cautilus Agent
- declared-claim discovery that turns repo-owned truth surfaces into proof backlogs
- host-repo adapters that define baselines, iterate loops, held-out checks, compare passes, and full gates
- optional executor-variant runners for bounded external review
- product-owned helper scripts and Cautilus Agent references for bounded evidence mining and improvement loops
- train-vs-held-out discipline backed by scenario history
- scenario proposal flows that mine runtime logs and audit traces into draft evaluation cases
- normalization-family proposal flows for chatbot, skill, and durable workflow behavior
- runner readiness as a setup substrate under `claim`, `eval`, and `improve`, especially for app behavior proof
- `eval live` as the command surface for live app runner discovery, single-run invocation, and batched live scenarios
- agent-first command and packet surfaces that reveal user intent while hiding lower-level helper detail
- an intent-first workflow where prompts are mutable implementation details and evaluation contracts define success

The product has three connected jobs:

1. discover declared behavior claims worth proving from adapter-owned entry docs, README.md, AGENTS.md, CLAUDE.md, and linked repo-local docs
2. verify selected claims through bounded evaluation fixtures, observed packets, summaries, reports, and review surfaces
3. improve behavior through bounded improvement and GEPA-style search after the proof surface is honest

README proof is one instance of the first job, not a product-specific concept.
Cautilus owns the generic claim-to-proof workflow; consumer repos own their local fixtures, runners, prompts, wrappers, and policy.
Cautilus exposes machine-readable packets, provenance, status summaries, and bounded next-work routes that other tools can consume.
Each job now has a first-class command family: `claim`, `eval`, and `improve`.
The product surface should keep following the same discipline as `charness`: expose the user's intent at the public command boundary, keep tool-specific mechanics underneath it, and preserve durable artifacts that another agent can resume.
Do not hide arbitrary caps or host-specific defaults inside generic discovery; use explicit packet fields, adapter-owned policy, or explicit command options when selection is needed.

## Current State

Current `core validated surface`:

- generic workflow, adapter, and reporting contracts
- `cautilus.behavior_intent.v1` contract scoring operator-facing behavior surfaces (`operator_behavior`, `operator_workflow_recovery`, `operator_guidance_clarity`, `repair_explicit_regressions_first`)
- Go CLI entrypoint (`toolchain go1.26.5`) with checked-in `golangci-lint`, `govulncheck`, and an attestation-backed release artifact workflow
- registry-backed command discovery (`cautilus doctor commands`, `cautilus doctor binary`) for safe probing and wrapper tooling
- Node adapter bootstrap scripts
- a minimal CLI plus a Cautilus Agent entrypoint embedded through `skills/bundled.go`
- repo-local Codex and Claude plugin packages, marketplace wiring, and local proof paths for the Cautilus Agent
- adapter readiness checks through `doctor`
- bounded runtime execution through `evaluate fixture` and packet recheck through `evaluate observation`
- scenario-history-aware profile selection and history updates for profile-backed mode runs
- comparison-mode baseline-cache seed materialization for profile-backed runs
- explicit workspace preparation through `evaluate comparison prepare`
- explicit artifact-root pruning through `doctor artifacts prune`
- explicit per-run artifact-root materialization through `workspace start`, with a `CAUTILUS_RUN_DIR` env var contract documented in [active-run.md](./contracts/active-run.md).
  `evaluate fixture` is wired into `resolveRunDir`; remaining consumer commands are being pulled in one slice at a time.
- report packet assembly, review packet assembly, and review-variant fanout
- native self-dogfood HTML rendering through `cautilus doctor artifacts render-self-dogfood-html` and `render-experiments-html`
- tagged-release install surface (`install.sh`, checksum + `actions/attest` subject attestation) plus product-owned public-release verification and `release:smoke-install` helpers
- checked-in local gates, GitHub workflows that run `verify`, and an external consumer onboarding smoke (`consumer:onboard:smoke`) that proves install → adapter init → minimal wiring → adapter resolve → doctor ready → one bounded `evaluate fixture -> evaluate observation` packet loop
- normalization-family starter kits under [examples/starters/](../examples/starters/) plus `consumer:starters:smoke`, covering chatbot, skill, and workflow bootstrap adapters and canonical normalization inputs

Current `product-owned helper surface`:

- `evaluate fixture` with the `dev/skill` preset wraps adapter-owned local skill runners, including consensus-based repeated tests and output-review warning surfacing
- `evaluate observation` packet summarizer dispatches to `cautilus.skill_evaluation_summary.v1` for trigger and execution behavior when the observed packet's schema is `cautilus.skill_evaluation_inputs.v1`
- `eval live` commands expose the live app runner seam; it is not a fourth product job
- `chatbot`, `skill`, and `workflow` `discover scenarios normalize` helpers feeding the proposal-input pipeline; their archetype-shaped framing in evaluation no longer applies (see [evaluation.spec.md](./specs/promises/evaluation.spec.md))
- scenario proposal packet assembly and proposal generation
- scenario-adjacent conversation review packet and HTML surface over normalized chatbot threads plus proposal candidates
- scenario-level telemetry summaries for cost and token transparency
- normalized evidence-bundle input and merge helpers
- bounded improvement input and proposal helpers
- durable revision-artifact builder (`cautilus.revision_artifact.v1`) above improve proposals
- GEPA-style bounded prompt-search helpers (`improve-search v2`) with multi-generation reflective mutation, optional bounded two- or three-parent merge synthesis, frontier-promotion review checkpoints, scenario-aware checkpoint feedback reinjection, severity-aware rejected-sibling merge tie-breaking, concern-level repair-first mutation prioritization, selection-cap reason codes, and final-only full-gate fallback
- selective SkillOpt / SkillOpt-Sleep absorption is now a Cautilus-native boundary, not a runtime import: [skillopt-absorption.md](./contracts/skillopt-absorption.md) classifies normalized session-derived proposal inputs, rejected-candidate evidence, staged adoption evidence, and replay/recall inputs as accepted contract targets while rejecting raw transcript readers, plugin shells, schedulers, auto-apply, and a second optimizer
- the first implemented absorption route is scenario-proposal evidence provenance handoff: host-owned candidate miners may attach `origin` and `activityProvenance` to `cautilus.scenario_proposal_inputs.v1`; `prepare-input` preserves those fields, and `propose` validates them when present and preserves them on emitted top-ranked proposal evidence

Dogfood and migration evidence now lives separately from the product concept.
Use [consumer-readiness.md](./maintainers/consumer-readiness.md) for checked-in host evidence instead of treating any one consumer repo as the product definition.

The three command-family promise map lives in [specs/user/index.spec.md](./specs/user/index.spec.md): `claim` for declared-claim discovery and proof planning, `eval` for verification, and `improve` for bounded improvement.
The contract proof map for those promises lives in [specs/contracts/index.spec.md](./specs/contracts/index.spec.md).
The first `claim` slice ships as deterministic `cautilus discover claims`, which emits a source-ref-backed proof plan rather than a verdict.
The next claim-discovery workflow contract lives in [claim-discovery-workflow.md](./contracts/claim-discovery-workflow.md): the binary owns deterministic skeletons, scan scope, state paths, refresh plans, and packet semantics; the Cautilus Agent owns user confirmation, LLM review, grouping, evidence interpretation, and next-action conversation.
Direction decision (2026-06-10): claim extraction itself becomes agent-primary — the Cautilus Agent extracts claims against a product-owned template while the binary anchors verbatim excerpts, validates packets, and bounds re-extraction to git-diff-changed sources; the deterministic heuristic extractor remains an explicitly labeled baseline mode.
The deterministic binary slice, first Cautilus Agent control-flow slice, deterministic review-input helper slice, possible-evidence preflight, guarded review-result application slice, review-to-eval branch proof, eval planning, fixture-authoring guidance, and first carried-evidence reconciliation slice are now implemented.
The next claim-discovery hardening seam should come from fresh dogfood evidence rather than the old review-result application / evidence reconciliation backlog.
The current reader-facing evaluation claim lives in [specs/promises/evaluation.spec.md](./specs/promises/evaluation.spec.md); the archived implementation-surface spec lives in [specs/old/evaluation-surfaces.spec.md](./specs/old/evaluation-surfaces.spec.md).
The earlier first-class archetype boundary (chatbot / skill / workflow) was retired with that redesign.
`npm run lint:specs` and `npm run lint:scenario-normalizers` still gate the runtime completeness of the surviving `discover scenarios normalize` helpers; new user-facing copy must reconcile with the surface/preset contract before landing.
The runner readiness contract lives in [runner-readiness.md](./contracts/runner-readiness.md).
It keeps headless product runners as setup/readiness substrate rather than a fourth command family, and it separates proof requirements from readiness verdicts.
The runner verification capability contract lives in [runner-verification.md](./contracts/runner-verification.md).
It requires product-proof runner assessments to explain input simulation, external substitution, trigger control, and external observation before `doctor` or `doctor status` can present product-behavior proof as ready.
The live app runner contracts live in [workbench-instance-discovery.md](./contracts/workbench-instance-discovery.md), [live-run-invocation.md](./contracts/live-run-invocation.md), and [live-run-invocation-batch.md](./contracts/live-run-invocation-batch.md).
Their public command namespace is `eval live`; the `workbench` name is reserved for a possible future GUI where operators can browse and edit claims, scenarios, and evidence.

## Phase Plan

### Phase 1: Product Baseline — done

- own generic workflow and contract docs
- own bootstrap scripts
- provide a repo-local CLI entrypoint
- provide lint and test surfaces
- keep adapter bootstrap and readiness helpers inside the product-owned runtime

### Phase 2: Standalone Product Hardening — done

- standalone Go binary and Cautilus Agent feel like one product surface
- durable runtime boundary for review prompts, schemas, and compare artifacts
- stable versioned JSON contracts (`cautilus.report_packet.v2`, review/evidence/improve/revision/scenario variants)
- tagged-release installer surface without npm publication, including checksums, attestations, and post-release verification helpers

### Phase 3: Evaluation Engine — mostly done

Moved into the product runtime:

- scenario split selection rules (train / held-out / full-gate)
- history update and scenario graduation logic for profile-backed runs
- baseline-cache key materialization for profile-backed comparison runs
- compare artifact conventions shared by `evaluate fixture` and `evaluate review variants`

Still open (both deferred 2026-04-15 pending dogfood evidence — see [scenario-history.md § Deferred Expansion](./contracts/scenario-history.md) for premortem findings and the triggers that would unlock the slice):

- reusable baseline result store beyond the first profile-backed cache-key path
- broader compare ownership (more scenario-history entry points plus reusable baseline results)

Guardrail: do not import a host repo's built-in benchmark profiles unchanged if they encode host-specific scenario packs.

### Phase 4: Scenario Proposal Engine — mostly done

Product-owned pieces shipped:

- `chatbot`, `skill`, and `workflow` `discover scenarios normalize` commands plus candidate helpers (proposal-input pipeline; the evaluation-surface archetype framing was retired)
- `discover scenarios prepare-input`, `discover scenarios propose`, `discover scenarios summarize-telemetry`
- checked-in schema artifacts and normalization-family fixtures (chatbot, skill-validation, durable-workflow)
- Cautilus Agent reference prompts point at these helpers

Still open:

- keep raw log readers, storage access, and host-specific trace retrieval consumer-owned
- expand normalization coverage as new consumer patterns show up

### Phase 5: Intent-First Improvement Surface — mostly done

Product-owned pieces shipped:

- `cautilus.behavior_intent.v1` framing for chatbot, skill, and durable-workflow
- report, compare, review, history, evidence, improve, and revision packets flow end-to-end
- GEPA-style `improve-search v2` with reflective mutation, bounded merge, checkpoint feedback, severity-aware rejected-sibling handling, and selection caps — implementation and dogfood evidence both closed
- Cautilus Agent meta-prompts read report packets, compare artifacts, review verdicts, and scenario history
- product-owned helper scripts carry the bounded improvement loop orchestration (input build, propose, build-artifact)
- live held-out improve loop proven on the dev/skill surface (`npm run proof:improve:live`): a degraded prompt is rewritten until a mutated candidate recovers a held-out scenario it was never tuned on (seed 0, winner 100), surfacing and fixing three load-bearing improve-search/runner bugs along the way — the apex `Bounded Improvement` badge is now proven

Also shipped:

- optimizer-untouchable final-acceptance-set detection on top of improve search ([final-acceptance-set.md](./contracts/final-acceptance-set.md)): a post-hoc authored `acceptance` split, `heldOutExposureCount` on the search result, and `cautilus evaluate acceptance` which reads a finalist on the acceptance set to report the generalization gap with a contamination guard and a reliability flag, advisory-only at the human accept step
- the risk-tier policy on top of the acceptance read ([acceptance-risk-tier.md](./contracts/acceptance-risk-tier.md)): a host declares per-target `required`/`optional`/`skippable` effects in the adapter `acceptance_risk` block; read-time enforcement blocks-or-waives a `required` read in `cautilus evaluate acceptance`, and the skip-time gate in read-only `cautilus doctor` (`acceptanceReadiness`) catches a `required` target never read, with `cautilus evaluate acceptance waive-skip` recording an explicit waiver-on-skip — the product owns only the effect vocabulary, never the risk categories

Still open:

- decide whether richer merge heuristics are actually needed — dogfood evidence should justify the next seam rather than adding heuristics speculatively
- keep every improver surface bounded by held-out, comparison, and structured review gates

Still intentionally excluded:

- multi-prompt or multi-component coupled updates
- fine-tuning or trainer orchestration
- consumer prompt auto-apply
- SkillOpt-Sleep-style raw transcript harvesting, schedulers, plugin shells, and long-term-memory stores inside the Cautilus product boundary

### Phase 6: Consumer Repoint And External Consumers — in progress

Shipped:

- [docs/guides/consumer-adoption.md](./guides/consumer-adoption.md) plus `npm run consumer:onboard:smoke` prove install → adapter init → minimal runnable wiring → adapter resolve → doctor ready → one bounded `evaluate fixture -> evaluate observation` packet loop in a temp git repo
- release discipline boundary documented in [release-boundary.md](./maintainers/release-boundary.md)
- normalization-family starter kits for chatbot, skill, and workflow bootstrap adapters plus proposal-input examples, with repo-relative smoke output and parity-tested canonical inputs

Still open:

- keep the supported install smoke focused on `install.sh`
- continue moving host-specific runtime seams (raw log readers, host storage conventions) out of the product boundary

## Immediate Next Moves

Eval determinism skew — substantially closed (2026-06-09 → 2026-06-19), superseding the original "the whole eval is all-deterministic" framing.
The intelligence-as-independent-observer / code-as-deterministic-comparator design landed: a reasoning-soundness judge disciplined by calibration sets, decomposed into code∧judge facets, wired into `cautilus evaluate` (replay-based, prove-then-project), with regression detection proven across three pinned routing behaviors; see [docs/contracts/eval-judge-collaboration.md](contracts/eval-judge-collaboration.md) and [docs/contracts/facet-decomposition.md](contracts/facet-decomposition.md).
The apex `Behavior Evaluation` badge is `proven`, scoped to the dev coding-agent surfaces (`dev/repo` routing and `dev/skill` orientation, both proven live on demand); the whole apex now reads 7/7 proven.
What remains is below-apex hardening, in measured priority order:
1. Per-facet routing is being brought into the deterministic engine baseline (`classifyClaimLine`) that produces the checked-in, CI-visible claim population. Progress (measured against the ratified answer-key overlap; agreeing count rising):
   - R6/R12 ownership/boundary-assignment and capability-existence → `deterministic` landed in the baseline (2026-06-21);
   - the rune upper bound was relaxed to a 2000-rune sanity cap and `" ships "` was added to the lexicon gate, recovering 76 length-dropped routable claims and making R12 actually reachable (it had been structurally dead behind the gate), GEPA-seam `claim-readme-md-140` now `deterministic`;
   - **Fork B (the deeper per-facet end-state) has started:** the `namedPacketEmissionClaim` discriminator routes named-packet/explicit-non-LLM shapes `deterministic` with an eval-judgment over-flip guard, no per-claim schema (slice 1, 2026-06-21).
   Engine-baseline overlap route-accuracy moved ~45% → ~61% across these slices, with zero new over-corrections. Remaining: the other deferred `cautilus-eval → deterministic` shapes (schema-field-persistence, static-taxonomy, CLI-flag-semantics, status-routing, extraction, command-absence, R6-ish boundary) and a gate↔router verb-coverage audit so a future router case cannot go structurally dead behind the gate. SOT: [charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md](../charness-artifacts/eval-trust/2026-06-21-fork-b-eval-overassignment-measurement.md).
2. App-ship surface Proof Debt: `app/chat` liveness (its agent run is replayed from a production log, not re-run live) and `app/prompt` product-runner proof (`productProofReady=false`).

1. Pick the next bounded improvement seam for the improvement layer: either close a specific richer merge heuristic that dogfood evidence asks for, implement a minimal packet slice from [skillopt-absorption.md](./contracts/skillopt-absorption.md), or move to another roadmap slice rather than extending heuristics speculatively.
2. Expand typed multi-runner metadata from the shipped `runner_readiness.runners` base only when real consumer adapters need additional fields; source-code inference remains deferred.
3. Expand scenario-history beyond the first profile-backed comparison cache-key path toward reusable baseline results and broader compare ownership.
4. Continue moving host-specific runtime seams out of the product boundary into consumer-owned adapters, prompts, and storage readers.
5. Keep expanding normalization-pattern coverage as new consumer patterns appear, while preserving one official adapter contract (`cautilus-adapter.yaml`).
6. Keep the shipped normalization-family starter kits current as new consumer patterns appear while keeping the supported installer surface centered on `install.sh`.
7. Keep widening HTML surfaces only when the packet boundary stays stable and the page meaningfully improves human review; agents should consume durable packets first.
8. Specify a future interactive workbench only when the product is ready to support GUI-backed claim and scenario browsing, editing, deletion, and addition.
    Do not use the current live app runner seam as that GUI workbench concept.
