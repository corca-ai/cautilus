# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:17bd375050dc077cc2d780673b5af04ba191bbb8125c345fd380f9b3f2131aef
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:9c3d2986ea79fd472bd06ce4a2aaea474c026ef21ecb5162613174f0c66870d6
- Git state: fresh; stale=no
- Snapshot inspected commit: 39a6bfe3d0f143c645754613ec559a1889189775
- Packet commit: 39a6bfe3d0f143c645754613ec559a1889189775
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 140, unknown: 427 |
| Recommended proof | cautilus-eval: 162, deterministic: 256, human-auditable: 149 |
| Proof readiness | blocked: 31, needs alignment: 55, needs scenario: 2, ready for proof: 479 |
| Review | agent-reviewed: 188, heuristic: 378, human-reviewed: 1 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 157 |
| ready for proof | 155 |
| needs scenario | 2 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 6 |
| app/chat | 4 |
| app/prompt | 22 |
| dev/repo | 86 |
| dev/skill | 39 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-agents-md-29 | AGENTS.md:29 | dev/repo | ready for proof | agent-reviewed | `Cautilus` owns generic intentful behavior evaluation workflow contracts. |
| claim-agents-md-96 | AGENTS.md:96 | dev/repo | ready for proof | heuristic | When changing the `skills/cautilus-agent/` surface or behavior-steering references, freeze the current consumer intent before broad edits by deciding whether reviewed dogfood, maintained evaluator scenarios, or checked-in scenario review proof will carry the change. |
| claim-agents-md-116 | AGENTS.md:116 | dev/repo | ready for proof | heuristic | Do not report a task-completing goal or slice as done while meaningful implementation, workflow, or artifact work remains uncommitted, unless the deferral is explicit. |
| claim-readme-md-19 | README.md:19 | dev/skill | ready for proof | heuristic | For cross-repo adoption, the bounded evaluation loop is the most ready slice: host repos can use `cautilus evaluate fixture`, `cautilus evaluate observation`, and post-run `cautilus evaluate skill-experiment` with checked-in fixtures, host-owned adapters, preserved task packets, and the current evaluation and skill-experiment report packets. |
| claim-readme-md-49 | README.md:49 | dev/repo | ready for proof | heuristic | You can also hand setup to an agent instead of running these steps yourself. |
| claim-readme-md-86 | README.md:86 | dev/skill | ready for proof | heuristic | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-97 | README.md:97 | dev/skill | ready for proof | heuristic | That turned "did the agent read and follow the repo instructions?" from transcript judgment into a reproducible packet with artifacts another maintainer can reopen. |
| claim-readme-md-110 | README.md:110 | dev/skill | ready for proof | heuristic | Evaluation uses two top-level surfaces: `dev` for AI-assisted development work such as repo contracts, tools, and skills, and `app` for AI-powered product behavior such as chat, prompt, and service responses. |

### Scenario Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-docs-contracts-scenario-history-md-3 | docs/contracts/scenario-history.md:3 | surface undecided | needs scenario | agent-reviewed | `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time. |
| claim-docs-specs-promises-ownership-spec-md-7 | docs/specs/promises/ownership.spec.md:7 | surface undecided | needs scenario | agent-reviewed | Before Cautilus can evaluate behavior honestly, the user needs host-specific prompts, models, credentials, runtime wiring, and acceptance policy to stay in the host repo. |

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 140 | satisfied: 140 | agent-reviewed: 140 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 119 | unknown: 119 | agent-reviewed: 2, heuristic: 116, human-reviewed: 1 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 155 | unknown: 155 | agent-reviewed: 9, heuristic: 146 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| agent-design-scenario | agent | 2 | unknown: 2 | agent-reviewed: 2 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 55 | unknown: 55 | agent-reviewed: 11, heuristic: 44 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 65 | unknown: 65 | heuristic: 65 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 31 | unknown: 31 | agent-reviewed: 24, heuristic: 7 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Meaning |
| --- | --- | --- | --- |
| heuristic-review-needed | agent | 378 | Review heuristic labels before spending proof or eval budget. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

