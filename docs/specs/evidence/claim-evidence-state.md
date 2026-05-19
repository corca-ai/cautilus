# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:d2bf250e250c258e334878eb0a8611d0b8fc32c605d14b7e45137bee832ca258
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:21239bb3d1231c0376d3960d0805fce2b1897de53cfeacc87ae24927c8173c12
- Git state: fresh; stale=no
- Snapshot inspected commit: 1c43b1fa720f1d66d29757b28759d110a0dfa1af
- Packet commit: 1c43b1fa720f1d66d29757b28759d110a0dfa1af
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 143, stale: 2, unknown: 216 |
| Recommended proof | cautilus-eval: 124, deterministic: 139, human-auditable: 98 |
| Proof readiness | blocked: 27, needs alignment: 39, ready for proof: 295 |
| Review | agent-reviewed: 193, heuristic: 167, human-reviewed: 1 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 118 |
| ready for proof | 118 |
| needs scenario | 0 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 6 |
| app/chat | 3 |
| app/prompt | 11 |
| dev/repo | 72 |
| dev/skill | 26 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-agents-md-101 | AGENTS.md:101 | dev/repo | ready for proof | agent-reviewed | When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available. |
| claim-readme-md-92 | README.md:92 | dev/skill | ready for proof | heuristic | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-103 | README.md:103 | dev/skill | ready for proof | heuristic | That turned "did the agent read and follow the repo instructions?" from transcript judgment into a reproducible packet with artifacts another maintainer can reopen. |
| claim-readme-md-117 | README.md:117 | dev/skill | ready for proof | heuristic | Evaluation uses two top-level surfaces: `dev` for AI-assisted development work such as repo contracts, tools, and skills, and `app` for AI-powered product behavior such as chat, prompt, and service responses. |
| claim-readme-md-130 | README.md:130 | app/chat | ready for proof | agent-reviewed | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-contracts-adapter-contract-md-209 | docs/contracts/adapter-contract.md:209 | dev/repo | ready for proof | heuristic | When an eval run uses `runtime=product`, the adapter-owned command is expected to exercise a headless product path; the runtime label does not make product proof ready without a current runner assessment. |
| claim-docs-contracts-adapter-contract-md-222 | docs/contracts/adapter-contract.md:222 | dev/repo | ready for proof | heuristic | If omitted, discovery uses the portable fallback group `General product behavior` instead of assuming a product-specific taxonomy. |
| claim-docs-contracts-adapter-contract-md-532 | docs/contracts/adapter-contract.md:532 | dev/skill | ready for proof | heuristic | Use `--codex-home-mode isolated` when the eval should not load the operator's `CODEX_HOME` config, plugins, or sessions. |

### Scenario Samples

No scenario-sample Cautilus eval claims currently require scenario decomposition.

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 143 | satisfied: 143 | agent-reviewed: 142, human-reviewed: 1 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 1 | unknown: 1 | heuristic: 1 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 118 | stale: 1, unknown: 117 | agent-reviewed: 11, heuristic: 107 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| human-align-surfaces | human | 39 | unknown: 39 | agent-reviewed: 21, heuristic: 18 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 33 | stale: 1, unknown: 32 | agent-reviewed: 1, heuristic: 32 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 27 | unknown: 27 | agent-reviewed: 18, heuristic: 9 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Meaning |
| --- | --- | --- | --- |
| heuristic-review-needed | agent | 167 | Review heuristic labels before spending proof or eval budget. |
| stale-evidence | agent | 2 | Refresh or recheck stale evidence before consuming it as proof. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

