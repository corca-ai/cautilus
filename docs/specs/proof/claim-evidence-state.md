# Claim Evidence State

This file is generated from the claim packet and status snapshot.
Do not edit it by hand.
Raw claim evidence state stays in the claim packet; this page is the Evidence State projection for human reading.

## Source Of Truth

- Claims packet: .cautilus/claims/evidenced-typed-runners.json
- Claims hash: sha256:259a3ea5b27c7a36acca980e4c817363cf7208aaa061efcd1d06e4b2a570c42f
- Status snapshot: .cautilus/claims/status-summary.json
- Status hash: sha256:c74536c1b35010d9079d6ee0730d7a6b853db18e86ac382ec3d4e3889227f894
- Git state: stale; stale=yes
- Snapshot current commit: 59a4a9a83cfc6b79ec2dd75a1e8d23336b54ebea
- Packet commit: fe162d3f9e53436e5fed14b706abe9b5bcfe90c2
- Changed claim sources: 33
- Claims packet role: audit source for candidates, labels, evidence status, and count totals
- Status snapshot role: derived command snapshot for git state, action buckets, and cross-cutting signals; its claimSummary must match the claim packet

## Scoreboard

| Dimension | Counts |
| --- | --- |
| Evidence | satisfied: 128, stale: 1, unknown: 194 |
| Recommended proof | cautilus-eval: 104, deterministic: 118, human-auditable: 101 |
| Proof readiness | blocked: 36, needs alignment: 47, needs scenario: 9, ready for proof: 231 |
| Review | agent-reviewed: 175, heuristic: 148 |

## Cautilus Eval Backlog

| Queue | Count |
| --- | --- |
| open Cautilus eval claims | 89 |
| ready for proof | 80 |
| needs scenario | 9 |

Ready for proof means the claim is concrete enough to attach or create the selected proof now; it does not mean a scenario fixture already exists.
Needs scenario means the claim is still too broad, abstract, or surface-ambiguous for honest eval planning and must first be decomposed into one or more observable scenarios.

### By Surface

| Surface | Count |
| --- | --- |
| (none) | 6 |
| app/chat | 1 |
| app/prompt | 10 |
| dev/repo | 49 |
| dev/skill | 23 |

### Proof-Ready Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-docs-contracts-adapter-contract-md-209 | docs/contracts/adapter-contract.md:209 | dev/repo | ready for proof | heuristic | When an eval run uses `runtime=product`, the adapter-owned command is expected to exercise a headless product path; the runtime label does not make product proof ready without a current runner assessment. |
| claim-docs-contracts-adapter-contract-md-222 | docs/contracts/adapter-contract.md:222 | dev/repo | ready for proof | heuristic | If omitted, discovery uses the portable fallback group `General product behavior` instead of assuming a product-specific taxonomy. |
| claim-docs-contracts-adapter-contract-md-432 | docs/contracts/adapter-contract.md:432 | dev/repo | ready for proof | heuristic | point review prompts at the same path so human and machine review can refer to the same compare output |
| claim-docs-contracts-adapter-contract-md-478 | docs/contracts/adapter-contract.md:478 | dev/repo | ready for proof | heuristic | Each review prompt should point at human-visible failure: |
| claim-docs-contracts-review-packet-md-3 | docs/contracts/review-packet.md:3 | dev/repo | ready for proof | heuristic | `Cautilus` should keep review prompts, schemas, compare questions, and report artifacts on one durable boundary before executor variants run. |
| claim-docs-contracts-active-run-md-59 | docs/contracts/active-run.md:59 | dev/repo | ready for proof | heuristic | The manifest is only a recognition marker for the pruner; workflow metadata belongs in per-command artifacts, not in the manifest. |
| claim-docs-contracts-active-run-md-186 | docs/contracts/active-run.md:186 | dev/repo | ready for proof | heuristic | Ambiguous across parallel workflows, silently grabs yesterday's workflow across session gaps, requires a magic freshness threshold. |
| claim-docs-contracts-active-run-md-221 | docs/contracts/active-run.md:221 | dev/repo | ready for proof | heuristic | The command therefore follows the same precedence chain as other workflow-creating helpers (explicit `--output-dir` > `CAUTILUS_RUN_DIR` > auto-materialize under `./.cautilus/runs/`) and emits `Active run: <abs path>` once only when it auto-materializes. |

### Scenario Samples

| Claim | Source | Surface | Readiness | Review | Summary |
| --- | --- | --- | --- | --- | --- |
| claim-readme-md-179 | README.md:179 | app/chat | needs scenario | heuristic | `Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest. |
| claim-docs-master-plan-md-88 | docs/master-plan.md:88 | surface undecided | needs scenario | heuristic | Their public command namespace is `eval live`; the `workbench` name is reserved for a possible future GUI where operators can browse and edit claims, scenarios, and evidence. |
| claim-docs-specs-user-evaluation-spec-md-12 | docs/specs/user/evaluation.spec.md:12 | app/prompt | needs scenario | agent-reviewed | Cautilus supports app-facing behavior, such as prompt, chat, and service-response behavior. |
| claim-docs-contracts-claim-discovery-workflow-md-690 | docs/contracts/claim-discovery-workflow.md:690 | surface undecided | needs scenario | heuristic | `claim show` emits `cautilus.claim_status_summary.v1` and can include bounded `sampleClaims` plus `gitState` for agents that need concrete candidates before choosing the next branch. |
| claim-docs-contracts-scenario-history-md-3 | docs/contracts/scenario-history.md:3 | surface undecided | needs scenario | heuristic | `Cautilus` needs a repo-agnostic way to decide which scenarios run during iterate, held-out, and full-gate evaluation, and how repeated train runs change scenario cadence over time. |
| claim-docs-contracts-scenario-history-md-175 | docs/contracts/scenario-history.md:175 | surface undecided | needs scenario | heuristic | Compare runs often need a frozen baseline side so only the candidate reruns. |
| claim-docs-contracts-workbench-instance-discovery-md-87 | docs/contracts/workbench-instance-discovery.md:87 | surface undecided | needs scenario | heuristic | future GUI workbench behavior for browsing and editing claims, scenarios, evidence, and related review state That future workbench should be specified as an interactive product surface, not as the current live app runner seam. |
| claim-docs-specs-user-optimization-spec-md-7 | docs/specs/user/optimization.spec.md:7 | surface undecided | needs scenario | heuristic | Cautilus supports bounded improvement loops where the target claim, budget, and protected checks are explicit before work begins. |

## Action Buckets

| Bucket | Actor | Count | Evidence | Review | Meaning |
| --- | --- | --- | --- | --- | --- |
| already-satisfied | none | 128 | satisfied: 128 | agent-reviewed: 128 | Proof is already attached and valid under packet semantics. |
| agent-add-deterministic-proof | agent | 2 | stale: 1, unknown: 1 | agent-reviewed: 1, heuristic: 1 | Add or connect unit, lint, build, schema, spec, or CI proof. |
| agent-plan-cautilus-eval | agent | 80 | unknown: 80 | heuristic: 80 | Draft or select Cautilus eval scenarios for proof-ready eval claims. |
| agent-design-scenario | agent | 9 | unknown: 9 | agent-reviewed: 2, heuristic: 7 | Decompose the behavior into a concrete scenario before protected eval planning. |
| human-align-surfaces | human | 47 | unknown: 47 | agent-reviewed: 18, heuristic: 29 | Reconcile conflicting docs, code, adapters, or ownership boundaries before proof would be honest. |
| human-confirm-or-decompose | human | 21 | unknown: 21 | heuristic: 21 | Confirm, decompose, or accept a human-auditable claim before treating it as proven. |
| split-or-defer | human | 36 | unknown: 36 | agent-reviewed: 26, heuristic: 10 | Split broad, historical, provider-caveated, policy-like, or otherwise blocked claims before verification. |

## Cross-Cutting Signals

| Signal | Actor | Count | Meaning |
| --- | --- | --- | --- |
| heuristic-review-needed | agent | 148 | Review heuristic labels before spending proof or eval budget. |
| stale-evidence | agent | 1 | Refresh or recheck stale evidence before consuming it as proof. |

## How This Avoids A Split SOT

- The claim packet is the audit source.
- The status snapshot is regenerated from that packet before this projection is rendered.
- This page is checked by `npm run claims:evidence-state:check` and `npm run verify`.
- Manual proof maps still curate product-level evidence routes; they should link here rather than copying raw claim backlog counts.

