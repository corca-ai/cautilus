# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:0603d31ac3d4d4583c6fe4e46503a366e34dbc90a3a7120ce923ad10c8abee69
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:42749ed70b15666368459944a97ea68f7cfb6b1d6a6d7d63a8dae351cb8713f1
- Git state: fresh; stale=no
- Snapshot current commit: 612b580505db8f2e14c6497002043ed6cc74a50c
- Packet commit: 612b580505db8f2e14c6497002043ed6cc74a50c
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 47, stale: 25, unknown: 292 |
| Recommended proof | cautilus-eval: 123, deterministic: 142, human-auditable: 99 |
| Proof readiness | blocked: 30, needs alignment: 36, needs scenario: 8, ready for proof: 290 |
| Review | agent-reviewed: 124, heuristic: 239, human-reviewed: 1 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 123 |
| ready for proof | 116 |
| needs scenario | 7 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 5 |
| app/chat | 4 |
| app/prompt | 10 |
| dev/repo | 74 |
| dev/skill | 30 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-agents-md-96 | AGENTS.md:96 | dev/repo | ready for proof | agent-reviewed | When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available. |
| claim-readme-md-106 | README.md:106 | dev/skill | ready for proof | heuristic | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-160 | README.md:160 | dev/skill | ready for proof | agent-reviewed | Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing. |
| claim-readme-md-164 | README.md:164 | dev/skill | ready for proof | agent-reviewed | The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`. |
| claim-readme-md-228 | README.md:228 | dev/skill | ready for proof | heuristic | Agent track — Claude / Codex plugin.** The `cautilus init` step also lands a Cautilus Agent at `.agents/skills/cautilus-agent/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally. |
| claim-docs-contracts-adapter-contract-md-209 | docs/contracts/adapter-contract.md:209 | dev/repo | ready for proof | heuristic | When an eval run uses `runtime=product`, the adapter-owned command is expected to exercise a headless product path; the runtime label does not make product proof ready without a current runner assessment. |
| claim-docs-contracts-adapter-contract-md-222 | docs/contracts/adapter-contract.md:222 | dev/repo | ready for proof | heuristic | If omitted, discovery uses the portable fallback group `General product behavior` instead of assuming a product-specific taxonomy. |
| claim-docs-contracts-adapter-contract-md-532 | docs/contracts/adapter-contract.md:532 | dev/skill | ready for proof | heuristic | Use `--codex-home-mode isolated` when the eval should not load the operator's `CODEX_HOME` config, plugins, or sessions. |

### Scenario Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-readme-md-188 | README.md:188 | app/chat | needs scenario | heuristic | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-specs-user-evaluation-spec-md-4 | docs/specs/user/evaluation.spec.md:4 | surface undecided | needs scenario | heuristic | Using the `cautilus evaluate` CLI command and the `cautilus-agent` skill, a user can evaluate behavior across `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces without turning the host repo's runners, prompts, or policy into Cautilus-owned state. |
| claim-docs-specs-user-evaluation-spec-md-25 | docs/specs/user/evaluation.spec.md:25 | surface undecided | needs scenario | heuristic | A user can evaluate behavior without Cautilus taking over host-owned execution. |
| claim-docs-specs-user-improvement-spec-md-23 | docs/specs/user/improvement.spec.md:23 | surface undecided | needs scenario | heuristic | A user can improve behavior while preserving protected checks, held-out evidence, and explicit budget. |
| claim-docs-specs-user-improvement-spec-md-41 | docs/specs/user/improvement.spec.md:41 | app/chat | needs scenario | heuristic | Improvement produces a proposal and revision artifact that preserve source files, stop conditions, prioritized evidence, and follow-up checks. |
| claim-docs-specs-ledger-improvement-spec-md-5 | docs/specs/ledger/improvement.spec.md:5 | surface undecided | needs scenario | heuristic | Bounded Improvement improves a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts. |
| claim-docs-specs-ledger-promise-ledger-spec-md-16 | docs/specs/ledger/promise-ledger.spec.md:16 | surface undecided | needs scenario | heuristic | \[Bounded Improvement\] (improvement.spec.md): Cautilus improves a selected behavior target under explicit budget, protected checks, and held-out evidence. |

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 47 | satisfied: 47 | agent-reviewed: 47 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 94 | stale: 17, unknown: 77 | agent-reviewed: 27, heuristic: 67 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 116 | stale: 7, unknown: 109 | agent-reviewed: 10, heuristic: 105, human-reviewed: 1 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| agent-design-scenario | agent | 8 | unknown: 8 | agent-reviewed: 1, heuristic: 7 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 36 | unknown: 36 | agent-reviewed: 18, heuristic: 18 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 33 | stale: 1, unknown: 32 | agent-reviewed: 1, heuristic: 32 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 30 | unknown: 30 | agent-reviewed: 20, heuristic: 10 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Meaning |
| --- | --- | --- | --- |
| heuristic-review-needed | agent | 239 | Review heuristic labels before spending proof or eval budget. |
| stale-evidence | agent | 25 | Refresh or recheck stale evidence before consuming it as proof. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

