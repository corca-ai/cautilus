# Projected Claim State

This page is generated from the fingerprint-keyed claim inventory.
Do not edit it by hand.
The inventory is projected from the HITL-ratified gold set; regenerate with `npm run specdown:claim-state` and check drift with `npm run specdown:claim-state:check`.
It is the single generated tier/verdict/route view the ledger and evidence pages read instead of restating claim state by hand.

## Source Of Truth

- Schema: cautilus.claim_inventory.v1
- Inventory: `.cautilus/specdown/claim-inventory.json`
- Gold set: charness-artifacts/eval-trust/goldset-v2-head/gold-set-proposal.user-product.json
- Track: user-product
- Source packet commit: 558cda76d9bd044a65cf94bce751c8752c69c9dc
- Badge map: docs/specs/audit/claim-badge-map.json
- Proof-route overrides: docs/specs/audit/claim-proof-route-overrides.json
- Apex registry: docs/specs/audit/surface-registry.json

## Claim State Summary

| Dimension | State |
| --- | --- |
| Total gold-set entries | 74 |
| Durable-graded (projected as claims) | 56 |
| Non-graded (prose to retire) | 18 |
| By tier | T1: 7, T2: 41, T3: 8 |
| By maintainer verdict | accept: 54, relabel: 1, rewrite-source: 1 |
| Non-graded by verdict | not-a-claim: 11, retire-source: 5, badly-bounded: 2 |
| T1 claims bound to an apex badge | 7/7 |
| Proof routes overridden | 1 |

## Proof Route Distribution

Ratified proof route over the durable-graded claims (after maintainer overrides).

| Proof route | Claims |
| --- | --- |
| deterministic | 36 |
| cautilus-eval | 9 |
| human-auditable | 11 |

## Headline Claims And Apex Badges

The seven T1 headline claims and the apex badge each binds to.
The badge taxonomy and the gold-set claim taxonomy are related but distinct, so some badges carry no T1 headline claim; that is surfaced in the reconciliation below, not hidden.

| Claim | Badge | Route | Source | Summary |
| --- | --- | --- | --- | --- |
| claim-readme-md-4 | behavior-evaluation | cautilus-eval | README.md:4 | Cautilus lets you pin the behavior that matters, prove it survives every change to prompts/skills/models, and improve it within explicit budgets, whether protecting an AGENTS.md, a single skill, a prompt, or a full agent loop. |
| claim-readme-md-5 | claim-discovery | cautilus-eval | README.md:5 | The three jobs connect: discover declared claims worth proving from selected source docs, verify curated claims through bounded evaluation packets, and improve behavior once the proof surface is honest. |
| claim-readme-md-6 | host-ownership | deterministic | README.md:6 | Cautilus ships as a standalone binary plus Cautilus Agent that a host repo can install without copying another scaffold first. |
| claim-readme-md-67 | claim-discovery | cautilus-eval | README.md:67 | The Cautilus Agent curates the raw discovery packet against the repo: reduce false positives, raise likely missing public promises, and separate in-scope discovery bugs from out-of-scope narrative gaps. |
| claim-readme-md-136 | behavior-evaluation | human-auditable | README.md:136 | Cautilus does not freeze one prompt string as the contract; it treats the behavior under evaluation as the contract (intent-first principle). |
| claim-readme-md-137 | reviewable-artifacts | cautilus-eval | README.md:137 | Cautilus separates iteration from protected validation and keeps evidence reopenable from files (held-out honesty, packet-first principle). |
| claim-readme-md-139 | bounded-improvement | deterministic | README.md:139 | Cautilus keeps search and revision explicitly bounded by budgets, checkpoints, and blocked-readiness conditions (bounded autonomy principle). |

## Apex Badge Reconciliation

How each apex badge's ratified proof route relates to the registry proof class the audit gate consumes.
`route-class-mismatch` and `no-t1-claim` are honest divergences the projection reports read-only; they are inputs to later proof work, not gate failures.

| Badge | Registry proof class | Divergence | Mismatched claims |
| --- | --- | --- | --- |
| readiness | deterministic | no-t1-claim | - |
| claim-discovery | deterministic | route-class-mismatch | claim-readme-md-5, claim-readme-md-67 |
| behavior-evaluation | cautilus-eval | route-class-mismatch | claim-readme-md-136 |
| bounded-improvement | cautilus-eval | route-class-mismatch | claim-readme-md-139 |
| reviewable-artifacts | projected-bundle | route-class-mismatch | claim-readme-md-137 |
| host-ownership | human-auditable | route-class-mismatch | claim-readme-md-6 |
| a-testable-agent | none | no-t1-claim | - |

Divergent badges: 7/7.

## Full Claim Inventory

Every durable-graded claim, in document order within tier.

| Tier | Claim | Verdict | Route | Epic | Badge | Source |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | claim-readme-md-4 | accept | cautilus-eval | APEX | behavior-evaluation | README.md:4 |
| T1 | claim-readme-md-5 | accept | cautilus-eval | APEX | claim-discovery | README.md:5 |
| T1 | claim-readme-md-6 | accept | deterministic | S1-install | host-ownership | README.md:6 |
| T1 | claim-readme-md-67 | accept | cautilus-eval | A2-curation-review | claim-discovery | README.md:67 |
| T1 | claim-readme-md-136 | accept | human-auditable | APEX | behavior-evaluation | README.md:136 |
| T1 | claim-readme-md-137 | accept | cautilus-eval | E2-scenarios-experiments | reviewable-artifacts | README.md:137 |
| T1 | claim-readme-md-139 | accept | deterministic | I1-bounded-improvement | bounded-improvement | README.md:139 |
| T2 | claim-readme-md-8 | relabel | cautilus-eval | A1-orchestration | - | README.md:8 |
| T2 | claim-readme-md-9 | accept | deterministic | S1-install | - | README.md:9 |
| T2 | claim-readme-md-11 | accept | deterministic | S1-install | - | README.md:11 |
| T2 | claim-readme-md-17 | accept | deterministic | E1-evaluate | - | README.md:17 |
| T2 | claim-readme-md-18 | accept | deterministic | E2-scenarios-experiments | - | README.md:18 |
| T2 | claim-readme-md-44 | accept | deterministic | S1-install | - | README.md:44 |
| T2 | claim-readme-md-65 | accept | human-auditable | M1-proven-on-itself | - | README.md:65 |
| T2 | claim-readme-md-66 | accept | deterministic | D1-discovery | - | README.md:66 |
| T2 | claim-readme-md-68 | accept | deterministic | M1-proven-on-itself | - | README.md:68 |
| T2 | claim-readme-md-69 | accept | human-auditable | M1-proven-on-itself | - | README.md:69 |
| T2 | claim-readme-md-75 | accept | deterministic | E1-evaluate | - | README.md:75 |
| T2 | claim-readme-md-76 | accept | deterministic | E1-evaluate | - | README.md:76 |
| T2 | claim-readme-md-91 | accept | deterministic | E1-evaluate | - | README.md:91 |
| T2 | claim-readme-md-92 | accept | human-auditable | E1-evaluate | - | README.md:92 |
| T2 | claim-readme-md-93 | accept | human-auditable | E1-evaluate | - | README.md:93 |
| T2 | claim-readme-md-102 | accept | cautilus-eval | M1-proven-on-itself | - | README.md:102 |
| T2 | claim-readme-md-103 | accept | human-auditable | M1-proven-on-itself | - | README.md:103 |
| T2 | claim-readme-md-112 | accept | deterministic | D1-discovery | - | README.md:112 |
| T2 | claim-readme-md-113 | accept | human-auditable | D1-discovery | - | README.md:113 |
| T2 | claim-readme-md-116 | accept | deterministic | E1-evaluate | - | README.md:116 |
| T2 | claim-readme-md-135 | accept | human-auditable | A1-orchestration | - | README.md:135 |
| T2 | claim-readme-md-138 | accept | deterministic | A2-curation-review | - | README.md:138 |
| T2 | claim-readme-md-142 | accept | human-auditable | APEX | - | README.md:142 |
| T2 | claim-readme-md-147 | accept | deterministic | I1-bounded-improvement | - | README.md:147 |
| T2 | claim-readme-md-154 | accept | deterministic | E1-evaluate | - | README.md:154 |
| T2 | claim-readme-md-155 | accept | deterministic | A1-orchestration | - | README.md:155 |
| T2 | claim-readme-md-158 | accept | deterministic | S1-install | - | README.md:158 |
| T2 | claim-readme-md-159 | accept | deterministic | E1-evaluate | - | README.md:159 |
| T2 | claim-readme-md-162 | accept | deterministic | S2-readiness | - | README.md:162 |
| T2 | claim-docs-contracts-claim-discovery-workflow-md-677 | accept | cautilus-eval | A1-orchestration | - | docs/contracts/claim-discovery-workflow.md:677 |
| T2 | claim-docs-contracts-claim-discovery-workflow-md-678 | accept | cautilus-eval | D1-discovery | - | docs/contracts/claim-discovery-workflow.md:678 |
| T2 | claim-docs-guides-cli-md-11 | accept | deterministic | S1-install | - | docs/guides/cli.md:11 |
| T2 | claim-docs-guides-cli-md-21 | accept | deterministic | S1-install | - | docs/guides/cli.md:21 |
| T2 | claim-docs-guides-cli-md-38 | accept | deterministic | S1-install | - | docs/guides/cli.md:38 |
| T2 | claim-docs-guides-cli-md-45 | accept | human-auditable | S1-install | - | docs/guides/cli.md:45 |
| T2 | claim-docs-guides-cli-md-226 | accept | deterministic | E2-scenarios-experiments | - | docs/guides/cli.md:226 |
| T2 | claim-docs-guides-cli-md-274 | accept | deterministic | E1-evaluate | - | docs/guides/cli.md:274 |
| T2 | claim-docs-guides-cli-md-276 | accept | deterministic | E1-evaluate | - | docs/guides/cli.md:276 |
| T2 | claim-docs-guides-cli-md-280 | accept | deterministic | E1-evaluate | - | docs/guides/cli.md:280 |
| T2 | claim-docs-guides-cli-md-397 | accept | deterministic | E1-evaluate | - | docs/guides/cli.md:397 |
| T2 | claim-docs-guides-cli-md-519 | accept | human-auditable | I1-bounded-improvement | - | docs/guides/cli.md:519 |
| T3 | claim-readme-md-35 | accept | deterministic | S1-install | - | README.md:35 |
| T3 | claim-readme-md-54 | rewrite-source | cautilus-eval | S2-readiness | - | README.md:54 |
| T3 | claim-docs-guides-cli-md-27 | accept | deterministic | S2-readiness | - | docs/guides/cli.md:27 |
| T3 | claim-docs-guides-cli-md-110 | accept | deterministic | S2-readiness | - | docs/guides/cli.md:110 |
| T3 | claim-docs-guides-cli-md-218 | accept | deterministic | E1-evaluate | - | docs/guides/cli.md:218 |
| T3 | claim-docs-guides-cli-md-263 | accept | deterministic | E2-scenarios-experiments | - | docs/guides/cli.md:263 |
| T3 | claim-docs-guides-cli-md-472 | accept | deterministic | E1-evaluate | - | docs/guides/cli.md:472 |
| T3 | claim-docs-guides-cli-md-525 | accept | deterministic | I1-bounded-improvement | - | docs/guides/cli.md:525 |

