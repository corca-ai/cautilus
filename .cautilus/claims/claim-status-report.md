# Cautilus Claim Status Report

This is a human-readable projection over the current claim packet, status summary, review results, validation reports, and eval plans.
Use the JSON packets as the audit source; use this report to decide what to inspect or do next.

## Packet

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Status packet: .cautilus/claims/status-summary.json
- Candidate count: 311
- Source count: 40
- Packet source commit: 74b40f9016dfc9926d85fbd9d05a816c45be2dd5
- Snapshot notice: gitState is computed when this status packet is generated; rerun claim show for live checkout state.
- Git state snapshot: fresh; stale=no
- Snapshot recommendation: The claim packet commit matches the inspected checkout.

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 14, unknown: 297 |
| Review | agent-reviewed: 61, heuristic: 247, human-reviewed: 3 |
| Recommended proof | cautilus-eval: 123, deterministic: 124, human-auditable: 64 |
| Verification readiness | blocked: 13, needs-alignment: 28, needs-scenario: 8, ready-to-verify: 262 |
| Audience | developer: 229, user: 82 |

Review readiness: heuristicClaimsReadyForReview: 222, needsAlignment: 28, needsScenario: 8.

## Canonical Claim Map

- Map packet: .cautilus/claims/canonical-claim-map.json
- Input status: current
- User raw claims: 82
- User claims mapped to U1-U7: 82
- User claims not mapped to U1-U7: 0
- User mappings recommended for semantic sampling: 58
- Maintainer claims mapped to M1-M7: M1: 29, M2: 89, M3: 72, M4: 12, M5: 7, M6: 9, M7: 11
- All raw claims by disposition: mapped-to-maintainer-canonical: 229, mapped-to-user-canonical: 82
- Mapping confidence: high: 48, low: 73, medium: 190

| User claim | Title | Raw claims | Evidence | Review |
| --- | --- | --- | --- | --- |
| U1 | Claim Discovery | 24 | satisfied: 2, unknown: 22 | agent-reviewed: 13, heuristic: 10, human-reviewed: 1 |
| U2 | Evaluation | 29 | satisfied: 3, unknown: 26 | agent-reviewed: 15, heuristic: 14 |
| U3 | Optimization | 4 | unknown: 4 | heuristic: 4 |
| U4 | Doctor And Readiness | 7 | satisfied: 2, unknown: 5 | agent-reviewed: 4, heuristic: 3 |
| U5 | Product And Host Ownership | 8 | satisfied: 2, unknown: 6 | agent-reviewed: 4, heuristic: 4 |
| U6 | Reviewable Artifacts | 4 | unknown: 4 | heuristic: 4 |
| U7 | Proof Debt | 6 | unknown: 6 | agent-reviewed: 1, heuristic: 5 |

| Maintainer claim | Title | Raw claims | Proof | Evidence | Review |
| --- | --- | --- | --- | --- | --- |
| M1 | Claim Discovery Workflow | 29 | cautilus-eval: 3, deterministic: 15, human-auditable: 11 | satisfied: 1, unknown: 28 | agent-reviewed: 1, heuristic: 28 |
| M2 | Binary And Skill Boundary | 89 | cautilus-eval: 41, deterministic: 42, human-auditable: 6 | satisfied: 4, unknown: 85 | agent-reviewed: 6, heuristic: 83 |
| M3 | Adapter And Host Ownership | 72 | cautilus-eval: 40, deterministic: 17, human-auditable: 15 | unknown: 72 | agent-reviewed: 10, heuristic: 61, human-reviewed: 1 |
| M4 | Evaluation Surfaces And Runners | 12 | cautilus-eval: 10, deterministic: 1, human-auditable: 1 | unknown: 12 | agent-reviewed: 2, heuristic: 10 |
| M5 | Evidence State And Review Artifacts | 7 | deterministic: 3, human-auditable: 4 | unknown: 7 | agent-reviewed: 2, heuristic: 5 |
| M6 | Optimization Loop | 9 | cautilus-eval: 5, deterministic: 3, human-auditable: 1 | unknown: 9 | heuristic: 9 |
| M7 | Readiness And Runtime Status | 11 | cautilus-eval: 2, deterministic: 5, human-auditable: 4 | unknown: 11 | agent-reviewed: 3, heuristic: 7, human-reviewed: 1 |

Maintainer semantic sampling queue:

| Maintainer claim | Title | Sample raw claims |
| --- | --- | --- |
| M1 | Claim Discovery Workflow | claim-docs-contracts-adapter-contract-md-472 (low), claim-docs-contracts-adapter-contract-md-535 (low), claim-docs-gepa-md-15 (medium), claim-docs-master-plan-md-76 (medium) |
| M2 | Binary And Skill Boundary | claim-agents-md-61 (medium), claim-agents-md-123 (low), claim-docs-contracts-adapter-contract-md-218 (medium), claim-docs-contracts-adapter-contract-md-276 (medium) |
| M3 | Adapter And Host Ownership | claim-agents-md-26 (low), claim-docs-contracts-adapter-contract-md-3 (medium), claim-docs-contracts-adapter-contract-md-208 (medium), claim-docs-contracts-adapter-contract-md-220 (medium) |
| M4 | Evaluation Surfaces And Runners | claim-agents-md-12 (low), claim-agents-md-29 (medium), claim-docs-contracts-claim-discovery-workflow-md-520 (medium), claim-docs-contracts-runner-readiness-md-45 (medium) |
| M5 | Evidence State And Review Artifacts | claim-agents-md-73 (low), claim-docs-contracts-active-run-md-212 (medium), claim-docs-contracts-claim-discovery-workflow-md-181 (medium), claim-docs-contracts-claim-discovery-workflow-md-325 (medium) |
| M6 | Optimization Loop | claim-docs-contracts-reporting-md-150 (low), claim-docs-contracts-runner-readiness-md-37 (medium), claim-docs-contracts-runner-readiness-md-147 (medium), claim-docs-contracts-scenario-history-md-3 (low) |
| M7 | Readiness And Runtime Status | claim-agents-md-79 (medium), claim-docs-contracts-claim-discovery-workflow-md-96 (medium), claim-docs-contracts-claim-discovery-workflow-md-320 (medium), claim-docs-contracts-live-run-invocation-md-12 (medium) |

Semantic sampling recommended for 263 raw claim(s): claim-agents-md-12, claim-agents-md-26, claim-agents-md-29, claim-agents-md-61, claim-agents-md-73, claim-agents-md-79, claim-agents-md-123, claim-readme-md-3, ...

## Next Work

- Human review is still meaningful for human-align-surfaces=28, human-confirm-or-decompose=23, split-or-defer=13.
- Agent next proof work: connect deterministic gates for 110 claim(s), starting with agent-reviewed items before heuristic items.
- Agent eval work: plan Cautilus eval scenarios for 115 claim(s), after reviewing heuristic labels where needed.
- Scenario design work remains for 8 claim(s).

## Action Buckets

| Bucket | Actor | Count | Review | Evidence | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 14 | agent-reviewed: 14 | satisfied: 14 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 110 | agent-reviewed: 25, heuristic: 82, human-reviewed: 3 | unknown: 110 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 115 | agent-reviewed: 2, heuristic: 113 | unknown: 115 | Draft or select Cautilus eval scenarios for ready eval claims. |
| agent-design-scenario | agent | 8 | heuristic: 8 | unknown: 8 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 28 | agent-reviewed: 11, heuristic: 17 | unknown: 28 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 23 | heuristic: 23 | unknown: 23 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 13 | agent-reviewed: 9, heuristic: 4 | unknown: 13 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

Cross-cutting signal: heuristic-review-needed (247) - Review heuristic labels before spending proof or eval budget.

### agent-add-deterministic-proof

Add or connect unit, lint, build, schema, spec, or CI proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-12 | AGENTS.md:12 | deterministic | ready-to-verify | agent-reviewed | unknown | Deterministic behavior belongs in code, scripts, adapters, tests, and specs. |
| claim-agents-md-61 | AGENTS.md:61 | deterministic | ready-to-verify | agent-reviewed | unknown | Keep this block short. Detailed routing belongs in installed skill metadata and `find-skills` output, not in a long checked-in catalog. |
| claim-readme-md-7 | README.md:7 | deterministic | ready-to-verify | agent-reviewed | unknown | Ships as a standalone binary plus a bundled skill a host repo can install without copying another scaffold first. |
| claim-readme-md-9 | README.md:9 | deterministic | ready-to-verify | agent-reviewed | unknown | Commands should emit durable packets with enough state for the next agent to resume, not only terminal prose for a human operator. |
| claim-readme-md-10 | README.md:10 | deterministic | ready-to-verify | agent-reviewed | unknown | `Cautilus` installs as a machine-level binary, but its agent-facing surface is intentionally repo-local. |

### agent-plan-cautilus-eval

Draft or select Cautilus eval scenarios for ready eval claims.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-79 | AGENTS.md:79 | cautilus-eval | ready-to-verify | agent-reviewed | unknown | When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available. |
| claim-readme-md-129 | README.md:129 | cautilus-eval | ready-to-verify | heuristic | unknown | For reviewed `cautilus-eval` claims, `claim plan-evals` emits `cautilus.claim_eval_plan.v1`: an intermediate plan for host-owned eval fixtures, not a writer for prompts, runners, fixtures, or policy. |
| claim-readme-md-144 | README.md:144 | cautilus-eval | ready-to-verify | agent-reviewed | unknown | CLI: `cautilus scenario normalize chatbot --input logs.json` For agent: "Run a chatbot regression with these logs and my new system prompt." You get reopenable `proposals.json` candidates that can be kept out of tuning as protected checks. |
| claim-readme-md-151 | README.md:151 | cautilus-eval | ready-to-verify | heuristic | unknown | Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing. |
| claim-readme-md-155 | README.md:155 | cautilus-eval | ready-to-verify | heuristic | unknown | The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`; Cautilus's own first-scan, refresh-flow, review-prepare, reviewer-launch, and review-to-eval dogfood fixtures derive their results from audit packets. |

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
| claim-docs-guides-consumer-adoption-md-29 | docs/guides/consumer-adoption.md:29 | human-auditable | needs-alignment | agent-reviewed | unknown | `Cautilus` only owns the generic workflow contract, CLI, and normalization helpers. |
| claim-docs-guides-consumer-adoption-md-83 | docs/guides/consumer-adoption.md:83 | human-auditable | needs-alignment | agent-reviewed | unknown | It should answer "what is the default `Cautilus` evaluation for this repo?" without forcing the operator to mentally sort multiple unrelated workflows. |
| claim-docs-guides-consumer-adoption-md-106 | docs/guides/consumer-adoption.md:106 | human-auditable | needs-alignment | agent-reviewed | unknown | The product owns the behavior-surface vocabulary in `cautilus.behavior_intent.v1`. |

### human-confirm-or-decompose

Confirm, decompose, or accept a human-auditable claim before treating it as proven.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-75 | README.md:75 | human-auditable | ready-to-verify | heuristic | unknown | Raw `claim discover` packets remain the source-ref-backed proof-planning input, not the primary document a user should review. |
| claim-docs-specs-user-index-spec-md-24 | docs/specs/user/index.spec.md:24 | human-auditable | ready-to-verify | heuristic | unknown | Cautilus requires specdown for public executable claim documentation. |
| claim-docs-specs-user-reviewable-artifacts-spec-md-13 | docs/specs/user/reviewable-artifacts.spec.md:13 | human-auditable | ready-to-verify | heuristic | unknown | Report views should make stale, blocked, or missing evidence visible. |
| claim-docs-contracts-claim-discovery-workflow-md-92 | docs/contracts/claim-discovery-workflow.md:92 | human-auditable | ready-to-verify | heuristic | unknown | In other repos, the same rule should be driven by the repo's adapter, README, and source docs rather than by Cautilus-specific command names. |
| claim-docs-contracts-claim-discovery-workflow-md-181 | docs/contracts/claim-discovery-workflow.md:181 | human-auditable | ready-to-verify | heuristic | unknown | That selected map should drive status summaries and inspect/refresh branch commands, while `state_path` remains the default output path for first discovery. |

### split-or-defer

Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-26 | AGENTS.md:26 | human-auditable | blocked | agent-reviewed | unknown | `Cautilus` owns generic intentful behavior evaluation workflow contracts. |
| claim-agents-md-29 | AGENTS.md:29 | human-auditable | blocked | agent-reviewed | unknown | The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better. |
| claim-agents-md-73 | AGENTS.md:73 | human-auditable | blocked | agent-reviewed | unknown | While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes. |
| claim-readme-md-3 | README.md:3 | human-auditable | blocked | agent-reviewed | unknown | `Cautilus` keeps agent and workflow behavior honest while prompts keep changing. |
| claim-readme-md-160 | README.md:160 | human-auditable | blocked | heuristic | unknown | Use when a stateful automation — a CLI workflow, long-running agent session, or pipeline that persists state across invocations — keeps stalling on the same step. |

## Review Results

| Packet | Mode | Reviewer | Clusters | Updates | Proof | Readiness |
| --- | --- | --- | --- | --- | --- | --- |
| .cautilus/claims/review-result-deterministic-gates-2026-05-01.json | - | - | 1 | 4 | deterministic: 4 | ready-to-verify: 4 |
| .cautilus/claims/review-result-evidence-dev-skill-routing-install.json | - | - | 1 | 1 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-hitl-audience-2026-05-02.json | hitl-decision-cards | human-maintainer | 1 | 1 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-hitl-claim-review-boundary-2026-05-02.json | hitl-decision-cards | human-maintainer | 1 | 1 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-hitl-priority-reset-2026-05-03.json | hitl-decision-cards | human-maintainer | 1 | 1 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-human-align-action-bucket.json | action-bucket-focused-review | codex-current-agent | 3 | 7 | deterministic: 3, human-auditable: 4 | needs-alignment: 4, ready-to-verify: 3 |
| .cautilus/claims/review-result-human-confirm-action-bucket.json | action-bucket-focused-review | codex-current-agent | 3 | 8 | deterministic: 8 | ready-to-verify: 8 |
| .cautilus/claims/review-result-llm-batch1.json | - | - | 3 | 3 | deterministic: 2, human-auditable: 1 | blocked: 1, ready-to-verify: 2 |
| .cautilus/claims/review-result-llm-batch3.json | - | - | 4 | 4 | cautilus-eval: 1, deterministic: 2, human-auditable: 1 | blocked: 1, ready-to-verify: 3 |
| .cautilus/claims/review-result-llm-batch4.json | - | - | 5 | 5 | deterministic: 2, human-auditable: 3 | blocked: 2, needs-alignment: 1, ready-to-verify: 2 |
| .cautilus/claims/review-result-llm-batch5.json | - | - | 6 | 12 | deterministic: 10, human-auditable: 2 | needs-alignment: 2, ready-to-verify: 10 |
| .cautilus/claims/review-result-llm-batch6.json | - | - | 7 | 17 | deterministic: 8, human-auditable: 9 | blocked: 5, needs-alignment: 4, ready-to-verify: 8 |
| .cautilus/claims/review-result-loop1-lane-a.json | - | codex | 2 | 2 | deterministic: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-loop2-lane-a.json | - | codex | 3 | 4 | cautilus-eval: 1, deterministic: 3 | ready-to-verify: 4 |
| .cautilus/claims/review-result-loop2-lane-b.json | clusters 3-5 only | codex-lane-b | 2 | 2 | cautilus-eval: 1, deterministic: 1 | ready-to-verify: 2 |
| .cautilus/claims/review-result-positioning-boundary.json | - | - | 1 | 1 | human-auditable: 1 | blocked: 1 |

### .cautilus/claims/review-result-human-align-action-bucket.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-cli-reference-md-180 | human-auditable | needs-alignment | unknown | Human-confirm the packet/status ownership boundary against CLI reference, packet schemas, and implementation before promoting narrower deterministic checks. |
| claim-docs-contracts-active-run-md-3 | deterministic | ready-to-verify | unknown | Add or connect a deterministic active-run test that proves the workspace root is pinned per workflow and reused through the shell environment variable. |
| claim-docs-contracts-live-run-invocation-batch-md-28 | human-auditable | needs-alignment | unknown | Confirm the provider-error ownership boundary against live-run packets and adapter docs; split concrete schema checks if needed. |
| claim-docs-contracts-live-run-invocation-md-12 | deterministic | ready-to-verify | unknown | Add or connect deterministic live-run invocation tests for workspace directory allocation and one-time prepare hook timing. |
| claim-docs-contracts-live-run-invocation-md-160 | human-auditable | needs-alignment | unknown | Human-confirm which workspace contents are product-owned versus consumer-owned, then split any observable no-write guarantees into deterministic tests. |
| claim-docs-contracts-live-run-invocation-md-24 | deterministic | ready-to-verify | unknown | Add or connect deterministic schema/template checks proving workspace lifecycle is not exposed through the public packet shape and flows through adapter placeholders. |
| claim-docs-master-plan-md-29 | human-auditable | needs-alignment | unknown | Human-review the Cautilus-versus-consumer ownership boundary and split executable subclaims into deterministic or eval proof. |

### .cautilus/claims/review-result-human-confirm-action-bucket.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-cli-reference-md-256 | deterministic | ready-to-verify | unknown | Add or connect a deterministic packet test proving `attentionView` is emitted as a bounded human-facing shortlist derived from the ranked set. |
| claim-docs-contracts-runner-readiness-md-118 | deterministic | ready-to-verify | unknown | Add or connect deterministic agent-status tests for initialize-adapter, refresh-claim-state, runner-assessment, runner-smoke, inspect-claims, and run-eval branch exposure. |
| claim-docs-contracts-workbench-instance-discovery-md-100 | deterministic | ready-to-verify | unknown | Add or connect deterministic instance-chooser rendering proof, or defer the claim if the workbench UI remains future work. |
| claim-docs-contracts-workbench-instance-discovery-md-101 | deterministic | ready-to-verify | unknown | Add or connect deterministic tests proving scenario-adjacent paths come from typed packet fields rather than hardcoded route templates. |
| claim-docs-contracts-workbench-instance-discovery-md-25 | deterministic | ready-to-verify | unknown | Add or connect adapter/packet validation for stable `instanceId` and human-facing `displayLabel` fields. |
| claim-docs-contracts-reporting-md-124 | deterministic | ready-to-verify | unknown | Add or connect deterministic report-summary tests for aggregating numeric telemetry across variants. |
| claim-docs-contracts-runner-readiness-md-134 | deterministic | ready-to-verify | unknown | Add or connect deterministic runner-readiness branch-shape tests for stable id, human label, blocking reason, command/artifact, owning surface, and write flag. |
| claim-docs-contracts-runner-readiness-md-349 | deterministic | ready-to-verify | unknown | Add or connect deterministic summary/report tests proving proof class stays visible downstream. |

### .cautilus/claims/review-result-deterministic-gates-2026-05-01.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-readme-md-7 | deterministic | ready-to-verify | satisfied | Keep covered by consumer:onboard:smoke and install smoke when install, starter, or adapter bootstrap behavior changes. |
| claim-readme-md-10 | deterministic | ready-to-verify | satisfied | Rerun install and consumer onboarding smoke when binary provenance or installed skill materialization changes. |
| claim-docs-master-plan-md-56 | deterministic | ready-to-verify | satisfied | Keep covered by verify, workflow-file review, consumer:onboard:smoke, and release install smoke. |
| claim-docs-master-plan-md-82 | deterministic | ready-to-verify | satisfied | Keep covered by lint:specs and lint:scenario-normalizers whenever scenario-normalization vocabulary changes. |

### .cautilus/claims/review-result-positioning-boundary.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-readme-md-3 | human-auditable | blocked | unknown | Keep the claim visible as positioning, or decompose it into concrete deterministic, dev/skill, and packet-surface claims before proof planning. |

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
- Excludes: .git/**, node_modules/**, dist/**, coverage/**, artifacts/**, charness-artifacts/**, docs/specs/old/**, docs/maintainers/**, ...

