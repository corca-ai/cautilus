# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:71ad5ea847f532893d6c8261bb0559a038d5544e45adedb84946f0031bf004bc
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:4c9d898dd586ffbeac9cbc5080c7a2cafe034b6aac28db6f30ab546bcf053f0f
- Git state: fresh; stale=no
- Snapshot inspected commit: d1c75f43e3e636cfac466c231b4cd145f7269506
- Packet commit: d1c75f43e3e636cfac466c231b4cd145f7269506
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 47, stale: 26, unknown: 286 |
| Recommended proof | cautilus-eval: 123, deterministic: 139, human-auditable: 97 |
| Proof readiness | blocked: 27, needs alignment: 37, needs scenario: 8, ready for proof: 287 |
| Review | agent-reviewed: 123, heuristic: 235, human-reviewed: 1 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 123 |
| ready for proof | 115 |
| needs scenario | 8 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 6 |
| app/chat | 4 |
| app/prompt | 10 |
| dev/repo | 75 |
| dev/skill | 28 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-agents-md-101 | AGENTS.md:101 | dev/repo | ready for proof | agent-reviewed | When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available. |
| claim-readme-md-92 | README.md:92 | dev/skill | ready for proof | heuristic | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-109 | README.md:109 | dev/skill | ready for proof | heuristic | Evaluation uses two top-level surfaces: `dev` for AI-assisted development work such as repo contracts, tools, and skills, and `app` for AI-powered product behavior such as chat, prompt, and service responses. |
| claim-docs-contracts-adapter-contract-md-209 | docs/contracts/adapter-contract.md:209 | dev/repo | ready for proof | heuristic | When an eval run uses `runtime=product`, the adapter-owned command is expected to exercise a headless product path; the runtime label does not make product proof ready without a current runner assessment. |
| claim-docs-contracts-adapter-contract-md-222 | docs/contracts/adapter-contract.md:222 | dev/repo | ready for proof | heuristic | If omitted, discovery uses the portable fallback group `General product behavior` instead of assuming a product-specific taxonomy. |
| claim-docs-contracts-adapter-contract-md-532 | docs/contracts/adapter-contract.md:532 | dev/skill | ready for proof | heuristic | Use `--codex-home-mode isolated` when the eval should not load the operator's `CODEX_HOME` config, plugins, or sessions. |
| claim-docs-guides-cli-md-55 | docs/guides/cli.md:55 | dev/repo | ready for proof | heuristic | For `codex_exec`, `--codex-home-mode isolated` keeps user config and session state out of the eval while `--codex-auth-mode inherit` copies only Codex auth into the isolated home. |
| claim-docs-guides-cli-md-114 | docs/guides/cli.md:114 | dev/repo | ready for proof | agent-reviewed | If repo setup is ready but runner proof is not, that next action can point at runner assessment setup before the first bounded eval loop. |

### Scenario Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-readme-md-122 | README.md:122 | app/chat | needs scenario | heuristic | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-specs-user-evaluation-spec-md-4 | docs/specs/user/evaluation.spec.md:4 | surface undecided | needs scenario | heuristic | Using the `cautilus evaluate` CLI command and the `cautilus-agent` skill, a user can evaluate behavior across `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces without turning the host repo's runners, prompts, or policy into Cautilus-owned state. |
| claim-docs-specs-user-evaluation-spec-md-25 | docs/specs/user/evaluation.spec.md:25 | surface undecided | needs scenario | heuristic | A user can evaluate behavior without Cautilus taking over host-owned execution. |
| claim-docs-contracts-scenario-history-md-181 | docs/contracts/scenario-history.md:181 | surface undecided | needs scenario | agent-reviewed | Compare runs often need a frozen baseline side so only the candidate reruns. |
| claim-docs-specs-user-improvement-spec-md-23 | docs/specs/user/improvement.spec.md:23 | surface undecided | needs scenario | heuristic | A user can improve behavior while preserving protected checks, held-out evidence, and explicit budget. |
| claim-docs-specs-user-improvement-spec-md-41 | docs/specs/user/improvement.spec.md:41 | app/chat | needs scenario | heuristic | Improvement produces a proposal and revision artifact that preserve source files, stop conditions, prioritized evidence, and follow-up checks. |
| claim-docs-specs-ledger-improvement-spec-md-5 | docs/specs/ledger/improvement.spec.md:5 | surface undecided | needs scenario | heuristic | Bounded Improvement improves a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts. |
| claim-docs-specs-ledger-promise-ledger-spec-md-16 | docs/specs/ledger/promise-ledger.spec.md:16 | surface undecided | needs scenario | heuristic | \[Bounded Improvement\] (improvement.spec.md): Cautilus improves a selected behavior target under explicit budget, protected checks, and held-out evidence. |

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 47 | satisfied: 47 | agent-reviewed: 47 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 91 | stale: 18, unknown: 73 | agent-reviewed: 27, heuristic: 64 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 115 | stale: 6, unknown: 109 | agent-reviewed: 9, heuristic: 105, human-reviewed: 1 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| agent-design-scenario | agent | 8 | unknown: 8 | agent-reviewed: 1, heuristic: 7 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 37 | unknown: 37 | agent-reviewed: 19, heuristic: 18 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 34 | stale: 2, unknown: 32 | agent-reviewed: 2, heuristic: 32 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 27 | unknown: 27 | agent-reviewed: 18, heuristic: 9 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Meaning |
| --- | --- | --- | --- |
| heuristic-review-needed | agent | 235 | Review heuristic labels before spending proof or eval budget. |
| stale-evidence | agent | 26 | Refresh or recheck stale evidence before consuming it as proof. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

