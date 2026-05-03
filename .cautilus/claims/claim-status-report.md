# Cautilus Claim Status Report

This is a human-readable projection over the current claim packet, status summary, review results, validation reports, and eval plans.
Use the JSON packets as the audit source; use this report to decide what to inspect or do next.

## Packet

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Status packet: .cautilus/claims/status-summary.json
- Candidate count: 312
- Source count: 44
- Packet source commit: 384671a8979867f6446fa9ad1ac8708250be7e8c
- Snapshot notice: gitState is computed when this status packet is generated; rerun claim show for live checkout state.
- Git state snapshot: fresh; stale=no
- Changed-file scope: committed-diff-between-packet-and-current-head; working tree=excluded
- Snapshot recommendation: The claim packet commit matches the inspected checkout.

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 92, unknown: 220 |
| Review | agent-reviewed: 146, heuristic: 166 |
| Recommended proof | cautilus-eval: 132, deterministic: 92, human-auditable: 88 |
| Verification readiness | blocked: 35, needs-alignment: 33, needs-scenario: 8, ready-to-verify: 236 |
| Audience | developer: 233, user: 79 |

Review readiness: heuristicClaimsReadyForReview: 138, needsAlignment: 33, needsScenario: 8.

## Canonical Claim Map

- Map packet: .cautilus/claims/canonical-claim-map.json
- Input status: current
- User raw claims: 79
- User claims mapped to U1-U7: 79
- User claims not mapped to U1-U7: 0
- User mappings recommended for semantic sampling: 58
- Maintainer claims mapped to M1-M11: M1: 21, M10: 18, M11: 9, M2: 61, M3: 48, M4: 14, M5: 6, M6: 9, M7: 13, M8: 12, M9: 22
- All raw claims by disposition: mapped-to-maintainer-canonical: 233, mapped-to-user-canonical: 79
- Mapping confidence: high: 59, low: 61, medium: 192

| User claim | Title | Raw claims | Evidence | Review |
| --- | --- | --- | --- | --- |
| U1 | Claim Discovery | 20 | satisfied: 12, unknown: 8 | agent-reviewed: 18, heuristic: 2 |
| U2 | Evaluation | 31 | satisfied: 8, unknown: 23 | agent-reviewed: 18, heuristic: 13 |
| U3 | Optimization | 4 | satisfied: 1, unknown: 3 | agent-reviewed: 1, heuristic: 3 |
| U4 | Doctor And Readiness | 7 | satisfied: 5, unknown: 2 | agent-reviewed: 5, heuristic: 2 |
| U5 | Product And Host Ownership | 10 | satisfied: 5, unknown: 5 | agent-reviewed: 7, heuristic: 3 |
| U6 | Reviewable Artifacts | 5 | satisfied: 4, unknown: 1 | agent-reviewed: 4, heuristic: 1 |
| U7 | Proof Debt | 2 | satisfied: 2 | agent-reviewed: 2 |

| Maintainer claim | Title | Raw claims | Proof | Evidence | Review |
| --- | --- | --- | --- | --- | --- |
| M1 | Claim Discovery Workflow | 21 | cautilus-eval: 6, deterministic: 6, human-auditable: 9 | satisfied: 6, unknown: 15 | agent-reviewed: 9, heuristic: 12 |
| M2 | Binary And Skill Boundary | 61 | cautilus-eval: 33, deterministic: 9, human-auditable: 19 | satisfied: 8, unknown: 53 | agent-reviewed: 26, heuristic: 35 |
| M3 | Adapter And Host Ownership | 48 | cautilus-eval: 27, deterministic: 5, human-auditable: 16 | satisfied: 5, unknown: 43 | agent-reviewed: 9, heuristic: 39 |
| M4 | Evaluation Surfaces And Runners | 14 | cautilus-eval: 9, deterministic: 4, human-auditable: 1 | satisfied: 4, unknown: 10 | agent-reviewed: 5, heuristic: 9 |
| M5 | Evidence State And Review Artifacts | 6 | deterministic: 2, human-auditable: 4 | satisfied: 2, unknown: 4 | agent-reviewed: 4, heuristic: 2 |
| M6 | Optimization Loop | 9 | cautilus-eval: 4, deterministic: 3, human-auditable: 2 | satisfied: 3, unknown: 6 | agent-reviewed: 5, heuristic: 4 |
| M7 | Readiness And Runtime Status | 13 | cautilus-eval: 2, deterministic: 4, human-auditable: 7 | satisfied: 4, unknown: 9 | agent-reviewed: 8, heuristic: 5 |
| M8 | Active Run And Workspace Lifecycle | 12 | cautilus-eval: 6, deterministic: 4, human-auditable: 2 | satisfied: 4, unknown: 8 | agent-reviewed: 6, heuristic: 6 |
| M9 | Live Invocation Runtime | 22 | cautilus-eval: 15, deterministic: 5, human-auditable: 2 | satisfied: 5, unknown: 17 | agent-reviewed: 5, heuristic: 17 |
| M10 | Reporting And Review Variants | 18 | cautilus-eval: 3, deterministic: 11, human-auditable: 4 | satisfied: 11, unknown: 7 | agent-reviewed: 11, heuristic: 7 |
| M11 | Scenario History And Proposal Normalization | 9 | cautilus-eval: 6, deterministic: 3 | satisfied: 3, unknown: 6 | agent-reviewed: 3, heuristic: 6 |

Maintainer semantic sampling queue:

| Maintainer claim | Title | Sample raw claims |
| --- | --- | --- |
| M1 | Claim Discovery Workflow | claim-docs-contracts-adapter-contract-md-472 (low), claim-docs-contracts-adapter-contract-md-535 (low), claim-docs-master-plan-md-76 (medium), claim-docs-contracts-claim-discovery-workflow-md-5 (medium) |
| M2 | Binary And Skill Boundary | claim-docs-contracts-adapter-contract-md-533 (low), claim-docs-master-plan-md-56 (medium), claim-docs-master-plan-md-82 (low), claim-docs-contracts-active-run-md-186 (low) |
| M3 | Adapter And Host Ownership | claim-agents-md-12 (low), claim-agents-md-26 (low), claim-docs-contracts-adapter-contract-md-3 (medium), claim-docs-contracts-adapter-contract-md-220 (medium) |
| M4 | Evaluation Surfaces And Runners | claim-agents-md-29 (medium), claim-docs-contracts-adapter-contract-md-276 (medium), claim-docs-contracts-claim-discovery-workflow-md-520 (medium), claim-docs-contracts-runner-readiness-md-45 (medium) |
| M5 | Evidence State And Review Artifacts | claim-agents-md-73 (low), claim-docs-contracts-adapter-contract-md-218 (medium), claim-docs-contracts-claim-discovery-workflow-md-325 (medium), claim-docs-contracts-claim-discovery-workflow-md-607 (medium) |
| M6 | Optimization Loop | claim-docs-gepa-md-15 (medium), claim-docs-contracts-reporting-md-150 (low), claim-docs-contracts-runner-readiness-md-37 (medium), claim-docs-contracts-runner-readiness-md-147 (medium) |
| M7 | Readiness And Runtime Status | claim-agents-md-79 (medium), claim-docs-contracts-claim-discovery-workflow-md-96 (medium), claim-docs-contracts-claim-discovery-workflow-md-260 (medium), claim-docs-contracts-claim-discovery-workflow-md-320 (medium) |
| M8 | Active Run And Workspace Lifecycle | claim-agents-md-61 (medium), claim-agents-md-123 (medium), claim-docs-master-plan-md-31 (medium), claim-docs-contracts-active-run-md-3 (medium) |
| M9 | Live Invocation Runtime | claim-docs-contracts-adapter-contract-md-208 (medium), claim-docs-master-plan-md-88 (low), claim-docs-contracts-claim-discovery-workflow-md-399 (medium), claim-docs-contracts-claim-discovery-workflow-md-404 (low) |
| M10 | Reporting And Review Variants | claim-docs-contracts-adapter-contract-md-430 (medium), claim-docs-master-plan-md-179 (medium), claim-docs-contracts-claim-discovery-workflow-md-97 (medium), claim-docs-contracts-claim-discovery-workflow-md-100 (medium) |
| M11 | Scenario History And Proposal Normalization | claim-docs-contracts-claim-discovery-workflow-md-261 (low), claim-docs-contracts-runner-readiness-md-279 (medium), claim-docs-contracts-scenario-history-md-3 (medium), claim-docs-contracts-scenario-history-md-175 (low) |

Semantic sampling recommended for 253 raw claim(s): claim-agents-md-12, claim-agents-md-26, claim-agents-md-29, claim-agents-md-61, claim-agents-md-73, claim-agents-md-79, claim-agents-md-123, claim-readme-md-3, ...

## Next Work

- Human review is still meaningful for human-align-surfaces=33, human-confirm-or-decompose=21, split-or-defer=35.
- Agent eval work: plan Cautilus eval scenarios for 123 claim(s), after reviewing heuristic labels where needed.
- Scenario design work remains for 8 claim(s).

## Action Buckets

| Bucket | Actor | Count | Review | Evidence | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 92 | agent-reviewed: 92 | satisfied: 92 | Proof is already attached and valid under packet semantics. |
| agent-plan-cautilus-eval | agent | 123 | agent-reviewed: 11, heuristic: 112 | unknown: 123 | Draft or select Cautilus eval scenarios for ready eval claims. |
| agent-design-scenario | agent | 8 | heuristic: 8 | unknown: 8 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 33 | agent-reviewed: 13, heuristic: 20 | unknown: 33 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 21 | heuristic: 21 | unknown: 21 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 35 | agent-reviewed: 30, heuristic: 5 | unknown: 35 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

Cross-cutting signal: heuristic-review-needed (166) - Review heuristic labels before spending proof or eval budget.

### agent-plan-cautilus-eval

Draft or select Cautilus eval scenarios for ready eval claims.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-79 | AGENTS.md:79 | cautilus-eval | ready-to-verify | agent-reviewed | unknown | When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available. |
| claim-readme-md-129 | README.md:129 | cautilus-eval | ready-to-verify | heuristic | unknown | For reviewed `cautilus-eval` claims, `claim plan-evals` emits `cautilus.claim_eval_plan.v1`: an intermediate plan for host-owned eval fixtures, not a writer for prompts, runners, fixtures, or policy. |
| claim-readme-md-151 | README.md:151 | cautilus-eval | ready-to-verify | heuristic | unknown | Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing. |
| claim-readme-md-155 | README.md:155 | cautilus-eval | ready-to-verify | heuristic | unknown | The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`; Cautilus's own first-scan, refresh-flow, review-prepare, reviewer-launch, and review-to-eval dogfood fixtures derive their results from audit packets. |
| claim-readme-md-218 | README.md:218 | cautilus-eval | ready-to-verify | heuristic | unknown | Agent track — Claude / Codex plugin.** The `cautilus install` step also lands a bundled skill at `.agents/skills/cautilus/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally. |

### agent-design-scenario

Decompose the behavior into a concrete scenario before protected eval planning.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-178 | README.md:178 | cautilus-eval | needs-scenario | heuristic | unknown | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-master-plan-md-88 | docs/master-plan.md:88 | cautilus-eval | needs-scenario | heuristic | unknown | Their public command namespace is `eval live`; the `workbench` name is reserved for a possible future GUI where operators can browse and edit claims, scenarios, and evidence. |
| claim-docs-contracts-claim-discovery-workflow-md-261 | docs/contracts/claim-discovery-workflow.md:261 | cautilus-eval | needs-scenario | heuristic | unknown | Historical observation and provider-caveat statements can inform future scenarios, but they should stay `human-auditable` and `blocked` until promoted into a concrete regression claim. |
| claim-docs-contracts-claim-discovery-workflow-md-683 | docs/contracts/claim-discovery-workflow.md:683 | cautilus-eval | needs-scenario | heuristic | unknown | `claim show` emits `cautilus.claim_status_summary.v1` and can include bounded `sampleClaims` plus `gitState` for agents that need concrete candidates before choosing the next branch. |
| claim-docs-contracts-scenario-history-md-3 | docs/contracts/scenario-history.md:3 | cautilus-eval | needs-scenario | heuristic | unknown | `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time. |

### human-align-surfaces

Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-docs-cli-reference-md-180 | docs/cli-reference.md:180 | human-auditable | needs-alignment | agent-reviewed | unknown | The product owns the packet boundary and status semantics. |
| claim-docs-cli-reference-md-186 | docs/cli-reference.md:186 | human-auditable | needs-alignment | agent-reviewed | unknown | That keeps persona prompt shaping and result semantics product-owned while backend selection stays adapter-owned. |
| claim-docs-contracts-adapter-contract-md-405 | docs/contracts/adapter-contract.md:405 | human-auditable | needs-alignment | heuristic | unknown | This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file. |
| claim-docs-contracts-adapter-contract-md-424 | docs/contracts/adapter-contract.md:424 | human-auditable | needs-alignment | agent-reviewed | unknown | A named adapter whose eval-test commands produce rich scenario-by-scenario signals should also persist them as files so executor variants and human reviewers can ground their verdicts on the same numbers. |
| claim-docs-guides-consumer-adoption-md-29 | docs/guides/consumer-adoption.md:29 | human-auditable | needs-alignment | agent-reviewed | unknown | `Cautilus` only owns the generic workflow contract, CLI, and normalization helpers. |

### human-confirm-or-decompose

Confirm, decompose, or accept a human-auditable claim before treating it as proven.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-75 | README.md:75 | human-auditable | ready-to-verify | heuristic | unknown | Raw `claim discover` packets remain the source-ref-backed proof-planning input, not the primary document a user should review. |
| claim-docs-contracts-claim-discovery-workflow-md-92 | docs/contracts/claim-discovery-workflow.md:92 | human-auditable | ready-to-verify | heuristic | unknown | In other repos, the same rule should be driven by the repo's adapter, README, and source docs rather than by Cautilus-specific command names. |
| claim-docs-contracts-claim-discovery-workflow-md-181 | docs/contracts/claim-discovery-workflow.md:181 | human-auditable | ready-to-verify | heuristic | unknown | That selected map should drive status summaries and inspect/refresh branch commands, while `state_path` remains the default output path for first discovery. |
| claim-docs-contracts-claim-discovery-workflow-md-254 | docs/contracts/claim-discovery-workflow.md:254 | human-auditable | ready-to-verify | heuristic | unknown | The claim should remain visible in the packet, but it should not become a fixture plan by default because one passing fixture would overclaim the umbrella promise. |
| claim-docs-contracts-claim-discovery-workflow-md-320 | docs/contracts/claim-discovery-workflow.md:320 | human-auditable | ready-to-verify | heuristic | unknown | `verificationReadiness=ready-to-verify` with `evidenceStatus=missing` means proof is absent but a test, fixture, or human-auditable check can now be created or run. |

### split-or-defer

Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-12 | AGENTS.md:12 | human-auditable | blocked | agent-reviewed | unknown | Deterministic behavior belongs in code, scripts, adapters, tests, and specs. |
| claim-agents-md-26 | AGENTS.md:26 | human-auditable | blocked | agent-reviewed | unknown | `Cautilus` owns generic intentful behavior evaluation workflow contracts. |
| claim-agents-md-29 | AGENTS.md:29 | human-auditable | blocked | agent-reviewed | unknown | The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better. |
| claim-agents-md-61 | AGENTS.md:61 | human-auditable | blocked | agent-reviewed | unknown | Keep this block short. Detailed routing belongs in installed skill metadata and `find-skills` output, not in a long checked-in catalog. |
| claim-agents-md-73 | AGENTS.md:73 | human-auditable | blocked | agent-reviewed | unknown | While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes. |

## Review Results

Active updates still match the current claim packet; superseded updates are historical and omitted from the detail tables below.

| Packet | Mode | Reviewer | Clusters | Active | Superseded | Proof | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| .cautilus/claims/review-result-agent-status-safe-branch-catalog-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-deterministic-gates-2026-05-01.json | - | - | 1 | 2 | 2 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-deterministic-ready-heuristic-2026-05-03.json | - | - | 12 | 45 | 2 | cautilus-eval: 9, deterministic: 20, human-auditable: 16 | blocked: 16, ready-to-verify: 29 |
| .cautilus/claims/review-result-evidence-active-run-and-claim-discover-2026-05-03.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-to-verify: 3 |
| .cautilus/claims/review-result-evidence-adapter-discovery-contracts-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-claim-discover-proof-routing-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-claim-review-prepare-input-boundary-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-consumer-doctor-onboarding-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-consumer-surface-alias-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-dev-skill-routing-install.json | - | - | 1 | 1 | 0 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-doctor-runner-readiness-next-action-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-durable-packets-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-evaluation-process-artifacts-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-fixture-runtime-proof-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-gepa-sparse-evidence-block-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-install-channel-policy-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-install-packaging-2026-05-03.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-to-verify: 3 |
| .cautilus/claims/review-result-evidence-live-run-workspace-boundary-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-machine-readable-packets-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-proof-class-downstream-summary-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-refresh-plan-state-transition-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-review-summary-telemetry-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-review-variants-status-and-output-text-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-reviewable-proof-debt-reports-2026-05-03.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-to-verify: 3 |
| .cautilus/claims/review-result-evidence-runner-readiness-branch-shape-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-runner-readiness-schema-fields-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-scenario-catalog-example-cli-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-scenario-review-attention-linkage-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-self-dogfood-html-renderers-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-specdown-prerequisite-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-final-deterministic-proof-debt-2026-05-03.json | - | - | 1 | 5 | 0 | deterministic: 4, human-auditable: 1 | needs-alignment: 1, ready-to-verify: 4 |
| .cautilus/claims/review-result-hitl-audience-2026-05-02.json | hitl-decision-cards | human-maintainer | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-hitl-claim-review-boundary-2026-05-02.json | hitl-decision-cards | human-maintainer | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-hitl-priority-reset-2026-05-03.json | hitl-decision-cards | human-maintainer | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-human-align-action-bucket.json | action-bucket-focused-review | codex-current-agent | 3 | 4 | 3 | human-auditable: 4 | needs-alignment: 4 |
| .cautilus/claims/review-result-human-confirm-action-bucket.json | action-bucket-focused-review | codex-current-agent | 0 | 0 | 8 | - | - |
| .cautilus/claims/review-result-llm-batch1.json | - | - | 0 | 0 | 3 | - | - |
| .cautilus/claims/review-result-llm-batch3.json | - | - | 2 | 2 | 2 | cautilus-eval: 1, human-auditable: 1 | blocked: 1, ready-to-verify: 1 |
| .cautilus/claims/review-result-llm-batch4.json | - | - | 5 | 5 | 0 | deterministic: 2, human-auditable: 3 | blocked: 2, needs-alignment: 1, ready-to-verify: 2 |
| .cautilus/claims/review-result-llm-batch5.json | - | - | 6 | 12 | 0 | deterministic: 10, human-auditable: 2 | needs-alignment: 2, ready-to-verify: 10 |
| .cautilus/claims/review-result-llm-batch6.json | - | - | 3 | 9 | 8 | human-auditable: 9 | blocked: 5, needs-alignment: 4 |
| .cautilus/claims/review-result-loop1-lane-a.json | - | codex | 0 | 0 | 2 | - | - |
| .cautilus/claims/review-result-loop2-lane-a.json | - | codex | 0 | 0 | 4 | - | - |
| .cautilus/claims/review-result-loop2-lane-b.json | clusters 3-5 only | codex-lane-b | 0 | 0 | 2 | - | - |
| .cautilus/claims/review-result-policy-claim-reclassification-2026-05-03.json | - | - | 1 | 2 | 0 | human-auditable: 2 | blocked: 2 |
| .cautilus/claims/review-result-positioning-boundary.json | - | - | 1 | 1 | 0 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-readme-scenario-next-step-reclassification-2026-05-03.json | - | - | 1 | 1 | 0 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-remaining-deterministic-claims-2026-05-03.json | - | - | 4 | 13 | 0 | cautilus-eval: 1, deterministic: 10, human-auditable: 2 | blocked: 1, needs-alignment: 1, ready-to-verify: 11 |
| .cautilus/claims/review-result-reviewable-artifacts-proof-gap-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-workbench-instance-catalog-contract-2026-05-03.json | - | - | 1 | 3 | 0 | deterministic: 3 | blocked: 1, ready-to-verify: 2 |

### .cautilus/claims/review-result-human-align-action-bucket.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-cli-reference-md-180 | human-auditable | needs-alignment | unknown | Human-confirm the packet/status ownership boundary against CLI reference, packet schemas, and implementation before promoting narrower deterministic checks. |
| claim-docs-contracts-live-run-invocation-batch-md-28 | human-auditable | needs-alignment | unknown | Confirm the provider-error ownership boundary against live-run packets and adapter docs; split concrete schema checks if needed. |
| claim-docs-contracts-live-run-invocation-md-160 | human-auditable | needs-alignment | unknown | Human-confirm which workspace contents are product-owned versus consumer-owned, then split any observable no-write guarantees into deterministic tests. |
| claim-docs-master-plan-md-29 | human-auditable | needs-alignment | unknown | Human-review the Cautilus-versus-consumer ownership boundary and split executable subclaims into deterministic or eval proof. |

### .cautilus/claims/review-result-deterministic-gates-2026-05-01.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-master-plan-md-56 | deterministic | ready-to-verify | satisfied | Keep covered by verify, workflow-file review, consumer:onboard:smoke, and release install smoke. |
| claim-docs-master-plan-md-82 | deterministic | ready-to-verify | satisfied | Keep covered by lint:specs and lint:scenario-normalizers whenever scenario-normalization vocabulary changes. |

### .cautilus/claims/review-result-workbench-instance-catalog-contract-2026-05-03.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-contracts-workbench-instance-discovery-md-25 | deterministic | ready-to-verify | satisfied | Keep adapter validation and catalog schema tests current when changing instance discovery fields. |
| claim-docs-contracts-workbench-instance-discovery-md-100 | deterministic | blocked | unknown | Defer until a shipped chooser or review surface exists, or reword the contract to claim only that eval live discover emits display labels in the catalog packet. |
| claim-docs-contracts-workbench-instance-discovery-md-101 | deterministic | ready-to-verify | satisfied | Keep typed path normalization and catalog schema tests current when adding scenario-adjacent path keys. |

### .cautilus/claims/review-result-reviewable-artifacts-proof-gap-2026-05-03.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-specs-user-reviewable-artifacts-spec-md-3 | deterministic | ready-to-verify | satisfied | Keep the projection matrix and renderer tests current when adding a new Cautilus-owned readable artifact family. |
| claim-docs-specs-user-reviewable-artifacts-spec-md-12 | deterministic | ready-to-verify | satisfied | Keep the projection matrix and readable-view source-boundary tests current when adding Markdown or HTML projections. |

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
| .cautilus/claims/eval-plan-evidenced-typed-runners.json | 8 | 255 | already-satisfied: 1, not-cautilus-eval: 160, not-ready-to-verify: 7, not-reviewed: 87 | - |
| .cautilus/claims/eval-plan-loop1.json | 2 | 325 | not-cautilus-eval: 85, not-ready-to-verify: 70, not-reviewed: 170 | - |
| .cautilus/claims/eval-plan-loop2.json | 4 | 304 | not-cautilus-eval: 147, not-ready-to-verify: 6, not-reviewed: 151 | - |
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

Latest refresh summary: The saved claim map already matches the current checkout; no refresh work is needed before review or eval planning.
Latest refresh plan is historical for this status packet; its next actions are not the current review queue.

## Discovery Boundary

- Entries: README.md, AGENTS.md, CLAUDE.md
- Traversal: entry-markdown-links; linked Markdown depth: 3
- Gitignore policy: respect-repo-gitignore
- Explicit sources: no
- Excludes: .git/**, node_modules/**, dist/**, coverage/**, artifacts/**, charness-artifacts/**, docs/specs/old/**, docs/claims/**, ...

