# Cautilus Claim Status Report

This is a human-readable projection over the current claim packet, status summary, review results, validation reports, and eval plans.
Use the JSON packets as the audit source; use this report to decide what to inspect or do next.

## Packet

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Status packet: .cautilus/claims/status-summary.json
- Candidate count: 264
- Source count: 23
- Claims git commit: f08b2383a66bdd72e636c8a4f1c1658fc2385520
- Git state: fresh-with-head-drift; stale=no
- Git recommendation: The current HEAD differs from the packet commit, but no recorded claim source changed; review and eval planning may continue.

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 16, unknown: 248 |
| Review | agent-reviewed: 77, heuristic: 184, human-reviewed: 3 |
| Recommended proof | cautilus-eval: 103, deterministic: 112, human-auditable: 49 |
| Verification readiness | blocked: 13, needs-alignment: 24, needs-scenario: 7, ready-to-verify: 220 |
| Audience | developer: 195, user: 69 |

Review readiness: heuristicClaimsReadyForReview: 166, needsAlignment: 24, needsScenario: 7.

## Next Work

- Human review is still meaningful for human-align-surfaces=24, human-confirm-or-decompose=12, split-or-defer=13.
- Agent next proof work: connect deterministic gates for 97 claim(s), starting with agent-reviewed items before heuristic items.
- Agent eval work: plan Cautilus eval scenarios for 95 claim(s), after reviewing heuristic labels where needed.
- Scenario design work remains for 7 claim(s).

## Action Buckets

| Bucket | Actor | Count | Review | Evidence | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 16 | agent-reviewed: 16 | satisfied: 16 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 97 | agent-reviewed: 32, heuristic: 63, human-reviewed: 2 | unknown: 97 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 95 | agent-reviewed: 5, heuristic: 90 | unknown: 95 | Draft or select Cautilus eval scenarios for ready eval claims. |
| agent-design-scenario | agent | 7 | agent-reviewed: 1, heuristic: 6 | unknown: 7 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 24 | agent-reviewed: 12, heuristic: 12 | unknown: 24 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 12 | heuristic: 11, human-reviewed: 1 | unknown: 12 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 13 | agent-reviewed: 11, heuristic: 2 | unknown: 13 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

Cross-cutting signal: heuristic-review-needed (184) - Review heuristic labels before spending proof or eval budget.

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
| claim-readme-md-123 | README.md:123 | cautilus-eval | ready-to-verify | agent-reviewed | unknown | For reviewed `cautilus-eval` claims, `claim plan-evals` emits `cautilus.claim_eval_plan.v1`: an intermediate plan for host-owned eval fixtures, not a writer for prompts, runners, fixtures, or policy. |
| claim-readme-md-144 | README.md:144 | cautilus-eval | ready-to-verify | agent-reviewed | unknown | Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing. |
| claim-readme-md-148 | README.md:148 | cautilus-eval | ready-to-verify | agent-reviewed | unknown | The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`; Cautilus's own first-scan, refresh-flow, review-prepare, reviewer-launch, and review-to-eval dogfood fixtures derive their results from audit packets. |
| claim-readme-md-211 | README.md:211 | cautilus-eval | ready-to-verify | agent-reviewed | unknown | Agent track — Claude / Codex plugin.** The `cautilus install` step also lands a bundled skill at `.agents/skills/cautilus/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally. |

### agent-design-scenario

Decompose the behavior into a concrete scenario before protected eval planning.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-171 | README.md:171 | cautilus-eval | needs-scenario | agent-reviewed | unknown | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-master-plan-md-88 | docs/master-plan.md:88 | cautilus-eval | needs-scenario | heuristic | unknown | Their public command namespace is `eval live`; the `workbench` name is reserved for a possible future GUI where operators can browse and edit claims, scenarios, and evidence. |
| claim-docs-contracts-claim-discovery-workflow-md-232 | docs/contracts/claim-discovery-workflow.md:232 | cautilus-eval | needs-scenario | heuristic | unknown | Historical observation and provider-caveat statements can inform future scenarios, but they should stay `human-auditable` and `blocked` until promoted into a concrete regression claim. |
| claim-docs-contracts-claim-discovery-workflow-md-652 | docs/contracts/claim-discovery-workflow.md:652 | cautilus-eval | needs-scenario | heuristic | unknown | `claim show` emits `cautilus.claim_status_summary.v1` and can include bounded `sampleClaims` plus `gitState` for agents that need concrete candidates before choosing the next branch. |
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
| claim-docs-contracts-claim-discovery-workflow-md-156 | docs/contracts/claim-discovery-workflow.md:156 | human-auditable | ready-to-verify | heuristic | unknown | That selected map should drive status summaries and inspect/refresh branch commands, while `state_path` remains the default output path for first discovery. |
| claim-docs-contracts-claim-discovery-workflow-md-225 | docs/contracts/claim-discovery-workflow.md:225 | human-auditable | ready-to-verify | heuristic | unknown | The claim should remain visible in the packet, but it should not become a fixture plan by default because one passing fixture would overclaim the umbrella promise. |
| claim-docs-contracts-claim-discovery-workflow-md-291 | docs/contracts/claim-discovery-workflow.md:291 | human-auditable | ready-to-verify | heuristic | unknown | `verificationReadiness=ready-to-verify` with `evidenceStatus=missing` means proof is absent but a test, fixture, or human-auditable check can now be created or run. |
| claim-docs-contracts-claim-discovery-workflow-md-297 | docs/contracts/claim-discovery-workflow.md:297 | human-auditable | ready-to-verify | heuristic | unknown | `evidenceRefs[]` should use a minimum inspectable shape: |
| claim-docs-contracts-claim-discovery-workflow-md-520 | docs/contracts/claim-discovery-workflow.md:520 | human-auditable | ready-to-verify | heuristic | unknown | Depth 3 must be paired with visible source, candidate, cluster, and review-budget bounds. |

### split-or-defer

Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-26 | AGENTS.md:26 | human-auditable | blocked | agent-reviewed | unknown | `Cautilus` owns generic intentful behavior evaluation workflow contracts. |
| claim-agents-md-29 | AGENTS.md:29 | human-auditable | blocked | agent-reviewed | unknown | The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better. |
| claim-agents-md-73 | AGENTS.md:73 | human-auditable | blocked | agent-reviewed | unknown | While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes. |
| claim-readme-md-3 | README.md:3 | human-auditable | blocked | agent-reviewed | unknown | `Cautilus` keeps agent and workflow behavior honest while prompts keep changing. |
| claim-readme-md-153 | README.md:153 | human-auditable | blocked | agent-reviewed | unknown | Use when a stateful automation — a CLI workflow, long-running agent session, or pipeline that persists state across invocations — keeps stalling on the same step. |

## Review Results

| Packet | Mode | Reviewer | Clusters | Updates | Proof | Readiness |
| --- | --- | --- | --- | --- | --- | --- |
| .cautilus/claims/review-result-deterministic-gates-2026-05-01.json | - | - | 1 | 6 | deterministic: 6 | ready-to-verify: 6 |
| .cautilus/claims/review-result-evidence-claim-eval-plan-2026-05-01.json | - | - | 1 | 1 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-dev-skill-dogfood.json | - | - | 1 | 1 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-dev-skill-routing-install.json | - | - | 1 | 2 | cautilus-eval: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-review-to-eval-flow.json | direct-evidence-application | codex-current-agent-evidence-review | 1 | 1 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-hitl-audience-2026-05-02.json | hitl-decision-cards | human-maintainer | 2 | 3 | deterministic: 2, human-auditable: 1 | ready-to-verify: 3 |
| .cautilus/claims/review-result-human-align-action-bucket.json | action-bucket-focused-review | codex-current-agent | 3 | 7 | deterministic: 3, human-auditable: 4 | needs-alignment: 4, ready-to-verify: 3 |
| .cautilus/claims/review-result-human-confirm-action-bucket.json | action-bucket-focused-review | codex-current-agent | 3 | 9 | deterministic: 9 | ready-to-verify: 9 |
| .cautilus/claims/review-result-llm-batch1.json | - | - | 4 | 8 | deterministic: 6, human-auditable: 2 | blocked: 1, needs-scenario: 2, ready-to-verify: 5 |
| .cautilus/claims/review-result-llm-batch3.json | - | - | 6 | 7 | cautilus-eval: 3, deterministic: 2, human-auditable: 2 | blocked: 2, needs-scenario: 1, ready-to-verify: 4 |
| .cautilus/claims/review-result-llm-batch4.json | - | - | 5 | 5 | deterministic: 2, human-auditable: 3 | blocked: 2, needs-alignment: 1, ready-to-verify: 2 |
| .cautilus/claims/review-result-llm-batch5.json | - | - | 7 | 14 | deterministic: 11, human-auditable: 3 | needs-alignment: 3, ready-to-verify: 11 |
| .cautilus/claims/review-result-llm-batch6.json | - | - | 7 | 17 | deterministic: 8, human-auditable: 9 | blocked: 5, needs-alignment: 4, ready-to-verify: 8 |
| .cautilus/claims/review-result-loop1-lane-a.json | - | codex | 4 | 7 | cautilus-eval: 1, deterministic: 6 | ready-to-verify: 7 |
| .cautilus/claims/review-result-loop1-lane-b.json | clusters 4-7 only | codex-lane-b | 4 | 5 | cautilus-eval: 3, deterministic: 2 | needs-scenario: 1, ready-to-verify: 4 |
| .cautilus/claims/review-result-loop2-lane-a.json | - | codex | 3 | 7 | cautilus-eval: 1, deterministic: 5, human-auditable: 1 | blocked: 1, ready-to-verify: 6 |
| .cautilus/claims/review-result-loop2-lane-b.json | clusters 3-5 only | codex-lane-b | 3 | 6 | cautilus-eval: 3, deterministic: 3 | ready-to-verify: 6 |
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
| claim-docs-contracts-claim-discovery-workflow-md-153 | deterministic | ready-to-verify | unknown | Add or connect deterministic agent-status tests proving the selected related claim map drives status summaries and inspect/refresh branch commands while `state_path` remains the first-discovery output path. |
| claim-docs-contracts-reporting-md-124 | deterministic | ready-to-verify | unknown | Add or connect deterministic report-summary tests for aggregating numeric telemetry across variants. |
| claim-docs-contracts-runner-readiness-md-134 | deterministic | ready-to-verify | unknown | Add or connect deterministic runner-readiness branch-shape tests for stable id, human label, blocking reason, command/artifact, owning surface, and write flag. |

### .cautilus/claims/review-result-evidence-review-to-eval-flow.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-contracts-claim-discovery-workflow-md-656 | cautilus-eval | ready-to-verify | satisfied | No new fixture is needed for this claim while the referenced review-to-eval evidence bundle remains current. |

### .cautilus/claims/review-result-deterministic-gates-2026-05-01.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-readme-md-7 | deterministic | ready-to-verify | satisfied | Keep covered by consumer:onboard:smoke and install smoke when install, starter, or adapter bootstrap behavior changes. |
| claim-readme-md-10 | deterministic | ready-to-verify | satisfied | Rerun install and consumer onboarding smoke when binary provenance or installed skill materialization changes. |
| claim-readme-md-137 | deterministic | ready-to-verify | satisfied | Keep covered by consumer:starters:smoke when chatbot proposal input shape or starter docs change. |
| claim-readme-md-159 | deterministic | ready-to-verify | satisfied | Keep covered by scenario catalog JSON tests and `cautilus scenarios --json` smoke. |
| claim-docs-master-plan-md-56 | deterministic | ready-to-verify | satisfied | Keep covered by verify, workflow-file review, consumer:onboard:smoke, and release install smoke. |
| claim-docs-master-plan-md-82 | deterministic | ready-to-verify | satisfied | Keep covered by lint:specs and lint:scenario-normalizers whenever scenario-normalization vocabulary changes. |

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
| .cautilus/claims/eval-plan-evidenced-typed-runners.json | 5 | 259 | already-satisfied: 1, not-cautilus-eval: 161, not-ready-to-verify: 7, not-reviewed: 90 | - |
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
| .cautilus/claims/refresh-plan-after-frontmatter-heuristics.json | changes-detected | 1 | 63 | 263 |
| .cautilus/claims/refresh-plan-after-hitl-audience.json | changes-detected | 1 | 69 | 195 |
| .cautilus/claims/refresh-plan-after-provider-caveat-heuristics.json | changes-detected | 1 | 65 | 266 |
| .cautilus/claims/refresh-plan-after-review-input-skip.json | changes-detected | 3 | 94 | 230 |
| .cautilus/claims/refresh-plan-after-routing-heuristics.json | changes-detected | 2 | 62 | 263 |
| .cautilus/claims/refresh-plan-after-source-boundary.json | up-to-date | 0 | 0 | 264 |
| .cautilus/claims/refresh-plan-agent-status-selected-state.json | changes-detected | 2 | 77 | 259 |
| .cautilus/claims/refresh-plan-claim-status-report.json | changes-detected | 1 | 10 | 328 |
| .cautilus/claims/refresh-plan-final.json | changes-detected | 35 | 16 | 284 |
| .cautilus/claims/refresh-plan-skill-action-buckets.json | changes-detected | 1 | 9 | 326 |
| .cautilus/claims/refresh-plan-typed-runners.json | up-to-date | 0 | 0 | 324 |
| .cautilus/claims/refresh-plan.json | changes-detected | 36 | 132 | 160 |

Latest refresh summary: The saved claim map was made from an older checkout; this plan identifies claims whose source files changed and does not update the saved claim map yet.
Latest changed claim sources: docs/contracts/claim-discovery-workflow.md: 69
- Update the saved claim map before review or eval planning: Run claim discovery to write a fresh claim packet, then use claim show to inspect the updated status.
- Inspect which files and claims changed: Use this refresh plan to focus review on changed sources before launching any reviewer or eval workflow.
- Stop after recording the refresh plan: Choose this if the coordinator only wanted to make the stale state explicit for a later session.

## Discovery Boundary

- Entries: README.md, AGENTS.md, CLAUDE.md
- Traversal: entry-markdown-links; linked Markdown depth: 3
- Gitignore policy: respect-repo-gitignore
- Explicit sources: no
- Excludes: .git/**, node_modules/**, dist/**, coverage/**, artifacts/**, charness-artifacts/**, docs/specs/**, docs/maintainers/**, ...

