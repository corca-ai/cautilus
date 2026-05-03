# Cautilus Claim Status Report

This is a human-readable projection over the current claim packet, status summary, review results, validation reports, and eval plans.
Use the JSON packets as the audit source; use this report to decide what to inspect or do next.

## Packet

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Status packet: .cautilus/claims/status-summary.json
- Candidate count: 310
- Source count: 25
- Claims git commit: cf91bf29b47a9b6a2a439659e283773436e6ec18
- Git state: fresh; stale=no
- Git recommendation: The claim packet commit matches the current checkout.

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 15, unknown: 295 |
| Review | agent-reviewed: 67, heuristic: 237, human-reviewed: 6 |
| Recommended proof | cautilus-eval: 118, deterministic: 126, human-auditable: 66 |
| Verification readiness | blocked: 14, needs-alignment: 30, needs-scenario: 8, ready-to-verify: 258 |
| Audience | developer: 226, user: 84 |

Review readiness: heuristicClaimsReadyForReview: 214, needsAlignment: 30, needsScenario: 8.

## Canonical Claim Map

- Map packet: .cautilus/claims/canonical-claim-map.json
- Input status: current
- User raw claims: 84
- User claims mapped to U1-U9: 84
- User claims not mapped to U1-U9: 0
- User mappings recommended for semantic sampling: 57
- All raw claims by disposition: mapped-to-maintainer-canonical: 226, mapped-to-user-canonical: 84
- Mapping confidence: high: 102, low: 16, medium: 192

| User claim | Title | Raw claims | Evidence | Review |
| --- | --- | --- | --- | --- |
| U1 | Claim: Discover Declared Behavior Promises | 2 | unknown: 2 | heuristic: 2 |
| U2 | Eval: Verify Behavior With Explicit Evidence | 10 | unknown: 10 | agent-reviewed: 3, heuristic: 7 |
| U3 | Optimize: Improve Only After The Proof Surface Is Clear | 2 | unknown: 2 | heuristic: 2 |
| U4 | Doctor: Show Setup And Runner Readiness | 17 | satisfied: 2, unknown: 15 | agent-reviewed: 11, heuristic: 6 |
| U5 | Cautilus Keeps Product And Host Ownership Separate | 25 | satisfied: 6, unknown: 19 | agent-reviewed: 15, heuristic: 9, human-reviewed: 1 |
| U6 | Cautilus Serves Both CLI Operators And Agents | 7 | unknown: 7 | agent-reviewed: 2, heuristic: 5 |
| U7 | Cautilus Produces Reviewable Human And Machine Artifacts | 6 | unknown: 6 | heuristic: 6 |
| U8 | Cautilus Supports Development And App Behavior Surfaces | 11 | satisfied: 1, unknown: 10 | agent-reviewed: 7, heuristic: 4 |
| U9 | Cautilus Makes Proof Debt Visible | 4 | unknown: 4 | heuristic: 4 |

Semantic sampling recommended for 208 raw claim(s): claim-agents-md-12, claim-agents-md-26, claim-agents-md-73, claim-agents-md-78, claim-agents-md-79, claim-agents-md-123, claim-readme-md-3, claim-readme-md-7, ...

## Next Work

- Human review is still meaningful for human-align-surfaces=30, human-confirm-or-decompose=22, split-or-defer=14.
- Agent next proof work: connect deterministic gates for 111 claim(s), starting with agent-reviewed items before heuristic items.
- Agent eval work: plan Cautilus eval scenarios for 110 claim(s), after reviewing heuristic labels where needed.
- Scenario design work remains for 8 claim(s).

## Action Buckets

| Bucket | Actor | Count | Review | Evidence | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 15 | agent-reviewed: 15 | satisfied: 15 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 111 | agent-reviewed: 25, heuristic: 82, human-reviewed: 4 | unknown: 111 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 110 | agent-reviewed: 2, heuristic: 107, human-reviewed: 1 | unknown: 110 | Draft or select Cautilus eval scenarios for ready eval claims. |
| agent-design-scenario | agent | 8 | heuristic: 8 | unknown: 8 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 30 | agent-reviewed: 15, heuristic: 15 | unknown: 30 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 22 | heuristic: 21, human-reviewed: 1 | unknown: 22 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 14 | agent-reviewed: 10, heuristic: 4 | unknown: 14 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

Cross-cutting signal: heuristic-review-needed (237) - Review heuristic labels before spending proof or eval budget.

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
| claim-readme-md-127 | README.md:127 | cautilus-eval | ready-to-verify | heuristic | unknown | For reviewed `cautilus-eval` claims, `claim plan-evals` emits `cautilus.claim_eval_plan.v1`: an intermediate plan for host-owned eval fixtures, not a writer for prompts, runners, fixtures, or policy. |
| claim-readme-md-148 | README.md:148 | cautilus-eval | ready-to-verify | agent-reviewed | unknown | Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing. |
| claim-readme-md-152 | README.md:152 | cautilus-eval | ready-to-verify | heuristic | unknown | The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`; Cautilus's own first-scan, refresh-flow, review-prepare, reviewer-launch, and review-to-eval dogfood fixtures derive their results from audit packets. |
| claim-readme-md-215 | README.md:215 | cautilus-eval | ready-to-verify | heuristic | unknown | Agent track — Claude / Codex plugin.** The `cautilus install` step also lands a bundled skill at `.agents/skills/cautilus/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally. |

### agent-design-scenario

Decompose the behavior into a concrete scenario before protected eval planning.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-175 | README.md:175 | cautilus-eval | needs-scenario | heuristic | unknown | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-claims-user-facing-md-48 | docs/claims/user-facing.md:48 | cautilus-eval | needs-scenario | heuristic | unknown | Promise.** `Cautilus` should only help improve behavior after the target claim, budget, and protected checks are clear. |
| claim-docs-master-plan-md-88 | docs/master-plan.md:88 | cautilus-eval | needs-scenario | heuristic | unknown | Their public command namespace is `eval live`; the `workbench` name is reserved for a possible future GUI where operators can browse and edit claims, scenarios, and evidence. |
| claim-docs-contracts-claim-discovery-workflow-md-259 | docs/contracts/claim-discovery-workflow.md:259 | cautilus-eval | needs-scenario | heuristic | unknown | Historical observation and provider-caveat statements can inform future scenarios, but they should stay `human-auditable` and `blocked` until promoted into a concrete regression claim. |
| claim-docs-contracts-claim-discovery-workflow-md-681 | docs/contracts/claim-discovery-workflow.md:681 | cautilus-eval | needs-scenario | heuristic | unknown | `claim show` emits `cautilus.claim_status_summary.v1` and can include bounded `sampleClaims` plus `gitState` for agents that need concrete candidates before choosing the next branch. |

### human-align-surfaces

Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-docs-claims-maintainer-facing-md-4 | docs/claims/maintainer-facing.md:4 | human-auditable | needs-alignment | heuristic | unknown | It is allowed to use internal vocabulary, but each claim must stay aligned with a user-facing promise. |
| claim-docs-claims-maintainer-facing-md-38 | docs/claims/maintainer-facing.md:38 | human-auditable | needs-alignment | heuristic | unknown | The bundled skill owns routing, sequencing, decision boundaries, claim curation, review-budget explanation, LLM-backed claim review, and subagent orchestration. |
| claim-docs-claims-maintainer-facing-md-116 | docs/claims/maintainer-facing.md:116 | human-auditable | needs-alignment | heuristic | unknown | M6. Review-Result Replay Must Guard Semantic Drift |
| claim-docs-claims-maintainer-facing-md-141 | docs/claims/maintainer-facing.md:141 | human-auditable | needs-alignment | heuristic | unknown | Commit drift should be exposed as provenance when the adapter and runner files still match. |
| claim-docs-claims-user-facing-md-12 | docs/claims/user-facing.md:12 | human-auditable | needs-alignment | heuristic | unknown | Source anchors point to the durable docs or specs that should stay aligned with the claim. |

### human-confirm-or-decompose

Confirm, decompose, or accept a human-auditable claim before treating it as proven.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-73 | README.md:73 | human-auditable | ready-to-verify | heuristic | unknown | Raw `claim discover` packets remain the source-ref-backed proof-planning input, not the primary document a user should review. |
| claim-docs-claims-maintainer-facing-md-101 | docs/claims/maintainer-facing.md:101 | human-auditable | ready-to-verify | heuristic | unknown | Possible evidence and human agreement alone must not satisfy a claim. |
| claim-docs-claims-maintainer-facing-md-203 | docs/claims/maintainer-facing.md:203 | human-auditable | ready-to-verify | heuristic | unknown | Raw `claim discover` output should feed the catalog through curation; it should not be the primary human review surface. |
| claim-docs-claims-user-facing-md-25 | docs/claims/user-facing.md:25 | human-auditable | ready-to-verify | heuristic | unknown | How Cautilus checks it.** The saved claim packet should show which docs were scanned, which claims were found, which ones need review, and whether the packet still matches the current checkout. |
| claim-docs-claims-user-facing-md-40 | docs/claims/user-facing.md:40 | human-auditable | ready-to-verify | heuristic | unknown | How Cautilus checks it.** Executable specs, CLI tests, and evaluation fixtures should prove that these saved files are written and can be read later. |

### split-or-defer

Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-26 | AGENTS.md:26 | human-auditable | blocked | agent-reviewed | unknown | `Cautilus` owns generic intentful behavior evaluation workflow contracts. |
| claim-agents-md-29 | AGENTS.md:29 | human-auditable | blocked | agent-reviewed | unknown | The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better. |
| claim-agents-md-73 | AGENTS.md:73 | human-auditable | blocked | agent-reviewed | unknown | While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes. |
| claim-readme-md-3 | README.md:3 | human-auditable | blocked | agent-reviewed | unknown | `Cautilus` keeps agent and workflow behavior honest while prompts keep changing. |
| claim-readme-md-153 | README.md:153 | human-auditable | blocked | agent-reviewed | unknown | When the goal is only to prove command routing and packet evaluation, `cautilus eval test --runtime fixture` can run the same product path with adapter-owned fixture results instead of launching a nested model eval. |

## Review Results

| Packet | Mode | Reviewer | Clusters | Updates | Proof | Readiness |
| --- | --- | --- | --- | --- | --- | --- |
| .cautilus/claims/review-result-deterministic-gates-2026-05-01.json | - | - | 1 | 4 | deterministic: 4 | ready-to-verify: 4 |
| .cautilus/claims/review-result-evidence-dev-skill-dogfood.json | - | - | 1 | 1 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-hitl-audience-2026-05-02.json | hitl-decision-cards | human-maintainer | 2 | 3 | deterministic: 2, human-auditable: 1 | ready-to-verify: 3 |
| .cautilus/claims/review-result-hitl-claim-review-boundary-2026-05-02.json | hitl-decision-cards | human-maintainer | 1 | 1 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-hitl-evidence-backed-human-review-2026-05-02.json | hitl-decision-cards | human-maintainer | 1 | 1 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-hitl-priority-reset-2026-05-03.json | hitl-decision-cards | human-maintainer | 1 | 1 | deterministic: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-human-align-action-bucket.json | action-bucket-focused-review | codex-current-agent | 4 | 9 | deterministic: 3, human-auditable: 6 | needs-alignment: 6, ready-to-verify: 3 |
| .cautilus/claims/review-result-human-confirm-action-bucket.json | action-bucket-focused-review | codex-current-agent | 3 | 8 | deterministic: 8 | ready-to-verify: 8 |
| .cautilus/claims/review-result-llm-batch1.json | - | - | 3 | 4 | deterministic: 2, human-auditable: 2 | blocked: 1, needs-scenario: 1, ready-to-verify: 2 |
| .cautilus/claims/review-result-llm-batch3.json | - | - | 4 | 4 | cautilus-eval: 1, deterministic: 2, human-auditable: 1 | blocked: 1, ready-to-verify: 3 |
| .cautilus/claims/review-result-llm-batch4.json | - | - | 6 | 6 | deterministic: 2, human-auditable: 4 | blocked: 2, needs-alignment: 2, ready-to-verify: 2 |
| .cautilus/claims/review-result-llm-batch5.json | - | - | 7 | 14 | deterministic: 11, human-auditable: 3 | needs-alignment: 3, ready-to-verify: 11 |
| .cautilus/claims/review-result-llm-batch6.json | - | - | 7 | 17 | deterministic: 8, human-auditable: 9 | blocked: 5, needs-alignment: 4, ready-to-verify: 8 |
| .cautilus/claims/review-result-loop1-lane-a.json | - | codex | 3 | 3 | cautilus-eval: 1, deterministic: 2 | ready-to-verify: 3 |
| .cautilus/claims/review-result-loop1-lane-b.json | clusters 4-7 only | codex-lane-b | 1 | 1 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-loop2-lane-a.json | - | codex | 3 | 5 | cautilus-eval: 1, deterministic: 3, human-auditable: 1 | blocked: 1, ready-to-verify: 4 |
| .cautilus/claims/review-result-loop2-lane-b.json | clusters 3-5 only | codex-lane-b | 2 | 2 | cautilus-eval: 1, deterministic: 1 | ready-to-verify: 2 |
| .cautilus/claims/review-result-positioning-boundary.json | - | - | 1 | 1 | human-auditable: 1 | blocked: 1 |

### .cautilus/claims/review-result-human-align-action-bucket.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-cli-reference-md-180 | human-auditable | needs-alignment | unknown | Human-confirm the packet/status ownership boundary against CLI reference, packet schemas, and implementation before promoting narrower deterministic checks. |
| claim-docs-contracts-active-run-md-3 | deterministic | ready-to-verify | unknown | Add or connect a deterministic active-run test that proves the workspace root is pinned per workflow and reused through the shell environment variable. |
| claim-docs-contracts-claim-discovery-workflow-md-588 | human-auditable | needs-alignment | unknown | Human-review the binary/skill/adapter boundary and split any executable subclaims into deterministic or dev/skill proof. |
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
Latest changed claim sources: skills/cautilus/SKILL.md: 11
- Update the saved claim map before review or eval planning: Run claim discovery to write a fresh claim packet, then use claim show to inspect the updated status.
- Inspect which files and claims changed: Use this refresh plan to focus review on changed sources before launching any reviewer or eval workflow.
- Stop after recording the refresh plan: Choose this if the coordinator only wanted to make the stale state explicit for a later session.

## Discovery Boundary

- Entries: README.md, AGENTS.md, CLAUDE.md
- Traversal: entry-markdown-links; linked Markdown depth: 3
- Gitignore policy: respect-repo-gitignore
- Explicit sources: no
- Excludes: .git/**, node_modules/**, dist/**, coverage/**, artifacts/**, charness-artifacts/**, docs/specs/**, docs/maintainers/**, ...

