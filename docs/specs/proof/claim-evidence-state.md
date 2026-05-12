# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:537457b503a3336b668143ad3adbb885e9060cc4f376326f9e03768bb3baf569
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:7c4f83b40606434125ab730933f6d2b315366a0ae47bf3e8c96e57100f2309f3
- Git state: fresh; stale=no
- Snapshot current commit: 80323706266cad3ce0c32f7ac7de056486a05c9d
- Packet commit: 80323706266cad3ce0c32f7ac7de056486a05c9d
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 67, stale: 27, unknown: 274 |
| Recommended proof | cautilus-eval: 141, deterministic: 124, human-auditable: 103 |
| Proof readiness | blocked: 18, needs alignment: 45, needs scenario: 13, ready for proof: 292 |
| Review | agent-reviewed: 149, heuristic: 218, human-reviewed: 1 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 132 |
| ready for proof | 119 |
| needs scenario | 13 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 10 |
| app/chat | 5 |
| app/prompt | 10 |
| dev/repo | 79 |
| dev/skill | 28 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-agents-md-26 | AGENTS.md:26 | dev/repo | ready for proof | agent-reviewed | `Cautilus` owns generic intentful behavior evaluation workflow contracts. |
| claim-agents-md-81 | AGENTS.md:81 | dev/repo | ready for proof | agent-reviewed | When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available. |
| claim-readme-md-18 | README.md:18 | dev/skill | ready for proof | heuristic | Host repos can use `cautilus eval test`, `cautilus eval evaluate`, and post-run `cautilus eval skill-experiment compare` with checked-in fixtures, host-owned adapters, preserved task packets, and the current evaluation and skill-experiment report packets. |
| claim-readme-md-106 | README.md:106 | dev/skill | ready for proof | heuristic | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-160 | README.md:160 | dev/skill | ready for proof | agent-reviewed | Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing. |
| claim-readme-md-164 | README.md:164 | dev/skill | ready for proof | agent-reviewed | The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`. |
| claim-readme-md-228 | README.md:228 | dev/skill | ready for proof | heuristic | Agent track — Claude / Codex plugin.** The `cautilus install` step also lands a Cautilus Agent at `.agents/skills/cautilus-agent/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally. |
| claim-docs-contracts-adapter-contract-md-209 | docs/contracts/adapter-contract.md:209 | dev/repo | ready for proof | heuristic | When an eval run uses `runtime=product`, the adapter-owned command is expected to exercise a headless product path; the runtime label does not make product proof ready without a current runner assessment. |

### Scenario Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-readme-md-188 | README.md:188 | app/chat | needs scenario | heuristic | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-master-plan-md-90 | docs/master-plan.md:90 | surface undecided | needs scenario | agent-reviewed | Their public command namespace is `eval live`; the `workbench` name is reserved for a possible future GUI where operators can browse and edit claims, scenarios, and evidence. |
| claim-docs-specs-user-evaluation-spec-md-4 | docs/specs/user/evaluation.spec.md:4 | surface undecided | needs scenario | heuristic | Using the `cautilus eval` CLI command and the `cautilus-agent` skill, a user can evaluate behavior across `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces without turning the host repo's runners, prompts, or policy into Cautilus-owned state. |
| claim-docs-specs-user-evaluation-spec-md-25 | docs/specs/user/evaluation.spec.md:25 | surface undecided | needs scenario | heuristic | A user can evaluate behavior without Cautilus taking over host-owned execution. |
| claim-docs-contracts-scenario-history-md-3 | docs/contracts/scenario-history.md:3 | surface undecided | needs scenario | agent-reviewed | `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time. |
| claim-docs-contracts-scenario-history-md-175 | docs/contracts/scenario-history.md:175 | surface undecided | needs scenario | agent-reviewed | Compare runs often need a frozen baseline side so only the candidate reruns. |
| claim-docs-contracts-workbench-instance-discovery-md-87 | docs/contracts/workbench-instance-discovery.md:87 | surface undecided | needs scenario | agent-reviewed | future GUI workbench behavior for browsing and editing claims, scenarios, evidence, and related review state That future workbench should be specified as an interactive product surface, not as the current live app runner seam. |
| claim-docs-specs-model-promise-ledger-spec-md-16 | docs/specs/model/promise-ledger.spec.md:16 | surface undecided | needs scenario | heuristic | \[Bounded Optimization\] (optimization.spec.md): Cautilus improves a selected behavior target under explicit budget, protected checks, and held-out evidence. |

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 67 | satisfied: 67 | agent-reviewed: 67 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 77 | stale: 20, unknown: 57 | agent-reviewed: 30, heuristic: 47 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 119 | stale: 6, unknown: 113 | agent-reviewed: 13, heuristic: 105, human-reviewed: 1 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| agent-design-scenario | agent | 13 | unknown: 13 | agent-reviewed: 7, heuristic: 6 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 39 | unknown: 39 | agent-reviewed: 21, heuristic: 18 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 35 | stale: 1, unknown: 34 | agent-reviewed: 3, heuristic: 32 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 18 | unknown: 18 | agent-reviewed: 8, heuristic: 10 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Meaning |
| --- | --- | --- | --- |
| heuristic-review-needed | agent | 218 | Review heuristic labels before spending proof or eval budget. |
| stale-evidence | agent | 27 | Refresh or recheck stale evidence before consuming it as proof. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

