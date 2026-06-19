# Cautilus Claim Status Report

This is a human-readable projection over the current claim packet, status summary, review results, validation reports, and eval plans.
Use the JSON packets as the audit source; use this report to decide what to inspect or do next.

## Packet

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Status packet: .cautilus/claims/status-summary.json
- Candidate count: 393
- Source count: 71
- Packet source commit: c319573412a32a0826cd84c6d25b7cd108c48fde
- Snapshot notice: gitState is computed when this status packet is generated; rerun discover claims status for live checkout state.
- Git state snapshot: fresh; stale=no
- Changed-file scope: committed-diff-between-packet-and-current-head; working tree=excluded
- Snapshot recommendation: The claim packet commit matches the inspected checkout.

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 144, unknown: 249 |
| Review | agent-reviewed: 200, heuristic: 191, human-reviewed: 2 |
| Recommended proof | cautilus-eval: 116, deterministic: 172, human-auditable: 105 |
| Verification readiness | blocked: 35, needs-alignment: 41, needs-scenario: 1, ready-for-proof: 316 |
| Audience | developer: 286, user: 107 |

Review readiness: heuristicClaimsReadyForReview: 168, needsAlignment: 41, needsScenario: 1.

## Canonical Claim Map

- Map packet: .cautilus/claims/canonical-claim-map.json
- Input status: current
- User raw claims: 107
- User claims mapped to U1-U7: 107
- User claims not mapped to U1-U7: 0
- User mappings recommended for semantic sampling: 33
- Maintainer claims mapped to M1-M34: M1: 7, M10: 12, M11: 37, M12: 11, M2: 18, M3: 69, M4: 69, M5: 25, M6: 6, M7: 12, M8: 14, M9: 6
- All raw claims by disposition: mapped-to-maintainer-canonical: 286, mapped-to-user-canonical: 107
- Mapping confidence: high: 78, low: 19, medium: 296

| User claim | Title | Raw claims | Evidence | Review |
| --- | --- | --- | --- | --- |
| U1 | Readiness | 22 | satisfied: 10, unknown: 12 | agent-reviewed: 10, heuristic: 12 |
| U2 | Claim Discovery | 63 | satisfied: 27, unknown: 36 | agent-reviewed: 40, heuristic: 23 |
| U3 | Behavior Evaluation | 7 | satisfied: 2, unknown: 5 | agent-reviewed: 4, heuristic: 3 |
| U4 | Bounded Improvement | 3 | unknown: 3 | agent-reviewed: 2, heuristic: 1 |
| U5 | Reviewable Artifacts | 5 | satisfied: 4, unknown: 1 | agent-reviewed: 4, heuristic: 1 |
| U6 | Evidence Gaps | 1 | satisfied: 1 | agent-reviewed: 1 |
| U7 | Host Ownership | 6 | satisfied: 2, unknown: 4 | agent-reviewed: 3, heuristic: 3 |

| Maintainer claim | Title | Raw claims | Proof | Evidence | Review |
| --- | --- | --- | --- | --- | --- |
| M1 | Contract Cross-Cutting Rule Policy | 7 | cautilus-eval: 2, human-auditable: 5 | unknown: 7 | agent-reviewed: 1, heuristic: 6 |
| M2 | Claim Discovery Workflow | 18 | deterministic: 9, human-auditable: 9 | satisfied: 8, unknown: 10 | agent-reviewed: 11, heuristic: 7 |
| M3 | Binary And Skill Boundary | 69 | cautilus-eval: 19, deterministic: 33, human-auditable: 17 | satisfied: 18, unknown: 51 | agent-reviewed: 28, heuristic: 40, human-reviewed: 1 |
| M4 | Adapter And Host Ownership | 69 | cautilus-eval: 29, deterministic: 20, human-auditable: 20 | satisfied: 18, unknown: 51 | agent-reviewed: 28, heuristic: 41 |
| M5 | Evaluation Surfaces And Runners | 25 | cautilus-eval: 12, deterministic: 12, human-auditable: 1 | satisfied: 13, unknown: 12 | agent-reviewed: 13, heuristic: 12 |
| M6 | Evidence State And Review Artifacts | 6 | deterministic: 3, human-auditable: 3 | satisfied: 3, unknown: 3 | agent-reviewed: 3, heuristic: 3 |
| M7 | Improvement Loop | 12 | cautilus-eval: 3, deterministic: 4, human-auditable: 5 | satisfied: 4, unknown: 8 | agent-reviewed: 7, heuristic: 5 |
| M8 | Readiness And Runtime Status | 14 | cautilus-eval: 2, deterministic: 10, human-auditable: 2 | satisfied: 10, unknown: 4 | agent-reviewed: 12, heuristic: 2 |
| M9 | Active Run And Workspace Lifecycle | 6 | cautilus-eval: 5, human-auditable: 1 | unknown: 6 | agent-reviewed: 2, heuristic: 4 |
| M10 | Live Invocation Runtime | 12 | cautilus-eval: 6, deterministic: 3, human-auditable: 3 | satisfied: 2, unknown: 10 | agent-reviewed: 5, heuristic: 7 |
| M11 | Reporting And Review Variants | 37 | cautilus-eval: 4, deterministic: 22, human-auditable: 11 | satisfied: 17, unknown: 20 | agent-reviewed: 19, heuristic: 18 |
| M12 | Scenario History And Proposal Normalization | 11 | cautilus-eval: 2, deterministic: 6, human-auditable: 3 | satisfied: 5, unknown: 6 | agent-reviewed: 7, heuristic: 3, human-reviewed: 1 |
| M13 | Evidence State And Review Artifacts | 0 | - | - | - |
| M14 | Reporting And Review Variants | 0 | - | - | - |
| M15 | Active Run And Workspace Lifecycle | 0 | - | - | - |
| M16 | Evidence State And Review Artifacts | 0 | - | - | - |
| M17 | Improvement Loop | 0 | - | - | - |
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
| M29 | Improvement Loop | 0 | - | - | - |
| M30 | Scenario History And Proposal Normalization | 0 | - | - | - |
| M31 | Evidence State And Review Artifacts | 0 | - | - | - |
| M32 | Binary And Skill Boundary | 0 | - | - | - |
| M33 | Active Run And Workspace Lifecycle | 0 | - | - | - |
| M34 | Reporting And Review Variants | 0 | - | - | - |

Maintainer semantic sampling queue:

| Maintainer claim | Title | Sample raw claims |
| --- | --- | --- |
| M1 | Contract Cross-Cutting Rule Policy | claim-agents-md-101 (medium), claim-docs-specs-index-spec-md-105 (low), claim-docs-contracts-runner-readiness-md-172 (low), claim-docs-specs-ledger-index-spec-md-4 (medium) |
| M2 | Claim Discovery Workflow | claim-docs-master-plan-md-78 (medium), claim-docs-contracts-claim-discovery-workflow-md-5 (medium), claim-docs-contracts-claim-discovery-workflow-md-128 (medium), claim-docs-contracts-claim-discovery-workflow-md-179 (medium) |
| M3 | Binary And Skill Boundary | claim-agents-md-100 (medium), claim-agents-md-142 (medium), claim-docs-contracts-adapter-contract-md-494 (low), claim-docs-contracts-adapter-contract-md-552 (medium) |
| M4 | Adapter And Host Ownership | claim-agents-md-12 (medium), claim-agents-md-29 (medium), claim-agents-md-95 (medium), claim-docs-contracts-adapter-contract-md-3 (medium) |
| M5 | Evaluation Surfaces And Runners | claim-docs-contracts-adapter-contract-md-220 (medium), claim-docs-master-plan-md-85 (medium), claim-docs-specs-index-spec-md-43 (medium), claim-docs-contracts-claim-discovery-workflow-md-502 (medium) |
| M6 | Evidence State And Review Artifacts | claim-docs-contracts-claim-discovery-workflow-md-361 (medium), claim-docs-contracts-claim-discovery-workflow-md-739 (medium), claim-docs-contracts-claim-discovery-workflow-md-740 (medium), claim-docs-contracts-claim-discovery-workflow-md-741 (medium) |
| M7 | Improvement Loop | claim-agents-md-32 (medium), claim-docs-contracts-claim-discovery-workflow-md-16 (medium), claim-docs-contracts-reporting-md-170 (low), claim-docs-specs-rules-evidence-gaps-spec-md-3 (medium) |
| M8 | Readiness And Runtime Status | claim-docs-contracts-claim-discovery-workflow-md-18 (medium), claim-docs-contracts-claim-discovery-workflow-md-47 (medium), claim-docs-contracts-claim-discovery-workflow-md-561 (medium), claim-docs-contracts-claim-discovery-workflow-md-644 (medium) |
| M9 | Active Run And Workspace Lifecycle | claim-docs-contracts-active-run-md-59 (medium), claim-docs-contracts-active-run-md-221 (medium), claim-docs-contracts-live-run-invocation-md-160 (medium), claim-docs-contracts-scenario-history-md-188 (low) |
| M10 | Live Invocation Runtime | claim-docs-master-plan-md-91 (medium), claim-docs-specs-index-spec-md-12 (medium), claim-docs-contracts-live-run-invocation-batch-md-28 (medium), claim-docs-contracts-live-run-invocation-batch-md-166 (medium) |
| M11 | Reporting And Review Variants | claim-docs-contracts-adapter-contract-md-231 (medium), claim-docs-contracts-adapter-contract-md-446 (medium), claim-docs-contracts-adapter-contract-md-452 (medium), claim-docs-contracts-adapter-contract-md-498 (medium) |
| M12 | Scenario History And Proposal Normalization | claim-agents-md-68 (medium), claim-docs-contracts-claim-discovery-workflow-md-298 (medium), claim-docs-contracts-claim-discovery-workflow-md-676 (medium), claim-docs-contracts-scenario-history-md-3 (medium) |

Semantic sampling recommended for 315 raw claim(s): claim-agents-md-12, claim-agents-md-29, claim-agents-md-32, claim-agents-md-68, claim-agents-md-95, claim-agents-md-100, claim-agents-md-101, claim-agents-md-142, ...

## Next Work

- Human review is still meaningful for human-align-surfaces=41, human-confirm-or-decompose=31, split-or-defer=35.
- Agent next proof work: connect deterministic gates for 29 claim(s), starting with agent-reviewed items before heuristic items.
- Agent eval work: plan Cautilus eval scenarios for 112 claim(s), after reviewing heuristic labels where needed.
- Scenario design work remains for 1 claim(s).

## Action Buckets

| Bucket | Actor | Count | Review | Evidence | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 144 | agent-reviewed: 144 | satisfied: 144 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 29 | agent-reviewed: 1, heuristic: 27, human-reviewed: 1 | unknown: 29 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 112 | agent-reviewed: 8, heuristic: 103, human-reviewed: 1 | unknown: 112 | Draft or select Cautilus eval scenarios for ready eval claims. |
| agent-design-scenario | agent | 1 | agent-reviewed: 1 | unknown: 1 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 41 | agent-reviewed: 18, heuristic: 23 | unknown: 41 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 31 | heuristic: 31 | unknown: 31 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 35 | agent-reviewed: 28, heuristic: 7 | unknown: 35 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

Cross-cutting signal: heuristic-review-needed (191) - Review heuristic labels before spending proof or eval budget.

### agent-add-deterministic-proof

Add or connect unit, lint, build, schema, spec, or CI proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-6 | README.md:6 | deterministic | ready-for-proof | heuristic | unknown | `Cautilus` ships as a standalone binary plus Cautilus Agent, which a host repo can install without copying another scaffold first. |
| claim-docs-specs-index-spec-md-60 | docs/specs/index.spec.md:60 | deterministic | ready-for-proof | heuristic | unknown | You, the next teammate, or the next agent can reopen exactly what happened: every run leaves both a machine-readable record and a readable view to audit against. |
| claim-docs-specs-index-spec-md-72 | docs/specs/index.spec.md:72 | deterministic | ready-for-proof | heuristic | unknown | You get a clean, invokable runner for Cautilus to run against — the kind of entry point that makes any agent testable in the first place — and the Cautilus agent helps you build it and check how testable your agent is, so that testability stays yours for good. |
| claim-docs-specs-index-spec-md-97 | docs/specs/index.spec.md:97 | deterministic | ready-for-proof | heuristic | unknown | For each subclaim, either (a) add an executable check that runs the actual scenario and asserts on the produced packet/file, or (b) link a concrete existing evidence bundle, audit fixture, or packet path that proves that specific subclaim. |
| claim-docs-contracts-claim-discovery-workflow-md-5 | docs/contracts/claim-discovery-workflow.md:5 | deterministic | ready-for-proof | heuristic | unknown | `cautilus discover claims` emits a deterministic, source-ref-backed proof-plan skeleton — a fast, high-recall inventory. |

### agent-plan-cautilus-eval

Draft or select Cautilus eval scenarios for ready eval claims.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-47 | README.md:47 | cautilus-eval | ready-for-proof | heuristic | unknown | You can also hand setup to an agent instead of running these steps yourself. |
| claim-readme-md-84 | README.md:84 | cautilus-eval | ready-for-proof | heuristic | unknown | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-108 | README.md:108 | cautilus-eval | ready-for-proof | heuristic | unknown | Evaluation uses two top-level surfaces: `dev` for AI-assisted development work such as repo contracts, tools, and skills, and `app` for AI-powered product behavior such as chat, prompt, and service responses. |
| claim-readme-md-121 | README.md:121 | cautilus-eval | ready-for-proof | agent-reviewed | unknown | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-contracts-adapter-contract-md-221 | docs/contracts/adapter-contract.md:221 | cautilus-eval | ready-for-proof | heuristic | unknown | When an eval run uses `runtime=product`, the adapter-owned command is expected to exercise a headless product path; the runtime label does not make product proof ready without a current runner assessment. |

### agent-design-scenario

Decompose the behavior into a concrete scenario before protected eval planning.

Full bucket detail is shown because this bucket is not ready for proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-95 | README.md:95 | deterministic | needs-scenario | agent-reviewed | unknown | That turned "did the agent read and follow the repo instructions?" from transcript judgment into a reproducible packet with artifacts another maintainer can reopen. |

### human-align-surfaces

Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest.

Full bucket detail is shown because this bucket is not ready for proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-100 | AGENTS.md:100 | human-auditable | needs-alignment | agent-reviewed | unknown | Cautilus Agent should own routing, sequencing, guardrails, and decision boundaries; the binary should own broad command discovery, help text, scenario catalogs, packet examples, install smoke, and doctor/readiness details. |
| claim-docs-contracts-adapter-contract-md-427 | docs/contracts/adapter-contract.md:427 | human-auditable | needs-alignment | heuristic | unknown | This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file. |
| claim-docs-contracts-adapter-contract-md-446 | docs/contracts/adapter-contract.md:446 | human-auditable | needs-alignment | agent-reviewed | unknown | A named adapter whose eval-test commands produce rich scenario-by-scenario signals should also persist them as files so executor variants and human reviewers can ground their verdicts on the same numbers. |
| claim-docs-guides-cli-md-184 | docs/guides/cli.md:184 | human-auditable | needs-alignment | agent-reviewed | unknown | The product owns the packet boundary and status semantics. |
| claim-docs-guides-cli-md-190 | docs/guides/cli.md:190 | human-auditable | needs-alignment | agent-reviewed | unknown | That keeps persona prompt shaping and result semantics product-owned while backend selection stays adapter-owned. |
| claim-docs-guides-consumer-adoption-md-29 | docs/guides/consumer-adoption.md:29 | human-auditable | needs-alignment | agent-reviewed | unknown | `Cautilus` only owns the generic workflow contract, CLI, and normalization helpers. |
| claim-docs-guides-consumer-adoption-md-83 | docs/guides/consumer-adoption.md:83 | human-auditable | needs-alignment | agent-reviewed | unknown | It should answer "what is the default `Cautilus` evaluation for this repo?" without forcing the operator to mentally sort multiple unrelated workflows. |
| claim-docs-guides-evaluation-process-md-10 | docs/guides/evaluation-process.md:10 | human-auditable | needs-alignment | agent-reviewed | unknown | That seam owns the checked-in case suite, adapter-runner invocation, and chained summary artifacts before the flow returns to packet-level `cautilus evaluate observation` and proposal normalization. |
| claim-docs-guides-evaluation-process-md-270 | docs/guides/evaluation-process.md:270 | human-auditable | needs-alignment | agent-reviewed | unknown | The host still owns raw invocation and transcript capture; `Cautilus` owns the case-suite/runDir workflow, packet-level recommendation, behavior-intent framing, and the direct chain into `discover scenarios normalize skill`. |
| claim-docs-master-plan-md-29 | docs/master-plan.md:29 | human-auditable | needs-alignment | agent-reviewed | unknown | Cautilus owns the generic claim-to-proof workflow; consumer repos own their local fixtures, runners, prompts, wrappers, and policy. |
| claim-docs-master-plan-md-188 | docs/master-plan.md:188 | human-auditable | needs-alignment | heuristic | unknown | Keep widening HTML surfaces only when the packet boundary stays stable and the page meaningfully improves human review; agents should consume durable packets first. |
| claim-docs-contracts-claim-discovery-workflow-md-16 | docs/contracts/claim-discovery-workflow.md:16 | human-auditable | needs-alignment | heuristic | unknown | The binary owns deterministic packet production: scan traversal, extraction-input packets, anchoring validation, and state transitions. |
| claim-docs-contracts-claim-discovery-workflow-md-17 | docs/contracts/claim-discovery-workflow.md:17 | human-auditable | needs-alignment | heuristic | unknown | The Cautilus Agent owns claim extraction (following the product-owned extraction template), evidence reconciliation, and user-facing status. |
| claim-docs-contracts-claim-discovery-workflow-md-60 | docs/contracts/claim-discovery-workflow.md:60 | human-auditable | needs-alignment | agent-reviewed | unknown | The binary must not own LLM provider selection, subagent scheduling, model prompts, review policy, or human conversation. |
| claim-docs-contracts-claim-discovery-workflow-md-65 | docs/contracts/claim-discovery-workflow.md:65 | human-auditable | needs-alignment | heuristic | unknown | The Cautilus Agent should own orchestration that depends on an agent: |
| claim-docs-contracts-claim-discovery-workflow-md-128 | docs/contracts/claim-discovery-workflow.md:128 | human-auditable | needs-alignment | heuristic | unknown | Those findings should be recorded as narrative, catalog, alignment, or documentation work before expecting `discover claims` to emit them by default. |
| claim-docs-contracts-claim-discovery-workflow-md-493 | docs/contracts/claim-discovery-workflow.md:493 | human-auditable | needs-alignment | heuristic | unknown | The binary may provide helper flags such as `discover claims --previous <packet> --refresh-plan`, but the public user-level workflow remains `discover`. |
| claim-docs-contracts-claim-discovery-workflow-md-546 | docs/contracts/claim-discovery-workflow.md:546 | human-auditable | needs-alignment | agent-reviewed | unknown | The status packet should include a `discoveryBoundary` block that says the packet is based on entry documents and linked docs. |
| claim-docs-contracts-claim-discovery-workflow-md-682 | docs/contracts/claim-discovery-workflow.md:682 | human-auditable | needs-alignment | heuristic | unknown | The binary/skill boundary stays clean enough that consumer repos can use the binary plus Cautilus Agent without Cautilus importing host-specific prompts or adapters. |
| claim-docs-contracts-live-run-invocation-batch-md-28 | docs/contracts/live-run-invocation-batch.md:28 | human-auditable | needs-alignment | agent-reviewed | unknown | Raw provider-error interpretation stays consumer-owned. |
| claim-docs-contracts-live-run-invocation-md-160 | docs/contracts/live-run-invocation.md:160 | human-auditable | needs-alignment | agent-reviewed | unknown | The workspace directory contents stay consumer-owned even when `Cautilus` owns the directory allocation and one-time prepare timing. |
| claim-docs-contracts-reporting-md-50 | docs/contracts/reporting.md:50 | deterministic | needs-alignment | agent-reviewed | unknown | When `Cautilus` itself executes adapter-defined mode commands, it should write those command observations into the report input so the final packet preserves how the evidence was gathered. |
| claim-docs-contracts-runner-verification-md-5 | docs/contracts/runner-verification.md:5 | human-auditable | needs-alignment | heuristic | unknown | This contract keeps that judgment packet-shaped and repo-owned instead of teaching the binary to reverse-engineer arbitrary app code. |
| claim-docs-contracts-runner-verification-md-24 | docs/contracts/runner-verification.md:24 | human-auditable | needs-alignment | agent-reviewed | unknown | external substitution: nondeterministic or costly external dependencies can be replaced with deterministic substitutes at the same boundary the product uses |
| claim-docs-contracts-workbench-instance-discovery-md-99 | docs/contracts/workbench-instance-discovery.md:99 | deterministic | needs-alignment | agent-reviewed | unknown | A future live app eval flow can refer to one selected instance by stable id. |
| claim-docs-specs-contracts-adapter-host-ownership-spec-md-13 | docs/specs/contracts/adapter-host-ownership.spec.md:13 | human-auditable | needs-alignment | heuristic | unknown | Cautilus owns generic workflow contracts, packet shapes, readiness semantics, behavior-surface vocabulary, and normalization helpers, while host repos own prompts, runners, credentials, model or backend selection, fixtures, and policy. |
| claim-docs-specs-contracts-live-invocation-runtime-spec-md-13 | docs/specs/contracts/live-invocation-runtime.spec.md:13 | human-auditable | needs-alignment | heuristic | unknown | Cautilus owns the generic request and result packet shape and the loop boundary, while the host-owned adapter still owns provider calls, backend flags, route layout, model choice, credentials, and product-specific response semantics. |
| claim-docs-specs-rules-host-owned-execution-spec-md-4 | docs/specs/rules/host-owned-execution.spec.md:4 | human-auditable | needs-alignment | heuristic | unknown | Cautilus owns generic workflow contracts, packet shapes, command boundaries, and evidence routes. |
| claim-docs-specs-rules-vocabulary-consistency-spec-md-3 | docs/specs/rules/vocabulary-consistency.spec.md:3 | human-auditable | needs-alignment | agent-reviewed | unknown | The same product concept should keep the same name in user-facing prose, maintainer specs, CLI JSON, Cautilus Agent guidance, and tests. |
| claim-docs-specs-user-claim-discovery-spec-md-37 | docs/specs/user/claim-discovery.spec.md:37 | human-auditable | needs-alignment | heuristic | unknown | If an important behavior appears only outside that boundary, such as in code, transcripts, issues, or private operator memory, Cautilus Agent or a human can raise it as a documentation, catalog, or alignment gap. |
| claim-docs-specs-user-claim-discovery-spec-md-122 | docs/specs/user/claim-discovery.spec.md:122 | human-auditable | needs-alignment | heuristic | unknown | Without the hint the same document yields zero candidates, which keeps the lexicon adapter-owned rather than hardcoded. |
| claim-docs-specs-user-ownership-spec-md-3 | docs/specs/user/ownership.spec.md:3 | human-auditable | needs-alignment | agent-reviewed | unknown | Before Cautilus can evaluate behavior honestly, the user needs host-specific prompts, models, credentials, runtime wiring, and acceptance policy to stay in the host repo. |
| claim-docs-specs-user-ownership-spec-md-4 | docs/specs/user/ownership.spec.md:4 | human-auditable | needs-alignment | heuristic | unknown | Using the `cautilus init adapter`, `cautilus doctor adapter`, and `cautilus doctor` CLI commands with the `cautilus-agent` skill, a user can keep host-owned execution in place while Cautilus standardizes workflow packets and boundaries. |
| claim-docs-contracts-claim-extraction-template-md-39 | docs/contracts/claim-extraction-template.md:39 | human-auditable | needs-alignment | heuristic | unknown | The binary owns `sourceInventory`, `sourceGraph`, `effectiveScanScope`, git commit, and per-source content hashes in every mode. |
| claim-docs-contracts-claim-extraction-template-md-299 | docs/contracts/claim-extraction-template.md:299 | human-auditable | needs-alignment | heuristic | unknown | `skills/cautilus-agent/SKILL.md` stays within the 180-nonempty-line disclosure budget when the agent flow is updated; binary-owned detail (packet examples, command catalogs) belongs to the binary's help and docs per the progressive-disclosure rule. |
| claim-docs-contracts-claim-extraction-template-md-306 | docs/contracts/claim-extraction-template.md:306 | human-auditable | needs-alignment | heuristic | unknown | (`--allow-stale-sources` can apply a packet whose excerpts no longer anchor against drifted current content; the drift is recorded in `extractionAudit` and surfaces as stale-anchor findings in `validate`.) |
| claim-docs-contracts-facet-decomposition-md-56 | docs/contracts/facet-decomposition.md:56 | human-auditable | needs-alignment | heuristic | unknown | Repo-specific classification knowledge must not accumulate as hardcoded engine rules; it belongs in adapter-owned `claim_discovery.classification_hints`, proposed by the Cautilus Agent from an initial scan and ratified by the maintainer. |
| claim-docs-contracts-realsurface-judge-convergence-md-45 | docs/contracts/realsurface-judge-convergence.md:45 | human-auditable | needs-alignment | heuristic | unknown | FD4 — attach via adapter-owned enrichment; the generic runtime runner stays pure. |
| claim-docs-contracts-skill-surface-judge-convergence-md-114 | docs/contracts/skill-surface-judge-convergence.md:114 | human-auditable | needs-alignment | heuristic | unknown | The generic Go engine extension must stay generic verdict-compositing symmetric with the instruction surface; no repo-specific judge or facet logic enters the engine or the generic runtime runner, and the judge half stays in adapter-owned `scripts/`. |
| claim-docs-contracts-skill-surface-judge-convergence-md-150 | docs/contracts/skill-surface-judge-convergence.md:150 | human-auditable | needs-alignment | heuristic | unknown | The critique confirmed FD5's boundary-honesty claim (the reused Go helpers only read and count a structured verdict; all facet computation stays in the `.mjs` harness) and the no-manufacturing/sequencing discipline. |
| claim-skills-cautilus-agent-skill-md-130 | skills/cautilus-agent/SKILL.md:130 | human-auditable | needs-alignment | heuristic | unknown | Maintainer-facing claims may use internal terms, but they must stay aligned with the user-facing claim specs and preserve source refs, proof route, evidence status, and next action. |

### human-confirm-or-decompose

Confirm, decompose, or accept a human-auditable claim before treating it as proven.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-readme-md-59 | README.md:59 | human-auditable | ready-for-proof | heuristic | unknown | Raw `discover claims` packets remain the high-recall, source-ref-backed proof-planning input, not the primary document a user should review. |
| claim-docs-specs-index-spec-md-105 | docs/specs/index.spec.md:105 | human-auditable | ready-for-proof | heuristic | unknown | A `gap` means missing or weak evidence that stays visible. |
| claim-docs-specs-user-index-spec-md-27 | docs/specs/user/index.spec.md:27 | human-auditable | ready-for-proof | heuristic | unknown | Evidence Gaps (evidence-gaps.spec.md): discovered or reviewed promises should not be treated as satisfied until valid evidence is attached, and missing or weak evidence should remain visible until the claim is proven, narrowed, deferred, or removed. |
| claim-docs-specs-user-reviewable-artifacts-spec-md-21 | docs/specs/user/reviewable-artifacts.spec.md:21 | human-auditable | ready-for-proof | heuristic | unknown | A user can read generated views without losing the packet source of truth. |
| claim-docs-contracts-claim-discovery-workflow-md-92 | docs/contracts/claim-discovery-workflow.md:92 | human-auditable | ready-for-proof | heuristic | unknown | In other repos, the same rule should be driven by the repo's adapter, README, and source docs rather than by Cautilus-specific command names. |

### split-or-defer

Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification.

Full bucket detail is shown because this bucket is not ready for proof.

| Claim | Source | Proof | Readiness | Review | Evidence | Summary |
| --- | --- | --- | --- | --- | --- | --- |
| claim-agents-md-12 | AGENTS.md:12 | human-auditable | blocked | agent-reviewed | unknown | Deterministic behavior belongs in code, scripts, adapters, tests, and specs. |
| claim-agents-md-29 | AGENTS.md:29 | human-auditable | blocked | agent-reviewed | unknown | `Cautilus` owns generic intentful behavior evaluation workflow contracts. |
| claim-agents-md-32 | AGENTS.md:32 | human-auditable | blocked | agent-reviewed | unknown | The long-term direction is intent-first and intentful behavior evaluation: prompts can change if the evaluated behavior gets better. |
| claim-agents-md-68 | AGENTS.md:68 | human-auditable | blocked | agent-reviewed | unknown | Keep this block short. Detailed routing belongs in installed skill metadata and `find-skills` output, not in a long checked-in catalog. |
| claim-agents-md-95 | AGENTS.md:95 | human-auditable | blocked | agent-reviewed | unknown | While implementing, any bug, error, regression, or unexpected behavior routes to `charness:debug` before further fixes. |
| claim-agents-md-101 | AGENTS.md:101 | human-auditable | blocked | agent-reviewed | unknown | When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available. |
| claim-readme-md-142 | README.md:142 | human-auditable | blocked | heuristic | unknown | The longer-term direction is close to the workflow philosophy behind DSPy: prompts can change as long as the evaluated behavior survives. |
| claim-docs-contracts-adapter-contract-md-494 | docs/contracts/adapter-contract.md:494 | human-auditable | blocked | heuristic | unknown | If a checked-in wrapper can observe provider cost or token usage, let it emit an optional `telemetry` object in the structured verdict payload instead of hiding that data in stderr text. |
| claim-docs-contracts-adapter-contract-md-559 | docs/contracts/adapter-contract.md:559 | human-auditable | blocked | heuristic | unknown | Past runs showed some CLIs can reject schemas that declare object properties without also listing them in `required`, even when plain JSON Schema would allow them as optional. |
| claim-docs-contracts-adapter-contract-md-561 | docs/contracts/adapter-contract.md:561 | human-auditable | blocked | heuristic | unknown | Past sessions showed `codex exec` can emit skill-load errors on stderr while still returning a successful exit code. |
| claim-docs-guides-evaluation-process-md-304 | docs/guides/evaluation-process.md:304 | human-auditable | blocked | agent-reviewed | unknown | Past sessions showed `codex exec` can emit fatal skill-loading errors on stderr while the final process exit still looks successful. |
| claim-docs-guides-evaluation-process-md-308 | docs/guides/evaluation-process.md:308 | human-auditable | blocked | agent-reviewed | unknown | Past sessions showed that overly aggressive effort overrides can conflict with tool surfaces that the prompt or skill still needs. |
| claim-docs-guides-evaluation-process-md-317 | docs/guides/evaluation-process.md:317 | human-auditable | blocked | agent-reviewed | unknown | Past sessions showed `--bare` can disable the local OAuth or keychain path and fail with `Not logged in`. |
| claim-docs-guides-evaluation-process-md-320 | docs/guides/evaluation-process.md:320 | human-auditable | blocked | agent-reviewed | unknown | In JSON mode, `claude -p` can wrap the verdict under `structured_output` instead of printing the schema payload as the top-level object. |
| claim-docs-guides-evaluation-process-md-322 | docs/guides/evaluation-process.md:322 | human-auditable | blocked | agent-reviewed | unknown | Past sessions showed `claude -p` can look silent for a while and tempt operators into manual polling or abort loops. |
| claim-docs-master-plan-md-32 | docs/master-plan.md:32 | human-auditable | blocked | agent-reviewed | unknown | The product surface should keep following the same discipline as `charness`: expose the user's intent at the public command boundary, keep tool-specific mechanics underneath it, and preserve durable artifacts that another agent can resume. |
| claim-docs-master-plan-md-91 | docs/master-plan.md:91 | human-auditable | blocked | agent-reviewed | unknown | Their public command namespace is `eval live`; the `workbench` name is reserved for a possible future GUI where operators can browse and edit claims, scenarios, and evidence. |
| claim-docs-contracts-claim-discovery-workflow-md-47 | docs/contracts/claim-discovery-workflow.md:47 | human-auditable | blocked | agent-reviewed | unknown | The binary should own deterministic behavior that can be rerun without model access: |
| claim-docs-contracts-claim-discovery-workflow-md-77 | docs/contracts/claim-discovery-workflow.md:77 | human-auditable | blocked | agent-reviewed | unknown | This keeps the product agent-first without making the binary a host-specific agent runtime. |
| claim-docs-contracts-claim-discovery-workflow-md-212 | docs/contracts/claim-discovery-workflow.md:212 | human-auditable | blocked | agent-reviewed | unknown | It should also show the deterministic bounds that will be applied: |
| claim-docs-contracts-claim-discovery-workflow-md-220 | docs/contracts/claim-discovery-workflow.md:220 | human-auditable | blocked | agent-reviewed | unknown | Cautilus Agent should ask the user to confirm or adjust that scope. |
| claim-docs-contracts-claim-discovery-workflow-md-288 | docs/contracts/claim-discovery-workflow.md:288 | human-auditable | blocked | agent-reviewed | unknown | Broad positioning or aggregate product promises should stay `human-auditable` and `verificationReadiness=blocked` until they are decomposed into concrete deterministic checks, scenario candidates, or Cautilus eval claims. |
| claim-docs-contracts-claim-discovery-workflow-md-289 | docs/contracts/claim-discovery-workflow.md:289 | human-auditable | blocked | heuristic | unknown | The claim should remain visible in the packet, but it should not become a fixture plan by default because one passing fixture would overclaim the umbrella promise. |
| claim-docs-contracts-claim-discovery-workflow-md-293 | docs/contracts/claim-discovery-workflow.md:293 | human-auditable | blocked | agent-reviewed | unknown | Ownership-boundary explanations, such as product-owned versus adapter-owned responsibilities, should stay `human-auditable` and `needs-alignment` until the matching docs, code, adapters, and tests are reconciled. |
| claim-docs-contracts-claim-discovery-workflow-md-295 | docs/contracts/claim-discovery-workflow.md:295 | human-auditable | blocked | agent-reviewed | unknown | Command, packet, runner, and readiness statements should prefer deterministic proof unless they explicitly depend on model or agent behavior. |
| claim-docs-contracts-claim-discovery-workflow-md-298 | docs/contracts/claim-discovery-workflow.md:298 | human-auditable | blocked | heuristic | unknown | Historical observation and provider-caveat statements can inform future scenarios, but they should stay `human-auditable` and `blocked` until promoted into a concrete regression claim. |
| claim-docs-contracts-claim-discovery-workflow-md-358 | docs/contracts/claim-discovery-workflow.md:358 | human-auditable | blocked | agent-reviewed | unknown | `verificationReadiness=needs-alignment` means at least two truth surfaces must be reconciled before proof would be honest. |
| claim-docs-contracts-claim-discovery-workflow-md-707 | docs/contracts/claim-discovery-workflow.md:707 | human-auditable | blocked | agent-reviewed | unknown | The binary should remain deterministic and provider-neutral. |
| claim-docs-contracts-runner-readiness-md-55 | docs/contracts/runner-readiness.md:55 | human-auditable | blocked | agent-reviewed | unknown | A runner is a bounded headless command that takes product-readable input and writes a Cautilus-readable observed packet. |
| claim-docs-contracts-runner-readiness-md-348 | docs/contracts/runner-readiness.md:348 | human-auditable | blocked | agent-reviewed | unknown | The skill may guide runner creation, but reusable deterministic behavior belongs in code, adapters, packets, and tests. |
| claim-docs-contracts-scenario-history-md-3 | docs/contracts/scenario-history.md:3 | human-auditable | blocked | agent-reviewed | unknown | `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time. |
| claim-docs-contracts-workbench-instance-discovery-md-100 | docs/contracts/workbench-instance-discovery.md:100 | human-auditable | blocked | agent-reviewed | unknown | The product can render a human-facing instance chooser without learning consumer-native labels itself. |
| claim-docs-specs-contracts-binary-skill-boundary-spec-md-17 | docs/specs/contracts/binary-skill-boundary.spec.md:17 | human-auditable | blocked | agent-reviewed | unknown | The binary owns deterministic command execution, packet schemas, help text, and reusable artifacts. |
| claim-docs-contracts-realsurface-judge-convergence-md-90 | docs/contracts/realsurface-judge-convergence.md:90 | human-auditable | blocked | heuristic | unknown | Any bug, error, or regression encountered routes to `charness:debug` before further fixes. |
| claim-skills-cautilus-agent-skill-md-22 | skills/cautilus-agent/SKILL.md:22 | human-auditable | blocked | agent-reviewed | unknown | The binary owns command discovery, packet examples, deterministic scans, validation, and reusable evaluation artifacts. |

## Review Results

Active updates still match the current claim packet; superseded updates are historical and omitted from the detail tables below.

| Packet | Mode | Reviewer | Clusters | Active | Superseded | Proof | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| .cautilus/claims/review-result-agent-design-scenario-proposals-2026-05-17.json | - | - | 1 | 6 | 0 | cautilus-eval: 6 | ready-for-proof: 6 |
| .cautilus/claims/review-result-agent-plan-cautilus-eval-2026-05-04.json | parallel-agent-review | - | 1 | 1 | 2 | deterministic: 1 | needs-alignment: 1 |
| .cautilus/claims/review-result-agent-status-safe-branch-catalog-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-canonical-spec-curation-flow-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-contract-binary-preflight-review-boundary-2026-05-17.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-contract-canonical-spec-curation-before-hitl-2026-05-17.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-contract-claim-discovery-proof-plan-2026-05-17.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-contract-reporting-telemetry-packets-2026-05-17.json | - | - | 1 | 5 | 0 | deterministic: 5 | needs-alignment: 1, ready-for-proof: 4 |
| .cautilus/claims/review-result-contract-runner-readiness-packets-2026-05-17.json | - | - | 1 | 5 | 0 | deterministic: 5 | ready-for-proof: 5 |
| .cautilus/claims/review-result-current-deterministic-proof-batch-2026-05-03.json | - | - | 1 | 4 | 3 | deterministic: 2, human-auditable: 2 | blocked: 2, ready-for-proof: 2 |
| .cautilus/claims/review-result-current-dev-skill-dogfood-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-current-eval-surfaces-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-deterministic-proof-batch-2026-05-04.json | - | - | 1 | 3 | 1 | deterministic: 3 | ready-for-proof: 3 |
| .cautilus/claims/review-result-deterministic-ready-heuristic-2026-05-03.json | - | - | 3 | 6 | 4 | deterministic: 5, human-auditable: 1 | blocked: 1, ready-for-proof: 5 |
| .cautilus/claims/review-result-eval-bucket-user-a-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-eval-bucket-user-b-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-eval-bucket-user-c-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-eval-heuristic-batch-2026-05-03.json | - | - | 1 | 1 | 5 | human-auditable: 1 | needs-alignment: 1 |
| .cautilus/claims/review-result-evidence-active-run-and-claim-discover-2026-05-03.json | - | - | 1 | 1 | 1 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-claim-cli-packet-boundary-2026-05-11.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-evidence-claim-workflow-canonical-review-input-2026-05-11.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-consumer-adoption-readiness-and-intent-vocabulary-2026-05-17.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-consumer-doctor-onboarding-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-consumer-surface-alias-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-dev-skill-dogfood.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-evidence-durable-packets-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-evidence-evaluation-process-artifacts-2026-05-03.json | - | - | 1 | 1 | 1 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-evaluation-process-compare-paths-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-guides-cli-doctor-refresh-boundaries-2026-05-16.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-evidence-improve-search-sparse-evidence-block-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-live-run-workspace-boundary-2026-05-03.json | - | - | 1 | 2 | 0 | deterministic: 2 | ready-for-proof: 2 |
| .cautilus/claims/review-result-evidence-master-plan-claim-discover-proof-plan-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-master-plan-gates-consumer-smoke-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-master-plan-packet-routes-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-on-demand-test-gate-2026-05-16.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-proof-class-downstream-summary-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-readme-spec-report-renderer-independence-2026-05-16.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-evidence-remaining-stale-claims-2026-05-11.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-evidence-review-packet-boundary-2026-05-16.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-review-variants-read-mostly-2026-05-17.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-runner-readiness-branch-shape-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-evidence-runner-readiness-schema-fields-2026-05-03.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-family-b-dev-skill-deterministic-proof-2026-05-20.json | - | - | 1 | 1 | 1 | cautilus-eval: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-final-deterministic-proof-debt-2026-05-03.json | - | - | 1 | 1 | 1 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-final-deterministic-queue-2026-05-17.json | - | - | 1 | 8 | 0 | deterministic: 8 | ready-for-proof: 8 |
| .cautilus/claims/review-result-hitl-claim-review-boundary-2026-05-02.json | hitl-decision-cards | human-maintainer | 1 | 1 | 2 | cautilus-eval: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-hitl-priority-reset-2026-05-03.json | hitl-decision-cards | human-maintainer | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-human-align-action-bucket.json | action-bucket-focused-review | codex-current-agent | 3 | 4 | 3 | human-auditable: 4 | needs-alignment: 4 |
| .cautilus/claims/review-result-human-confirm-action-bucket.json | action-bucket-focused-review | codex-current-agent | 1 | 1 | 5 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-improve-artifact-runtime-fingerprint-2026-05-17.json | - | - | 1 | 5 | 0 | deterministic: 5 | ready-for-proof: 5 |
| .cautilus/claims/review-result-llm-batch1.json | - | - | 1 | 1 | 1 | deterministic: 1 | needs-scenario: 1 |
| .cautilus/claims/review-result-llm-batch3.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-llm-batch4.json | - | - | 1 | 1 | 0 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-llm-batch5.json | - | - | 4 | 5 | 0 | deterministic: 3, human-auditable: 2 | needs-alignment: 2, ready-for-proof: 3 |
| .cautilus/claims/review-result-llm-batch6.json | - | - | 3 | 7 | 3 | human-auditable: 7 | blocked: 5, needs-alignment: 2 |
| .cautilus/claims/review-result-loop1-lane-a.json | - | codex | 0 | 0 | 2 | - | - |
| .cautilus/claims/review-result-loop1-lane-b.json | clusters 4-7 only | codex-lane-b | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-loop2-lane-a.json | - | codex | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-loop2-lane-b.json | clusters 3-5 only | codex-lane-b | 0 | 0 | 2 | - | - |
| .cautilus/claims/review-result-ownership-evidence-gaps-improvement-2026-05-17.json | - | - | 1 | 5 | 0 | deterministic: 5 | ready-for-proof: 5 |
| .cautilus/claims/review-result-policy-claim-reclassification-2026-05-03.json | - | - | 1 | 1 | 0 | human-auditable: 1 | blocked: 1 |
| .cautilus/claims/review-result-readiness-triage-2026-05-10.json | action-bucket-readiness-triage | codex-current-agent | 1 | 2 | 10 | human-auditable: 2 | blocked: 1, needs-alignment: 1 |
| .cautilus/claims/review-result-readiness-triage-replay-2026-06-10.json | id-drift-replay-repair | claude-current-agent | 1 | 2 | 1 | deterministic: 1, human-auditable: 1 | blocked: 1, ready-for-proof: 1 |
| .cautilus/claims/review-result-remaining-deterministic-claims-2026-05-03.json | - | - | 2 | 5 | 4 | deterministic: 4, human-auditable: 1 | needs-alignment: 1, ready-for-proof: 4 |
| .cautilus/claims/review-result-rename-chain-supports-replenish-2026-05-20.json | - | - | 1 | 1 | 0 | unchanged: 1 | unchanged: 1 |
| .cautilus/claims/review-result-reviewable-artifact-workflow-scope-2026-05-17.json | - | - | 1 | 4 | 0 | deterministic: 4 | ready-for-proof: 4 |
| .cautilus/claims/review-result-reviewable-artifacts-proof-gap-2026-05-03.json | - | - | 0 | 0 | 1 | - | - |
| .cautilus/claims/review-result-scenario-proposal-portable-provenance-2026-05-04.json | - | - | 1 | 1 | 0 | deterministic: 1 | ready-for-proof: 1 |
| .cautilus/claims/review-result-spec-binary-skill-boundary-2026-05-17.json | - | - | 1 | 3 | 0 | deterministic: 3 | ready-for-proof: 3 |
| .cautilus/claims/review-result-spec-reviewable-eval-surfaces-2026-05-17.json | - | - | 1 | 5 | 0 | deterministic: 5 | ready-for-proof: 5 |
| .cautilus/claims/review-result-user-claim-discovery-reviewable-artifacts-2026-05-17.json | - | - | 1 | 3 | 0 | deterministic: 2, human-auditable: 1 | needs-alignment: 1, ready-for-proof: 2 |
| .cautilus/claims/review-result-workbench-instance-catalog-contract-2026-05-03.json | - | - | 1 | 2 | 1 | deterministic: 2 | ready-for-proof: 2 |

### .cautilus/claims/review-result-human-align-action-bucket.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-contracts-live-run-invocation-batch-md-28 | human-auditable | needs-alignment | unknown | Confirm the provider-error ownership boundary against live-run packets and adapter docs; split concrete schema checks if needed. |
| claim-docs-contracts-live-run-invocation-md-160 | human-auditable | needs-alignment | unknown | Human-confirm which workspace contents are product-owned versus consumer-owned, then split any observable no-write guarantees into deterministic tests. |
| claim-docs-master-plan-md-29 | human-auditable | needs-alignment | unknown | Human-review the Cautilus-versus-consumer ownership boundary and split executable subclaims into deterministic or eval proof. |
| claim-docs-contracts-claim-discovery-workflow-md-546 | human-auditable | needs-alignment | unknown | Human-confirm the binary/skill ownership boundary, then split executable skill orchestration behavior into dev/skill scenarios. |

### .cautilus/claims/review-result-human-confirm-action-bucket.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-contracts-claim-discovery-workflow-md-220 | human-auditable | blocked | unknown | Split this umbrella overclaim policy into concrete deterministic routing checks before treating it as proof work. |

### .cautilus/claims/review-result-workbench-instance-catalog-contract-2026-05-03.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-contracts-workbench-instance-discovery-md-25 | deterministic | ready-for-proof | satisfied | Keep adapter validation and catalog schema tests current when changing instance discovery fields. |
| claim-docs-contracts-workbench-instance-discovery-md-101 | deterministic | ready-for-proof | satisfied | Keep typed path normalization and catalog schema tests current when adding scenario-adjacent path keys. |

### .cautilus/claims/review-result-user-claim-discovery-reviewable-artifacts-2026-05-17.json

| Claim | Proof | Readiness | Evidence | Next action |
| --- | --- | --- | --- | --- |
| claim-docs-specs-rules-reviewable-artifacts-spec-md-3 | deterministic | ready-for-proof | satisfied | Keep the reviewable artifact projection matrix, renderer tests, and rule-level spec links aligned when adding a new packet-backed readable view. |
| claim-docs-specs-user-claim-discovery-spec-md-6 | deterministic | ready-for-proof | satisfied | Keep claim-discovery CLI tests and Cautilus Agent flow audits synchronized when changing candidate extraction, source refs, curation prompts, or next-work routing. |
| claim-docs-specs-rules-vocabulary-consistency-spec-md-3 | human-auditable | needs-alignment | unknown | Resolve `gap.vocabulary-evidence-bundle` by defining the vocabulary probe scope across user prose, maintainer specs, CLI JSON, Cautilus Agent guidance, and tests, then create `.cautilus/claims/evidence-vocabulary-consistency-current.json` or record an explicit waiver. |

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
- Excludes: .git/**, node_modules/**, dist/**, coverage/**, artifacts/**, charness-artifacts/**, docs/specs/old/**, docs/specs/evidence/claim-evidence-state.md, ...

