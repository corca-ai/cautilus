# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:d8fb0d6a964afcf1cd777fdae60ced83b0ac672d40d7f09d1090e0409fcb98a8
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:0a3945e899781c9a78fd6ceb9d108aadf18875409a233ce000aebe6269f68076
- Git state: fresh; stale=no
- Snapshot inspected commit: bde828e072faca9dad27798ce4fda111b5721006
- Packet commit: bde828e072faca9dad27798ce4fda111b5721006
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 155, unknown: 224 |
| Recommended proof | cautilus-eval: 118, deterministic: 163, human-auditable: 98 |
| Proof readiness | blocked: 37, needs alignment: 33, ready for proof: 309 |
| Review | agent-reviewed: 212, heuristic: 164, human-reviewed: 3 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 112 |
| ready for proof | 112 |
| needs scenario | 0 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 6 |
| app/chat | 4 |
| app/prompt | 11 |
| dev/repo | 66 |
| dev/skill | 25 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-readme-md-92 | README.md:92 | dev/skill | ready for proof | heuristic | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-103 | README.md:103 | dev/skill | ready for proof | heuristic | That turned "did the agent read and follow the repo instructions?" from transcript judgment into a reproducible packet with artifacts another maintainer can reopen. |
| claim-readme-md-117 | README.md:117 | dev/skill | ready for proof | heuristic | Evaluation uses two top-level surfaces: `dev` for AI-assisted development work such as repo contracts, tools, and skills, and `app` for AI-powered product behavior such as chat, prompt, and service responses. |
| claim-readme-md-130 | README.md:130 | app/chat | ready for proof | agent-reviewed | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-contracts-adapter-contract-md-213 | docs/contracts/adapter-contract.md:213 | dev/repo | ready for proof | heuristic | When an eval run uses `runtime=product`, the adapter-owned command is expected to exercise a headless product path; the runtime label does not make product proof ready without a current runner assessment. |
| claim-docs-contracts-adapter-contract-md-541 | docs/contracts/adapter-contract.md:541 | dev/skill | ready for proof | heuristic | Use `--codex-home-mode isolated` when the eval should not load the operator's `CODEX_HOME` config, plugins, or sessions. |
| claim-docs-guides-cli-md-55 | docs/guides/cli.md:55 | dev/repo | ready for proof | heuristic | For `codex_exec`, `--codex-home-mode isolated` keeps user config and session state out of the eval while `--codex-auth-mode inherit` copies only Codex auth into the isolated home. |
| claim-docs-guides-cli-md-316 | docs/guides/cli.md:316 | dev/skill | ready for proof | heuristic | `cautilus evaluate skill-experiment` emits `cautilus.skill_clone_experiment_report.v1` with `variant_ran`, baseline-versus-variant delta, rubric match, source coverage delta, isolation notes, and a promotion recommendation. |

### Scenario Samples

No scenario-sample Cautilus eval claims currently require scenario decomposition.

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 155 | satisfied: 155 | agent-reviewed: 154, human-reviewed: 1 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 11 | unknown: 11 | agent-reviewed: 1, heuristic: 9, human-reviewed: 1 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 112 | unknown: 112 | agent-reviewed: 8, heuristic: 103, human-reviewed: 1 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| human-align-surfaces | human | 33 | unknown: 33 | agent-reviewed: 18, heuristic: 15 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 31 | unknown: 31 | heuristic: 31 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 37 | unknown: 37 | agent-reviewed: 31, heuristic: 6 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Meaning |
| --- | --- | --- | --- |
| heuristic-review-needed | agent | 164 | Review heuristic labels before spending proof or eval budget. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

