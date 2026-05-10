# Cautilus Claim Status Report

This is a human-readable projection over the current claim packet, status summary, review results, validation reports, and eval plans.
Use the JSON packets as the audit source; use this report to decide what to inspect or do next.

## Packet

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Status packet: .cautilus/claims/status-summary.json
- Candidate count: 368
- Source count: 67
- Packet source commit: e5b886eb0ebf5cd4162a5e66f92f3df4d0415656
- Snapshot notice: gitState is computed when this status packet is generated; rerun claim show for live checkout state.
- Git state snapshot: fresh; stale=no
- Changed-file scope: committed-diff-between-packet-and-current-head; working tree=excluded
- Snapshot recommendation: The claim packet commit matches the inspected checkout.

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 67, stale: 29, unknown: 272 |
| Review | agent-reviewed: 135, heuristic: 232, human-reviewed: 1 |
| Recommended proof | cautilus-eval: 124, deterministic: 142, human-auditable: 102 |
| Verification readiness | blocked: 27, needs-alignment: 44, needs-scenario: 14, ready-to-verify: 283 |
| Audience | developer: 262, user: 106 |

Review readiness: heuristicClaimsReadyForReview: 194, needsAlignment: 44, needsScenario: 14.

## Canonical Claim Map

- Map packet: .cautilus/claims/canonical-claim-map.json
- Input status: current
- User raw claims: 106
- User claims mapped to U1-U7: 106
- User claims not mapped to U1-U7: 0
- User mappings recommended for semantic sampling: 43
- Maintainer claims mapped to M1-M34: M1: 6, M10: 11, M11: 29, M12: 11, M2: 9, M3: 55, M4: 74, M5: 16, M6: 5, M7: 15, M8: 26, M9: 5
- All raw claims by disposition: mapped-to-maintainer-canonical: 262, mapped-to-user-canonical: 106
- Mapping confidence: high: 66, low: 15, medium: 287

| User claim | Title | Raw claims | Evidence | Review |
| --- | --- | --- | --- | --- |
| U1 | Readiness | 25 | satisfied: 10, stale: 1, unknown: 14 | agent-reviewed: 12, heuristic: 13 |
| U2 | Claim Discovery | 61 | satisfied: 8, stale: 18, unknown: 35 | agent-reviewed: 39, heuristic: 22 |
| U3 | Behavior Evaluation | 5 | stale: 1, unknown: 4 | agent-reviewed: 1, heuristic: 4 |
| U4 | Bounded Optimization | 3 | unknown: 3 | heuristic: 3 |
| U5 | Reviewable Artifacts | 4 | unknown: 4 | heuristic: 4 |
| U6 | Evidence Gaps | 1 | unknown: 1 | heuristic: 1 |
| U7 | Host Ownership | 7 | satisfied: 1, unknown: 6 | agent-reviewed: 1, heuristic: 6 |

| Maintainer claim | Title | Raw claims | Proof | Evidence | Review |
| --- | --- | --- | --- | --- | --- |
| M1 | Maintainer Shared Concern Policy | 6 | cautilus-eval: 3, human-auditable: 3 | unknown: 6 | agent-reviewed: 1, heuristic: 5 |
| M2 | Claim Discovery Workflow | 9 | deterministic: 2, human-auditable: 7 | satisfied: 1, unknown: 8 | agent-reviewed: 2, heuristic: 7 |
| M3 | Binary And Skill Boundary | 55 | cautilus-eval: 22, deterministic: 18, human-auditable: 15 | satisfied: 6, stale: 2, unknown: 47 | agent-reviewed: 14, heuristic: 40, human-reviewed: 1 |
| M4 | Adapter And Host Ownership | 74 | cautilus-eval: 32, deterministic: 21, human-auditable: 21 | satisfied: 16, stale: 1, unknown: 57 | agent-reviewed: 25, heuristic: 49 |
| M5 | Evaluation Surfaces And Runners | 16 | cautilus-eval: 8, deterministic: 7, human-auditable: 1 | satisfied: 4, stale: 2, unknown: 10 | agent-reviewed: 6, heuristic: 10 |
| M6 | Evidence State And Review Artifacts | 5 | cautilus-eval: 1, deterministic: 1, human-auditable: 3 | unknown: 5 | heuristic: 5 |
| M7 | Optimization Loop | 15 | cautilus-eval: 7, deterministic: 4, human-auditable: 4 | satisfied: 3, stale: 1, unknown: 11 | agent-reviewed: 5, heuristic: 10 |
| M8 | Readiness And Runtime Status | 26 | cautilus-eval: 3, deterministic: 20, human-auditable: 3 | satisfied: 8, unknown: 18 | agent-reviewed: 10, heuristic: 16 |
| M9 | Active Run And Workspace Lifecycle | 5 | cautilus-eval: 4, human-auditable: 1 | unknown: 5 | agent-reviewed: 1, heuristic: 4 |
| M10 | Live Invocation Runtime | 11 | cautilus-eval: 5, deterministic: 4, human-auditable: 2 | satisfied: 3, unknown: 8 | agent-reviewed: 5, heuristic: 6 |
| M11 | Reporting And Review Variants | 29 | cautilus-eval: 4, deterministic: 16, human-auditable: 9 | satisfied: 6, stale: 3, unknown: 20 | agent-reviewed: 10, heuristic: 19 |
| M12 | Scenario History And Proposal Normalization | 11 | cautilus-eval: 3, deterministic: 4, human-auditable: 4 | satisfied: 1, unknown: 10 | agent-reviewed: 3, heuristic: 8 |
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
| M1 | Maintainer Shared Concern Policy | claim-agents-md-80 (medium), claim-docs-specs-index-spec-md-17 (medium), claim-docs-contracts-runner-readiness-md-172 (low), claim-docs-specs-proof-claim-evidence-state-md-5 (medium) |
| M2 | Claim Discovery Workflow | claim-docs-contracts-claim-discovery-workflow-md-5 (medium), claim-docs-contracts-claim-discovery-workflow-md-130 (medium), claim-docs-contracts-claim-discovery-workflow-md-558 (low), claim-docs-contracts-claim-discovery-workflow-md-689 (medium) |
| M3 | Binary And Skill Boundary | claim-agents-md-79 (medium), claim-agents-md-124 (medium), claim-docs-contracts-adapter-contract-md-474 (low), claim-docs-contracts-adapter-contract-md-535 (medium) |
| M4 | Adapter And Host Ownership | claim-agents-md-12 (medium), claim-agents-md-26 (low), claim-agents-md-29 (medium), claim-agents-md-74 (medium) |
| M5 | Evaluation Surfaces And Runners | claim-docs-contracts-adapter-contract-md-208 (medium), claim-docs-master-plan-md-84 (medium), claim-docs-contracts-claim-discovery-workflow-md-409 (medium), claim-docs-contracts-claim-discovery-workflow-md-468 (medium) |
| M6 | Evidence State And Review Artifacts | claim-docs-master-plan-md-181 (medium), claim-docs-contracts-claim-discovery-workflow-md-326 (medium), claim-docs-contracts-claim-discovery-workflow-md-696 (medium), claim-docs-specs-concerns-agent-human-resumability-spec-md-3 (medium) |
| M7 | Optimization Loop | claim-docs-specs-index-spec-md-22 (low), claim-docs-contracts-claim-discovery-workflow-md-695 (medium), claim-docs-contracts-reporting-md-150 (low), claim-docs-contracts-runner-readiness-md-37 (medium) |
| M8 | Readiness And Runtime Status | claim-docs-gepa-md-15 (medium), claim-docs-contracts-claim-discovery-workflow-md-21 (medium), claim-docs-contracts-claim-discovery-workflow-md-47 (medium), claim-docs-contracts-claim-discovery-workflow-md-85 (medium) |
| M9 | Active Run And Workspace Lifecycle | claim-docs-contracts-active-run-md-59 (medium), claim-docs-contracts-active-run-md-221 (medium), claim-docs-contracts-live-run-invocation-md-160 (medium), claim-docs-specs-maintainer-active-run-workspace-spec-md-3 (medium) |
| M10 | Live Invocation Runtime | claim-docs-contracts-live-run-invocation-batch-md-28 (medium), claim-docs-contracts-live-run-invocation-batch-md-166 (medium), claim-docs-contracts-live-run-invocation-md-58 (medium), claim-docs-contracts-reporting-md-39 (medium) |
| M11 | Reporting And Review Variants | claim-docs-contracts-adapter-contract-md-426 (medium), claim-docs-contracts-adapter-contract-md-432 (medium), claim-docs-contracts-adapter-contract-md-478 (medium), claim-docs-contracts-review-packet-md-3 (medium) |
| M12 | Scenario History And Proposal Normalization | claim-agents-md-62 (medium), claim-docs-contracts-claim-discovery-workflow-md-252 (medium), claim-docs-contracts-claim-discovery-workflow-md-262 (medium), claim-docs-contracts-claim-discovery-workflow-md-586 (medium) |

Semantic sampling recommended for 302 raw claim(s): claim-agents-md-12, claim-agents-md-26, claim-agents-md-29, claim-agents-md-62, claim-agents-md-74, claim-agents-md-79, claim-agents-md-80, claim-agents-md-124, ...

## Next Work

- Human review is still meaningful for human-align-surfaces=44, human-confirm-or-decompose=34, split-or-defer=27.
- Agent next proof work: connect deterministic gates for 72 claim(s), starting with agent-reviewed items before heuristic items.
- Agent eval work: plan Cautilus eval scenarios for 110 claim(s), after reviewing heuristic labels where needed.
- Scenario design work remains for 14 claim(s).

## Action Buckets

| Bucket | Actor | Count | Review | Evidence | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 67 | agent-reviewed: 67 | satisfied: 67 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 72 | agent-reviewed: 23, heuristic: 49 | stale: 23, unknown: 49 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 110 | agent-reviewed: 7, heuristic: 102, human-reviewed: 1 | stale: 4, unknown: 106 | Draft or select Cautilus eval scenarios for ready eval claims. |
| agent-design-scenario | agent | 14 | heuristic: 14 | unknown: 14 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 44 | agent-reviewed: 20, heuristic: 24 | stale: 1, unknown: 43 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 34 | agent-reviewed: 1, heuristic: 33 | stale: 1, unknown: 33 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 27 | agent-reviewed: 17, heuristic: 10 | unknown: 27 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

Cross-cutting signal: heuristic-review-needed (232) - Review heuristic labels before spending proof or eval budget.

Cross-cutting signal: stale-evidence (29) - Refresh or recheck stale evidence before consuming it as proof.

### agent-add-deterministic-proof

Add or connect unit, lint, build, schema, spec, or CI proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-124 | AGENTS.md:124 | deterministic | ready-to-verify | agent-reviewed | stale | `npm run test:on-demand` currently owns the heavier self-dogfood workflow script tests. |
| claim-readme-md-82 | README.md:82 | deterministic | ready-to-verify | heuristic | unknown | The public website report is generated from the claim spec tree, but host repos do not need that renderer before Cautilus can inspect readiness, claims, evals, or optimization work. |
| claim-readme-md-90 | README.md:90 | deterministic | ready-to-verify | heuristic | unknown | This loop verifies a bounded behavior fixture and produces reopenable observed and summary packets. |
| claim-readme-md-152 | README.md:152 | deterministic | ready-to-verify | agent-reviewed | stale | CLI: `cautilus scenario normalize chatbot --input logs.json` For agent: "Run a chatbot regression with these logs and my new system prompt." You get reopenable `proposals.json` candidates that can be kept out of tuning as protected checks. |
| claim-readme-md-165 | README.md:165 | deterministic | ready-to-verify | agent-reviewed | stale | When the goal is only to prove command routing and packet evaluation, `cautilus eval test --runtime fixture` can run the same product path with adapter-owned fixture results instead of launching a nested model eval. |

### agent-plan-cautilus-eval

Draft or select Cautilus eval scenarios for ready eval claims.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-79 | AGENTS.md:79 | cautilus-eval | ready-to-verify | agent-reviewed | unknown | Cautilus Agent should own routing, sequencing, guardrails, and decision boundaries; the binary should own broad command discovery, help text, scenario catalogs, packet examples, install smoke, and doctor/readiness details. |
| claim-agents-md-80 | AGENTS.md:80 | cautilus-eval | ready-to-verify | agent-reviewed | unknown | When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available. |
| claim-readme-md-18 | README.md:18 | cautilus-eval | ready-to-verify | heuristic | unknown | Host repos can use `cautilus eval test` and `cautilus eval evaluate` with checked-in fixtures, host-owned adapters, and the current `cautilus.evaluation_input.v1`, `cautilus.evaluation_observed.v1`, and `cautilus.evaluation_summary.v1` packets. |
| claim-readme-md-105 | README.md:105 | cautilus-eval | ready-to-verify | heuristic | unknown | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-163 | README.md:163 | cautilus-eval | ready-to-verify | agent-reviewed | stale | The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`. |

### agent-design-scenario

Decompose the behavior into a concrete scenario before protected eval planning.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-187 | README.md:187 | cautilus-eval | needs-scenario | heuristic | unknown | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-master-plan-md-90 | docs/master-plan.md:90 | cautilus-eval | needs-scenario | heuristic | unknown | Their public command namespace is `eval live`; the `workbench` name is reserved for a possible future GUI where operators can browse and edit claims, scenarios, and evidence. |
| claim-docs-specs-user-evaluation-spec-md-4 | docs/specs/user/evaluation.spec.md:4 | cautilus-eval | needs-scenario | heuristic | unknown | Using the `cautilus eval` CLI command and the `cautilus-agent` skill, a user can evaluate behavior across `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces without turning the host repo's runners, prompts, or policy into Cautilus-owned state. |
| claim-docs-specs-user-evaluation-spec-md-25 | docs/specs/user/evaluation.spec.md:25 | cautilus-eval | needs-scenario | heuristic | unknown | A user can evaluate behavior without Cautilus taking over host-owned execution. |
| claim-docs-contracts-scenario-history-md-3 | docs/contracts/scenario-history.md:3 | cautilus-eval | needs-scenario | heuristic | unknown | `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time. |

### human-align-surfaces

Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-62 | AGENTS.md:62 | human-auditable | needs-alignment | agent-reviewed | unknown | Keep this block short. Detailed routing belongs in installed skill metadata and `find-skills` output, not in a long checked-in catalog. |
| claim-docs-cli-reference-md-183 | docs/cli-reference.md:183 | human-auditable | needs-alignment | agent-reviewed | unknown | The product owns the packet boundary and status semantics. |
| claim-docs-cli-reference-md-189 | docs/cli-reference.md:189 | human-auditable | needs-alignment | agent-reviewed | unknown | That keeps persona prompt shaping and result semantics product-owned while backend selection stays adapter-owned. |
| claim-docs-contracts-adapter-contract-md-407 | docs/contracts/adapter-contract.md:407 | human-auditable | needs-alignment | heuristic | unknown | This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file. |
| claim-docs-guides-consumer-adoption-md-29 | docs/guides/consumer-adoption.md:29 | human-auditable | needs-alignment | agent-reviewed | unknown | `Cautilus` only owns the generic workflow contract, CLI, and normalization helpers. |

### human-confirm-or-decompose

Confirm, decompose, or accept a human-auditable claim before treating it as proven.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-80 | README.md:80 | human-auditable | ready-to-verify | heuristic | unknown | Raw `claim discover` packets remain the high-recall, source-ref-backed proof-planning input, not the primary document a user should review. |
| claim-docs-cli-reference-md-259 | docs/cli-reference.md:259 | human-auditable | ready-to-verify | agent-reviewed | stale | The same packet also emits an `attentionView`, which is a bounded human-facing shortlist derived from the full ranked set. |
| claim-docs-contracts-adapter-contract-md-426 | docs/contracts/adapter-contract.md:426 | human-auditable | ready-to-verify | heuristic | unknown | A named adapter whose eval-test commands produce rich scenario-by-scenario signals should also persist them as files so executor variants and human reviewers can ground their verdicts on the same numbers. |
| claim-docs-specs-index-spec-md-11 | docs/specs/index.spec.md:11 | human-auditable | ready-to-verify | heuristic | unknown | A gap is missing or weak evidence that stays visible. |
| claim-docs-specs-index-spec-md-22 | docs/specs/index.spec.md:22 | human-auditable | ready-to-verify | heuristic | unknown | Each spec page should still carry its own local proof or visible proof gap. |

### split-or-defer

Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-12 | AGENTS.md:12 | human-auditable | blocked | agent-reviewed | unknown | Deterministic behavior belongs in code, scripts, adapters, tests, and specs. |
| claim-agents-md-26 | AGENTS.md:26 | human-auditable | blocked | agent-reviewed | unknown | `Cautilus` owns generic intentful behavior evaluation workflow contracts. |
| claim-agents-md-29 | AGENTS.md:29 | human-auditable | blocked | agent-reviewed | unknown | The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better. |
| claim-agents-md-74 | AGENTS.md:74 | human-auditable | blocked | agent-reviewed | unknown | While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes. |
| claim-readme-md-3 | README.md:3 | human-auditable | blocked | agent-reviewed | unknown | `Cautilus` keeps agent and workflow behavior honest while prompts keep changing. |

## Review Results

Active updates still match the current claim packet; superseded updates are historical and omitted from the detail tables below.

| Packet | Mode | Reviewer | Clusters | Active | Superseded | Proof | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| .cautilus/claims/review-result-adapter-gate-split-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-agent-plan-cautilus-eval-2026-05-04.json | parallel-agent-review | - | 2 | 2 | 5 | deterministic: 2 | needs-alignment: 2 |
| .cautilus/claims/review-result-agent-status-safe-branch-catalog-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-canonical-spec-curation-flow-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-current-deterministic-proof-batch-2026-05-03.json | - | - | 1 | 8 | 1 | deterministic: 6, human-auditable: 2 | blocked: 2, needs-alignment: 1, ready-to-verify: 5 |
| .cautilus/claims/review-result-current-dev-skill-dogfood-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-deterministic-gates-2026-05-01.json | - | - | 1 | 3 | 1 | deterministic: 3 | ready-to-verify: 3 |
| .cautilus/claims/review-result-deterministic-proof-batch-2026-05-04.json | - | - | 1 | 4 | 1 | deterministic: 4 | ready-to-verify: 4 |
| .cautilus/claims/review-result-deterministic-ready-heuristic-2026-05-03.json | - | - | 4 | 15 | 7 | deterministic: 12, human-auditable: 3 | blocked: 3, ready-to-verify: 12 |
| .cautilus/claims/review-result-dev-skill-branch-proof-2026-05-04.json | evidence-application | codex-dev-skill-dogfood-proof | 0 | 0 | 4 | - | - |
| .cautilus/claims/review-result-eval-bucket-user-b-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-eval-bucket-user-c-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-eval-heuristic-batch-2026-05-03.json | - | - | 1 | 3 | 8 | deterministic: 1, human-auditable: 2 | blocked: 1, needs-alignment: 1, ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-active-run-and-claim-discover-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-consumer-doctor-onboarding-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-consumer-surface-alias-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-deterministic-proof-batch-2026-05-04b.json | - | - | 1 | 4 | 2 | deterministic: 4 | ready-to-verify: 4 |
| .cautilus/claims/review-result-evidence-doctor-runner-readiness-next-action-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-durable-packets-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-evaluation-process-artifacts-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-gepa-sparse-evidence-block-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-install-channel-policy-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-install-packaging-2026-05-03.json | - | - | 1 | 2 | 1 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-live-run-workspace-boundary-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-proof-class-downstream-summary-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-review-summary-telemetry-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-runner-readiness-branch-shape-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-runner-readiness-schema-fields-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-final-deterministic-proof-debt-2026-05-03.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-to-verify: 3 |
| .cautilus/claims/review-result-hitl-claim-review-boundary-2026-05-02.json | hitl-decision-cards | human-maintainer | 1 | 1 | 1 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-hitl-priority-reset-2026-05-03.json | hitl-decision-cards | human-maintainer | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-human-align-action-bucket.json | action-bucket-focused-review | codex-current-agent | 2 | 3 | 3 | human-auditable: 3 | needs-alignment: 3 |
| .cautilus/claims/review-result-human-confirm-action-bucket.json | action-bucket-focused-review | codex-current-agent | 0 | 0 | 6 | - | - |
| .cautilus/claims/review-result-llm-batch1.json | - | - | 0 | 0 | 3 | - | - |
| .cautilus/claims/review-result-llm-batch3.json | - | - | 2 | 2 | 1 | cautilus-eval: 1, human-auditable: 1 | blocked: 1, ready-to-verify: 1 |
| .cautilus/claims/review-result-llm-batch4.json | - | - | 1 | 1 | 0 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-llm-batch5.json | - | - | 4 | 6 | 0 | deterministic: 4, human-auditable: 2 | needs-alignment: 2, ready-to-verify: 4 |
| .cautilus/claims/review-result-llm-batch6.json | - | - | 3 | 9 | 2 | human-auditable: 9 | blocked: 5, needs-alignment: 4 |
| .cautilus/claims/review-result-loop1-lane-a.json | - | codex | 0 | 0 | 3 | - | - |
| .cautilus/claims/review-result-loop1-lane-b.json | clusters 4-7 only | codex-lane-b | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-loop2-lane-a.json | - | codex | 0 | 0 | 4 | - | - |
| .cautilus/claims/review-result-loop2-lane-b.json | clusters 3-5 only | codex-lane-b | 0 | 0 | 2 | - | - |
| .cautilus/claims/review-result-policy-claim-reclassification-2026-05-03.json | - | - | 1 | 1 | 0 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-positioning-boundary.json | - | - | 1 | 1 | 0 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-remaining-deterministic-claims-2026-05-03.json | - | - | 3 | 8 | 3 | deterministic: 6, human-auditable: 2 | blocked: 1, needs-alignment: 1, ready-to-verify: 6 |
| .cautilus/claims/review-result-remaining-deterministic-proof-2026-05-04.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-reviewable-artifacts-proof-gap-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-scenario-proposal-portable-provenance-2026-05-04.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-workbench-instance-catalog-contract-2026-05-03.json | - | - | 1 | 2 | 1 | deterministic: 2 | ready-to-verify: 2 |

### .cautilus/claims/review-result-human-align-action-bucket.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-contracts-live-run-invocation-batch-md-28 | human-auditable | needs-alignment | unknown | Confirm the provider-error ownership boundary against live-run packets and adapter docs; split concrete schema checks if needed. |
| claim-docs-contracts-live-run-invocation-md-160 | human-auditable | needs-alignment | unknown | Human-confirm which workspace contents are product-owned versus consumer-owned, then split any observable no-write guarantees into deterministic tests. |
| claim-docs-master-plan-md-29 | human-auditable | needs-alignment | unknown | Human-review the Cautilus-versus-consumer ownership boundary and split executable subclaims into deterministic or eval proof. |

### .cautilus/claims/review-result-deterministic-gates-2026-05-01.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-readme-md-7 | deterministic | ready-to-verify | satisfied | Keep covered by consumer:onboard:smoke and install smoke when install, starter, or adapter bootstrap behavior changes. |
| claim-readme-md-137 | deterministic | ready-to-verify | satisfied | Keep covered by consumer:starters:smoke when chatbot proposal input shape or starter docs change. |
| claim-readme-md-159 | deterministic | ready-to-verify | satisfied | Keep covered by scenario catalog JSON tests and `cautilus scenarios --json` smoke. |

### .cautilus/claims/review-result-workbench-instance-catalog-contract-2026-05-03.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-contracts-workbench-instance-discovery-md-25 | deterministic | ready-to-verify | satisfied | Keep adapter validation and catalog schema tests current when changing instance discovery fields. |
| claim-docs-contracts-workbench-instance-discovery-md-101 | deterministic | ready-to-verify | satisfied | Keep typed path normalization and catalog schema tests current when adding scenario-adjacent path keys. |

### .cautilus/claims/review-result-scenario-proposal-portable-provenance-2026-05-04.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-contracts-scenario-proposal-sources-md-152 | deterministic | ready-to-verify | satisfied | Keep scenario proposal evidence sourceKind enum and host-storage non-requirement tests in place when changing proposal schemas. |

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
| .cautilus/claims/eval-plan-agent-reviewed-eval-2026-05-04.json | 0 | 323 | already-satisfied: 15, not-cautilus-eval: 224, not-ready-to-verify: 10, not-reviewed: 74 | all-reviewed-eval-targets-satisfied-and-remaining-reviewed-claims-not-eval-targets |
| .cautilus/claims/eval-plan-evidenced-typed-runners.json | 8 | 255 | already-satisfied: 1, not-cautilus-eval: 160, not-ready-to-verify: 7, not-reviewed: 87 | - |
| .cautilus/claims/eval-plan-loop1.json | 2 | 325 | not-cautilus-eval: 85, not-ready-to-verify: 70, not-reviewed: 170 | - |
| .cautilus/claims/eval-plan-loop2.json | 4 | 304 | not-cautilus-eval: 147, not-ready-to-verify: 6, not-reviewed: 151 | - |
| .cautilus/claims/eval-plan-reviewed-eval-claims-2026-05-03.json | 0 | 322 | already-satisfied: 17, not-cautilus-eval: 217, not-ready-to-verify: 10, not-reviewed: 78 | all-reviewed-eval-targets-satisfied-and-remaining-reviewed-claims-not-eval-targets |
| .cautilus/claims/eval-plan-reviewed-typed-runners.json | 3 | 321 | not-cautilus-eval: 157, not-ready-to-verify: 6, not-reviewed: 158 | - |
| .cautilus/claims/eval-plan-typed-runners.json | 3 | 319 | not-cautilus-eval: 155, not-ready-to-verify: 6, not-reviewed: 158 | - |

Latest zero-plan expectation: Zero eval plans can be expected when reviewed eval-ready claims are already satisfied or when remaining reviewed claims are not Cautilus eval targets.

## Refresh Plans

| Packet | Status | Changed sources | Changed claims | Carried forward |
| --- | --- | --- | --- | --- |
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

Latest refresh summary: The saved claim map was made from an older checkout; this plan identifies claims whose source files changed and does not update the saved claim map yet.
Latest refresh plan is historical for this status packet; its next actions are not the current review queue.

## Discovery Boundary

- Entries: README.md, AGENTS.md, CLAUDE.md
- Traversal: entry-markdown-links; linked Markdown depth: 3
- Gitignore policy: respect-repo-gitignore
- Explicit sources: no
- Excludes: .git/**, node_modules/**, dist/**, coverage/**, artifacts/**, charness-artifacts/**, docs/specs/old/**, docs/claims/**, ...

