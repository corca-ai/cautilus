# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:2a04e8ba4b692bd08eddaa95b1ae79b31dc63791490793dcdfb202c8e06741be
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:c1b389e13fea60cbedc08d926b3004a3a3c9cb64767cef59153c178c04a58cae
- Git state: fresh; stale=no
- Snapshot current commit: c729a90421957649840ac0a158ef843f1af41d9f
- Packet commit: c729a90421957649840ac0a158ef843f1af41d9f
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 82, stale: 12, unknown: 272 |
| Recommended proof | cautilus-eval: 117, deterministic: 149, human-auditable: 100 |
| Proof readiness | blocked: 33, needs alignment: 35, needs scenario: 7, ready for proof: 291 |
| Review | agent-reviewed: 149, heuristic: 216, human-reviewed: 1 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 117 |
| ready for proof | 111 |
| needs scenario | 6 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 5 |
| app/chat | 2 |
| app/prompt | 10 |
| dev/repo | 72 |
| dev/skill | 28 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-agents-md-79 | AGENTS.md:79 | dev/repo | ready for proof | agent-reviewed | Cautilus Agent should own routing, sequencing, guardrails, and decision boundaries; the binary should own broad command discovery, help text, scenario catalogs, packet examples, install smoke, and doctor/readiness details. |
| claim-agents-md-80 | AGENTS.md:80 | dev/repo | ready for proof | agent-reviewed | When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available. |
| claim-readme-md-18 | README.md:18 | dev/skill | ready for proof | heuristic | Host repos can use `cautilus eval test`, `cautilus eval evaluate`, and post-run `cautilus eval skill-experiment compare` with checked-in fixtures, host-owned adapters, preserved task packets, and the current evaluation and skill-experiment report packets. |
| claim-readme-md-106 | README.md:106 | dev/skill | ready for proof | heuristic | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-160 | README.md:160 | dev/skill | ready for proof | agent-reviewed | Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing. |
| claim-readme-md-164 | README.md:164 | dev/skill | ready for proof | agent-reviewed | The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`. |
| claim-readme-md-228 | README.md:228 | dev/skill | ready for proof | heuristic | Agent track — Claude / Codex plugin.** The `cautilus install` step also lands a Cautilus Agent at `.agents/skills/cautilus-agent/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally. |
| claim-docs-cli-reference-md-312 | docs/cli-reference.md:312 | dev/skill | ready for proof | heuristic | `cautilus eval skill-experiment compare` emits `cautilus.skill_clone_experiment_report.v1` with `variant_ran`, baseline-versus-variant delta, rubric match, source coverage delta, isolation notes, and a promotion recommendation. |

### Scenario Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-readme-md-188 | README.md:188 | app/chat | needs scenario | heuristic | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-specs-user-evaluation-spec-md-4 | docs/specs/user/evaluation.spec.md:4 | surface undecided | needs scenario | heuristic | Using the `cautilus eval` CLI command and the `cautilus-agent` skill, a user can evaluate behavior across `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces without turning the host repo's runners, prompts, or policy into Cautilus-owned state. |
| claim-docs-specs-user-evaluation-spec-md-25 | docs/specs/user/evaluation.spec.md:25 | surface undecided | needs scenario | heuristic | A user can evaluate behavior without Cautilus taking over host-owned execution. |
| claim-docs-specs-model-promise-ledger-spec-md-16 | docs/specs/model/promise-ledger.spec.md:16 | surface undecided | needs scenario | heuristic | \[Bounded Optimization\] (optimization.spec.md): Cautilus improves a selected behavior target under explicit budget, protected checks, and held-out evidence. |
| claim-docs-specs-user-optimization-spec-md-23 | docs/specs/user/optimization.spec.md:23 | surface undecided | needs scenario | heuristic | A user can improve behavior while preserving protected checks, held-out evidence, and explicit budget. |
| claim-docs-specs-model-optimization-spec-md-5 | docs/specs/model/optimization.spec.md:5 | surface undecided | needs scenario | heuristic | Bounded Optimization improves a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts. |

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 82 | satisfied: 82 | agent-reviewed: 82 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 66 | stale: 9, unknown: 57 | agent-reviewed: 19, heuristic: 47 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 111 | stale: 3, unknown: 108 | agent-reviewed: 7, heuristic: 103, human-reviewed: 1 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| agent-design-scenario | agent | 7 | unknown: 7 | agent-reviewed: 1, heuristic: 6 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 35 | unknown: 35 | agent-reviewed: 17, heuristic: 18 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 32 | unknown: 32 | heuristic: 32 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 33 | unknown: 33 | agent-reviewed: 23, heuristic: 10 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Meaning |
| --- | --- | --- | --- |
| heuristic-review-needed | agent | 216 | Review heuristic labels before spending proof or eval budget. |
| stale-evidence | agent | 12 | Refresh or recheck stale evidence before consuming it as proof. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

