# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:925ad8d282df4ba72f166d133fbcf8d70652d09f408638f4c8983578e1259a87
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:b04ec1a59f57a32ab7773ecf6b0f924ee2a0d73e2bd22638f8b46966eaae92d0
- Git state: fresh; stale=no
- Snapshot inspected commit: 4ebd518f4611942eaa86e7909344ff60fe234352
- Packet commit: 4ebd518f4611942eaa86e7909344ff60fe234352
- Changed claim sources: 0
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 142, unknown: 255 |
| Recommended proof | cautilus-eval: 120, deterministic: 177, human-auditable: 100 |
| Proof readiness | blocked: 33, needs alignment: 36, needs scenario: 1, ready for proof: 327 |
| Review | agent-reviewed: 192, heuristic: 204, human-reviewed: 1 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 116 |
| ready for proof | 115 |
| needs scenario | 1 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 5 |
| app/chat | 4 |
| app/prompt | 9 |
| dev/repo | 70 |
| dev/skill | 28 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-readme-md-48 | README.md:48 | dev/repo | ready for proof | heuristic | You can also hand setup to an agent instead of running these steps yourself. |
| claim-readme-md-85 | README.md:85 | dev/skill | ready for proof | heuristic | `Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen. |
| claim-readme-md-96 | README.md:96 | dev/skill | ready for proof | heuristic | That turned "did the agent read and follow the repo instructions?" from transcript judgment into a reproducible packet with artifacts another maintainer can reopen. |
| claim-readme-md-109 | README.md:109 | dev/skill | ready for proof | heuristic | Evaluation uses two top-level surfaces: `dev` for AI-assisted development work such as repo contracts, tools, and skills, and `app` for AI-powered product behavior such as chat, prompt, and service responses. |
| claim-readme-md-122 | README.md:122 | app/chat | ready for proof | agent-reviewed | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-contracts-adapter-contract-md-224 | docs/contracts/adapter-contract.md:224 | dev/repo | ready for proof | heuristic | When an eval run uses `runtime=product`, the adapter-owned command is expected to exercise a headless product path; the runtime label does not make product proof ready without a current runner assessment. |
| claim-docs-contracts-adapter-contract-md-558 | docs/contracts/adapter-contract.md:558 | dev/skill | ready for proof | heuristic | Use `--codex-home-mode isolated` when the eval should not load the operator's `CODEX_HOME` config, plugins, or sessions. |
| claim-docs-guides-cli-md-49 | docs/guides/cli.md:49 | dev/repo | ready for proof | heuristic | For `codex_exec`, `--codex-home-mode isolated` keeps user config and session state out of the eval while `--codex-auth-mode inherit` copies only Codex auth into the isolated home. |

### Scenario Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-docs-specs-promises-ownership-spec-md-7 | docs/specs/promises/ownership.spec.md:7 | surface undecided | needs scenario | agent-reviewed | Before Cautilus can evaluate behavior honestly, the user needs host-specific prompts, models, credentials, runtime wiring, and acceptance policy to stay in the host repo. |

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 142 | satisfied: 142 | agent-reviewed: 142 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 37 | unknown: 37 | agent-reviewed: 2, heuristic: 34, human-reviewed: 1 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 115 | unknown: 115 | agent-reviewed: 6, heuristic: 109 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| agent-design-scenario | agent | 1 | unknown: 1 | agent-reviewed: 1 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 36 | unknown: 36 | agent-reviewed: 15, heuristic: 21 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 33 | unknown: 33 | heuristic: 33 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 33 | unknown: 33 | agent-reviewed: 26, heuristic: 7 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Meaning |
| --- | --- | --- | --- |
| heuristic-review-needed | agent | 204 | Review heuristic labels before spending proof or eval budget. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

