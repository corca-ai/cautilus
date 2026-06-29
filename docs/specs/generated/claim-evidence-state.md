# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:e22edeeb033fb95f7300b664a9616fa9b6e6347a1eb72b4966cf93db4fcd8f24
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:9365d865032b0dedb98abadb5d53ddcd6e3a6c42889cae74e57245bf4be9dc46
- Git state: fresh; stale=no
- Snapshot inspected commit: 34df49afd43d26df8edaad6302ae323de9d12857
- Packet commit: 34df49afd43d26df8edaad6302ae323de9d12857
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 142, unknown: 405 |
| Recommended proof | cautilus-eval: 154, deterministic: 247, human-auditable: 146 |
| Proof readiness | blocked: 33, needs alignment: 55, needs scenario: 2, ready for proof: 457 |
| Review | agent-reviewed: 192, heuristic: 354, human-reviewed: 1 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 150 |
| ready for proof | 148 |
| needs scenario | 2 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 6 |
| app/chat | 4 |
| app/prompt | 20 |
| dev/repo | 82 |
| dev/skill | 38 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-agents-md-96 | AGENTS.md:96 | dev/repo | ready for proof | heuristic | When changing the `skills/cautilus-agent/` surface or behavior-steering references, freeze the current consumer intent before broad edits by deciding whether reviewed dogfood, maintained evaluator scenarios, or checked-in scenario review proof will carry the change. |
| claim-readme-md-16 | README.md:16 | dev/repo | ready for proof | heuristic | Cautilus proves its own promises with honest badges (\[the apex spec\] (./docs/specs/index.spec.md)): readiness and claim discovery carry **proven** evidence; behavior evaluation remains **declared** overall because its dev surfaces are proven live but its app surfaces remain explicitly itemized in Proof Debt (`app/chat` has an anonymized external product-log replay plus a blind intent judge but not live app-agent liveness, and `app/prompt` has a fresh backend probe plus a blind intent judge over that probe but not product-runner proof). |
| claim-readme-md-18 | README.md:18 | dev/skill | ready for proof | heuristic | For cross-repo adoption, the bounded evaluation loop is the most ready slice: host repos can use `cautilus evaluate fixture`, `cautilus evaluate observation`, and post-run `cautilus evaluate skill-experiment` with checked-in fixtures, host-owned adapters, preserved task packets, and the current evaluation and skill-experiment report packets. |
| claim-readme-md-48 | README.md:48 | dev/repo | ready for proof | heuristic | You can also hand setup to an agent instead of running these steps yourself. |
| claim-readme-md-85 | README.md:85 | dev/skill | ready for proof | heuristic | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-96 | README.md:96 | dev/skill | ready for proof | heuristic | That turned "did the agent read and follow the repo instructions?" from transcript judgment into a reproducible packet with artifacts another maintainer can reopen. |
| claim-readme-md-109 | README.md:109 | dev/skill | ready for proof | heuristic | Evaluation uses two top-level surfaces: `dev` for AI-assisted development work such as repo contracts, tools, and skills, and `app` for AI-powered product behavior such as chat, prompt, and service responses. |
| claim-readme-md-122 | README.md:122 | app/chat | ready for proof | agent-reviewed | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |

### Scenario Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-docs-contracts-acceptance-risk-tier-md-180 | docs/contracts/acceptance-risk-tier.md:180 | surface undecided | needs scenario | heuristic | A `cautilus doctor`/readiness skip-gate that, for each `required` target, checks scenario history for a recorded acceptance read or waiver and reports the target blocked when neither exists, and records a waiver-on-skip for `optional`/default targets accepted without a read. This needs the acceptance read record to also carry the target id (today `RecordAcceptanceRead` records only candidate id and scenario ids), so the gate can match a read to a target. `skippable` targets are exempt. |
| claim-docs-specs-promises-ownership-spec-md-7 | docs/specs/promises/ownership.spec.md:7 | surface undecided | needs scenario | agent-reviewed | Before Cautilus can evaluate behavior honestly, the user needs host-specific prompts, models, credentials, runtime wiring, and acceptance policy to stay in the host repo. |

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 142 | satisfied: 142 | agent-reviewed: 142 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 107 | unknown: 107 | agent-reviewed: 2, heuristic: 104, human-reviewed: 1 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 148 | unknown: 148 | agent-reviewed: 6, heuristic: 142 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| agent-design-scenario | agent | 2 | unknown: 2 | agent-reviewed: 1, heuristic: 1 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 55 | unknown: 55 | agent-reviewed: 15, heuristic: 40 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 60 | unknown: 60 | heuristic: 60 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 33 | unknown: 33 | agent-reviewed: 26, heuristic: 7 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Meaning |
| --- | --- | --- | --- |
| heuristic-review-needed | agent | 354 | Review heuristic labels before spending proof or eval budget. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

