# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:0bdf0ef1e582b5756bc131d739cbc7883056c890d31ede77c6b1f9d7cf829509
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:b524c0774071addb4bace74048d08183a5c1dcd38aaab9108976b3a8eaccff19
- Git state: fresh; stale=no
- Snapshot inspected commit: 11821ce810e7e015a1b530116224873af3fa3d7f
- Packet commit: 11821ce810e7e015a1b530116224873af3fa3d7f
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 147, unknown: 236 |
| Recommended proof | cautilus-eval: 116, deterministic: 165, human-auditable: 102 |
| Proof readiness | blocked: 35, needs alignment: 37, ready for proof: 311 |
| Review | agent-reviewed: 201, heuristic: 180, human-reviewed: 2 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 111 |
| ready for proof | 111 |
| needs scenario | 0 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 6 |
| app/chat | 4 |
| app/prompt | 9 |
| dev/repo | 69 |
| dev/skill | 23 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-readme-md-45 | README.md:45 | dev/repo | ready for proof | heuristic | You can also hand setup to an agent instead of running these steps yourself. |
| claim-readme-md-82 | README.md:82 | dev/skill | ready for proof | heuristic | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-93 | README.md:93 | dev/skill | ready for proof | heuristic | That turned "did the agent read and follow the repo instructions?" from transcript judgment into a reproducible packet with artifacts another maintainer can reopen. |
| claim-readme-md-106 | README.md:106 | dev/skill | ready for proof | heuristic | Evaluation uses two top-level surfaces: `dev` for AI-assisted development work such as repo contracts, tools, and skills, and `app` for AI-powered product behavior such as chat, prompt, and service responses. |
| claim-readme-md-119 | README.md:119 | app/chat | ready for proof | agent-reviewed | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-contracts-adapter-contract-md-221 | docs/contracts/adapter-contract.md:221 | dev/repo | ready for proof | heuristic | When an eval run uses `runtime=product`, the adapter-owned command is expected to exercise a headless product path; the runtime label does not make product proof ready without a current runner assessment. |
| claim-docs-contracts-adapter-contract-md-552 | docs/contracts/adapter-contract.md:552 | dev/skill | ready for proof | heuristic | Use `--codex-home-mode isolated` when the eval should not load the operator's `CODEX_HOME` config, plugins, or sessions. |
| claim-docs-guides-cli-md-49 | docs/guides/cli.md:49 | dev/repo | ready for proof | heuristic | For `codex_exec`, `--codex-home-mode isolated` keeps user config and session state out of the eval while `--codex-auth-mode inherit` copies only Codex auth into the isolated home. |

### Scenario Samples

No scenario-sample Cautilus eval claims currently require scenario decomposition.

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 147 | satisfied: 147 | agent-reviewed: 146, human-reviewed: 1 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 21 | unknown: 21 | agent-reviewed: 1, heuristic: 19, human-reviewed: 1 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 111 | unknown: 111 | agent-reviewed: 8, heuristic: 103 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| human-align-surfaces | human | 37 | unknown: 37 | agent-reviewed: 17, heuristic: 20 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 32 | unknown: 32 | heuristic: 32 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 35 | unknown: 35 | agent-reviewed: 29, heuristic: 6 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Meaning |
| --- | --- | --- | --- |
| heuristic-review-needed | agent | 180 | Review heuristic labels before spending proof or eval budget. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

