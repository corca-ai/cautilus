# Cautilus Claim Status Report

This is a human-readable projection over the current claim packet, status summary, review results, validation reports, and eval plans.
Use the JSON packets as the audit source; use this report to decide what to inspect or do next.

## Packet

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Status packet: .cautilus/claims/status-summary.json
- Candidate count: 365
- Source count: 66
- Packet source commit: 128e15454ff634d446a95c7408b95379ce009788
- Snapshot notice: gitState is computed when this status packet is generated; rerun claim show for live checkout state.
- Git state snapshot: fresh-with-head-drift; stale=no
- Changed-file scope: committed-diff-between-packet-and-current-head; working tree=excluded
- Snapshot recommendation: The current HEAD differs from the packet commit, but no recorded claim source changed; review and eval planning may continue.

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 72, stale: 23, unknown: 270 |
| Review | agent-reviewed: 148, heuristic: 216, human-reviewed: 1 |
| Recommended proof | cautilus-eval: 118, deterministic: 149, human-auditable: 98 |
| Verification readiness | blocked: 32, needs-alignment: 34, needs-scenario: 6, ready-for-proof: 293 |
| Audience | developer: 259, user: 106 |

Review readiness: heuristicClaimsReadyForReview: 192, needsAlignment: 34, needsScenario: 6.

## Canonical Claim Map

- Map packet: .cautilus/claims/canonical-claim-map.json
- Input status: current
- User raw claims: 106
- User claims mapped to U1-U7: 106
- User claims not mapped to U1-U7: 0
- User mappings recommended for semantic sampling: 43
- Maintainer claims mapped to M1-M34: M1: 5, M10: 11, M11: 28, M12: 9, M2: 9, M3: 56, M4: 74, M5: 16, M6: 6, M7: 15, M8: 24, M9: 6
- All raw claims by disposition: mapped-to-maintainer-canonical: 259, mapped-to-user-canonical: 106
- Mapping confidence: high: 66, low: 16, medium: 283

| User claim | Title | Raw claims | Evidence | Review |
| --- | --- | --- | --- | --- |
| U1 | Readiness | 26 | satisfied: 11, stale: 1, unknown: 14 | agent-reviewed: 13, heuristic: 13 |
| U2 | Claim Discovery | 61 | satisfied: 11, stale: 15, unknown: 35 | agent-reviewed: 40, heuristic: 21 |
| U3 | Behavior Evaluation | 4 | unknown: 4 | heuristic: 4 |
| U4 | Bounded Optimization | 3 | unknown: 3 | agent-reviewed: 1, heuristic: 2 |
| U5 | Reviewable Artifacts | 4 | unknown: 4 | heuristic: 4 |
| U6 | Evidence Gaps | 1 | unknown: 1 | agent-reviewed: 1 |
| U7 | Host Ownership | 7 | satisfied: 1, unknown: 6 | agent-reviewed: 2, heuristic: 5 |

| Maintainer claim | Title | Raw claims | Proof | Evidence | Review |
| --- | --- | --- | --- | --- | --- |
| M1 | Maintainer Shared Concern Policy | 5 | cautilus-eval: 3, human-auditable: 2 | unknown: 5 | agent-reviewed: 1, heuristic: 4 |
| M2 | Claim Discovery Workflow | 9 | deterministic: 2, human-auditable: 7 | satisfied: 1, unknown: 8 | agent-reviewed: 3, heuristic: 6 |
| M3 | Binary And Skill Boundary | 56 | cautilus-eval: 23, deterministic: 19, human-auditable: 14 | satisfied: 8, stale: 1, unknown: 47 | agent-reviewed: 16, heuristic: 39, human-reviewed: 1 |
| M4 | Adapter And Host Ownership | 74 | cautilus-eval: 32, deterministic: 23, human-auditable: 19 | satisfied: 16, stale: 1, unknown: 57 | agent-reviewed: 28, heuristic: 46 |
| M5 | Evaluation Surfaces And Runners | 16 | cautilus-eval: 9, deterministic: 7 | satisfied: 4, stale: 1, unknown: 11 | agent-reviewed: 6, heuristic: 10 |
| M6 | Evidence State And Review Artifacts | 6 | cautilus-eval: 1, deterministic: 2, human-auditable: 3 | unknown: 6 | agent-reviewed: 1, heuristic: 5 |
| M7 | Optimization Loop | 15 | cautilus-eval: 7, deterministic: 4, human-auditable: 4 | satisfied: 3, stale: 1, unknown: 11 | agent-reviewed: 5, heuristic: 10 |
| M8 | Readiness And Runtime Status | 24 | cautilus-eval: 3, deterministic: 18, human-auditable: 3 | satisfied: 7, unknown: 17 | agent-reviewed: 9, heuristic: 15 |
| M9 | Active Run And Workspace Lifecycle | 6 | cautilus-eval: 4, human-auditable: 2 | unknown: 6 | agent-reviewed: 2, heuristic: 4 |
| M10 | Live Invocation Runtime | 11 | cautilus-eval: 5, deterministic: 3, human-auditable: 3 | satisfied: 3, unknown: 8 | agent-reviewed: 5, heuristic: 6 |
| M11 | Reporting And Review Variants | 28 | cautilus-eval: 1, deterministic: 17, human-auditable: 10 | satisfied: 6, stale: 3, unknown: 19 | agent-reviewed: 11, heuristic: 17 |
| M12 | Scenario History And Proposal Normalization | 9 | cautilus-eval: 1, deterministic: 4, human-auditable: 4 | satisfied: 1, unknown: 8 | agent-reviewed: 4, heuristic: 5 |
| M13 | Evidence State And Review Artifacts | 0 | - | - | - |
| M14 | Reporting And Review Variants | 0 | - | - | - |
| M15 | Active Run And Workspace Lifecycle | 0 | - | - | - |
| M16 | Evidence State And Review Artifacts | 0 | - | - | - |
| M17 | Optimization Loop | 0 | - | - | - |
| M18 | Readiness And Runtime Status | 0 | - | - | - |
| M19 | Adapter And Host Ownership | 0 | - | - | - |
| M20 | Live Invocation Runtime | 0 | - | - | - |
| M21 | Binary And Skill Boundary | 0 | - | - | - |
| M22 | Binary And Skill Boundary | 0 | - | - | - |
| M23 | Adapter And Host Ownership | 0 | - | - | - |
| M24 | Evidence State And Review Artifacts | 0 | - | - | - |
| M25 | Evidence State And Review Artifacts | 0 | - | - | - |
| M26 | Reporting And Review Variants | 0 | - | - | - |
| M27 | Active Run And Workspace Lifecycle | 0 | - | - | - |
| M28 | Evaluation Surfaces And Runners | 0 | - | - | - |
| M29 | Optimization Loop | 0 | - | - | - |
| M30 | Scenario History And Proposal Normalization | 0 | - | - | - |
| M31 | Evidence State And Review Artifacts | 0 | - | - | - |
| M32 | Binary And Skill Boundary | 0 | - | - | - |
| M33 | Active Run And Workspace Lifecycle | 0 | - | - | - |
| M34 | Reporting And Review Variants | 0 | - | - | - |

Maintainer semantic sampling queue:

| Maintainer claim | Title | Sample raw claims |
| --- | --- | --- |
| M1 | Maintainer Shared Concern Policy | claim-agents-md-80 (medium), claim-docs-specs-index-spec-md-17 (medium), claim-docs-contracts-runner-readiness-md-172 (low), claim-docs-specs-proof-gaps-spec-md-9 (medium) |
| M2 | Claim Discovery Workflow | claim-docs-contracts-claim-discovery-workflow-md-5 (medium), claim-docs-contracts-claim-discovery-workflow-md-130 (medium), claim-docs-contracts-claim-discovery-workflow-md-323 (low), claim-docs-contracts-claim-discovery-workflow-md-558 (low) |
| M3 | Binary And Skill Boundary | claim-agents-md-79 (medium), claim-agents-md-124 (medium), claim-docs-contracts-adapter-contract-md-474 (low), claim-docs-contracts-adapter-contract-md-535 (medium) |
| M4 | Adapter And Host Ownership | claim-agents-md-12 (medium), claim-agents-md-26 (low), claim-agents-md-29 (medium), claim-agents-md-74 (medium) |
| M5 | Evaluation Surfaces And Runners | claim-docs-contracts-adapter-contract-md-208 (medium), claim-docs-master-plan-md-84 (medium), claim-docs-contracts-claim-discovery-workflow-md-409 (medium), claim-docs-contracts-claim-discovery-workflow-md-468 (medium) |
| M6 | Evidence State And Review Artifacts | claim-docs-master-plan-md-181 (medium), claim-docs-contracts-claim-discovery-workflow-md-326 (medium), claim-docs-contracts-claim-discovery-workflow-md-694 (medium), claim-docs-contracts-claim-discovery-workflow-md-696 (medium) |
| M7 | Optimization Loop | claim-docs-specs-index-spec-md-22 (low), claim-docs-contracts-claim-discovery-workflow-md-695 (medium), claim-docs-contracts-reporting-md-150 (low), claim-docs-contracts-runner-readiness-md-37 (medium) |
| M8 | Readiness And Runtime Status | claim-docs-gepa-md-15 (medium), claim-docs-contracts-claim-discovery-workflow-md-21 (medium), claim-docs-contracts-claim-discovery-workflow-md-47 (medium), claim-docs-contracts-claim-discovery-workflow-md-85 (medium) |
| M9 | Active Run And Workspace Lifecycle | claim-docs-contracts-active-run-md-59 (medium), claim-docs-contracts-active-run-md-221 (medium), claim-docs-contracts-live-run-invocation-md-160 (medium), claim-docs-contracts-scenario-history-md-175 (low) |
| M10 | Live Invocation Runtime | claim-docs-master-plan-md-90 (medium), claim-docs-contracts-live-run-invocation-batch-md-28 (medium), claim-docs-contracts-live-run-invocation-batch-md-166 (medium), claim-docs-contracts-live-run-invocation-md-58 (medium) |
| M11 | Reporting And Review Variants | claim-docs-contracts-adapter-contract-md-426 (medium), claim-docs-contracts-adapter-contract-md-432 (medium), claim-docs-contracts-adapter-contract-md-478 (medium), claim-docs-contracts-review-packet-md-3 (medium) |
| M12 | Scenario History And Proposal Normalization | claim-agents-md-62 (medium), claim-docs-contracts-claim-discovery-workflow-md-262 (medium), claim-docs-contracts-claim-discovery-workflow-md-586 (medium), claim-docs-contracts-scenario-history-md-3 (medium) |

Semantic sampling recommended for 299 raw claim(s): claim-agents-md-12, claim-agents-md-26, claim-agents-md-29, claim-agents-md-62, claim-agents-md-74, claim-agents-md-79, claim-agents-md-80, claim-agents-md-124, ...

## Next Work

- Human review is still meaningful for human-align-surfaces=34, human-confirm-or-decompose=33, split-or-defer=32.
- Agent next proof work: connect deterministic gates for 76 claim(s), starting with agent-reviewed items before heuristic items.
- Agent eval work: plan Cautilus eval scenarios for 112 claim(s), after reviewing heuristic labels where needed.
- Scenario design work remains for 6 claim(s).

## Action Buckets

| Bucket | Actor | Count | Review | Evidence | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 72 | agent-reviewed: 72 | satisfied: 72 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 76 | agent-reviewed: 28, heuristic: 48 | stale: 18, unknown: 58 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 112 | agent-reviewed: 9, heuristic: 102, human-reviewed: 1 | stale: 4, unknown: 108 | Draft or select Cautilus eval scenarios for ready eval claims. |
| agent-design-scenario | agent | 6 | heuristic: 6 | unknown: 6 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 34 | agent-reviewed: 16, heuristic: 18 | unknown: 34 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 33 | agent-reviewed: 1, heuristic: 32 | stale: 1, unknown: 32 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 32 | agent-reviewed: 22, heuristic: 10 | unknown: 32 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

Cross-cutting signal: heuristic-review-needed (216) - Review heuristic labels before spending proof or eval budget.

Cross-cutting signal: stale-evidence (23) - Refresh or recheck stale evidence before consuming it as proof.

### agent-add-deterministic-proof

Add or connect unit, lint, build, schema, spec, or CI proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-82 | README.md:82 | deterministic | ready-for-proof | heuristic | unknown | The public website report is generated from the claim spec tree, but host repos do not need that renderer before Cautilus can inspect readiness, claims, evals, or optimization work. |
| claim-readme-md-90 | README.md:90 | deterministic | ready-for-proof | heuristic | unknown | This loop verifies a bounded behavior fixture and produces reopenable observed and summary packets. |
| claim-readme-md-175 | README.md:175 | deterministic | ready-for-proof | agent-reviewed | stale | Each catalog entry now also includes `exampleInputCli`, so an operator or wrapper can inspect a minimal valid packet shape without opening a fixture path first. |
| claim-readme-md-247 | README.md:247 | deterministic | ready-for-proof | agent-reviewed | stale | machine-readable eval, report, review, evidence, and optimization packets that agents can consume directly |
| claim-docs-cli-reference-md-117 | docs/cli-reference.md:117 | deterministic | ready-for-proof | agent-reviewed | stale | When a repo intentionally keeps only named adapters under `.agents/cautilus-adapters/`, run `cautilus doctor --repo-root /path/to/repo --adapter-name <name>` for repo-scope validation instead of expecting plain `doctor` to guess which named adapter you mean. |

### agent-plan-cautilus-eval

Draft or select Cautilus eval scenarios for ready eval claims.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-79 | AGENTS.md:79 | cautilus-eval | ready-for-proof | agent-reviewed | unknown | Cautilus Agent should own routing, sequencing, guardrails, and decision boundaries; the binary should own broad command discovery, help text, scenario catalogs, packet examples, install smoke, and doctor/readiness details. |
| claim-agents-md-80 | AGENTS.md:80 | cautilus-eval | ready-for-proof | agent-reviewed | unknown | When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available. |
| claim-readme-md-18 | README.md:18 | cautilus-eval | ready-for-proof | heuristic | unknown | Host repos can use `cautilus eval test` and `cautilus eval evaluate` with checked-in fixtures, host-owned adapters, and the current `cautilus.evaluation_input.v1`, `cautilus.evaluation_observed.v1`, and `cautilus.evaluation_summary.v1` packets. |
| claim-readme-md-105 | README.md:105 | cautilus-eval | ready-for-proof | heuristic | unknown | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-163 | README.md:163 | cautilus-eval | ready-for-proof | agent-reviewed | stale | The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`. |

### agent-design-scenario

Decompose the behavior into a concrete scenario before protected eval planning.

Full bucket detail is shown because this bucket is not ready for proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-187 | README.md:187 | cautilus-eval | needs-scenario | heuristic | unknown | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-specs-user-evaluation-spec-md-4 | docs/specs/user/evaluation.spec.md:4 | cautilus-eval | needs-scenario | heuristic | unknown | Using the `cautilus eval` CLI command and the `cautilus-agent` skill, a user can evaluate behavior across `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces without turning the host repo's runners, prompts, or policy into Cautilus-owned state. |
| claim-docs-specs-user-evaluation-spec-md-25 | docs/specs/user/evaluation.spec.md:25 | cautilus-eval | needs-scenario | heuristic | unknown | A user can evaluate behavior without Cautilus taking over host-owned execution. |
| claim-docs-specs-model-promise-ledger-spec-md-16 | docs/specs/model/promise-ledger.spec.md:16 | cautilus-eval | needs-scenario | heuristic | unknown | Bounded Optimization (optimization.spec.md): Cautilus improves a selected behavior target under explicit budget, protected checks, and held-out evidence. |
| claim-docs-specs-user-optimization-spec-md-23 | docs/specs/user/optimization.spec.md:23 | cautilus-eval | needs-scenario | heuristic | unknown | A user can improve behavior while preserving protected checks, held-out evidence, and explicit budget. |
| claim-docs-specs-model-optimization-spec-md-5 | docs/specs/model/optimization.spec.md:5 | cautilus-eval | needs-scenario | heuristic | unknown | Bounded Optimization improves a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts. |

### human-align-surfaces

Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest.

Full bucket detail is shown because this bucket is not ready for proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-62 | AGENTS.md:62 | human-auditable | needs-alignment | agent-reviewed | unknown | Keep this block short. Detailed routing belongs in installed skill metadata and `find-skills` output, not in a long checked-in catalog. |
| claim-docs-cli-reference-md-183 | docs/cli-reference.md:183 | human-auditable | needs-alignment | agent-reviewed | unknown | The product owns the packet boundary and status semantics. |
| claim-docs-cli-reference-md-189 | docs/cli-reference.md:189 | human-auditable | needs-alignment | agent-reviewed | unknown | That keeps persona prompt shaping and result semantics product-owned while backend selection stays adapter-owned. |
| claim-docs-contracts-adapter-contract-md-407 | docs/contracts/adapter-contract.md:407 | human-auditable | needs-alignment | heuristic | unknown | This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file. |
| claim-docs-guides-consumer-adoption-md-29 | docs/guides/consumer-adoption.md:29 | human-auditable | needs-alignment | agent-reviewed | unknown | `Cautilus` only owns the generic workflow contract, CLI, and normalization helpers. |
| claim-docs-guides-consumer-adoption-md-83 | docs/guides/consumer-adoption.md:83 | human-auditable | needs-alignment | agent-reviewed | unknown | It should answer "what is the default `Cautilus` evaluation for this repo?" without forcing the operator to mentally sort multiple unrelated workflows. |
| claim-docs-guides-evaluation-process-md-10 | docs/guides/evaluation-process.md:10 | human-auditable | needs-alignment | agent-reviewed | unknown | That seam owns the checked-in case suite, adapter-runner invocation, and chained summary artifacts before the flow returns to packet-level `cautilus eval evaluate` and proposal normalization. |
| claim-docs-guides-evaluation-process-md-270 | docs/guides/evaluation-process.md:270 | human-auditable | needs-alignment | agent-reviewed | unknown | The host still owns raw invocation and transcript capture; `Cautilus` owns the case-suite/runDir workflow, packet-level recommendation, behavior-intent framing, and the direct chain into `scenario normalize skill`. |
| claim-docs-master-plan-md-29 | docs/master-plan.md:29 | human-auditable | needs-alignment | agent-reviewed | unknown | Cautilus owns the generic claim-to-proof workflow; consumer repos own their local fixtures, runners, prompts, wrappers, and policy. |
| claim-docs-master-plan-md-181 | docs/master-plan.md:181 | human-auditable | needs-alignment | heuristic | unknown | Keep widening HTML surfaces only when the packet boundary stays stable and the page meaningfully improves human review; agents should consume durable packets first. |
| claim-docs-contracts-claim-discovery-workflow-md-60 | docs/contracts/claim-discovery-workflow.md:60 | human-auditable | needs-alignment | agent-reviewed | unknown | The binary must not own LLM provider selection, subagent scheduling, model prompts, review policy, or human conversation. |
| claim-docs-contracts-claim-discovery-workflow-md-65 | docs/contracts/claim-discovery-workflow.md:65 | human-auditable | needs-alignment | heuristic | unknown | The Cautilus Agent should own orchestration that depends on an agent: |
| claim-docs-contracts-claim-discovery-workflow-md-130 | docs/contracts/claim-discovery-workflow.md:130 | human-auditable | needs-alignment | heuristic | unknown | Those findings should be recorded as narrative, catalog, alignment, or documentation work before expecting `claim discover` to emit them by default. |
| claim-docs-contracts-claim-discovery-workflow-md-257 | docs/contracts/claim-discovery-workflow.md:257 | human-auditable | needs-alignment | heuristic | unknown | Ownership-boundary explanations, such as product-owned versus adapter-owned responsibilities, should stay `human-auditable` and `needs-alignment` until the matching docs, code, adapters, and tests are reconciled. |
| claim-docs-contracts-claim-discovery-workflow-md-259 | docs/contracts/claim-discovery-workflow.md:259 | human-auditable | needs-alignment | heuristic | unknown | Command, packet, runner, and readiness statements should prefer deterministic proof unless they explicitly depend on model or agent behavior. |
| claim-docs-contracts-claim-discovery-workflow-md-459 | docs/contracts/claim-discovery-workflow.md:459 | human-auditable | needs-alignment | heuristic | unknown | The binary may provide helper flags such as `claim discover --previous <packet> --refresh-plan`, but the public user-level workflow remains `discover`. |
| claim-docs-contracts-claim-discovery-workflow-md-581 | docs/contracts/claim-discovery-workflow.md:581 | human-auditable | needs-alignment | heuristic | unknown | In this workflow, the binary stays deterministic and provider-neutral. |
| claim-docs-contracts-claim-discovery-workflow-md-636 | docs/contracts/claim-discovery-workflow.md:636 | human-auditable | needs-alignment | heuristic | unknown | The binary/skill boundary stays clean enough that consumer repos can use the binary plus Cautilus Agent without Cautilus importing host-specific prompts or adapters. |
| claim-docs-contracts-claim-discovery-workflow-md-661 | docs/contracts/claim-discovery-workflow.md:661 | human-auditable | needs-alignment | heuristic | unknown | The binary should remain deterministic and provider-neutral. |
| claim-docs-contracts-live-run-invocation-batch-md-28 | docs/contracts/live-run-invocation-batch.md:28 | human-auditable | needs-alignment | agent-reviewed | unknown | Raw provider-error interpretation stays consumer-owned. |
| claim-docs-contracts-live-run-invocation-md-160 | docs/contracts/live-run-invocation.md:160 | human-auditable | needs-alignment | agent-reviewed | unknown | The workspace directory contents stay consumer-owned even when `Cautilus` owns the directory allocation and one-time prepare timing. |
| claim-docs-contracts-runner-readiness-md-348 | docs/contracts/runner-readiness.md:348 | human-auditable | needs-alignment | heuristic | unknown | The skill may guide runner creation, but reusable deterministic behavior belongs in code, adapters, packets, and tests. |
| claim-docs-contracts-runner-verification-md-5 | docs/contracts/runner-verification.md:5 | human-auditable | needs-alignment | heuristic | unknown | This contract keeps that judgment packet-shaped and repo-owned instead of teaching the binary to reverse-engineer arbitrary app code. |
| claim-docs-contracts-runner-verification-md-24 | docs/contracts/runner-verification.md:24 | human-auditable | needs-alignment | agent-reviewed | unknown | external substitution: nondeterministic or costly external dependencies can be replaced with deterministic substitutes at the same boundary the product uses |
| claim-docs-contracts-workbench-instance-discovery-md-99 | docs/contracts/workbench-instance-discovery.md:99 | deterministic | needs-alignment | agent-reviewed | unknown | A future live app eval flow can refer to one selected instance by stable id. |
| claim-docs-specs-concerns-host-owned-execution-spec-md-4 | docs/specs/concerns/host-owned-execution.spec.md:4 | human-auditable | needs-alignment | heuristic | unknown | Cautilus owns generic workflow contracts, packet shapes, command boundaries, and evidence routes. |
| claim-docs-specs-maintainer-adapter-host-ownership-spec-md-13 | docs/specs/maintainer/adapter-host-ownership.spec.md:13 | human-auditable | needs-alignment | heuristic | unknown | Cautilus owns generic workflow contracts, packet shapes, readiness semantics, behavior-surface vocabulary, and normalization helpers, while host repos own prompts, runners, credentials, model or backend selection, fixtures, and policy. |
| claim-docs-specs-maintainer-binary-skill-boundary-spec-md-17 | docs/specs/maintainer/binary-skill-boundary.spec.md:17 | human-auditable | needs-alignment | agent-reviewed | unknown | The binary owns deterministic command execution, packet schemas, help text, and reusable artifacts. |
| claim-docs-specs-maintainer-live-invocation-runtime-spec-md-13 | docs/specs/maintainer/live-invocation-runtime.spec.md:13 | human-auditable | needs-alignment | heuristic | unknown | Cautilus owns the generic request and result packet shape and the loop boundary, while the host-owned adapter still owns provider calls, backend flags, route layout, model choice, credentials, and product-specific response semantics. |
| claim-docs-specs-user-claim-discovery-spec-md-37 | docs/specs/user/claim-discovery.spec.md:37 | human-auditable | needs-alignment | heuristic | unknown | If an important behavior appears only outside that boundary, such as in code, transcripts, issues, or private operator memory, Cautilus Agent or a human can raise it as a documentation, catalog, or alignment gap. |
| claim-docs-specs-user-ownership-spec-md-3 | docs/specs/user/ownership.spec.md:3 | human-auditable | needs-alignment | agent-reviewed | unknown | Before Cautilus can evaluate behavior honestly, the user needs host-specific prompts, models, credentials, runtime wiring, and acceptance policy to stay in the host repo. |
| claim-docs-specs-user-ownership-spec-md-4 | docs/specs/user/ownership.spec.md:4 | human-auditable | needs-alignment | heuristic | unknown | Using the `cautilus adapter` and `cautilus doctor` CLI commands with the `cautilus-agent` skill, a user can keep host-owned execution in place while Cautilus standardizes workflow packets and boundaries. |
| claim-skills-cautilus-agent-skill-md-21 | skills/cautilus-agent/SKILL.md:21 | human-auditable | needs-alignment | agent-reviewed | unknown | The binary owns command discovery, packet examples, deterministic scans, validation, and reusable evaluation artifacts. |
| claim-skills-cautilus-agent-skill-md-128 | skills/cautilus-agent/SKILL.md:128 | human-auditable | needs-alignment | heuristic | unknown | Maintainer-facing claims may use internal terms, but they must stay aligned with the user-facing claim specs and preserve source refs, proof route, evidence status, and next action. |

### human-confirm-or-decompose

Confirm, decompose, or accept a human-auditable claim before treating it as proven.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-80 | README.md:80 | human-auditable | ready-for-proof | heuristic | unknown | Raw `claim discover` packets remain the high-recall, source-ref-backed proof-planning input, not the primary document a user should review. |
| claim-docs-cli-reference-md-259 | docs/cli-reference.md:259 | human-auditable | ready-for-proof | agent-reviewed | stale | The same packet also emits an `attentionView`, which is a bounded human-facing shortlist derived from the full ranked set. |
| claim-docs-contracts-adapter-contract-md-426 | docs/contracts/adapter-contract.md:426 | human-auditable | ready-for-proof | heuristic | unknown | A named adapter whose eval-test commands produce rich scenario-by-scenario signals should also persist them as files so executor variants and human reviewers can ground their verdicts on the same numbers. |
| claim-docs-specs-index-spec-md-11 | docs/specs/index.spec.md:11 | human-auditable | ready-for-proof | heuristic | unknown | A gap is missing or weak evidence that stays visible. |
| claim-docs-specs-index-spec-md-22 | docs/specs/index.spec.md:22 | human-auditable | ready-for-proof | heuristic | unknown | Each spec page should still carry its own local proof or visible proof gap. |

### split-or-defer

Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification.

Full bucket detail is shown because this bucket is not ready for proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-12 | AGENTS.md:12 | human-auditable | blocked | agent-reviewed | unknown | Deterministic behavior belongs in code, scripts, adapters, tests, and specs. |
| claim-agents-md-26 | AGENTS.md:26 | human-auditable | blocked | agent-reviewed | unknown | `Cautilus` owns generic intentful behavior evaluation workflow contracts. |
| claim-agents-md-29 | AGENTS.md:29 | human-auditable | blocked | agent-reviewed | unknown | The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better. |
| claim-agents-md-74 | AGENTS.md:74 | human-auditable | blocked | agent-reviewed | unknown | While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes. |
| claim-readme-md-3 | README.md:3 | human-auditable | blocked | agent-reviewed | unknown | `Cautilus` keeps agent and workflow behavior honest while prompts keep changing. |
| claim-readme-md-169 | README.md:169 | human-auditable | blocked | heuristic | unknown | Use when a stateful automation — a CLI workflow, long-running agent session, or pipeline that persists state across invocations — keeps stalling on the same step. |
| claim-readme-md-208 | README.md:208 | human-auditable | blocked | heuristic | unknown | The longer-term direction is close to the workflow philosophy behind DSPy: prompts can change as long as the evaluated behavior survives. |
| claim-docs-contracts-adapter-contract-md-474 | docs/contracts/adapter-contract.md:474 | human-auditable | blocked | heuristic | unknown | If a checked-in wrapper can observe provider cost or token usage, let it emit an optional `telemetry` object in the structured verdict payload instead of hiding that data in stderr text. |
| claim-docs-contracts-adapter-contract-md-535 | docs/contracts/adapter-contract.md:535 | human-auditable | blocked | heuristic | unknown | Past runs showed some CLIs can reject schemas that declare object properties without also listing them in `required`, even when plain JSON Schema would allow them as optional. |
| claim-docs-contracts-adapter-contract-md-537 | docs/contracts/adapter-contract.md:537 | human-auditable | blocked | heuristic | unknown | Past sessions showed `codex exec` can emit skill-load errors on stderr while still returning a successful exit code. |
| claim-docs-guides-evaluation-process-md-304 | docs/guides/evaluation-process.md:304 | human-auditable | blocked | agent-reviewed | unknown | Past sessions showed `codex exec` can emit fatal skill-loading errors on stderr while the final process exit still looks successful. |
| claim-docs-guides-evaluation-process-md-308 | docs/guides/evaluation-process.md:308 | human-auditable | blocked | agent-reviewed | unknown | Past sessions showed that overly aggressive effort overrides can conflict with tool surfaces that the prompt or skill still needs. |
| claim-docs-guides-evaluation-process-md-317 | docs/guides/evaluation-process.md:317 | human-auditable | blocked | agent-reviewed | unknown | Past sessions showed `--bare` can disable the local OAuth or keychain path and fail with `Not logged in`. |
| claim-docs-guides-evaluation-process-md-320 | docs/guides/evaluation-process.md:320 | human-auditable | blocked | agent-reviewed | unknown | In JSON mode, `claude -p` can wrap the verdict under `structured_output` instead of printing the schema payload as the top-level object. |
| claim-docs-guides-evaluation-process-md-322 | docs/guides/evaluation-process.md:322 | human-auditable | blocked | agent-reviewed | unknown | Past sessions showed `claude -p` can look silent for a while and tempt operators into manual polling or abort loops. |
| claim-docs-master-plan-md-90 | docs/master-plan.md:90 | human-auditable | blocked | agent-reviewed | unknown | Their public command namespace is `eval live`; the `workbench` name is reserved for a possible future GUI where operators can browse and edit claims, scenarios, and evidence. |
| claim-docs-contracts-claim-discovery-workflow-md-47 | docs/contracts/claim-discovery-workflow.md:47 | human-auditable | blocked | agent-reviewed | unknown | The binary should own deterministic behavior that can be rerun without model access: |
| claim-docs-contracts-claim-discovery-workflow-md-78 | docs/contracts/claim-discovery-workflow.md:78 | human-auditable | blocked | agent-reviewed | unknown | This keeps the product agent-first without making the binary a host-specific agent runtime. |
| claim-docs-contracts-claim-discovery-workflow-md-252 | docs/contracts/claim-discovery-workflow.md:252 | human-auditable | blocked | heuristic | unknown | Broad positioning or aggregate product promises should stay `human-auditable` and `verificationReadiness=blocked` until they are decomposed into concrete deterministic checks, scenario candidates, or Cautilus eval claims. |
| claim-docs-contracts-claim-discovery-workflow-md-253 | docs/contracts/claim-discovery-workflow.md:253 | human-auditable | blocked | heuristic | unknown | The claim should remain visible in the packet, but it should not become a fixture plan by default because one passing fixture would overclaim the umbrella promise. |
| claim-docs-contracts-claim-discovery-workflow-md-262 | docs/contracts/claim-discovery-workflow.md:262 | human-auditable | blocked | heuristic | unknown | Historical observation and provider-caveat statements can inform future scenarios, but they should stay `human-auditable` and `blocked` until promoted into a concrete regression claim. |
| claim-docs-contracts-claim-discovery-workflow-md-323 | docs/contracts/claim-discovery-workflow.md:323 | human-auditable | blocked | agent-reviewed | unknown | `verificationReadiness=needs-alignment` means at least two truth surfaces must be reconciled before proof would be honest. |
| claim-docs-contracts-claim-discovery-workflow-md-586 | docs/contracts/claim-discovery-workflow.md:586 | human-auditable | blocked | heuristic | unknown | Perfect subagent batch sizing should wait until the deterministic packet and skill control flow are dogfooded. |
| claim-docs-contracts-claim-discovery-workflow-md-689 | docs/contracts/claim-discovery-workflow.md:689 | human-auditable | blocked | heuristic | unknown | LLM-backed cluster review should come after the deterministic packet and skill control flow are stable enough to dogfood. |
| claim-docs-contracts-live-run-invocation-batch-md-5 | docs/contracts/live-run-invocation-batch.md:5 | human-auditable | blocked | agent-reviewed | unknown | This slice exists to stop adopters from re-implementing the per-scenario scheduler once `cautilus eval live run` already owns the single-request runtime semantics. |
| claim-docs-contracts-runner-readiness-md-55 | docs/contracts/runner-readiness.md:55 | human-auditable | blocked | agent-reviewed | unknown | A runner is a bounded headless command that takes product-readable input and writes a Cautilus-readable observed packet. |
| claim-docs-contracts-scenario-history-md-3 | docs/contracts/scenario-history.md:3 | human-auditable | blocked | agent-reviewed | unknown | `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time. |
| claim-docs-contracts-scenario-history-md-175 | docs/contracts/scenario-history.md:175 | human-auditable | blocked | agent-reviewed | unknown | Compare runs often need a frozen baseline side so only the candidate reruns. |
| claim-docs-contracts-scenario-history-md-238 | docs/contracts/scenario-history.md:238 | human-auditable | blocked | agent-reviewed | unknown | **Part 2 — broader compare ownership.** Extend history / compare hooks beyond the single profile-backed eval path so `review variants`, profile-less eval test runs, and skill evaluation can also update history and materialize compare artifacts. |
| claim-docs-contracts-workbench-instance-discovery-md-87 | docs/contracts/workbench-instance-discovery.md:87 | human-auditable | blocked | agent-reviewed | unknown | future GUI workbench behavior for browsing and editing claims, scenarios, evidence, and related review state That future workbench should be specified as an interactive product surface, not as the current live app runner seam. |
| claim-docs-contracts-workbench-instance-discovery-md-100 | docs/contracts/workbench-instance-discovery.md:100 | human-auditable | blocked | agent-reviewed | unknown | The product can render a human-facing instance chooser without learning consumer-native labels itself. |
| claim-docs-contracts-optimization-md-151 | docs/contracts/optimization.md:151 | human-auditable | blocked | agent-reviewed | unknown | Update the optimize input builder, optimize proposal generator, revision artifact builder, schemas, fixtures, and flow tests so the optimize seam keeps one durable packet for the next bounded revision. |

## Review Results

Active updates still match the current claim packet; superseded updates are historical and omitted from the detail tables below.

| Packet | Mode | Reviewer | Clusters | Active | Superseded | Proof | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| .cautilus/claims/review-result-adapter-gate-split-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-agent-plan-cautilus-eval-2026-05-04.json | parallel-agent-review | - | 1 | 1 | 6 | deterministic: 1 | needs-alignment: 1 |
| .cautilus/claims/review-result-agent-status-safe-branch-catalog-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-canonical-spec-curation-flow-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-current-deterministic-proof-batch-2026-05-03.json | - | - | 1 | 7 | 2 | deterministic: 5, human-auditable: 2 | blocked: 2, ready-for-proof: 5 |
| .cautilus/claims/review-result-current-dev-skill-dogfood-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-deterministic-gates-2026-05-01.json | - | - | 1 | 3 | 1 | deterministic: 3 | ready-for-proof: 3 |
| .cautilus/claims/review-result-deterministic-proof-batch-2026-05-04.json | - | - | 1 | 4 | 1 | deterministic: 4 | ready-for-proof: 4 |
| .cautilus/claims/review-result-deterministic-ready-heuristic-2026-05-03.json | - | - | 4 | 15 | 7 | deterministic: 12, human-auditable: 3 | blocked: 3, ready-for-proof: 12 |
| .cautilus/claims/review-result-dev-skill-branch-proof-2026-05-04.json | evidence-application | codex-dev-skill-dogfood-proof | 0 | 0 | 4 | - | - |
| .cautilus/claims/review-result-eval-bucket-user-b-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-eval-bucket-user-c-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-eval-heuristic-batch-2026-05-03.json | - | - | 1 | 3 | 8 | deterministic: 1, human-auditable: 2 | blocked: 1, needs-alignment: 1, ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-active-run-and-claim-discover-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-chatbot-normalize-proposals-2026-05-11.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-consumer-doctor-onboarding-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-consumer-surface-alias-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-deterministic-proof-batch-2026-05-04b.json | - | - | 1 | 4 | 2 | deterministic: 4 | ready-for-proof: 4 |
| .cautilus/claims/review-result-evidence-doctor-runner-readiness-next-action-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-durable-packets-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-evaluation-process-artifacts-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-fixture-runtime-eval-path-2026-05-11.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-for-proof: 3 |
| .cautilus/claims/review-result-evidence-gepa-sparse-evidence-block-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-install-channel-policy-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-install-packaging-2026-05-03.json | - | - | 1 | 2 | 1 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-live-run-workspace-boundary-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-on-demand-test-gate-2026-05-11.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-proof-class-downstream-summary-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-review-summary-telemetry-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-runner-readiness-branch-shape-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-runner-readiness-schema-fields-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-final-deterministic-proof-debt-2026-05-03.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-for-proof: 3 |
| .cautilus/claims/review-result-hitl-claim-review-boundary-2026-05-02.json | hitl-decision-cards | human-maintainer | 1 | 1 | 1 | cautilus-eval: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-hitl-priority-reset-2026-05-03.json | hitl-decision-cards | human-maintainer | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-human-align-action-bucket.json | action-bucket-focused-review | codex-current-agent | 2 | 3 | 3 | human-auditable: 3 | needs-alignment: 3 |
| .cautilus/claims/review-result-human-confirm-action-bucket.json | action-bucket-focused-review | codex-current-agent | 0 | 0 | 6 | - | - |
| .cautilus/claims/review-result-llm-batch1.json | - | - | 0 | 0 | 3 | - | - |
| .cautilus/claims/review-result-llm-batch3.json | - | - | 2 | 2 | 1 | cautilus-eval: 1, human-auditable: 1 | blocked: 1, ready-for-proof: 1 |
| .cautilus/claims/review-result-llm-batch4.json | - | - | 1 | 1 | 0 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-llm-batch5.json | - | - | 4 | 6 | 0 | deterministic: 4, human-auditable: 2 | needs-alignment: 2, ready-for-proof: 4 |
| .cautilus/claims/review-result-llm-batch6.json | - | - | 3 | 7 | 4 | human-auditable: 7 | blocked: 5, needs-alignment: 2 |
| .cautilus/claims/review-result-loop1-lane-a.json | - | codex | 0 | 0 | 3 | - | - |
| .cautilus/claims/review-result-loop1-lane-b.json | clusters 4-7 only | codex-lane-b | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-loop2-lane-a.json | - | codex | 0 | 0 | 4 | - | - |
| .cautilus/claims/review-result-loop2-lane-b.json | clusters 3-5 only | codex-lane-b | 0 | 0 | 2 | - | - |
| .cautilus/claims/review-result-policy-claim-reclassification-2026-05-03.json | - | - | 1 | 1 | 0 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-positioning-boundary.json | - | - | 1 | 1 | 0 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-readiness-triage-2026-05-10.json | action-bucket-readiness-triage | codex-current-agent | 3 | 18 | 4 | cautilus-eval: 2, deterministic: 10, human-auditable: 6 | blocked: 5, needs-alignment: 1, ready-for-proof: 12 |
| .cautilus/claims/review-result-remaining-deterministic-claims-2026-05-03.json | - | - | 3 | 8 | 3 | deterministic: 6, human-auditable: 2 | blocked: 1, needs-alignment: 1, ready-for-proof: 6 |
| .cautilus/claims/review-result-remaining-deterministic-proof-2026-05-04.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-reviewable-artifacts-proof-gap-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-scenario-proposal-portable-provenance-2026-05-04.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-workbench-instance-catalog-contract-2026-05-03.json | - | - | 1 | 2 | 1 | deterministic: 2 | ready-for-proof: 2 |

### .cautilus/claims/review-result-human-align-action-bucket.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-contracts-live-run-invocation-batch-md-28 | human-auditable | needs-alignment | unknown | Confirm the provider-error ownership boundary against live-run packets and adapter docs; split concrete schema checks if needed. |
| claim-docs-contracts-live-run-invocation-md-160 | human-auditable | needs-alignment | unknown | Human-confirm which workspace contents are product-owned versus consumer-owned, then split any observable no-write guarantees into deterministic tests. |
| claim-docs-master-plan-md-29 | human-auditable | needs-alignment | unknown | Human-review the Cautilus-versus-consumer ownership boundary and split executable subclaims into deterministic or eval proof. |

### .cautilus/claims/review-result-deterministic-gates-2026-05-01.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-readme-md-7 | deterministic | ready-for-proof | satisfied | Keep covered by consumer:onboard:smoke and install smoke when install, starter, or adapter bootstrap behavior changes. |
| claim-readme-md-137 | deterministic | ready-for-proof | satisfied | Keep covered by consumer:starters:smoke when chatbot proposal input shape or starter docs change. |
| claim-readme-md-159 | deterministic | ready-for-proof | satisfied | Keep covered by scenario catalog JSON tests and `cautilus scenarios --json` smoke. |

### .cautilus/claims/review-result-workbench-instance-catalog-contract-2026-05-03.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-contracts-workbench-instance-discovery-md-25 | deterministic | ready-for-proof | satisfied | Keep adapter validation and catalog schema tests current when changing instance discovery fields. |
| claim-docs-contracts-workbench-instance-discovery-md-101 | deterministic | ready-for-proof | satisfied | Keep typed path normalization and catalog schema tests current when adding scenario-adjacent path keys. |

### .cautilus/claims/review-result-scenario-proposal-portable-provenance-2026-05-04.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-contracts-scenario-proposal-sources-md-152 | deterministic | ready-for-proof | satisfied | Keep scenario proposal evidence sourceKind enum and host-storage non-requirement tests in place when changing proposal schemas. |

## Validation

| Packet | Valid | Issues |
| --- | --- | --- |
| .cautilus/claims/validation-evidenced-typed-runners.json | yes | 0 |
| .cautilus/claims/validation-loop1.json | yes | 0 |
| .cautilus/claims/validation-loop2.json | yes | 0 |
| .cautilus/claims/validation-report.json | yes | 0 |
| .cautilus/claims/validation-reviewed-typed-runners.json | yes | 0 |

## Eval Plans

| Packet | Plans | Skipped | Skipped by reason | Zero-plan reason |
| --- | --- | --- | --- | --- |
| .cautilus/claims/eval-plan-agent-reviewed-eval-2026-05-04.json | 0 | 323 | already-satisfied: 15, not-cautilus-eval: 224, not-ready-for-proof: 10, not-reviewed: 74 | all-reviewed-eval-targets-satisfied-and-remaining-reviewed-claims-not-eval-targets |
| .cautilus/claims/eval-plan-evidenced-typed-runners.json | 8 | 255 | already-satisfied: 1, not-cautilus-eval: 160, not-ready-for-proof: 7, not-reviewed: 87 | - |
| .cautilus/claims/eval-plan-loop1.json | 2 | 325 | not-cautilus-eval: 85, not-ready-for-proof: 70, not-reviewed: 170 | - |
| .cautilus/claims/eval-plan-loop2.json | 4 | 304 | not-cautilus-eval: 147, not-ready-for-proof: 6, not-reviewed: 151 | - |
| .cautilus/claims/eval-plan-reviewed-eval-claims-2026-05-03.json | 0 | 322 | already-satisfied: 17, not-cautilus-eval: 217, not-ready-for-proof: 10, not-reviewed: 78 | all-reviewed-eval-targets-satisfied-and-remaining-reviewed-claims-not-eval-targets |
| .cautilus/claims/eval-plan-reviewed-typed-runners.json | 3 | 321 | not-cautilus-eval: 157, not-ready-for-proof: 6, not-reviewed: 158 | - |
| .cautilus/claims/eval-plan-typed-runners.json | 3 | 319 | not-cautilus-eval: 155, not-ready-for-proof: 6, not-reviewed: 158 | - |

Latest zero-plan expectation: Zero eval plans can be expected when reviewed eval-ready claims are already satisfied or when remaining reviewed claims are not Cautilus eval targets.

## Refresh Plans

| Packet | Status | Changed sources | Changed claims | Carried forward |
| --- | --- | --- | --- | --- |
| .cautilus/claims/refresh-plan-2026-05-10-readiness-triage.json | changes-detected | 1 | 3 | 365 |
| .cautilus/claims/refresh-plan-2026-05-11-post-skill-triage.json | up-to-date | 0 | 0 | 368 |
| .cautilus/claims/refresh-plan-action-boundaries.json | changes-detected | 1 | 65 | 268 |
| .cautilus/claims/refresh-plan-action-bucket-breakdowns.json | changes-detected | 1 | 68 | 269 |
| .cautilus/claims/refresh-plan-action-bucket-review-focus.json | changes-detected | 3 | 98 | 239 |
| .cautilus/claims/refresh-plan-after-claim-review-boundary-followup.json | up-to-date | 0 | 0 | 265 |
| .cautilus/claims/refresh-plan-after-claim-review-boundary.json | changes-detected | 1 | 70 | 195 |
| .cautilus/claims/refresh-plan-after-evidence-backed-human-review.json | changes-detected | 1 | 69 | 195 |
| .cautilus/claims/refresh-plan-after-frontmatter-heuristics.json | changes-detected | 1 | 63 | 263 |
| .cautilus/claims/refresh-plan-after-future-proof-placeholder-filter.json | up-to-date | 0 | 0 | 312 |
| .cautilus/claims/refresh-plan-after-hitl-audience.json | changes-detected | 1 | 69 | 195 |
| .cautilus/claims/refresh-plan-after-provider-caveat-heuristics.json | changes-detected | 1 | 65 | 266 |
| .cautilus/claims/refresh-plan-after-review-input-skip.json | changes-detected | 3 | 94 | 230 |
| .cautilus/claims/refresh-plan-after-routing-heuristics.json | changes-detected | 2 | 62 | 263 |
| .cautilus/claims/refresh-plan-after-skill-branch-policy-removal.json | changes-detected | 1 | 11 | 254 |
| .cautilus/claims/refresh-plan-after-source-boundary.json | up-to-date | 0 | 0 | 264 |
| .cautilus/claims/refresh-plan-agent-status-selected-state.json | changes-detected | 2 | 77 | 259 |
| .cautilus/claims/refresh-plan-claim-status-report.json | changes-detected | 1 | 10 | 328 |
| .cautilus/claims/refresh-plan-final.json | changes-detected | 35 | 16 | 284 |
| .cautilus/claims/refresh-plan-skill-action-buckets.json | changes-detected | 1 | 9 | 326 |
| .cautilus/claims/refresh-plan-typed-runners.json | up-to-date | 0 | 0 | 324 |
| .cautilus/claims/refresh-plan.json | changes-detected | 36 | 132 | 160 |

Latest refresh summary: The saved claim map already matches the current checkout; no refresh work is needed before review or eval planning.
Latest refresh plan is historical for this status packet; its next actions are not the current review queue.

## Discovery Boundary

- Entries: README.md, AGENTS.md, CLAUDE.md
- Traversal: entry-markdown-links; linked Markdown depth: 3
- Gitignore policy: respect-repo-gitignore
- Explicit sources: no
- Excludes: .git/**, node_modules/**, dist/**, coverage/**, artifacts/**, charness-artifacts/**, docs/specs/old/**, docs/specs/proof/claim-evidence-state.md, ...

