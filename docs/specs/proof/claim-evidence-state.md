# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:769a06ffeb696bcca77ffceb0b1a58656b1da4fd6c008061db9249c761c8ee73
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:dd2e2b29dfc0af67a2d24c9c85ab20f2fdd04850225b0f22eaa48c8ac3505d6c
- Git state: fresh; stale=no
- Snapshot current commit: 99e9ca40ac94b64719bb07ca53d77cad7c82f2c0
- Packet commit: 99e9ca40ac94b64719bb07ca53d77cad7c82f2c0
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 67, stale: 28, unknown: 273 |
| Recommended proof | cautilus-eval: 118, deterministic: 150, human-auditable: 100 |
| Proof readiness | blocked: 33, needs alignment: 34, needs scenario: 6, ready for proof: 295 |
| Review | agent-reviewed: 149, heuristic: 218, human-reviewed: 1 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 118 |
| ready for proof | 112 |
| needs scenario | 6 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 5 |
| app/chat | 3 |
| app/prompt | 10 |
| dev/repo | 74 |
| dev/skill | 26 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-agents-md-79 | AGENTS.md:79 | dev/repo | ready for proof | agent-reviewed | Cautilus Agent should own routing, sequencing, guardrails, and decision boundaries; the binary should own broad command discovery, help text, scenario catalogs, packet examples, install smoke, and doctor/readiness details. |
| claim-agents-md-80 | AGENTS.md:80 | dev/repo | ready for proof | agent-reviewed | When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available. |
| claim-readme-md-18 | README.md:18 | dev/repo | ready for proof | heuristic | Host repos can use `cautilus eval test` and `cautilus eval evaluate` with checked-in fixtures, host-owned adapters, and the current `cautilus.evaluation_input.v1`, `cautilus.evaluation_observed.v1`, and `cautilus.evaluation_summary.v1` packets. |
| claim-readme-md-105 | README.md:105 | dev/skill | ready for proof | heuristic | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-163 | README.md:163 | dev/skill | ready for proof | agent-reviewed | The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`. |
| claim-readme-md-227 | README.md:227 | dev/skill | ready for proof | heuristic | Agent track — Claude / Codex plugin.** The `cautilus install` step also lands a Cautilus Agent at `.agents/skills/cautilus-agent/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally. |
| claim-docs-cli-reference-md-131 | docs/cli-reference.md:131 | dev/repo | ready for proof | agent-reviewed | It emits `cautilus.claim_review_input.v1` and does not call an LLM or mark claims satisfied. |
| claim-docs-cli-reference-md-261 | docs/cli-reference.md:261 | app/chat | ready for proof | agent-reviewed | It links normalized chatbot threads to scenario proposals and coverage hints so an operator can review behavior-eval evidence without browsing every live operator turn. |

### Scenario Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-readme-md-187 | README.md:187 | app/chat | needs scenario | heuristic | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-specs-user-evaluation-spec-md-4 | docs/specs/user/evaluation.spec.md:4 | surface undecided | needs scenario | heuristic | Using the `cautilus eval` CLI command and the `cautilus-agent` skill, a user can evaluate behavior across `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces without turning the host repo's runners, prompts, or policy into Cautilus-owned state. |
| claim-docs-specs-user-evaluation-spec-md-25 | docs/specs/user/evaluation.spec.md:25 | surface undecided | needs scenario | heuristic | A user can evaluate behavior without Cautilus taking over host-owned execution. |
| claim-docs-specs-model-promise-ledger-spec-md-16 | docs/specs/model/promise-ledger.spec.md:16 | surface undecided | needs scenario | heuristic | \[Bounded Optimization\] (optimization.spec.md): Cautilus improves a selected behavior target under explicit budget, protected checks, and held-out evidence. |
| claim-docs-specs-user-optimization-spec-md-23 | docs/specs/user/optimization.spec.md:23 | surface undecided | needs scenario | heuristic | A user can improve behavior while preserving protected checks, held-out evidence, and explicit budget. |
| claim-docs-specs-model-optimization-spec-md-5 | docs/specs/model/optimization.spec.md:5 | surface undecided | needs scenario | heuristic | Bounded Optimization improves a selected behavior target while preserving intent, explicit budget, protected checks, held-out evidence, and reviewable revision artifacts. |

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 67 | satisfied: 67 | agent-reviewed: 67 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 82 | stale: 23, unknown: 59 | agent-reviewed: 33, heuristic: 49 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 112 | stale: 4, unknown: 108 | agent-reviewed: 9, heuristic: 102, human-reviewed: 1 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| agent-design-scenario | agent | 6 | unknown: 6 | heuristic: 6 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 34 | unknown: 34 | agent-reviewed: 16, heuristic: 18 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 34 | stale: 1, unknown: 33 | agent-reviewed: 1, heuristic: 33 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 33 | unknown: 33 | agent-reviewed: 23, heuristic: 10 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Meaning |
| --- | --- | --- | --- |
| heuristic-review-needed | agent | 218 | Review heuristic labels before spending proof or eval budget. |
| stale-evidence | agent | 28 | Refresh or recheck stale evidence before consuming it as proof. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

