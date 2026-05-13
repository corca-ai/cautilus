# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:1ada3c4ca9f95db29567bc34e669c3c5b3cf733c84eefc2c7de15771b5f434cb
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:2691c1048e7adb309d7edba9e12098dca86243a342900345d5db1c1c9e1e4e77
- Git state: fresh; stale=no
- Snapshot current commit: 5e587fcc6ce34f6cf46d45f5c002fa591291d89f
- Packet commit: 5e587fcc6ce34f6cf46d45f5c002fa591291d89f
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 47, stale: 25, unknown: 292 |
| Recommended proof | cautilus-eval: 140, deterministic: 121, human-auditable: 103 |
| Proof readiness | blocked: 18, needs alignment: 45, needs scenario: 13, ready for proof: 288 |
| Review | agent-reviewed: 119, heuristic: 244, human-reviewed: 1 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 133 |
| ready for proof | 120 |
| needs scenario | 13 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 10 |
| app/chat | 5 |
| app/prompt | 10 |
| dev/repo | 79 |
| dev/skill | 29 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-agents-md-26 | AGENTS.md:26 | dev/repo | ready for proof | agent-reviewed | `Cautilus` owns generic intentful behavior evaluation workflow contracts. |
| claim-agents-md-91 | AGENTS.md:91 | dev/repo | ready for proof | agent-reviewed | When a quality or release review asks for evaluator, review, CLI-discovery, or agent-surface proof, verify that the selected adapter can actually run that surface before treating the gate as available. |
| claim-readme-md-106 | README.md:106 | dev/skill | ready for proof | heuristic | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-160 | README.md:160 | dev/skill | ready for proof | agent-reviewed | Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing. |
| claim-readme-md-164 | README.md:164 | dev/skill | ready for proof | agent-reviewed | The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`. |
| claim-readme-md-228 | README.md:228 | dev/skill | ready for proof | heuristic | Agent track — Claude / Codex plugin.** The `cautilus init` step also lands a Cautilus Agent at `.agents/skills/cautilus-agent/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally. |
| claim-docs-contracts-adapter-contract-md-209 | docs/contracts/adapter-contract.md:209 | dev/repo | ready for proof | heuristic | When an eval run uses `runtime=product`, the adapter-owned command is expected to exercise a headless product path; the runtime label does not make product proof ready without a current runner assessment. |
| claim-docs-contracts-adapter-contract-md-222 | docs/contracts/adapter-contract.md:222 | dev/repo | ready for proof | heuristic | If omitted, discovery uses the portable fallback group `General product behavior` instead of assuming a product-specific taxonomy. |

### Scenario Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-readme-md-188 | README.md:188 | app/chat | needs scenario | heuristic | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-master-plan-md-90 | docs/master-plan.md:90 | surface undecided | needs scenario | agent-reviewed | Their public command namespace is `eval live`; the `workbench` name is reserved for a possible future GUI where operators can browse and edit claims, scenarios, and evidence. |
| claim-docs-specs-user-evaluation-spec-md-4 | docs/specs/user/evaluation.spec.md:4 | surface undecided | needs scenario | heuristic | Using the `cautilus evaluate` CLI command and the `cautilus-agent` skill, a user can evaluate behavior across `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces without turning the host repo's runners, prompts, or policy into Cautilus-owned state. |
| claim-docs-specs-user-evaluation-spec-md-25 | docs/specs/user/evaluation.spec.md:25 | surface undecided | needs scenario | heuristic | A user can evaluate behavior without Cautilus taking over host-owned execution. |
| claim-docs-contracts-scenario-history-md-3 | docs/contracts/scenario-history.md:3 | surface undecided | needs scenario | agent-reviewed | `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time. |
| claim-docs-contracts-scenario-history-md-175 | docs/contracts/scenario-history.md:175 | surface undecided | needs scenario | agent-reviewed | Compare runs often need a frozen baseline side so only the candidate reruns. |
| claim-docs-contracts-workbench-instance-discovery-md-87 | docs/contracts/workbench-instance-discovery.md:87 | surface undecided | needs scenario | agent-reviewed | future GUI workbench behavior for browsing and editing claims, scenarios, evidence, and related review state That future workbench should be specified as an interactive product surface, not as the current live app runner seam. |
| claim-docs-specs-user-claim-discovery-spec-md-6 | docs/specs/user/claim-discovery.spec.md:6 | app/chat | needs scenario | heuristic | Using the `cautilus discover claims` CLI command and the `cautilus-agent` skill, a user can turn scattered repo promises into a source-referenced worklist: what Cautilus found, what looks noisy, what may be missing, and what evidence each candidate needs next. |

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 47 | satisfied: 47 | agent-reviewed: 47 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 91 | stale: 17, unknown: 74 | agent-reviewed: 23, heuristic: 68 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 120 | stale: 7, unknown: 113 | agent-reviewed: 14, heuristic: 105, human-reviewed: 1 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| agent-design-scenario | agent | 13 | unknown: 13 | agent-reviewed: 5, heuristic: 8 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 40 | unknown: 40 | agent-reviewed: 19, heuristic: 21 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 35 | stale: 1, unknown: 34 | agent-reviewed: 3, heuristic: 32 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 18 | unknown: 18 | agent-reviewed: 8, heuristic: 10 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Meaning |
| --- | --- | --- | --- |
| heuristic-review-needed | agent | 244 | Review heuristic labels before spending proof or eval budget. |
| stale-evidence | agent | 25 | Refresh or recheck stale evidence before consuming it as proof. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

