# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:db16c3dc6b602e7ea04b5fd4f6d8b3a25a5675a84b0582afc95cede1307fc544
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:172d0f3392120eb0082aff0e15a0c98151a1da2a921af5df0f22d5bba1a7a49f
- Git state: fresh; stale=no
- Snapshot inspected commit: 7cdfe8f37a3fb59442d8acf49e8c26f076bd33ff
- Packet commit: 7cdfe8f37a3fb59442d8acf49e8c26f076bd33ff
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 148, unknown: 235 |
| Recommended proof | cautilus-eval: 114, deterministic: 166, human-auditable: 103 |
| Proof readiness | blocked: 36, needs alignment: 37, ready for proof: 310 |
| Review | agent-reviewed: 203, heuristic: 178, human-reviewed: 2 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 109 |
| ready for proof | 109 |
| needs scenario | 0 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 6 |
| app/chat | 4 |
| app/prompt | 9 |
| dev/repo | 68 |
| dev/skill | 22 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-readme-md-102 | README.md:102 | dev/skill | ready for proof | heuristic | That turned "did the agent read and follow the repo instructions?" from transcript judgment into a reproducible packet with artifacts another maintainer can reopen. |
| claim-readme-md-116 | README.md:116 | dev/skill | ready for proof | heuristic | Evaluation uses two top-level surfaces: `dev` for AI-assisted development work such as repo contracts, tools, and skills, and `app` for AI-powered product behavior such as chat, prompt, and service responses. |
| claim-readme-md-129 | README.md:129 | app/chat | ready for proof | agent-reviewed | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-contracts-adapter-contract-md-221 | docs/contracts/adapter-contract.md:221 | dev/repo | ready for proof | heuristic | When an eval run uses `runtime=product`, the adapter-owned command is expected to exercise a headless product path; the runtime label does not make product proof ready without a current runner assessment. |
| claim-docs-contracts-adapter-contract-md-552 | docs/contracts/adapter-contract.md:552 | dev/skill | ready for proof | heuristic | Use `--codex-home-mode isolated` when the eval should not load the operator's `CODEX_HOME` config, plugins, or sessions. |
| claim-docs-guides-cli-md-55 | docs/guides/cli.md:55 | dev/repo | ready for proof | heuristic | For `codex_exec`, `--codex-home-mode isolated` keeps user config and session state out of the eval while `--codex-auth-mode inherit` copies only Codex auth into the isolated home. |
| claim-docs-guides-cli-md-319 | docs/guides/cli.md:319 | dev/skill | ready for proof | heuristic | `cautilus evaluate skill-experiment` emits `cautilus.skill_clone_experiment_report.v1` with `variant_ran`, baseline-versus-variant delta, rubric match, source coverage delta, isolation notes, and a promotion recommendation. |
| claim-docs-guides-evaluation-process-md-269 | docs/guides/evaluation-process.md:269 | dev/skill | ready for proof | heuristic | `evaluate observation` remains the first-class packet boundary for skill trigger and execution quality. |

### Scenario Samples

No scenario-sample Cautilus eval claims currently require scenario decomposition.

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 148 | satisfied: 148 | agent-reviewed: 147, human-reviewed: 1 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 21 | unknown: 21 | agent-reviewed: 1, heuristic: 19, human-reviewed: 1 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 109 | unknown: 109 | agent-reviewed: 8, heuristic: 101 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| human-align-surfaces | human | 37 | unknown: 37 | agent-reviewed: 17, heuristic: 20 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 32 | unknown: 32 | heuristic: 32 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 36 | unknown: 36 | agent-reviewed: 30, heuristic: 6 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Meaning |
| --- | --- | --- | --- |
| heuristic-review-needed | agent | 178 | Review heuristic labels before spending proof or eval budget. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

