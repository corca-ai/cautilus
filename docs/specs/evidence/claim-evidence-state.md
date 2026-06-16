# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:036cb4922b4b8641b9eb1d48260e53315119848672720c97272b7df94292d8e0
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:86d36e94ed3d2770b936671528546701e11940c26125e45605ddd3717626b38a
- Git state: fresh; stale=no
- Snapshot inspected commit: adb488a80357a45c0ac1ff13cb5a59e943bda41c
- Packet commit: adb488a80357a45c0ac1ff13cb5a59e943bda41c
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 149, unknown: 235 |
| Recommended proof | cautilus-eval: 115, deterministic: 166, human-auditable: 103 |
| Proof readiness | blocked: 36, needs alignment: 37, ready for proof: 311 |
| Review | agent-reviewed: 204, heuristic: 178, human-reviewed: 2 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 110 |
| ready for proof | 110 |
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
| dev/skill | 23 |

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
| claim-docs-guides-cli-md-319 | docs/guides/cli.md:319 | dev/skill | ready for proof | heuristic | `cautilus evaluate skill-experiment` emits `cautilus.skill_clone_experiment_report.v1` with `variant_ran`, baseline-versus-variant delta, rubric match, source coverage delta, isolation notes, and a promotion recommendation. |

### Scenario Samples

No scenario-sample Cautilus eval claims currently require scenario decomposition.

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 149 | satisfied: 149 | agent-reviewed: 148, human-reviewed: 1 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 20 | unknown: 20 | agent-reviewed: 1, heuristic: 18, human-reviewed: 1 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 110 | unknown: 110 | agent-reviewed: 8, heuristic: 102 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
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

