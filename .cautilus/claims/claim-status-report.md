# Cautilus Claim Status Report

This is a human-readable projection over the current claim packet, status summary, review results, validation reports, and eval plans.
Use the JSON packets as the audit source; use this report to decide what to inspect or do next.

## Packet

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Status packet: .cautilus/claims/status-summary.json
- Candidate count: 338
- Source count: 36
- Claims git commit: 0349e6ce1b0b2ddf997b5f285cd5603ab22c9f43
- Git state: stale; stale=yes
- Git recommendation: Run claim discover --previous <claims.json> --refresh-plan before review, review application, or eval planning.

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 38, unknown: 300 |
| Review | agent-reviewed: 104, heuristic: 234 |
| Recommended proof | cautilus-eval: 139, deterministic: 144, human-auditable: 55 |
| Verification readiness | blocked: 13, needs-alignment: 25, needs-scenario: 7, ready-to-verify: 293 |
| Audience | developer: 271, user: 67 |

Review readiness: heuristicClaimsReadyForReview: 215, needsAlignment: 25, needsScenario: 7.

## Next Work

- Human review is still meaningful for human-align-surfaces=24, human-confirm-or-decompose=17, split-or-defer=13.
- Agent next proof work: connect deterministic gates for 113 claim(s), starting with agent-reviewed items before heuristic items.
- Agent eval work: plan Cautilus eval scenarios for 126 claim(s), after reviewing heuristic labels where needed.
- Scenario design work remains for 7 claim(s).

## Action Buckets

| Bucket | Actor | Count | Review | Evidence | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 38 | agent-reviewed: 38 | satisfied: 38 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 113 | agent-reviewed: 26, heuristic: 87 | unknown: 113 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 126 | agent-reviewed: 13, heuristic: 113 | unknown: 126 | Draft or select Cautilus eval scenarios for ready eval claims. |
| agent-design-scenario | agent | 7 | agent-reviewed: 1, heuristic: 6 | unknown: 7 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 24 | agent-reviewed: 11, heuristic: 13 | unknown: 24 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 17 | agent-reviewed: 4, heuristic: 13 | unknown: 17 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 13 | agent-reviewed: 11, heuristic: 2 | unknown: 13 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

Cross-cutting signal: heuristic-review-needed (234) - Review heuristic labels before spending proof or eval budget.

### agent-add-deterministic-proof

Add or connect unit, lint, build, schema, spec, or CI proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-12 | AGENTS.md:12 | deterministic | ready-to-verify | agent-reviewed | unknown | Deterministic behavior belongs in code, scripts, adapters, tests, and specs. |
| claim-agents-md-61 | AGENTS.md:61 | deterministic | ready-to-verify | agent-reviewed | unknown | Keep this block short. Detailed routing belongs in installed skill metadata and `find-skills` output, not in a long checked-in catalog. |
| claim-readme-md-9 | README.md:9 | deterministic | ready-to-verify | agent-reviewed | unknown | Commands should emit durable packets with enough state for the next agent to resume, not only terminal prose for a human operator. |
| claim-readme-md-13 | README.md:13 | deterministic | ready-to-verify | agent-reviewed | unknown | They stay checked into each host repo so evaluation behavior remains reproducible, reviewable, and owned by the repo that declares it. |
| claim-readme-md-95 | README.md:95 | deterministic | ready-to-verify | agent-reviewed | unknown | Next step: a human decides whether to promote the scenario into a protected evaluation path, while an agent can reopen the saved result, compare variants, or feed it into the next bounded step. |

### agent-plan-cautilus-eval

Draft or select Cautilus eval scenarios for ready eval claims.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-26 | AGENTS.md:26 | cautilus-eval | ready-to-verify | agent-reviewed | unknown | `Cautilus` owns generic intentful behavior evaluation workflow contracts. |
| claim-agents-md-79 | AGENTS.md:79 | cautilus-eval | ready-to-verify | agent-reviewed | unknown | When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available. |
| claim-docs-cli-reference-md-110 | docs/cli-reference.md:110 | cautilus-eval | ready-to-verify | agent-reviewed | unknown | If repo setup is ready but runner proof is not, that next action can point at runner assessment setup before the first bounded eval loop. |
| claim-docs-cli-reference-md-128 | docs/cli-reference.md:128 | cautilus-eval | ready-to-verify | agent-reviewed | unknown | It emits `cautilus.claim_review_input.v1` and does not call an LLM or mark claims satisfied. |
| claim-docs-cli-reference-md-258 | docs/cli-reference.md:258 | cautilus-eval | ready-to-verify | agent-reviewed | unknown | It links normalized chatbot threads to scenario proposals and coverage hints so an operator can review behavior-eval evidence without browsing every live operator turn. |

### agent-design-scenario

Decompose the behavior into a concrete scenario before protected eval planning.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-171 | README.md:171 | cautilus-eval | needs-scenario | agent-reviewed | unknown | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-master-plan-md-88 | docs/master-plan.md:88 | cautilus-eval | needs-scenario | heuristic | unknown | Their public command namespace is `eval live`; the `workbench` name is reserved for a possible future GUI where operators can browse and edit claims, scenarios, and evidence. |
| claim-docs-contracts-claim-discovery-workflow-md-227 | docs/contracts/claim-discovery-workflow.md:227 | cautilus-eval | needs-scenario | heuristic | unknown | Historical observation and provider-caveat statements can inform future scenarios, but they should stay `human-auditable` and `blocked` until promoted into a concrete regression claim. |
| claim-docs-contracts-claim-discovery-workflow-md-643 | docs/contracts/claim-discovery-workflow.md:643 | cautilus-eval | needs-scenario | heuristic | unknown | `claim show` emits `cautilus.claim_status_summary.v1` and can include bounded `sampleClaims` plus `gitState` for agents that need concrete candidates before choosing the next branch. |
| claim-docs-contracts-scenario-history-md-3 | docs/contracts/scenario-history.md:3 | cautilus-eval | needs-scenario | heuristic | unknown | `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time. |

### human-align-surfaces

Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-docs-cli-reference-md-180 | docs/cli-reference.md:180 | human-auditable | needs-alignment | agent-reviewed | unknown | The product owns the packet boundary and status semantics. |
| claim-docs-cli-reference-md-186 | docs/cli-reference.md:186 | human-auditable | needs-alignment | agent-reviewed | unknown | That keeps persona prompt shaping and result semantics product-owned while backend selection stays adapter-owned. |
| claim-docs-guides-evaluation-process-md-10 | docs/guides/evaluation-process.md:10 | human-auditable | needs-alignment | agent-reviewed | unknown | That seam owns the checked-in case suite, adapter-runner invocation, and chained summary artifacts before the flow returns to packet-level `cautilus eval evaluate` and proposal normalization. |
| claim-docs-guides-evaluation-process-md-270 | docs/guides/evaluation-process.md:270 | human-auditable | needs-alignment | agent-reviewed | unknown | The host still owns raw invocation and transcript capture; `Cautilus` owns the case-suite/runDir workflow, packet-level recommendation, behavior-intent framing, and the direct chain into `scenario normalize skill`. |
| claim-docs-maintainers-consumer-readiness-md-59 | docs/maintainers/consumer-readiness.md:59 | human-auditable | needs-alignment | heuristic | unknown | `Cautilus` can normalize public-skill, profile, and validation drift without binding the product to one named repo's layout. |

### human-confirm-or-decompose

Confirm, decompose, or accept a human-auditable claim before treating it as proven.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-docs-guides-evaluation-process-md-293 | docs/guides/evaluation-process.md:293 | human-auditable | ready-to-verify | agent-reviewed | unknown | Review variants should inspect the candidate, not mutate the repo. |
| claim-docs-maintainers-consumer-readiness-md-5 | docs/maintainers/consumer-readiness.md:5 | human-auditable | ready-to-verify | heuristic | unknown | Product-facing docs should describe repo-agnostic surfaces such as `chatbot`, `skill`, `workflow`, and `agent runtime` first, then point here for checked-in evidence shapes and proof expectations. |
| claim-docs-maintainers-consumer-readiness-md-91 | docs/maintainers/consumer-readiness.md:91 | human-auditable | ready-to-verify | agent-reviewed | unknown | the same consumer keeps its standing repo-owned evaluator path green on the released binary: `python3 scripts/run-evals.py --repo-root .` passed its maintained scenario set and `pytest tests/test_cautilus_scenarios.py` stayed green |
| claim-docs-maintainers-consumer-readiness-md-98 | docs/maintainers/consumer-readiness.md:98 | human-auditable | ready-to-verify | agent-reviewed | unknown | `Cautilus` now has one external proof that a bootstrap-heavy agent-runtime consumer can adopt the released `bootstrapHelper` / `workSkill` contract without false mismatches. |
| claim-docs-specs-evaluation-surfaces-spec-md-192 | docs/specs/evaluation-surfaces.spec.md:192 | human-auditable | ready-to-verify | heuristic | unknown | A `steps: [...]` fixture executes each step in order, and step N can read step (N-1)'s output. |

### split-or-defer

Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-29 | AGENTS.md:29 | human-auditable | blocked | agent-reviewed | unknown | The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better. |
| claim-agents-md-73 | AGENTS.md:73 | human-auditable | blocked | agent-reviewed | unknown | While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes. |
| claim-readme-md-3 | README.md:3 | human-auditable | blocked | agent-reviewed | unknown | `Cautilus` keeps agent and workflow behavior honest while prompts keep changing. |
| claim-readme-md-153 | README.md:153 | human-auditable | blocked | agent-reviewed | unknown | Use when a stateful automation — a CLI workflow, long-running agent session, or pipeline that persists state across invocations — keeps stalling on the same step. |
| claim-readme-md-192 | README.md:192 | human-auditable | blocked | agent-reviewed | unknown | The longer-term direction is close to the workflow philosophy behind DSPy: prompts can change as long as the evaluated behavior survives. |

## Review Results

| Packet | Mode | Reviewer | Clusters | Updates | Proof | Readiness |
| --- | --- | --- | --- | --- | --- | --- |
| .cautilus/claims/review-result-action-boundary-skill-guidance.json | bounded-single-cluster | codex-current-agent | 1 | 1 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-deterministic-gates-2026-05-01.json | - | - | 1 | 18 | deterministic: 18 | ready-to-verify: 18 |
| .cautilus/claims/review-result-evidence-claim-eval-plan-2026-05-01.json | - | - | 1 | 1 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-dev-skill-dogfood.json | - | - | 1 | 1 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-evidence-dev-skill-routing-install.json | - | - | 1 | 2 | cautilus-eval: 2 | ready-to-verify: 2 |
| .cautilus/claims/review-result-evidence-review-to-eval-flow.json | direct-evidence-application | codex-current-agent-evidence-review | 1 | 1 | cautilus-eval: 1 | ready-to-verify: 1 |
| .cautilus/claims/review-result-human-align-action-bucket.json | action-bucket-focused-review | codex-current-agent | 4 | 12 | deterministic: 4, human-auditable: 8 | needs-alignment: 6, ready-to-verify: 6 |
| .cautilus/claims/review-result-human-confirm-action-bucket.json | action-bucket-focused-review | codex-current-agent | 4 | 12 | deterministic: 11, human-auditable: 1 | blocked: 1, ready-to-verify: 11 |
| .cautilus/claims/review-result-llm-batch1.json | - | - | 4 | 8 | deterministic: 6, human-auditable: 2 | blocked: 1, needs-scenario: 2, ready-to-verify: 5 |
| .cautilus/claims/review-result-llm-batch3.json | - | - | 6 | 7 | cautilus-eval: 3, deterministic: 2, human-auditable: 2 | blocked: 2, needs-scenario: 1, ready-to-verify: 4 |
| .cautilus/claims/review-result-llm-batch4.json | - | - | 6 | 6 | deterministic: 2, human-auditable: 4 | blocked: 2, needs-alignment: 2, ready-to-verify: 2 |
| .cautilus/claims/review-result-llm-batch5.json | - | - | 8 | 18 | cautilus-eval: 3, deterministic: 11, human-auditable: 4 | needs-alignment: 4, needs-scenario: 1, ready-to-verify: 13 |
| .cautilus/claims/review-result-llm-batch6.json | - | - | 8 | 19 | cautilus-eval: 2, deterministic: 8, human-auditable: 9 | blocked: 5, needs-alignment: 4, ready-to-verify: 10 |
| .cautilus/claims/review-result-loop1-lane-a.json | - | codex | 4 | 8 | cautilus-eval: 1, deterministic: 6, human-auditable: 1 | blocked: 1, ready-to-verify: 7 |
| .cautilus/claims/review-result-loop1-lane-b.json | clusters 4-7 only | codex-lane-b | 4 | 5 | cautilus-eval: 3, deterministic: 2 | needs-scenario: 1, ready-to-verify: 4 |
| .cautilus/claims/review-result-loop2-lane-a.json | - | codex | 3 | 7 | cautilus-eval: 1, deterministic: 5, human-auditable: 1 | blocked: 1, ready-to-verify: 6 |
| .cautilus/claims/review-result-loop2-lane-b.json | clusters 3-5 only | codex-lane-b | 3 | 6 | cautilus-eval: 3, deterministic: 3 | ready-to-verify: 6 |
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
| claim-docs-maintainers-consumer-readiness-md-91 | human-auditable | ready-to-verify | unknown | Human-confirm or attach direct evidence for the external consumer evaluator and pytest runs referenced by the maintainer note. |

### .cautilus/claims/review-result-human-confirm-action-bucket.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-cli-reference-md-256 | deterministic | ready-to-verify | unknown | Add or connect a deterministic packet test proving `attentionView` is emitted as a bounded human-facing shortlist derived from the ranked set. |
| claim-docs-contracts-runner-readiness-md-118 | deterministic | ready-to-verify | unknown | Add or connect deterministic agent-status tests for initialize-adapter, refresh-claim-state, runner-assessment, runner-smoke, inspect-claims, and run-eval branch exposure. |
| claim-docs-contracts-workbench-instance-discovery-md-100 | deterministic | ready-to-verify | unknown | Add or connect deterministic instance-chooser rendering proof, or defer the claim if the workbench UI remains future work. |
| claim-docs-contracts-workbench-instance-discovery-md-101 | deterministic | ready-to-verify | unknown | Add or connect deterministic tests proving scenario-adjacent paths come from typed packet fields rather than hardcoded route templates. |
| claim-docs-contracts-workbench-instance-discovery-md-25 | deterministic | ready-to-verify | unknown | Add or connect adapter/packet validation for stable `instanceId` and human-facing `displayLabel` fields. |
| claim-docs-contracts-adapter-contract-md-422 | deterministic | ready-to-verify | unknown | Add or connect deterministic adapter checks that rich scenario-by-scenario signals are persisted as files for executor variants and human reviewers. |
| claim-docs-contracts-claim-discovery-workflow-md-648 | deterministic | ready-to-verify | unknown | Add or connect deterministic `claim review prepare-input` tests for excluding satisfied and already reviewed non-stale claims while preserving skipped audit entries. |
| claim-docs-contracts-claim-discovery-workflow-md-153 | deterministic | ready-to-verify | unknown | Add or connect deterministic agent-status tests proving the selected related claim map drives status summaries and inspect/refresh branch commands while `state_path` remains the first-discovery output path. |

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
| claim-docs-maintainers-consumer-readiness-md-68 | deterministic | ready-to-verify | satisfied | Keep covered by consumer:starters:smoke when workflow starter or workflow normalizer behavior changes. |
| claim-docs-maintainers-development-md-36 | deterministic | ready-to-verify | satisfied | Keep covered by `npm run verify` and update this claim if verify phase composition changes. |
| claim-docs-maintainers-development-md-38 | deterministic | ready-to-verify | satisfied | Keep covered by `npm run lint:specs` and verify output. |
| claim-docs-maintainers-development-md-80 | deterministic | ready-to-verify | satisfied | Keep covered by Go tests when CLI integration-flow ownership changes. |

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
| .cautilus/claims/eval-plan-evidenced-typed-runners.json | 0 | 324 | already-satisfied: 4, not-cautilus-eval: 157, not-ready-to-verify: 6, not-reviewed: 157 | all-reviewed-eval-targets-satisfied-and-remaining-reviewed-claims-not-eval-targets |
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
| .cautilus/claims/refresh-plan-after-provider-caveat-heuristics.json | changes-detected | 1 | 65 | 266 |
| .cautilus/claims/refresh-plan-after-review-input-skip.json | changes-detected | 3 | 94 | 230 |
| .cautilus/claims/refresh-plan-after-routing-heuristics.json | changes-detected | 2 | 62 | 263 |
| .cautilus/claims/refresh-plan-agent-status-selected-state.json | changes-detected | 2 | 77 | 259 |
| .cautilus/claims/refresh-plan-claim-status-report.json | changes-detected | 1 | 10 | 328 |
| .cautilus/claims/refresh-plan-final.json | changes-detected | 35 | 16 | 284 |
| .cautilus/claims/refresh-plan-skill-action-buckets.json | changes-detected | 1 | 9 | 326 |
| .cautilus/claims/refresh-plan-typed-runners.json | up-to-date | 0 | 0 | 324 |
| .cautilus/claims/refresh-plan.json | changes-detected | 36 | 132 | 160 |

Latest refresh summary: The saved claim map was made from an older checkout; this plan identifies claims whose source files changed and does not update the saved claim map yet.
Latest changed claim sources: skills/cautilus/SKILL.md: 10
- Update the saved claim map before review or eval planning: Run claim discovery to write a fresh claim packet, then use claim show to inspect the updated status.
- Inspect which files and claims changed: Use this refresh plan to focus review on changed sources before launching any reviewer or eval workflow.
- Stop after recording the refresh plan: Choose this if the coordinator only wanted to make the stale state explicit for a later session.

## Discovery Boundary

- Entries: README.md, AGENTS.md, CLAUDE.md
- Traversal: entry-markdown-links; linked Markdown depth: 3
- Gitignore policy: respect-repo-gitignore
- Explicit sources: no
- Excludes: .git/**, node_modules/**, dist/**, coverage/**, artifacts/**, charness-artifacts/**, docs/internal/handoff.md, docs/internal/research/**

