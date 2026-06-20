# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:23a9afe6d92db97f66df3294998664f6f3b392659487f7b4749616e107623edd
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:12c816ec89b2a1c9f7d84d218a076c3b8ab888963e08ab6cc08250e617434920
- Git state: fresh; stale=no
- Snapshot inspected commit: b75f1cfdcc73ab7e2103786b3c63683d0fa15557
- Packet commit: b75f1cfdcc73ab7e2103786b3c63683d0fa15557
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 144, unknown: 261 |
| Recommended proof | cautilus-eval: 123, deterministic: 176, human-auditable: 106 |
| Proof readiness | blocked: 35, needs alignment: 42, ready for proof: 328 |
| Review | agent-reviewed: 199, heuristic: 204, human-reviewed: 2 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 119 |
| ready for proof | 119 |
| needs scenario | 0 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 6 |
| app/chat | 4 |
| app/prompt | 9 |
| dev/repo | 73 |
| dev/skill | 27 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-readme-md-48 | README.md:48 | dev/repo | ready for proof | heuristic | You can also hand setup to an agent instead of running these steps yourself. |
| claim-readme-md-85 | README.md:85 | dev/skill | ready for proof | heuristic | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-96 | README.md:96 | dev/skill | ready for proof | heuristic | That turned "did the agent read and follow the repo instructions?" from transcript judgment into a reproducible packet with artifacts another maintainer can reopen. |
| claim-readme-md-109 | README.md:109 | dev/skill | ready for proof | heuristic | Evaluation uses two top-level surfaces: `dev` for AI-assisted development work such as repo contracts, tools, and skills, and `app` for AI-powered product behavior such as chat, prompt, and service responses. |
| claim-readme-md-122 | README.md:122 | app/chat | ready for proof | agent-reviewed | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-contracts-adapter-contract-md-221 | docs/contracts/adapter-contract.md:221 | dev/repo | ready for proof | heuristic | When an eval run uses `runtime=product`, the adapter-owned command is expected to exercise a headless product path; the runtime label does not make product proof ready without a current runner assessment. |
| claim-docs-contracts-adapter-contract-md-552 | docs/contracts/adapter-contract.md:552 | dev/skill | ready for proof | heuristic | Use `--codex-home-mode isolated` when the eval should not load the operator's `CODEX_HOME` config, plugins, or sessions. |
| claim-docs-guides-cli-md-49 | docs/guides/cli.md:49 | dev/repo | ready for proof | heuristic | For `codex_exec`, `--codex-home-mode isolated` keeps user config and session state out of the eval while `--codex-auth-mode inherit` copies only Codex auth into the isolated home. |

### Scenario Samples

No scenario-sample Cautilus eval claims currently require scenario decomposition.

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 144 | satisfied: 144 | agent-reviewed: 144 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 34 | unknown: 34 | agent-reviewed: 1, heuristic: 32, human-reviewed: 1 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 119 | unknown: 119 | agent-reviewed: 8, heuristic: 110, human-reviewed: 1 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| human-align-surfaces | human | 42 | unknown: 42 | agent-reviewed: 18, heuristic: 24 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 31 | unknown: 31 | heuristic: 31 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 35 | unknown: 35 | agent-reviewed: 28, heuristic: 7 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Meaning |
| --- | --- | --- | --- |
| heuristic-review-needed | agent | 204 | Review heuristic labels before spending proof or eval budget. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

