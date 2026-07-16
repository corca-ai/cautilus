# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:64be06703d900e0dd96f822d8b286dbc7028d2685f92879374c6d3f0e8d948af
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:388ea77d0ceb4767fe0ad4dc05b0f3a804c3638d7627e67cc824f510cf1d93ae
- Git state: fresh; stale=no
- Snapshot inspected commit: 8fbad961d44ff449a96484464ae10b68d2910fac
- Packet commit: 8fbad961d44ff449a96484464ae10b68d2910fac
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 139, unknown: 437 |
| Recommended proof | cautilus-eval: 170, deterministic: 258, human-auditable: 148 |
| Proof readiness | blocked: 30, needs alignment: 55, needs scenario: 2, ready for proof: 489 |
| Review | agent-reviewed: 186, heuristic: 389, human-reviewed: 1 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 165 |
| ready for proof | 163 |
| needs scenario | 2 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 6 |
| app/chat | 4 |
| app/prompt | 23 |
| dev/repo | 85 |
| dev/skill | 47 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-agents-md-29 | AGENTS.md:29 | dev/repo | ready for proof | agent-reviewed | `Cautilus` owns generic intentful behavior evaluation workflow contracts. |
| claim-agents-md-93 | AGENTS.md:93 | dev/repo | ready for proof | heuristic | When changing the `skills/cautilus-agent/` surface or behavior-steering references, freeze the current consumer intent before broad edits by deciding whether reviewed dogfood, maintained evaluator scenarios, or checked-in scenario review proof will carry the change. |
| claim-agents-md-113 | AGENTS.md:113 | dev/repo | ready for proof | heuristic | Do not report a task-completing goal or slice as done while meaningful implementation, workflow, or artifact work remains uncommitted, unless the deferral is explicit. |
| claim-readme-md-19 | README.md:19 | dev/skill | ready for proof | heuristic | For cross-repo adoption, the bounded evaluation loop is the most ready slice: host repos can use `cautilus evaluate fixture`, `cautilus evaluate observation`, and post-run `cautilus evaluate skill-experiment` with checked-in fixtures, host-owned adapters, preserved task packets, and the current evaluation and skill-experiment report packets. |
| claim-readme-md-49 | README.md:49 | dev/repo | ready for proof | heuristic | You can also hand setup to an agent instead of running these steps yourself. |
| claim-readme-md-86 | README.md:86 | dev/skill | ready for proof | heuristic | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-96 | README.md:96 | dev/skill | ready for proof | heuristic | On this repo's own `AGENTS.md`, an on-demand live proof (`npm run proof:behavior-eval:live`) drives the real agent and asserts it orients on `AGENTS.md` and routes to the durable work skill (`charness:impl`) for the actual task. |
| claim-readme-md-97 | README.md:97 | dev/skill | ready for proof | heuristic | That turned "did the agent read and follow the repo instructions?" from transcript judgment into a reproducible packet with artifacts another maintainer can reopen. |

### Scenario Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-docs-contracts-scenario-history-md-3 | docs/contracts/scenario-history.md:3 | surface undecided | needs scenario | agent-reviewed | `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time. |
| claim-docs-specs-promises-ownership-spec-md-7 | docs/specs/promises/ownership.spec.md:7 | surface undecided | needs scenario | agent-reviewed | Before Cautilus can evaluate behavior honestly, the user needs host-specific prompts, models, credentials, runtime wiring, and acceptance policy to stay in the host repo. |

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 139 | satisfied: 139 | agent-reviewed: 139 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 122 | unknown: 122 | agent-reviewed: 2, heuristic: 119, human-reviewed: 1 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 163 | unknown: 163 | agent-reviewed: 9, heuristic: 154 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| agent-design-scenario | agent | 2 | unknown: 2 | agent-reviewed: 2 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 55 | unknown: 55 | agent-reviewed: 11, heuristic: 44 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 65 | unknown: 65 | heuristic: 65 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 30 | unknown: 30 | agent-reviewed: 23, heuristic: 7 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Sample claims | Meaning |
| --- | --- | --- | --- | --- |
| heuristic-review-needed | agent | 389 | claim-agents-md-65, claim-agents-md-93, claim-agents-md-113, claim-readme-md-6, claim-readme-md-19 | Review heuristic labels before spending proof or eval budget. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

