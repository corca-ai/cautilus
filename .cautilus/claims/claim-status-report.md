# Cautilus Claim Status Report

This is a human-readable projection over the current claim packet, status summary, review results, validation reports, and eval plans.
Use the JSON packets as the audit source; use this report to decide what to inspect or do next.

## Packet

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Status packet: .cautilus/claims/status-summary.json
- Candidate count: 325
- Source count: 44
- Packet source commit: 0f605d6f678aadaa18cf82f8c44d07cb14119fea
- Snapshot notice: gitState is computed when this status packet is generated; rerun claim show for live checkout state.
- Git state snapshot: fresh; stale=no
- Changed-file scope: committed-diff-between-packet-and-current-head; working tree=excluded
- Snapshot recommendation: The claim packet commit matches the inspected checkout.

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 121, unknown: 204 |
| Review | agent-reviewed: 168, heuristic: 157 |
| Recommended proof | cautilus-eval: 101, deterministic: 135, human-auditable: 89 |
| Verification readiness | blocked: 31, needs-alignment: 39, needs-scenario: 10, ready-to-verify: 245 |
| Audience | developer: 244, user: 81 |

Review readiness: heuristicClaimsReadyForReview: 128, needsAlignment: 39, needsScenario: 10.

## Canonical Claim Map

- Map packet: .cautilus/claims/canonical-claim-map.json
- Input status: current
- User raw claims: 81
- User claims mapped to U1-U7: 81
- User claims not mapped to U1-U7: 0
- User mappings recommended for semantic sampling: 60
- Maintainer claims mapped to M1-M11: M1: 23, M10: 24, M11: 11, M2: 62, M3: 52, M4: 14, M5: 5, M6: 10, M7: 11, M8: 13, M9: 19
- All raw claims by disposition: mapped-to-maintainer-canonical: 244, mapped-to-user-canonical: 81
- Mapping confidence: high: 60, low: 66, medium: 199

| User claim | Title | Raw claims | Evidence | Review |
| --- | --- | --- | --- | --- |
| U1 | Claim Discovery | 23 | satisfied: 17, unknown: 6 | agent-reviewed: 21, heuristic: 2 |
| U2 | Evaluation | 28 | satisfied: 16, unknown: 12 | agent-reviewed: 26, heuristic: 2 |
| U3 | Optimization | 4 | satisfied: 2, unknown: 2 | agent-reviewed: 2, heuristic: 2 |
| U4 | Doctor And Readiness | 8 | satisfied: 8 | agent-reviewed: 8 |
| U5 | Product And Host Ownership | 11 | satisfied: 6, unknown: 5 | agent-reviewed: 9, heuristic: 2 |
| U6 | Reviewable Artifacts | 5 | satisfied: 4, unknown: 1 | agent-reviewed: 5 |
| U7 | Proof Debt | 2 | satisfied: 2 | agent-reviewed: 2 |

| Maintainer claim | Title | Raw claims | Proof | Evidence | Review |
| --- | --- | --- | --- | --- | --- |
| M1 | Claim Discovery Workflow | 23 | cautilus-eval: 3, deterministic: 9, human-auditable: 11 | satisfied: 6, unknown: 17 | agent-reviewed: 8, heuristic: 15 |
| M2 | Binary And Skill Boundary | 62 | cautilus-eval: 26, deterministic: 23, human-auditable: 13 | satisfied: 9, unknown: 53 | agent-reviewed: 17, heuristic: 45 |
| M3 | Adapter And Host Ownership | 52 | cautilus-eval: 22, deterministic: 11, human-auditable: 19 | satisfied: 7, unknown: 45 | agent-reviewed: 15, heuristic: 37 |
| M4 | Evaluation Surfaces And Runners | 14 | cautilus-eval: 8, deterministic: 5, human-auditable: 1 | satisfied: 6, unknown: 8 | agent-reviewed: 7, heuristic: 7 |
| M5 | Evidence State And Review Artifacts | 5 | cautilus-eval: 1, deterministic: 1, human-auditable: 3 | satisfied: 2, unknown: 3 | agent-reviewed: 3, heuristic: 2 |
| M6 | Optimization Loop | 10 | cautilus-eval: 4, deterministic: 4, human-auditable: 2 | satisfied: 5, unknown: 5 | agent-reviewed: 6, heuristic: 4 |
| M7 | Readiness And Runtime Status | 11 | cautilus-eval: 1, deterministic: 5, human-auditable: 5 | satisfied: 5, unknown: 6 | agent-reviewed: 7, heuristic: 4 |
| M8 | Active Run And Workspace Lifecycle | 13 | cautilus-eval: 4, deterministic: 5, human-auditable: 4 | satisfied: 4, unknown: 9 | agent-reviewed: 8, heuristic: 5 |
| M9 | Live Invocation Runtime | 19 | cautilus-eval: 10, deterministic: 7, human-auditable: 2 | satisfied: 7, unknown: 12 | agent-reviewed: 7, heuristic: 12 |
| M10 | Reporting And Review Variants | 24 | cautilus-eval: 3, deterministic: 15, human-auditable: 6 | satisfied: 11, unknown: 13 | agent-reviewed: 13, heuristic: 11 |
| M11 | Scenario History And Proposal Normalization | 11 | cautilus-eval: 6, deterministic: 5 | satisfied: 4, unknown: 7 | agent-reviewed: 4, heuristic: 7 |

Maintainer semantic sampling queue:

| Maintainer claim | Title | Sample raw claims |
| --- | --- | --- |
| M1 | Claim Discovery Workflow | claim-docs-contracts-adapter-contract-md-474 (low), claim-docs-contracts-adapter-contract-md-537 (low), claim-docs-master-plan-md-76 (medium), claim-docs-contracts-claim-discovery-workflow-md-5 (medium) |
| M2 | Binary And Skill Boundary | claim-docs-contracts-adapter-contract-md-219 (medium), claim-docs-contracts-adapter-contract-md-278 (medium), claim-docs-contracts-adapter-contract-md-535 (low), claim-docs-master-plan-md-56 (medium) |
| M3 | Adapter And Host Ownership | claim-agents-md-12 (low), claim-agents-md-26 (low), claim-docs-contracts-adapter-contract-md-3 (medium), claim-docs-contracts-adapter-contract-md-222 (medium) |
| M4 | Evaluation Surfaces And Runners | claim-agents-md-29 (medium), claim-docs-contracts-adapter-contract-md-208 (medium), claim-docs-contracts-claim-discovery-workflow-md-525 (medium), claim-docs-contracts-runner-readiness-md-45 (medium) |
| M5 | Evidence State And Review Artifacts | claim-agents-md-73 (low), claim-docs-contracts-claim-discovery-workflow-md-39 (medium), claim-docs-contracts-claim-discovery-workflow-md-326 (medium), claim-docs-contracts-runner-readiness-md-350 (medium) |
| M6 | Optimization Loop | claim-docs-gepa-md-15 (medium), claim-docs-contracts-reporting-md-150 (low), claim-docs-contracts-runner-readiness-md-37 (medium), claim-docs-contracts-runner-readiness-md-147 (medium) |
| M7 | Readiness And Runtime Status | claim-agents-md-79 (medium), claim-docs-contracts-adapter-contract-md-209 (medium), claim-docs-contracts-claim-discovery-workflow-md-96 (medium), claim-docs-contracts-claim-discovery-workflow-md-321 (medium) |
| M8 | Active Run And Workspace Lifecycle | claim-agents-md-61 (medium), claim-agents-md-123 (medium), claim-docs-master-plan-md-31 (medium), claim-docs-contracts-active-run-md-3 (medium) |
| M9 | Live Invocation Runtime | claim-docs-master-plan-md-88 (low), claim-docs-contracts-claim-discovery-workflow-md-404 (medium), claim-docs-contracts-claim-discovery-workflow-md-409 (low), claim-docs-contracts-live-run-invocation-batch-md-77 (medium) |
| M10 | Reporting And Review Variants | claim-docs-contracts-adapter-contract-md-426 (medium), claim-docs-contracts-adapter-contract-md-432 (medium), claim-docs-master-plan-md-179 (medium), claim-docs-contracts-claim-discovery-workflow-md-97 (medium) |
| M11 | Scenario History And Proposal Normalization | claim-docs-contracts-claim-discovery-workflow-md-254 (medium), claim-docs-contracts-claim-discovery-workflow-md-262 (low), claim-docs-contracts-runner-readiness-md-280 (medium), claim-docs-contracts-scenario-history-md-3 (medium) |

Semantic sampling recommended for 265 raw claim(s): claim-agents-md-12, claim-agents-md-26, claim-agents-md-29, claim-agents-md-61, claim-agents-md-73, claim-agents-md-79, claim-agents-md-123, claim-readme-md-3, ...

## Next Work

- Human review is still meaningful for human-align-surfaces=39, human-confirm-or-decompose=22, split-or-defer=31.
- Agent next proof work: connect deterministic gates for 26 claim(s), starting with agent-reviewed items before heuristic items.
- Agent eval work: plan Cautilus eval scenarios for 76 claim(s), after reviewing heuristic labels where needed.
- Scenario design work remains for 10 claim(s).

## Action Buckets

| Bucket | Actor | Count | Review | Evidence | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 121 | agent-reviewed: 121 | satisfied: 121 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 26 | agent-reviewed: 1, heuristic: 25 | unknown: 26 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 76 | heuristic: 76 | unknown: 76 | Draft or select Cautilus eval scenarios for ready eval claims. |
| agent-design-scenario | agent | 10 | agent-reviewed: 2, heuristic: 8 | unknown: 10 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 39 | agent-reviewed: 18, heuristic: 21 | unknown: 39 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 22 | heuristic: 22 | unknown: 22 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 31 | agent-reviewed: 26, heuristic: 5 | unknown: 31 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

Cross-cutting signal: heuristic-review-needed (157) - Review heuristic labels before spending proof or eval budget.

### agent-add-deterministic-proof

Add or connect unit, lint, build, schema, spec, or CI proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-docs-contracts-adapter-contract-md-219 | docs/contracts/adapter-contract.md:219 | deterministic | ready-to-verify | heuristic | unknown | The binary uses these hints before portable path defaults to label review queues, while the bundled skill or a human reviewer may still correct semantic edge cases. |
| claim-docs-contracts-adapter-contract-md-278 | docs/contracts/adapter-contract.md:278 | deterministic | ready-to-verify | heuristic | unknown | `kind: explicit` keeps fixture-backed repos and simple single-instance adopters cheap without forcing a probe script. |
| claim-docs-contracts-adapter-contract-md-317 | docs/contracts/adapter-contract.md:317 | deterministic | ready-to-verify | heuristic | unknown | The command writes one `cautilus.live_run_invocation_result.v1` packet to `output_file`. |
| claim-docs-contracts-claim-discovery-workflow-md-188 | docs/contracts/claim-discovery-workflow.md:188 | deterministic | ready-to-verify | heuristic | unknown | It should also show the deterministic bounds that will be applied: |
| claim-docs-contracts-claim-discovery-workflow-md-202 | docs/contracts/claim-discovery-workflow.md:202 | deterministic | ready-to-verify | heuristic | unknown | After the deterministic pass, the skill should show a separate review plan: |

### agent-plan-cautilus-eval

Draft or select Cautilus eval scenarios for ready eval claims.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-docs-contracts-adapter-contract-md-209 | docs/contracts/adapter-contract.md:209 | cautilus-eval | ready-to-verify | heuristic | unknown | When an eval run uses `runtime=product`, the adapter-owned command is expected to exercise a headless product path; the runtime label does not make product proof ready without a current runner assessment. |
| claim-docs-contracts-adapter-contract-md-222 | docs/contracts/adapter-contract.md:222 | cautilus-eval | ready-to-verify | heuristic | unknown | If omitted, discovery uses the portable fallback group `General product behavior` instead of assuming a product-specific taxonomy. |
| claim-docs-contracts-adapter-contract-md-432 | docs/contracts/adapter-contract.md:432 | cautilus-eval | ready-to-verify | heuristic | unknown | point review prompts at the same path so human and machine review can refer to the same compare output |
| claim-docs-contracts-adapter-contract-md-478 | docs/contracts/adapter-contract.md:478 | cautilus-eval | ready-to-verify | heuristic | unknown | Each review prompt should point at human-visible failure: |
| claim-docs-contracts-review-packet-md-3 | docs/contracts/review-packet.md:3 | cautilus-eval | ready-to-verify | heuristic | unknown | `Cautilus` should keep review prompts, schemas, compare questions, and report artifacts on one durable boundary before executor variants run. |

### agent-design-scenario

Decompose the behavior into a concrete scenario before protected eval planning.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-179 | README.md:179 | cautilus-eval | needs-scenario | heuristic | unknown | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-master-plan-md-88 | docs/master-plan.md:88 | cautilus-eval | needs-scenario | heuristic | unknown | Their public command namespace is `eval live`; the `workbench` name is reserved for a possible future GUI where operators can browse and edit claims, scenarios, and evidence. |
| claim-docs-specs-user-evaluation-spec-md-12 | docs/specs/user/evaluation.spec.md:12 | cautilus-eval | needs-scenario | agent-reviewed | unknown | Cautilus supports app-facing behavior, such as prompt, chat, and service-response behavior. |
| claim-docs-contracts-claim-discovery-workflow-md-262 | docs/contracts/claim-discovery-workflow.md:262 | cautilus-eval | needs-scenario | heuristic | unknown | Historical observation and provider-caveat statements can inform future scenarios, but they should stay `human-auditable` and `blocked` until promoted into a concrete regression claim. |
| claim-docs-contracts-claim-discovery-workflow-md-688 | docs/contracts/claim-discovery-workflow.md:688 | cautilus-eval | needs-scenario | heuristic | unknown | `claim show` emits `cautilus.claim_status_summary.v1` and can include bounded `sampleClaims` plus `gitState` for agents that need concrete candidates before choosing the next branch. |

### human-align-surfaces

Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-docs-cli-reference-md-180 | docs/cli-reference.md:180 | human-auditable | needs-alignment | agent-reviewed | unknown | The product owns the packet boundary and status semantics. |
| claim-docs-cli-reference-md-186 | docs/cli-reference.md:186 | human-auditable | needs-alignment | agent-reviewed | unknown | That keeps persona prompt shaping and result semantics product-owned while backend selection stays adapter-owned. |
| claim-docs-contracts-adapter-contract-md-407 | docs/contracts/adapter-contract.md:407 | human-auditable | needs-alignment | heuristic | unknown | This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file. |
| claim-docs-guides-consumer-adoption-md-29 | docs/guides/consumer-adoption.md:29 | human-auditable | needs-alignment | agent-reviewed | unknown | `Cautilus` only owns the generic workflow contract, CLI, and normalization helpers. |
| claim-docs-guides-consumer-adoption-md-83 | docs/guides/consumer-adoption.md:83 | human-auditable | needs-alignment | agent-reviewed | unknown | It should answer "what is the default `Cautilus` evaluation for this repo?" without forcing the operator to mentally sort multiple unrelated workflows. |

### human-confirm-or-decompose

Confirm, decompose, or accept a human-auditable claim before treating it as proven.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-75 | README.md:75 | human-auditable | ready-to-verify | heuristic | unknown | Raw `claim discover` packets remain the source-ref-backed proof-planning input, not the primary document a user should review. |
| claim-docs-contracts-adapter-contract-md-426 | docs/contracts/adapter-contract.md:426 | human-auditable | ready-to-verify | heuristic | unknown | A named adapter whose eval-test commands produce rich scenario-by-scenario signals should also persist them as files so executor variants and human reviewers can ground their verdicts on the same numbers. |
| claim-docs-contracts-claim-discovery-workflow-md-92 | docs/contracts/claim-discovery-workflow.md:92 | human-auditable | ready-to-verify | heuristic | unknown | In other repos, the same rule should be driven by the repo's adapter, README, and source docs rather than by Cautilus-specific command names. |
| claim-docs-contracts-claim-discovery-workflow-md-182 | docs/contracts/claim-discovery-workflow.md:182 | human-auditable | ready-to-verify | heuristic | unknown | That selected map should drive status summaries and inspect/refresh branch commands, while `state_path` remains the default output path for first discovery. |
| claim-docs-contracts-claim-discovery-workflow-md-255 | docs/contracts/claim-discovery-workflow.md:255 | human-auditable | ready-to-verify | heuristic | unknown | The claim should remain visible in the packet, but it should not become a fixture plan by default because one passing fixture would overclaim the umbrella promise. |

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
| .cautilus/claims/review-result-adapter-gate-split-2026-05-03.json | - | - | 1 | 1 | 0 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-agent-plan-cautilus-eval-2026-05-04.json | parallel-agent-review | - | 3 | 5 | 2 | deterministic: 4, human-auditable: 1 | needs-alignment: 4, ready-to-verify: 1 |
| .cautilus/claims/review-result-agent-status-safe-branch-catalog-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-canonical-spec-curation-flow-2026-05-03.json | - | - | 1 | 1 | 0 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-claim-discovery-routing-flow-2026-05-04.json | evidence-application | codex-dev-skill-routing-dogfood-proof | 1 | 1 | 0 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-claim-packet-next-work-grouping-2026-05-03.json | - | - | 1 | 1 | 0 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-current-deterministic-proof-batch-2026-05-03.json | - | - | 1 | 17 | 0 | deterministic: 14, human-auditable: 3 | blocked: 3, needs-alignment: 1, ready-to-verify: 13 |
| .cautilus/claims/review-result-current-dev-skill-dogfood-2026-05-03.json | - | - | 1 | 4 | 1 | cautilus-eval: 4 | ready-to-verify: 4 |
| .cautilus/claims/review-result-current-eval-surfaces-2026-05-03.json | - | - | 1 | 4 | 0 | cautilus-eval: 3, human-auditable: 1 | ready-to-verify: 4 |
| .cautilus/claims/review-result-deterministic-gates-2026-05-01.json | - | - | 1 | 2 | 2 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-deterministic-proof-batch-2026-05-04.json | - | - | 1 | 4 | 1 | deterministic: 4 | ready-to-verify: 4 |
| .cautilus/claims/review-result-deterministic-ready-heuristic-2026-05-03.json | - | - | 9 | 24 | 12 | deterministic: 18, human-auditable: 6 | blocked: 6, ready-to-verify: 18 |
| .cautilus/claims/review-result-dev-skill-branch-proof-2026-05-04.json | evidence-application | codex-dev-skill-dogfood-proof | 1 | 1 | 0 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-eval-bucket-user-a-2026-05-03.json | - | - | 0 | 0 | 4 | - | - |
| .cautilus/claims/review-result-eval-bucket-user-b-2026-05-03.json | - | - | 2 | 2 | 3 | cautilus-eval: 2 | needs-scenario: 2 |
| .cautilus/claims/review-result-eval-bucket-user-c-2026-05-03.json | - | - | 0 | 0 | 4 | - | - |
| .cautilus/claims/review-result-eval-heuristic-batch-2026-05-03.json | - | - | 1 | 6 | 8 | cautilus-eval: 1, deterministic: 1, human-auditable: 4 | blocked: 3, needs-alignment: 1, ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-active-run-and-claim-discover-2026-05-03.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-to-verify: 3 |
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
| .cautilus/claims/review-result-evidence-refresh-plan-state-transition-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-evidence-review-summary-telemetry-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-review-variants-status-and-output-text-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-reviewable-proof-debt-reports-2026-05-03.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-to-verify: 3 |
| .cautilus/claims/review-result-evidence-runner-readiness-branch-shape-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-runner-readiness-schema-fields-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-scenario-catalog-example-cli-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-scenario-review-attention-linkage-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-self-dogfood-html-renderers-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-specdown-prerequisite-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-final-deterministic-proof-debt-2026-05-03.json | - | - | 1 | 4 | 0 | deterministic: 4 | ready-to-verify: 4 |
| .cautilus/claims/review-result-hitl-audience-2026-05-02.json | hitl-decision-cards | human-maintainer | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-hitl-claim-review-boundary-2026-05-02.json | hitl-decision-cards | human-maintainer | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-hitl-evidence-backed-human-review-2026-05-02.json | hitl-decision-cards | human-maintainer | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-hitl-priority-reset-2026-05-03.json | hitl-decision-cards | human-maintainer | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-human-align-action-bucket.json | action-bucket-focused-review | codex-current-agent | 3 | 4 | 3 | human-auditable: 4 | needs-alignment: 4 |
| .cautilus/claims/review-result-human-confirm-action-bucket.json | action-bucket-focused-review | codex-current-agent | 0 | 0 | 7 | - | - |
| .cautilus/claims/review-result-llm-batch1.json | - | - | 0 | 0 | 3 | - | - |
| .cautilus/claims/review-result-llm-batch3.json | - | - | 1 | 1 | 3 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-llm-batch4.json | - | - | 5 | 5 | 0 | deterministic: 2, human-auditable: 3 | blocked: 2, needs-alignment: 1, ready-to-verify: 2 |
| .cautilus/claims/review-result-llm-batch5.json | - | - | 6 | 12 | 0 | deterministic: 10, human-auditable: 2 | needs-alignment: 2, ready-to-verify: 10 |
| .cautilus/claims/review-result-llm-batch6.json | - | - | 3 | 9 | 8 | human-auditable: 9 | blocked: 5, needs-alignment: 4 |
| .cautilus/claims/review-result-loop1-lane-a.json | - | codex | 0 | 0 | 2 | - | - |
| .cautilus/claims/review-result-loop2-lane-a.json | - | codex | 0 | 0 | 4 | - | - |
| .cautilus/claims/review-result-loop2-lane-b.json | clusters 3-5 only | codex-lane-b | 0 | 0 | 2 | - | - |
| .cautilus/claims/review-result-optimize-held-out-route-2026-05-03.json | - | - | 1 | 2 | 0 | cautilus-eval: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-policy-claim-reclassification-2026-05-03.json | - | - | 1 | 2 | 0 | human-auditable: 2 | blocked: 2 |
| .cautilus/claims/review-result-positioning-boundary.json | - | - | 1 | 1 | 0 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-readme-scenario-next-step-reclassification-2026-05-03.json | - | - | 1 | 1 | 0 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-remaining-deterministic-claims-2026-05-03.json | - | - | 4 | 11 | 1 | deterministic: 9, human-auditable: 2 | blocked: 1, needs-alignment: 1, ready-to-verify: 9 |
| .cautilus/claims/review-result-remaining-deterministic-proof-2026-05-04.json | - | - | 1 | 2 | 1 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-reviewable-artifacts-proof-gap-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-workbench-instance-catalog-contract-2026-05-03.json | - | - | 1 | 2 | 1 | deterministic: 2 | ready-to-verify: 2 |

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

Latest refresh summary: The saved claim map already matches the current checkout; no refresh work is needed before review or eval planning.
Latest refresh plan is historical for this status packet; its next actions are not the current review queue.

## Discovery Boundary

- Entries: README.md, AGENTS.md, CLAUDE.md
- Traversal: entry-markdown-links; linked Markdown depth: 3
- Gitignore policy: respect-repo-gitignore
- Explicit sources: no
- Excludes: .git/**, node_modules/**, dist/**, coverage/**, artifacts/**, charness-artifacts/**, docs/specs/old/**, docs/claims/**, ...

