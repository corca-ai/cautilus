# Cautilus Claim Status Report

This is a human-readable projection over the current claim packet, status summary, review results, review-drop summary, validation reports, and eval plans.
Use the JSON packets as the audit source; use this report to decide what to inspect or do next.

## Packet

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Status packet: .cautilus/claims/status-summary.json
- Candidate count: 567
- Source count: 76
- Packet source commit: f1f9bad762f5e86ed221196b159e901e1522e458
- Snapshot notice: gitState is computed when this status packet is generated; rerun discover claims status for live checkout state.
- Git state snapshot: fresh; stale=no
- Changed-file scope: committed-diff-between-packet-and-current-head; working tree=excluded
- Snapshot recommendation: The claim packet commit matches the inspected checkout.

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 140, unknown: 427 |
| Review | agent-reviewed: 188, heuristic: 378, human-reviewed: 1 |
| Recommended proof | cautilus-eval: 162, deterministic: 256, human-auditable: 149 |
| Verification readiness | blocked: 31, needs-alignment: 55, needs-scenario: 2, ready-for-proof: 479 |
| Audience | developer: 438, user: 129 |

Review readiness: heuristicClaimsReadyForReview: 334, needsAlignment: 55, needsScenario: 2.

## Canonical Claim Map

- Map packet: .cautilus/claims/canonical-claim-map.json
- Input status: current
- User raw claims: 129
- User claims mapped to canonical user claims: 0
- User claims not mapped to canonical user claims: 129
- User mappings recommended for semantic sampling: 129
- Maintainer claims mapped to M1-M12: M1: 7, M10: 23, M11: 62, M12: 12, M2: 27, M3: 107, M4: 97, M5: 36, M6: 13, M7: 18, M8: 25, M9: 11
- All raw claims by disposition: mapped-to-maintainer-canonical: 438, user-review-needed: 129
- Mapping confidence: high: 78, low: 161, medium: 328

| Maintainer claim | Title | Raw claims | Proof | Evidence | Review |
| --- | --- | --- | --- | --- | --- |
| M1 | Contract Cross-Cutting Rule Policy | 7 | cautilus-eval: 1, human-auditable: 6 | unknown: 7 | heuristic: 7 |
| M2 | Claim Discovery Workflow | 27 | deterministic: 9, human-auditable: 18 | satisfied: 7, unknown: 20 | agent-reviewed: 9, heuristic: 18 |
| M3 | Binary And Skill Boundary | 107 | cautilus-eval: 31, deterministic: 60, human-auditable: 16 | satisfied: 18, unknown: 89 | agent-reviewed: 26, heuristic: 81 |
| M4 | Adapter And Host Ownership | 97 | cautilus-eval: 39, deterministic: 30, human-auditable: 28 | satisfied: 16, unknown: 81 | agent-reviewed: 27, heuristic: 70 |
| M5 | Evaluation Surfaces And Runners | 36 | cautilus-eval: 17, deterministic: 15, human-auditable: 4 | satisfied: 14, unknown: 22 | agent-reviewed: 14, heuristic: 22 |
| M6 | Evidence State And Review Artifacts | 13 | deterministic: 5, human-auditable: 8 | satisfied: 3, unknown: 10 | agent-reviewed: 3, heuristic: 10 |
| M7 | Improvement Loop | 18 | cautilus-eval: 4, deterministic: 9, human-auditable: 5 | satisfied: 3, unknown: 15 | agent-reviewed: 4, heuristic: 14 |
| M8 | Readiness And Runtime Status | 25 | cautilus-eval: 3, deterministic: 15, human-auditable: 7 | satisfied: 10, unknown: 15 | agent-reviewed: 12, heuristic: 13 |
| M9 | Active Run And Workspace Lifecycle | 11 | cautilus-eval: 5, deterministic: 2, human-auditable: 4 | satisfied: 1, unknown: 10 | agent-reviewed: 3, heuristic: 8 |
| M10 | Live Invocation Runtime | 23 | cautilus-eval: 15, deterministic: 4, human-auditable: 4 | satisfied: 2, unknown: 21 | agent-reviewed: 5, heuristic: 18 |
| M11 | Reporting And Review Variants | 62 | cautilus-eval: 3, deterministic: 38, human-auditable: 21 | satisfied: 17, unknown: 45 | agent-reviewed: 19, heuristic: 43 |
| M12 | Scenario History And Proposal Normalization | 12 | cautilus-eval: 3, deterministic: 8, human-auditable: 1 | satisfied: 5, unknown: 7 | agent-reviewed: 7, heuristic: 4, human-reviewed: 1 |

Maintainer semantic sampling queue:

| Maintainer claim | Title | Sample raw claims |
| --- | --- | --- |
| M1 | Contract Cross-Cutting Rule Policy | claim-docs-contracts-acceptance-risk-tier-md-60 (low), claim-docs-contracts-acceptance-risk-tier-md-104 (low), claim-docs-contracts-runner-readiness-md-172 (low), claim-docs-contracts-realsurface-judge-convergence-md-90 (low) |
| M2 | Claim Discovery Workflow | claim-docs-contracts-adapter-contract-md-500 (low), claim-docs-master-plan-md-81 (medium), claim-docs-master-plan-md-83 (medium), claim-docs-contracts-acceptance-risk-tier-md-37 (low) |
| M3 | Binary And Skill Boundary | claim-agents-md-144 (medium), claim-docs-contracts-adapter-contract-md-558 (medium), claim-docs-contracts-adapter-contract-md-567 (low), claim-docs-internal-working-patterns-md-63 (medium) |
| M4 | Adapter And Host Ownership | claim-agents-md-12 (medium), claim-agents-md-29 (low), claim-agents-md-95 (medium), claim-agents-md-96 (medium) |
| M5 | Evaluation Surfaces And Runners | claim-docs-contracts-adapter-contract-md-223 (medium), claim-docs-contracts-adapter-contract-md-304 (medium), claim-docs-specs-index-spec-md-55 (medium), claim-docs-specs-index-spec-md-77 (medium) |
| M6 | Evidence State And Review Artifacts | claim-docs-specs-index-spec-md-168 (low), claim-docs-contracts-acceptance-risk-tier-md-70 (low), claim-docs-contracts-acceptance-risk-tier-md-130 (medium), claim-docs-contracts-claim-discovery-workflow-md-760 (medium) |
| M7 | Improvement Loop | claim-agents-md-32 (medium), claim-docs-contracts-claim-discovery-workflow-md-420 (medium), claim-docs-contracts-final-acceptance-set-md-68 (medium), claim-docs-contracts-final-acceptance-set-md-78 (low) |
| M8 | Readiness And Runtime Status | claim-docs-contracts-adapter-contract-md-565 (medium), claim-docs-contracts-acceptance-risk-tier-md-8 (medium), claim-docs-contracts-acceptance-risk-tier-md-129 (medium), claim-docs-contracts-claim-discovery-workflow-md-18 (medium) |
| M9 | Active Run And Workspace Lifecycle | claim-docs-contracts-acceptance-risk-tier-md-76 (medium), claim-docs-contracts-active-run-md-59 (medium), claim-docs-contracts-active-run-md-158 (medium), claim-docs-contracts-cli-output-format-md-31 (medium) |
| M10 | Live Invocation Runtime | claim-docs-master-plan-md-94 (medium), claim-docs-specs-index-spec-md-48 (medium), claim-docs-contracts-claim-discovery-workflow-md-306 (medium), claim-docs-contracts-live-run-invocation-batch-md-28 (medium) |
| M11 | Reporting And Review Variants | claim-docs-contracts-adapter-contract-md-234 (medium), claim-docs-master-plan-md-74 (medium), claim-docs-master-plan-md-190 (medium), claim-docs-master-plan-md-193 (medium) |
| M12 | Scenario History And Proposal Normalization | claim-agents-md-68 (medium), claim-docs-contracts-claim-discovery-workflow-md-696 (medium), claim-docs-contracts-scenario-history-md-3 (medium), claim-docs-contracts-improvement-search-md-45 (medium) |

Catalog review needed for 129 raw claim(s): claim-readme-md-6, claim-readme-md-8, claim-readme-md-9, claim-readme-md-12, claim-readme-md-19, claim-readme-md-49, claim-readme-md-61, claim-readme-md-63, ...

Semantic sampling recommended for 489 raw claim(s): claim-agents-md-12, claim-agents-md-29, claim-agents-md-32, claim-agents-md-68, claim-agents-md-95, claim-agents-md-96, claim-agents-md-101, claim-agents-md-116, ...

## Next Work

- Human review is still meaningful for human-align-surfaces=55, human-confirm-or-decompose=65, split-or-defer=31.
- Agent next proof work: connect deterministic gates for 119 claim(s), starting with agent-reviewed items before heuristic items.
- Agent eval work: plan Cautilus eval scenarios for 155 claim(s), after reviewing heuristic labels where needed.
- Scenario design work remains for 2 claim(s).

## Action Buckets

| Bucket | Actor | Count | Review | Evidence | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 140 | agent-reviewed: 140 | satisfied: 140 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 119 | agent-reviewed: 2, heuristic: 116, human-reviewed: 1 | unknown: 119 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 155 | agent-reviewed: 9, heuristic: 146 | unknown: 155 | Draft or select Cautilus eval scenarios for ready eval claims. |
| agent-design-scenario | agent | 2 | agent-reviewed: 2 | unknown: 2 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 55 | agent-reviewed: 11, heuristic: 44 | unknown: 55 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 65 | heuristic: 65 | unknown: 65 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 31 | agent-reviewed: 24, heuristic: 7 | unknown: 31 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

Cross-cutting signal: heuristic-review-needed (378) - Review heuristic labels before spending proof or eval budget.; samples (5 of 378): claim-agents-md-96, claim-agents-md-116, claim-readme-md-6, claim-readme-md-19, claim-readme-md-49, ...

### agent-add-deterministic-proof

Add or connect unit, lint, build, schema, spec, or CI proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-100 | AGENTS.md:100 | deterministic | ready-for-proof | agent-reviewed | unknown | Cautilus Agent should own routing, sequencing, guardrails, and decision boundaries; the binary should own broad command discovery, help text, scenario catalogs, packet examples, install smoke, and doctor/readiness details. |
| claim-readme-md-6 | README.md:6 | deterministic | ready-for-proof | heuristic | unknown | `Cautilus` ships as a standalone binary plus Cautilus Agent, which a host repo can install without copying another scaffold first. |
| claim-readme-md-141 | README.md:141 | deterministic | ready-for-proof | heuristic | unknown | `Cautilus` also ships a GEPA-style bounded prompt search seam above the one-shot improver: multi-generation reflective mutation, protected reevaluation, frontier-promotion review reuse, checkpoint feedback reinjection, bounded merge synthesis, and Pareto-style frontier selection. |
| claim-docs-contracts-adapter-contract-md-344 | docs/contracts/adapter-contract.md:344 | deterministic | ready-for-proof | heuristic | unknown | When `consumer_evaluator_command_template` is present, `Cautilus` writes one `cautilus.live_run_evaluator_input.v1` packet and expects one `cautilus.live_run_evaluator_result.v1` packet back. |
| claim-docs-guides-cli-md-49 | docs/guides/cli.md:49 | deterministic | ready-for-proof | heuristic | unknown | For `codex_exec`, `--codex-home-mode isolated` keeps user config and session state out of the eval while `--codex-auth-mode inherit` copies only Codex auth into the isolated home. |

### agent-plan-cautilus-eval

Draft or select Cautilus eval scenarios for ready eval claims.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-29 | AGENTS.md:29 | cautilus-eval | ready-for-proof | agent-reviewed | unknown | `Cautilus` owns generic intentful behavior evaluation workflow contracts. |
| claim-agents-md-96 | AGENTS.md:96 | cautilus-eval | ready-for-proof | heuristic | unknown | When changing the `skills/cautilus-agent/` surface or behavior-steering references, freeze the current consumer intent before broad edits by deciding whether reviewed dogfood, maintained evaluator scenarios, or checked-in scenario review proof will carry the change. |
| claim-agents-md-116 | AGENTS.md:116 | cautilus-eval | ready-for-proof | heuristic | unknown | Do not report a task-completing goal or slice as done while meaningful implementation, workflow, or artifact work remains uncommitted, unless the deferral is explicit. |
| claim-readme-md-19 | README.md:19 | cautilus-eval | ready-for-proof | heuristic | unknown | For cross-repo adoption, the bounded evaluation loop is the most ready slice: host repos can use `cautilus evaluate fixture`, `cautilus evaluate observation`, and post-run `cautilus evaluate skill-experiment` with checked-in fixtures, host-owned adapters, preserved task packets, and the current evaluation and skill-experiment report packets. |
| claim-readme-md-49 | README.md:49 | cautilus-eval | ready-for-proof | heuristic | unknown | You can also hand setup to an agent instead of running these steps yourself. |

### agent-design-scenario

Decompose the behavior into a concrete scenario before protected eval planning.

Full bucket detail is shown because this bucket is not ready for proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-docs-contracts-scenario-history-md-3 | docs/contracts/scenario-history.md:3 | cautilus-eval | needs-scenario | agent-reviewed | unknown | `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time. |
| claim-docs-specs-promises-ownership-spec-md-7 | docs/specs/promises/ownership.spec.md:7 | cautilus-eval | needs-scenario | agent-reviewed | unknown | Before Cautilus can evaluate behavior honestly, the user needs host-specific prompts, models, credentials, runtime wiring, and acceptance policy to stay in the host repo. |

### human-align-surfaces

Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest.

Full bucket detail is shown because this bucket is not ready for proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-docs-contracts-adapter-contract-md-433 | docs/contracts/adapter-contract.md:433 | human-auditable | needs-alignment | heuristic | unknown | This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file. |
| claim-docs-contracts-adapter-contract-md-452 | docs/contracts/adapter-contract.md:452 | human-auditable | needs-alignment | agent-reviewed | unknown | A named adapter whose eval-test commands produce rich scenario-by-scenario signals should also persist them as files so executor variants and human reviewers can ground their verdicts on the same numbers. |
| claim-docs-guides-cli-md-189 | docs/guides/cli.md:189 | human-auditable | needs-alignment | agent-reviewed | unknown | The product owns the packet boundary and status semantics. |
| claim-docs-guides-cli-md-195 | docs/guides/cli.md:195 | human-auditable | needs-alignment | agent-reviewed | unknown | That keeps persona prompt shaping and result semantics product-owned while backend selection stays adapter-owned. |
| claim-docs-guides-evaluation-process-md-10 | docs/guides/evaluation-process.md:10 | human-auditable | needs-alignment | heuristic | unknown | That seam owns the checked-in case suite, adapter-runner invocation, and chained summary artifacts before the flow returns to packet-level `cautilus evaluate observation` and proposal normalization. |
| claim-docs-guides-evaluation-process-md-270 | docs/guides/evaluation-process.md:270 | human-auditable | needs-alignment | heuristic | unknown | The host still owns raw invocation and transcript capture; `Cautilus` owns the case-suite/runDir workflow, packet-level recommendation, behavior-intent framing, and the direct chain into `discover scenarios normalize skill`. |
| claim-docs-master-plan-md-29 | docs/master-plan.md:29 | human-auditable | needs-alignment | agent-reviewed | unknown | Cautilus owns the generic claim-to-proof workflow; consumer repos own their local fixtures, runners, prompts, wrappers, and policy. |
| claim-docs-master-plan-md-82 | docs/master-plan.md:82 | human-auditable | needs-alignment | heuristic | unknown | The next claim-discovery workflow contract lives in claim-discovery-workflow.md (./contracts/claim-discovery-workflow.md): the binary owns deterministic skeletons, scan scope, state paths, refresh plans, and packet semantics; the Cautilus Agent owns user confirmation, LLM review, grouping, evidence interpretation, and next-action conversation. |
| claim-docs-master-plan-md-83 | docs/master-plan.md:83 | human-auditable | needs-alignment | heuristic | unknown | Direction decision (2026-06-10): claim extraction itself becomes agent-primary — the Cautilus Agent extracts claims against a product-owned template while the binary anchors verbatim excerpts, validates packets, and bounds re-extraction to git-diff-changed sources; the deterministic heuristic extractor remains an explicitly labeled baseline mode. |
| claim-docs-master-plan-md-203 | docs/master-plan.md:203 | human-auditable | needs-alignment | heuristic | unknown | Keep widening HTML surfaces only when the packet boundary stays stable and the page meaningfully improves human review; agents should consume durable packets first. |
| claim-docs-specs-index-spec-md-48 | docs/specs/index.spec.md:48 | human-auditable | needs-alignment | heuristic | unknown | The `app/prompt` surface now has a fresh backend probe over the checked-in tagline fixture plus a load-bearing blind intent judge over that probe: fixture and Codex live backends pass, Claude live backend exposes the current string-fragment matcher boundary by returning `reject` for a semantically close response that does not contain the exact expected fragment, and the blind intent judge grades both live backend responses sound while rejecting a constructed semantic control; product-runner proof remains deferred — see Proof Debt. |
| claim-docs-contracts-acceptance-risk-tier-md-19 | docs/contracts/acceptance-risk-tier.md:19 | human-auditable | needs-alignment | heuristic | unknown | It reuses the *ownership-split discipline* of the search-budget tier — a closed product-owned vocabulary the adapter cannot rename, plus adapter-owned numeric limits — but inverts which vocabulary the product owns: here the product owns the effect labels (not the tier names), while the adapter owns the tier names, which targets map to which tier, and the numeric thresholds (improvement-search.md (./improvement-search.md) lines 65-66). |
| claim-docs-contracts-acceptance-risk-tier-md-37 | docs/contracts/acceptance-risk-tier.md:37 | human-auditable | needs-alignment | heuristic | unknown | that the reliability floor becomes an adapter-owned, optionally per-tier threshold (the deferred trigger condition is now met), while the gap tolerance stays a fixed product constant |
| claim-docs-contracts-acceptance-risk-tier-md-66 | docs/contracts/acceptance-risk-tier.md:66 | human-auditable | needs-alignment | heuristic | unknown | This split keeps risk categorization host-owned (the product never ships "critical" or "low-risk" names) while keeping the accept-step behavior of each effect a product guarantee. |
| claim-docs-contracts-claim-discovery-workflow-md-8 | docs/contracts/claim-discovery-workflow.md:8 | human-auditable | needs-alignment | heuristic | unknown | The product should preserve a simple user-facing entry point while keeping the product boundary clean: for claim discovery and claim review, the binary owns deterministic packet production and state transitions, and the Cautilus Agent owns agent orchestration, LLM-backed claim review, subagent fanout, user confirmation, and next-action conversation. |
| claim-docs-contracts-claim-discovery-workflow-md-16 | docs/contracts/claim-discovery-workflow.md:16 | human-auditable | needs-alignment | heuristic | unknown | The binary owns deterministic packet production: scan traversal, extraction-input packets, anchoring validation, and state transitions. |
| claim-docs-contracts-claim-discovery-workflow-md-17 | docs/contracts/claim-discovery-workflow.md:17 | human-auditable | needs-alignment | heuristic | unknown | The Cautilus Agent owns claim extraction (following the product-owned extraction template), evidence reconciliation, and user-facing status. |
| claim-docs-contracts-claim-discovery-workflow-md-60 | docs/contracts/claim-discovery-workflow.md:60 | human-auditable | needs-alignment | agent-reviewed | unknown | The binary must not own LLM provider selection, subagent scheduling, model prompts, review policy, or human conversation. |
| claim-docs-contracts-claim-discovery-workflow-md-128 | docs/contracts/claim-discovery-workflow.md:128 | human-auditable | needs-alignment | heuristic | unknown | Those findings should be recorded as narrative, catalog, alignment, or documentation work before expecting `discover claims` to emit them by default. |
| claim-docs-contracts-claim-discovery-workflow-md-506 | docs/contracts/claim-discovery-workflow.md:506 | human-auditable | needs-alignment | heuristic | unknown | The binary may provide helper flags such as `discover claims --previous <packet> --refresh-plan`, but the public user-level workflow remains `discover`. |
| claim-docs-contracts-claim-discovery-workflow-md-560 | docs/contracts/claim-discovery-workflow.md:560 | human-auditable | needs-alignment | heuristic | unknown | That block should separate in-scope false negatives from out-of-scope narrative gaps: a declared promise inside the boundary that discovery missed is a binary bug, while undeclared user-facing behavior outside the boundary is an entry-surface or catalog gap rather than a discoverable claim. |
| claim-docs-contracts-claim-discovery-workflow-md-702 | docs/contracts/claim-discovery-workflow.md:702 | human-auditable | needs-alignment | heuristic | unknown | The binary/skill boundary stays clean enough that consumer repos can use the binary plus Cautilus Agent without Cautilus importing host-specific prompts or adapters. |
| claim-docs-contracts-facet-decomposition-md-59 | docs/contracts/facet-decomposition.md:59 | human-auditable | needs-alignment | heuristic | unknown | So the concrete, highest-measured-value form of this "Next step" is now: bring R6/R12 into the engine baseline (portable defaults plus an adapter-owned routing-hint extension family, mirroring the `non_claim_section_headings` default+extension pattern), kept deterministic; true per-facet decomposition for the whole population stays the deeper end-state gated behind it. |
| claim-docs-contracts-final-acceptance-set-md-18 | docs/contracts/final-acceptance-set.md:18 | human-auditable | needs-alignment | heuristic | unknown | Repeatedly querying the same valset through the selection channel turns it into a de facto training signal over many generations, so the selected finalist's held-out score can drift away from true generalization. |
| claim-docs-contracts-final-acceptance-set-md-78 | docs/contracts/final-acceptance-set.md:78 | human-auditable | needs-alignment | heuristic | unknown | Splitting a scarce, expensive-to-author held-out set three ways thins each split and trades known selection power for a noisy detector; authoring fresh boundary cases after search keeps the "never queried" guarantee and leaves held-out selection power intact. |
| claim-docs-contracts-live-run-invocation-batch-md-28 | docs/contracts/live-run-invocation-batch.md:28 | human-auditable | needs-alignment | agent-reviewed | unknown | Raw provider-error interpretation stays consumer-owned. |
| claim-docs-contracts-live-run-invocation-md-160 | docs/contracts/live-run-invocation.md:160 | human-auditable | needs-alignment | agent-reviewed | unknown | The workspace directory contents stay consumer-owned even when `Cautilus` owns the directory allocation and one-time prepare timing. |
| claim-docs-contracts-reporting-md-50 | docs/contracts/reporting.md:50 | deterministic | needs-alignment | agent-reviewed | unknown | When `Cautilus` itself executes adapter-defined mode commands, it should write those command observations into the report input so the final packet preserves how the evidence was gathered. |
| claim-docs-contracts-runner-verification-md-5 | docs/contracts/runner-verification.md:5 | human-auditable | needs-alignment | heuristic | unknown | This contract keeps that judgment packet-shaped and repo-owned instead of teaching the binary to reverse-engineer arbitrary app code. |
| claim-docs-contracts-runner-verification-md-24 | docs/contracts/runner-verification.md:24 | human-auditable | needs-alignment | agent-reviewed | unknown | external substitution: nondeterministic or costly external dependencies can be replaced with deterministic substitutes at the same boundary the product uses |
| claim-docs-contracts-skillopt-absorption-md-6 | docs/contracts/skillopt-absorption.md:6 | human-auditable | needs-alignment | heuristic | unknown | `Cautilus` should absorb only the SkillOpt and SkillOpt-Sleep patterns that strengthen its existing `claim`, `eval`, and `improve` command families while preserving host-owned raw data, packet-first proof, held-out safety, and no auto-apply. |
| claim-docs-contracts-skillopt-absorption-md-81 | docs/contracts/skillopt-absorption.md:81 | human-auditable | needs-alignment | heuristic | unknown | risk-tier acceptance policy stays adapter-owned |
| claim-docs-contracts-workbench-instance-discovery-md-99 | docs/contracts/workbench-instance-discovery.md:99 | deterministic | needs-alignment | agent-reviewed | unknown | A future live app eval flow can refer to one selected instance by stable id. |
| claim-docs-specs-contracts-adapter-host-ownership-spec-md-17 | docs/specs/contracts/adapter-host-ownership.spec.md:17 | human-auditable | needs-alignment | heuristic | unknown | Cautilus owns generic workflow contracts, packet shapes, readiness semantics, behavior-surface vocabulary, and normalization helpers, while host repos own prompts, runners, credentials, model or backend selection, fixtures, and policy. |
| claim-docs-specs-contracts-binary-skill-boundary-spec-md-17 | docs/specs/contracts/binary-skill-boundary.spec.md:17 | human-auditable | needs-alignment | heuristic | unknown | The binary owns deterministic command execution, packet schemas, help text, and reusable artifacts; the Cautilus Agent owns sequencing, decision boundaries, review-budget explanation, and agent-driven claim curation, and the binary never calls an LLM provider directly for claim discovery or claim review. |
| claim-docs-specs-contracts-live-invocation-runtime-spec-md-17 | docs/specs/contracts/live-invocation-runtime.spec.md:17 | human-auditable | needs-alignment | heuristic | unknown | Cautilus owns the generic request and result packet shape and the loop boundary, while the host-owned adapter still owns provider calls, backend flags, route layout, model choice, credentials, and product-specific response semantics. |
| claim-docs-specs-promises-a-testable-agent-spec-md-8 | docs/specs/promises/a-testable-agent.spec.md:8 | human-auditable | needs-alignment | heuristic | unknown | Using the `cautilus` CLI and the checked-in runner-readiness fixtures, you can check how testable your agent is: the binary emits a runner-readiness verdict, names the runner capability each claim needs, and flags an assessment that has drifted out of date. |
| claim-docs-specs-promises-a-testable-agent-spec-md-102 | docs/specs/promises/a-testable-agent.spec.md:102 | human-auditable | needs-alignment | heuristic | unknown | The `cautilus-agent` skill carries the runner-readiness routing: orient runner readiness from `doctor status`, read the required runner capability for the selected claim, help build a headless product runner that reuses the real product path, help produce a `cautilus.runner_assessment.v1` packet at the binary-named scaffold path, keep the proof class honest, and stop `improve` when runner-backed proof is missing, stale, or smoke-only — while the binary owns command discovery, the scaffold source, and freshness. |
| claim-docs-specs-promises-claim-discovery-spec-md-44 | docs/specs/promises/claim-discovery.spec.md:44 | human-auditable | needs-alignment | heuristic | unknown | If an important behavior appears only outside that boundary, such as in code, transcripts, issues, or private operator memory, Cautilus Agent or a human can raise it as a documentation, catalog, or alignment gap. |
| claim-docs-specs-promises-claim-discovery-spec-md-129 | docs/specs/promises/claim-discovery.spec.md:129 | human-auditable | needs-alignment | heuristic | unknown | Without the hint the same document yields zero candidates, which keeps the lexicon adapter-owned rather than hardcoded. |
| claim-docs-specs-promises-ownership-spec-md-8 | docs/specs/promises/ownership.spec.md:8 | human-auditable | needs-alignment | heuristic | unknown | Using the `cautilus init adapter`, `cautilus doctor adapter`, and `cautilus doctor` CLI commands with the `cautilus-agent` skill, a user can keep host-owned execution in place while Cautilus standardizes workflow packets and boundaries. |
| claim-docs-specs-promises-ownership-spec-md-37 | docs/specs/promises/ownership.spec.md:37 | human-auditable | needs-alignment | heuristic | unknown | An operator ran `npm run consumer:onboard:smoke` and vouches for the result: the smoke installs Cautilus, initializes adapter wiring, reaches doctor readiness, and runs one bounded `evaluate fixture -> evaluate observation` packet loop in a fresh temporary git repo whose adapter, fixture, and eval runner are all host-owned — so the host keeps execution while Cautilus brings only the generic workflow. |
| claim-docs-specs-rules-host-owned-execution-spec-md-8 | docs/specs/rules/host-owned-execution.spec.md:8 | human-auditable | needs-alignment | heuristic | unknown | Cautilus owns generic workflow contracts, packet shapes, command boundaries, and evidence routes. |
| claim-docs-contracts-claim-extraction-template-md-39 | docs/contracts/claim-extraction-template.md:39 | human-auditable | needs-alignment | heuristic | unknown | The binary owns `sourceInventory`, `sourceGraph`, `effectiveScanScope`, git commit, and per-source content hashes in every mode. |
| claim-docs-contracts-claim-extraction-template-md-69 | docs/contracts/claim-extraction-template.md:69 | human-auditable | needs-alignment | heuristic | unknown | Measurement then isolated the two patterns behind almost all of those misroutes, folded here as one generalization rather than a per-case list: an *ownership / boundary / isolation* assignment ("the binary owns X", "the consumer owns Y", "the run is isolated from user state") is a structural fact a static check settles, so it routes `deterministic` even though it reads like design philosophy; and the words `reviewable` / `reproducible` / `auditable` name a property the structure confers, never on their own a reason to drop to `human-auditable`, which is reserved for proof that genuinely needs a human to inspect an outcome. |
| claim-docs-contracts-claim-extraction-template-md-306 | docs/contracts/claim-extraction-template.md:306 | human-auditable | needs-alignment | heuristic | unknown | (`--allow-stale-sources` can apply a packet whose excerpts no longer anchor against drifted current content; the drift is recorded in `extractionAudit` and surfaces as stale-anchor findings in `validate`.) |
| claim-docs-contracts-improvement-search-md-126 | docs/contracts/improvement-search.md:126 | human-auditable | needs-alignment | heuristic | unknown | This keeps the useful GEPA shape while staying honest about `Cautilus`'s different product boundary. |
| claim-docs-contracts-realsurface-judge-convergence-md-45 | docs/contracts/realsurface-judge-convergence.md:45 | human-auditable | needs-alignment | heuristic | unknown | FD4 — attach via adapter-owned enrichment; the generic runtime runner stays pure. |
| claim-docs-contracts-scenario-proposal-inputs-md-106 | docs/contracts/scenario-proposal-inputs.md:106 | human-auditable | needs-alignment | heuristic | unknown | The product-owned merge step combines their evidence and keeps the newest evidence first. |
| claim-docs-contracts-skill-surface-judge-convergence-md-70 | docs/contracts/skill-surface-judge-convergence.md:70 | human-auditable | needs-alignment | heuristic | unknown | This preserves the code/intelligence boundary the contract pins: the engine only reads and composites a structured verdict (symmetric with the instruction surface), it never computes the judge verdict or a repo-specific facet — the judge logic stays in the adapter-owned enricher. |
| claim-docs-contracts-skill-surface-judge-convergence-md-120 | docs/contracts/skill-surface-judge-convergence.md:120 | human-auditable | needs-alignment | heuristic | unknown | The generic Go engine extension must stay generic verdict-compositing symmetric with the instruction surface; no repo-specific judge or facet logic enters the engine or the generic runtime runner, and the judge half stays in adapter-owned `scripts/`. |
| claim-docs-contracts-skill-surface-judge-convergence-md-156 | docs/contracts/skill-surface-judge-convergence.md:156 | human-auditable | needs-alignment | heuristic | unknown | The critique confirmed FD5's boundary-honesty claim (the reused Go helpers only read and count a structured verdict; all facet computation stays in the `.mjs` harness) and the no-manufacturing/sequencing discipline. |
| claim-docs-specs-rules-vocabulary-consistency-spec-md-7 | docs/specs/rules/vocabulary-consistency.spec.md:7 | human-auditable | needs-alignment | agent-reviewed | unknown | The same product concept should keep the same name in user-facing prose, maintainer specs, CLI JSON, Cautilus Agent guidance, and tests. |
| claim-skills-cautilus-agent-skill-md-102 | skills/cautilus-agent/SKILL.md:102 | human-auditable | needs-alignment | heuristic | unknown | Use `human-auditable` for source/doc judgment, `deterministic` for unit/lint/type/build/schema/CI proof, `cautilus-eval` for model/agent/prompt/skill/workflow evidence, `needs-scenario` for claims needing scenario decomposition, and `needs-alignment` for docs/code/adapter/skill surfaces that must be reconciled before proof would be honest. |
| claim-skills-cautilus-agent-skill-md-130 | skills/cautilus-agent/SKILL.md:130 | human-auditable | needs-alignment | heuristic | unknown | Maintainer-facing claims may use internal terms, but they must stay aligned with the user-facing claim specs and preserve source refs, proof route, evidence status, and next action. |

### human-confirm-or-decompose

Confirm, decompose, or accept a human-auditable claim before treating it as proven.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-61 | README.md:61 | human-auditable | ready-for-proof | heuristic | unknown | Raw `discover claims` packets remain the high-recall, source-ref-backed proof-planning input, not the primary document a user should review. |
| claim-docs-guides-cli-md-574 | docs/guides/cli.md:574 | human-auditable | ready-for-proof | heuristic | unknown | `doctor` stays read-only — record a skipped read with `evaluate acceptance waive-skip`, never by mutating it from the doctor surface. |
| claim-docs-master-plan-md-157 | docs/master-plan.md:157 | human-auditable | ready-for-proof | heuristic | unknown | the risk-tier policy on top of the acceptance read (acceptance-risk-tier.md (./contracts/acceptance-risk-tier.md)): a host declares per-target `required`/`optional`/`skippable` effects in the adapter `acceptance_risk` block; read-time enforcement blocks-or-waives a `required` read in `cautilus evaluate acceptance`, and the skip-time gate in read-only `cautilus doctor` (`acceptanceReadiness`) catches a `required` target never read, with `cautilus evaluate acceptance waive-skip` recording an explicit waiver-on-skip — the product owns only the effect vocabulary, never the risk categories |
| claim-docs-specs-index-spec-md-101 | docs/specs/index.spec.md:101 | human-auditable | ready-for-proof | heuristic | unknown | Surface Honesty Audit (generated/audit.spec.md) is the navigable, runnable per-badge map: for each promise it shows the level this page CLAIMS, the level the proof route is OBSERVED to deliver (recomputed by inspecting the leaf spec's checks and evidence files), the proof class, the command that runs it, and whether the two agree. |
| claim-docs-specs-index-spec-md-102 | docs/specs/index.spec.md:102 | human-auditable | ready-for-proof | heuristic | unknown | The binding is semantic, not just structural: for every badge that declares evidence, each evidence file must actually be read by a `cautilus-json-file` check in its leaf spec, so a route cannot point at an unrelated spec or pad its evidence count with files the spec never asserts on. |

### split-or-defer

Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification.

Full bucket detail is shown because this bucket is not ready for proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-12 | AGENTS.md:12 | human-auditable | blocked | agent-reviewed | unknown | Deterministic behavior belongs in code, scripts, adapters, tests, and specs. |
| claim-agents-md-32 | AGENTS.md:32 | human-auditable | blocked | agent-reviewed | unknown | The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better. |
| claim-agents-md-68 | AGENTS.md:68 | human-auditable | blocked | agent-reviewed | unknown | Keep this block short. Detailed routing belongs in installed skill metadata and `find-skills` output, not in a long checked-in catalog. |
| claim-agents-md-95 | AGENTS.md:95 | human-auditable | blocked | agent-reviewed | unknown | While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes. |
| claim-agents-md-101 | AGENTS.md:101 | human-auditable | blocked | agent-reviewed | unknown | When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available. |
| claim-readme-md-144 | README.md:144 | human-auditable | blocked | heuristic | unknown | The longer-term direction is close to the workflow philosophy behind DSPy: prompts can change as long as the evaluated behavior survives. |
| claim-docs-contracts-adapter-contract-md-500 | docs/contracts/adapter-contract.md:500 | human-auditable | blocked | heuristic | unknown | If a checked-in wrapper can observe provider cost or token usage, let it emit an optional `telemetry` object in the structured verdict payload instead of hiding that data in stderr text. |
| claim-docs-contracts-adapter-contract-md-565 | docs/contracts/adapter-contract.md:565 | human-auditable | blocked | heuristic | unknown | Past runs showed some CLIs can reject schemas that declare object properties without also listing them in `required`, even when plain JSON Schema would allow them as optional. |
| claim-docs-contracts-adapter-contract-md-567 | docs/contracts/adapter-contract.md:567 | human-auditable | blocked | heuristic | unknown | Past sessions showed `codex exec` can emit skill-load errors on stderr while still returning a successful exit code. |
| claim-docs-guides-evaluation-process-md-304 | docs/guides/evaluation-process.md:304 | human-auditable | blocked | agent-reviewed | unknown | Past sessions showed `codex exec` can emit fatal skill-loading errors on stderr while the final process exit still looks successful. |
| claim-docs-guides-evaluation-process-md-308 | docs/guides/evaluation-process.md:308 | human-auditable | blocked | agent-reviewed | unknown | Past sessions showed that overly aggressive effort overrides can conflict with tool surfaces that the prompt or skill still needs. |
| claim-docs-guides-evaluation-process-md-317 | docs/guides/evaluation-process.md:317 | human-auditable | blocked | agent-reviewed | unknown | Past sessions showed `--bare` can disable the local OAuth or keychain path and fail with `Not logged in`. |
| claim-docs-guides-evaluation-process-md-320 | docs/guides/evaluation-process.md:320 | human-auditable | blocked | agent-reviewed | unknown | In JSON mode, `claude -p` can wrap the verdict under `structured_output` instead of printing the schema payload as the top-level object. |
| claim-docs-guides-evaluation-process-md-322 | docs/guides/evaluation-process.md:322 | human-auditable | blocked | agent-reviewed | unknown | Past sessions showed `claude -p` can look silent for a while and tempt operators into manual polling or abort loops. |
| claim-docs-master-plan-md-32 | docs/master-plan.md:32 | human-auditable | blocked | agent-reviewed | unknown | The product surface should keep following the same discipline as `charness`: expose the user's intent at the public command boundary, keep tool-specific mechanics underneath it, and preserve durable artifacts that another agent can resume. |
| claim-docs-master-plan-md-94 | docs/master-plan.md:94 | human-auditable | blocked | agent-reviewed | unknown | Their public command namespace is `eval live`; the `workbench` name is reserved for a possible future GUI where operators can browse and edit claims, scenarios, and evidence. |
| claim-docs-contracts-claim-discovery-workflow-md-47 | docs/contracts/claim-discovery-workflow.md:47 | human-auditable | blocked | agent-reviewed | unknown | The binary should own deterministic behavior that can be rerun without model access: |
| claim-docs-contracts-claim-discovery-workflow-md-77 | docs/contracts/claim-discovery-workflow.md:77 | human-auditable | blocked | agent-reviewed | unknown | This keeps the product agent-first without making the binary a host-specific agent runtime. |
| claim-docs-contracts-claim-discovery-workflow-md-223 | docs/contracts/claim-discovery-workflow.md:223 | human-auditable | blocked | agent-reviewed | unknown | It should also show the deterministic bounds that will be applied: |
| claim-docs-contracts-claim-discovery-workflow-md-299 | docs/contracts/claim-discovery-workflow.md:299 | human-auditable | blocked | agent-reviewed | unknown | Broad positioning or aggregate product promises should stay `human-auditable` and `verificationReadiness=blocked` until they are decomposed into concrete deterministic checks, scenario candidates, or Cautilus eval claims. |
| claim-docs-contracts-claim-discovery-workflow-md-300 | docs/contracts/claim-discovery-workflow.md:300 | human-auditable | blocked | heuristic | unknown | The claim should remain visible in the packet, but it should not become a fixture plan by default because one passing fixture would overclaim the umbrella promise. |
| claim-docs-contracts-claim-discovery-workflow-md-308 | docs/contracts/claim-discovery-workflow.md:308 | human-auditable | blocked | agent-reviewed | unknown | Command, packet, runner, and readiness statements should prefer deterministic proof unless they explicitly depend on model or agent behavior. |
| claim-docs-contracts-claim-discovery-workflow-md-311 | docs/contracts/claim-discovery-workflow.md:311 | human-auditable | blocked | heuristic | unknown | Historical observation and provider-caveat statements can inform future scenarios, but they should stay `human-auditable` and `blocked` until promoted into a concrete regression claim. |
| claim-docs-contracts-claim-discovery-workflow-md-371 | docs/contracts/claim-discovery-workflow.md:371 | human-auditable | blocked | agent-reviewed | unknown | `verificationReadiness=needs-alignment` means at least two truth surfaces must be reconciled before proof would be honest. |
| claim-docs-contracts-claim-discovery-workflow-md-727 | docs/contracts/claim-discovery-workflow.md:727 | human-auditable | blocked | agent-reviewed | unknown | The binary should remain deterministic and provider-neutral. |
| claim-docs-contracts-runner-readiness-md-55 | docs/contracts/runner-readiness.md:55 | human-auditable | blocked | agent-reviewed | unknown | A runner is a bounded headless command that takes product-readable input and writes a Cautilus-readable observed packet. |
| claim-docs-contracts-runner-readiness-md-348 | docs/contracts/runner-readiness.md:348 | human-auditable | blocked | agent-reviewed | unknown | The skill may guide runner creation, but reusable deterministic behavior belongs in code, adapters, packets, and tests. |
| claim-docs-contracts-workbench-instance-discovery-md-100 | docs/contracts/workbench-instance-discovery.md:100 | human-auditable | blocked | agent-reviewed | unknown | The product can render a human-facing instance chooser without learning consumer-native labels itself. |
| claim-docs-specs-contracts-binary-skill-boundary-spec-md-21 | docs/specs/contracts/binary-skill-boundary.spec.md:21 | human-auditable | blocked | agent-reviewed | unknown | The binary owns deterministic command execution, packet schemas, help text, and reusable artifacts. |
| claim-docs-contracts-realsurface-judge-convergence-md-90 | docs/contracts/realsurface-judge-convergence.md:90 | human-auditable | blocked | heuristic | unknown | Any bug, error, or regression encountered routes to `charness:debug` before further fixes. |
| claim-skills-cautilus-agent-skill-md-22 | skills/cautilus-agent/SKILL.md:22 | human-auditable | blocked | agent-reviewed | unknown | The binary owns command discovery, packet examples, deterministic scans, validation, and reusable evaluation artifacts. |

## Review Results

Active updates still match current claim identity; superseded updates are historical and omitted from the detail tables below.

| Packet | Mode | Reviewer | Clusters | Active | Superseded | Proof | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| .cautilus/claims/review-result-adapter-gate-split-2026-05-03.json | - | - | 1 | 1 | 0 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-agent-design-scenario-proposals-2026-05-17.json | - | - | 1 | 6 | 0 | cautilus-eval: 6 | ready-for-proof: 6 |
| .cautilus/claims/review-result-agent-plan-cautilus-eval-2026-05-04.json | parallel-agent-review | - | 2 | 3 | 0 | deterministic: 3 | ready-for-proof: 1, needs-alignment: 2 |
| .cautilus/claims/review-result-agent-status-safe-branch-catalog-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-canonical-spec-curation-flow-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-claim-discovery-routing-flow-2026-05-04.json | evidence-application | codex-dev-skill-routing-dogfood-proof | 1 | 1 | 0 | cautilus-eval: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-contract-binary-preflight-review-boundary-2026-05-17.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-for-proof: 3 |
| .cautilus/claims/review-result-contract-canonical-spec-curation-before-hitl-2026-05-17.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-contract-claim-discovery-proof-plan-2026-05-17.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-contract-claim-workflow-helper-packets-2026-05-17.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-for-proof: 3 |
| .cautilus/claims/review-result-contract-compact-status-summary-2026-05-17.json | - | - | 1 | 4 | 0 | deterministic: 4 | ready-for-proof: 4 |
| .cautilus/claims/review-result-contract-discover-refresh-carry-forward-2026-05-17.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-contract-refresh-selection-state-transition-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-contract-reporting-telemetry-packets-2026-05-17.json | - | - | 1 | 5 | 0 | deterministic: 5 | needs-alignment: 1, ready-for-proof: 4 |
| .cautilus/claims/review-result-contract-runner-readiness-packets-2026-05-17.json | - | - | 1 | 5 | 0 | deterministic: 5 | ready-for-proof: 5 |
| .cautilus/claims/review-result-current-deterministic-proof-batch-2026-05-03.json | - | - | 1 | 9 | 1 | deterministic: 7, human-auditable: 2 | ready-for-proof: 6, needs-alignment: 1, blocked: 2 |
| .cautilus/claims/review-result-current-dev-skill-dogfood-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-deterministic-gates-2026-05-01.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-deterministic-proof-batch-2026-05-04.json | - | - | 1 | 8 | 0 | deterministic: 8 | ready-for-proof: 8 |
| .cautilus/claims/review-result-deterministic-ready-heuristic-2026-05-03.json | - | - | 7 | 23 | 4 | deterministic: 14, human-auditable: 8, cautilus-eval: 1 | ready-for-proof: 15, blocked: 8 |
| .cautilus/claims/review-result-eval-bucket-user-c-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-eval-heuristic-batch-2026-05-03.json | - | - | 1 | 14 | 1 | deterministic: 11, human-auditable: 3 | ready-for-proof: 11, needs-alignment: 1, blocked: 2 |
| .cautilus/claims/review-result-evidence-active-run-and-claim-discover-2026-05-03.json | - | - | 1 | 1 | 1 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-adapter-claim-discovery-hints-2026-05-16.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-adapter-discovery-contracts-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-adapter-review-prompt-compare-path-2026-05-16.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-adapter-review-prompt-human-visible-failure-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-agent-status-orientation-refresh-2026-05-16.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-cautilus-agent-source-launcher-2026-05-11.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-claim-cli-packet-boundary-2026-05-11.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-claim-eval-plan-2026-05-01.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-evidence-claim-review-prepare-input-boundary-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-claim-workflow-canonical-review-input-2026-05-11.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-cli-decision-packet-projections-2026-05-11.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-for-proof: 3 |
| .cautilus/claims/review-result-evidence-cli-live-runtime-go-owned-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-cli-reference-doctor-discovery-refresh-2026-05-11.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-consumer-adoption-readiness-and-intent-vocabulary-2026-05-17.json | - | - | 1 | 1 | 1 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-consumer-doctor-onboarding-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-consumer-surface-alias-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-deterministic-proof-batch-2026-05-04b.json | - | - | 1 | 5 | 0 | deterministic: 5 | ready-for-proof: 5 |
| .cautilus/claims/review-result-evidence-dev-skill-routing-install.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-evidence-doctor-runner-readiness-next-action-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-durable-packets-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-eval-live-cli-boundary-2026-05-11.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-evaluation-process-artifacts-2026-05-03.json | - | - | 1 | 1 | 1 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-evaluation-process-compare-paths-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-gepa-sparse-evidence-block-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-guides-cli-claim-discovery-routing-2026-05-16.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-guides-cli-decision-packet-projections-2026-05-17.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-for-proof: 3 |
| .cautilus/claims/review-result-evidence-guides-cli-doctor-refresh-boundaries-2026-05-16.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-guides-cli-eval-live-instance-selection-2026-05-16.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-guides-cli-evaluate-fixture-path-2026-05-16.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-guides-cli-evaluate-observation-no-runner-2026-05-16.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-guides-cli-runner-readiness-next-action-2026-05-16.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-improve-search-sparse-evidence-block-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-install-packaging-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-live-run-workspace-boundary-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-master-plan-claim-discover-proof-plan-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-master-plan-gates-consumer-smoke-2026-05-17.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-evidence-master-plan-packet-routes-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-master-plan-spec-normalizer-gates-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-on-demand-test-gate-2026-05-11.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-on-demand-test-gate-2026-05-16.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-proof-class-downstream-summary-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-readme-bounded-eval-loop-2026-05-16.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-readme-core-flow-consumer-artifacts-2026-05-17.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-readme-reviewable-artifacts-2026-05-16.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-readme-spec-report-renderer-independence-2026-05-16.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-refresh-plan-state-transition-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-evidence-remaining-stale-claims-2026-05-11.json | - | - | 2 | 3 | 1 | deterministic: 3 | ready-for-proof: 3 |
| .cautilus/claims/review-result-evidence-review-packet-boundary-2026-05-16.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-review-summary-telemetry-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-review-variants-read-mostly-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-review-variants-status-and-output-text-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-runner-readiness-branch-shape-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-runner-readiness-schema-fields-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-scenario-review-attention-linkage-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-self-dogfood-html-renderers-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-spec-vocabulary-evidence-definition-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-family-b-dev-skill-deterministic-proof-2026-05-20.json | - | - | 1 | 2 | 0 | cautilus-eval: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-final-deterministic-proof-debt-2026-05-03.json | - | - | 1 | 3 | 1 | human-auditable: 1, deterministic: 2 | needs-alignment: 1, ready-for-proof: 2 |
| .cautilus/claims/review-result-final-deterministic-queue-2026-05-17.json | - | - | 1 | 7 | 0 | deterministic: 7 | ready-for-proof: 7 |
| .cautilus/claims/review-result-hitl-audience-2026-05-02.json | hitl-decision-cards | human-maintainer | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-hitl-claim-review-boundary-2026-05-02.json | hitl-decision-cards | human-maintainer | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-hitl-evidence-backed-human-review-2026-05-02.json | hitl-decision-cards | human-maintainer | 1 | 1 | 0 | cautilus-eval: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-hitl-priority-reset-2026-05-03.json | hitl-decision-cards | human-maintainer | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-human-align-action-bucket.json | action-bucket-focused-review | codex-current-agent | 0 | 0 | 6 | - | - |
| .cautilus/claims/review-result-human-confirm-action-bucket.json | action-bucket-focused-review | codex-current-agent | 0 | 0 | 5 | - | - |
| .cautilus/claims/review-result-improve-artifact-runtime-fingerprint-2026-05-17.json | - | - | 1 | 5 | 0 | deterministic: 5 | ready-for-proof: 5 |
| .cautilus/claims/review-result-llm-batch1.json | - | - | 0 | 0 | 2 | - | - |
| .cautilus/claims/review-result-llm-batch3.json | - | - | 0 | 0 | 2 | - | - |
| .cautilus/claims/review-result-llm-batch4.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-llm-batch5.json | - | - | 0 | 0 | 5 | - | - |
| .cautilus/claims/review-result-llm-batch6.json | - | - | 0 | 0 | 8 | - | - |
| .cautilus/claims/review-result-loop2-lane-a.json | - | codex | 0 | 0 | 2 | - | - |
| .cautilus/claims/review-result-loop2-lane-b.json | clusters 3-5 only | codex-lane-b | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-ownership-evidence-gaps-improvement-2026-05-17.json | - | - | 1 | 5 | 0 | deterministic: 5 | ready-for-proof: 5 |
| .cautilus/claims/review-result-packet-first-skill-flow-2026-05-03.json | - | - | 1 | 1 | 0 | cautilus-eval: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-policy-claim-reclassification-2026-05-03.json | - | - | 1 | 2 | 0 | human-auditable: 2 | blocked: 2 |
| .cautilus/claims/review-result-readiness-triage-2026-05-10.json | action-bucket-readiness-triage | codex-current-agent | 0 | 0 | 8 | - | - |
| .cautilus/claims/review-result-readiness-triage-replay-2026-06-10.json | id-drift-replay-repair | claude-current-agent | 1 | 3 | 0 | human-auditable: 2, deterministic: 1 | blocked: 2, ready-for-proof: 1 |
| .cautilus/claims/review-result-remaining-deterministic-claims-2026-05-03.json | - | - | 2 | 5 | 3 | deterministic: 4, human-auditable: 1 | ready-for-proof: 4, needs-alignment: 1 |
| .cautilus/claims/review-result-remaining-deterministic-proof-2026-05-04.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-for-proof: 3 |
| .cautilus/claims/review-result-rename-chain-supports-replenish-2026-05-20.json | - | - | 1 | 2 | 0 | unchanged: 2 | unchanged: 2 |
| .cautilus/claims/review-result-reviewable-artifact-workflow-scope-2026-05-17.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-for-proof: 3 |
| .cautilus/claims/review-result-scenario-proposal-portable-provenance-2026-05-04.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-skill-packet-first-reclass-2026-05-03.json | - | - | 1 | 1 | 0 | cautilus-eval: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-spec-binary-skill-boundary-2026-05-17.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-for-proof: 3 |
| .cautilus/claims/review-result-spec-reviewable-eval-surfaces-2026-05-17.json | - | - | 1 | 5 | 0 | deterministic: 5 | ready-for-proof: 5 |
| .cautilus/claims/review-result-user-claim-discovery-reviewable-artifacts-2026-05-17.json | - | - | 1 | 5 | 0 | deterministic: 4, human-auditable: 1 | ready-for-proof: 4, needs-alignment: 1 |
| .cautilus/claims/review-result-user-evaluation-reopen-packets-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-workbench-instance-catalog-contract-2026-05-03.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-for-proof: 2, blocked: 1 |

### .cautilus/claims/review-result-workbench-instance-catalog-contract-2026-05-03.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-contracts-workbench-instance-discovery-md-25 | deterministic | ready-for-proof | satisfied | Keep adapter validation and catalog schema tests current when changing instance discovery fields. |
| claim-docs-contracts-workbench-instance-discovery-md-100 | deterministic | blocked | unknown | Defer until a shipped chooser or review surface exists, or reword the contract to claim only that eval live discover emits display labels in the catalog packet. |
| claim-docs-contracts-workbench-instance-discovery-md-101 | deterministic | ready-for-proof | satisfied | Keep typed path normalization and catalog schema tests current when adding scenario-adjacent path keys. |

### .cautilus/claims/review-result-user-evaluation-reopen-packets-2026-05-17.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-specs-promises-evaluation-spec-md-170 | deterministic | ready-for-proof | satisfied | Keep summary and observed packet schema checks in the evaluation spec whenever new eval surfaces are promoted as user-facing evidence. |

### .cautilus/claims/review-result-user-claim-discovery-reviewable-artifacts-2026-05-17.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-specs-rules-reviewable-artifacts-spec-md-7 | deterministic | ready-for-proof | satisfied | Keep the reviewable artifact projection matrix, renderer tests, and rule-level spec links aligned when adding a new packet-backed readable view. |
| claim-docs-specs-promises-claim-discovery-spec-md-10 | deterministic | ready-for-proof | satisfied | Keep claim-discovery CLI tests and Cautilus Agent flow audits synchronized when changing candidate extraction, source refs, curation prompts, or next-work routing. |
| claim-docs-specs-promises-claim-discovery-spec-md-226 | deterministic | ready-for-proof | satisfied | Keep status-summary packet tests and renderer tests current when changing action buckets or saved-packet status fields. |
| claim-docs-specs-promises-claim-discovery-spec-md-259 | deterministic | ready-for-proof | satisfied | Keep prepared skill-evaluation wording aligned with the deterministic status-summary command and review-prepare stop boundary. |
| claim-docs-specs-rules-vocabulary-consistency-spec-md-7 | human-auditable | needs-alignment | unknown | Resolve `gap.vocabulary-evidence-bundle` by defining the vocabulary probe scope across user prose, maintainer specs, CLI JSON, Cautilus Agent guidance, and tests, then create `.cautilus/claims/evidence-vocabulary-consistency-current.json` or record an explicit waiver. |

### .cautilus/claims/review-result-spec-reviewable-eval-surfaces-2026-05-17.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-specs-contracts-evaluation-surfaces-runners-spec-md-22 | deterministic | ready-for-proof | satisfied | Refresh charness-artifacts/spec/evaluation-surfaces-runners-proof.md when self-dogfood summary packets are regenerated. |
| claim-docs-specs-contracts-evaluation-surfaces-runners-spec-md-31 | deterministic | ready-for-proof | satisfied | Keep lint:scenario-normalizers in verify when adding or removing scenario normalization helpers. |
| claim-docs-specs-contracts-evidence-state-artifacts-spec-md-26 | deterministic | ready-for-proof | satisfied | Keep stale status visible in generated packet, Markdown, and HTML/status renderers when changing evidence-state transitions. |
| claim-docs-specs-contracts-reporting-review-variants-spec-md-17 | deterministic | ready-for-proof | satisfied | Keep rendered report/review views generated from machine-readable packet inputs when adding review-learning or active-run aggregation. |
| claim-docs-specs-contracts-scenario-history-normalization-spec-md-17 | deterministic | ready-for-proof | satisfied | Keep the documented held-out scenario-history evidence gap visible until an end-to-end held-out cycle artifact is captured. |

## Review Drop Audit

- Drop summary packet: .cautilus/claims/review-drops-summary.json
- Drop summary report: .cautilus/claims/review-drops-summary.md
- Source claim packet: .cautilus/claims/evidenced-typed-runners.json
- Dropped updates: 305
- Drop reasons: missing-fingerprint: 165, missing-live-fingerprint: 140
- Recorded samples: 20
- Reason classes represented by samples: 2/2
- Drop actions:
  - missing-fingerprint: unrecoverable; Prepare fresh review-input for the currently live claims instead of carrying the stale update forward.
  - missing-live-fingerprint: stale-fingerprint; Use the reviewResultPath and claimFingerprint to decide whether a focused review-input queue is warranted.

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
| .cautilus/claims/eval-plan-after-scenario-design-2026-05-17.json | 17 | 344 | not-cautilus-eval: 237, not-reviewed: 107 | - |
| .cautilus/claims/eval-plan-agent-reviewed-eval-2026-05-04.json | 0 | 323 | already-satisfied: 15, not-cautilus-eval: 224, not-ready-for-proof: 10, not-reviewed: 74 | all-reviewed-eval-targets-satisfied-and-remaining-reviewed-claims-not-eval-targets |
| .cautilus/claims/eval-plan-agent-reviewed-eval-2026-05-17.json | 9 | 352 | not-cautilus-eval: 237, not-ready-for-proof: 8, not-reviewed: 107 | - |
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
- Traversal: entry-markdown-links; linked docs depth: 3
- Gitignore policy: respect-repo-gitignore
- Explicit sources: no
- Excludes: .git/**, node_modules/**, dist/**, coverage/**, artifacts/**, charness-artifacts/**, docs/specs/old/**, docs/specs/archive/**, ...

