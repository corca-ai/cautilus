# Specdown rewrite — Phase 2 remainder: SC4 closed by reconciliation

Date: 2026-06-20 (execution session).
Spec (canonical): `charness-artifacts/spec/2026-06-20-specdown-rewrite-goldset-projection.md` (SC4, FD3/FD5, D1–D4).
Builds on the Phase 2 first slice (`6dd78e77`, generated `projected-claim-state.md`).

## Question this session resolved

The handoff and ratified D3 said SC4 "done" requires DELETING/REPLACING the hand-maintained
claim-state tables the projection subsumes — "단순 additive+link로는 SC4 done 아님" — and flagged
the one in-flight step as confirming the exact delete list against the guardrail before deleting.
Part (a) (FD5/D1/D2) was to retire the `retire-source`/`badly-bounded` source prose with
`claims:refresh:all`.

## Reconciliation outcome — both parts are no-ops at HEAD

### (a) Source-prose retirement: already landed / explicitly deferred

Anchored by fingerprint/summary content (line numbers are stale per FD2), reconciled against HEAD:

- `retire-source` (5: `claim-readme-md-16/-19/-47/-110`, `claim-docs-guides-cli-md-32`) — **already removed**
  in `3080482` ("Drop transitional release-boundary disclaimers and stale Homebrew from docs").
  No live hit at HEAD for any of the five.
- `badly-bounded` (2: `claim-readme-md-129`, `claim-docs-guides-cli-md-207`) — **explicitly deferred**
  by the maintainer in `3bc1b06`: "Gold-set re-anchor + curator splits fold into the deferred
  re-extraction session." The source prose (`README.md:122-123`, `docs/guides/cli.md:201-211`) is
  accurate; these are claim-extraction granularity (merge L129→L137 / split cli:207 into two), and the
  gold set is consumed as-is (Non-Goal), so no source rewrite is warranted now.
- `not-a-claim` (11) — tracking-only good prose, kept in place (D1).

Net: **no claim source changed → `claims:refresh:all` not triggered.**

### (b) D3 delete/replace target: empty under the guardrail

A full read of every table-bearing page in `docs/specs/` found **no hand-maintained per-claim
tier/verdict/route table**. Classification against the D3 guardrail:

| Page / table | Lens | Subsumed? |
| --- | --- | --- |
| apex `index.spec.md` (7 badges, audit check, Proof Debt) · `audit.spec.md` | badge honesty (proven/declared/promised) | No — audit-registry owned; Non-Goal to change |
| `ledger/promise-ledger.spec.md` · `names-and-keys` · `how-views-relate` | promise→contract ownership / naming | No — separate taxonomy (keep hand-authored) |
| `evidence/claim-evidence-state.md` | generated 398-candidate backlog | No — guardrail: keep |
| `evidence/evidence-map.spec.md` | evidence-route ownership | No — guardrail: keep |
| `evidence/gaps.spec.md` · `latest-selected-evidence.spec.md` | proof gaps / selection policy | No — distinct |
| `user/claim-discovery.spec.md` | `discover` product behavior | No — not claim-state |

The only `| T1 |`/`| T2 |` tier tables in the tree are inside the generated page itself.

## Why the premise was false (archaeology)

- The first-slice diff (`6dd78e77`) removed **zero** rows from any ledger/evidence page; it only
  added the generated page + two links. Its commit message asserts the FD3 "restated by hand across
  three framings" narrative, but the diff found nothing to remove.
- The prior findings artifact used conditional wording: "point the remaining hand-authored
  ledger/evidence state at the generated page **where it still restates claim state**."
- D3's own guardrail: "delete/replace applies ONLY to ... genuinely subsumed [tables]; content with
  no projection equivalent must be migrated or kept, never silently dropped. The next session confirms
  the exact table list ... before deleting."
- So FD3 asserted a premise that was never verified against the actual page contents; the projection
  FILLS the previously-missing gold-set tier/verdict/route facet rather than replacing a redundant table.

## Decision

Maintainer chose (2026-06-20): realign the canonical spec (correct FD3's premise, record the D1/D3
execution outcome, mark SC4 DONE) and proceed to Phase 3. No page deletions, no source edits,
no enforcement gate.

## What landed

- Canonical spec realigned: Phase 2 Remainder LANDED block, FD3 premise correction, D-block execution
  outcome, SC4 marked DONE.
- This evidence note.
- No `docs/specs/` or code change, so no gate moved; `lint:specs` / `npm run verify` unaffected by this
  slice (Phase 3 owns the `old/**` + gate-exit work).
