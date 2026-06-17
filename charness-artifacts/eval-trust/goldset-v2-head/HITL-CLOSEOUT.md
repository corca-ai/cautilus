# Fresh User-Product Gold Set — HITL Closeout

HITL session: `hitl-userprod-v2head-20260617` (2026-06-17 → 2026-06-18).
Target: `gold-set-proposal.user-product.json` (+ parent `gold-set-proposal.json`).
Anchor: git HEAD `558cda7` (see `ANCHOR.md`).

This is the durable record of a fresh, from-scratch user-product gold set: a blind v2 re-extraction
of the current HEAD discovery corpus, faceted into a proof-plan, segmented by audience, and ratified
claim-by-claim through human review. It supersedes the `0205b0d` v1 121-entry user-product track that
the prior run (`hitl-20260611-082742`) left at 15/24 pending.

## How it was built (machinery)

1. `discover claims extraction-input` over the 5-source HEAD corpus with `--adapter` so the 11-epic
   catalog + audience hints render (template v2, hash `41323548`).
2. Five BLIND sub-agents (one per source, no access to gold set / DAG / verdicts / answer key) extracted
   claims from numbered source copies in an isolated workspace.
3. `apply-extraction` anchored every excerpt verbatim at HEAD and synthesized the proof-plan
   (306 candidates, 0 rejected).
4. `build-gold-set-proposal.mjs` (new, +test) → `gold_set_proposal.v2` (maintainerVerdict=pending, R1–R15).
5. `segment-goldset-by-audience.mjs` → user-product 74 / developer 232 / holding 0 (lossless).
6. Staged HITL by epic branch, R10 decision cards, branch-staged apply+commit.

## Result: 74 / 74 reviewed, 0 pending

| disposition | n | meaning |
| --- | --- | --- |
| accept | 54 | correct extraction + correct labels |
| relabel | 1 | correct claim, label corrected (README:8 proof deterministic→cautilus-eval, R6) |
| rewrite-source | 1 | correct claim, source sentence trimmed (README:54) |
| not-a-claim | 11 | framing / positioning / pointer / external-example (R16/R17/R18) |
| retire-source | 5 | correct claim, source sentence removed (stale/transitional) |
| badly-bounded | 2 | wrong merge boundary (README:129 fold, cli:207 split) |

Durable graded claims = 56 (accept 54 + relabel 1 + rewrite-source 1). Tiers: **T1 7 / T2 41 / T3 8**.

### The 7 T1 headline claims (the user reading surface; one per major theme)

- README:4 — pin behavior, prove it survives every change, improve within budgets (APEX value-prop)
- README:5 — the three jobs connect: discover worth-proving → verify curated → improve once proof honest
- README:136 — intent-first: treats the behavior under evaluation as the contract, not a frozen prompt
- README:67 — the Cautilus Agent curates the raw discovery packet against the repo (A2)
- README:6 — installs as a standalone binary + Agent without copying a scaffold (S1)
- README:137 — held-out honesty: separate iteration from protected validation, evidence reopenable (E2)
- README:139 — bounded autonomy: search/revision bounded by budgets, checkpoints, blocked-readiness (I1)

Tier model (R13/R14): users read the ~11 epics + the proven-on-itself apex (`docs/specs/index.spec.md`,
proof badges), NOT the 74 raw claims (README:65 says so). T2 = mechanisms backing a T1; T3 = cli spec-detail.

## New HITL grading rules (R16–R18) — grading-only, do NOT enter the extraction template

These extend R1–R15 (carried from `hitl-20260611-082742`). They govern the answer key, not the agent's
prompt; the template stays lean ("less but better") and only takes lean generalizations when measurement
proves a systematic agent error.

- **R16** — audience-fit / positioning bullets ("Who It Is For" + "Not for") and pure identity/category
  sentences fully decomposed into siblings+epics (README:3) = positioning/framing premises → not-a-claim
  (prose stays). The APEX "what everything supports" role is the APEX EPIC node (catalog userStory), and
  the headline CLAIM is the value-prop (README:4), not the category label. BEHAVIORAL boundaries
  ("does X, not Y", e.g. skill-experiment "does not clone/install/execute") stay claims.
- **R17** — pointer / cross-reference sentences ("X is documented in / anchored in / lives in / see
  [file]") and pure restatements of an already-graded claim = not-a-claim (navigation/metadata).
- **R18** — a cited external/consumer result used as an illustrative example (e.g. README:101 "in
  charness, a fixture proved …") = not-a-claim; Cautilus's claims are its general capabilities, not a
  host repo's specific outcome. The general capability, if real, is claimed separately.

Extended verdict vocab (in the gold-set `verdictDefinitions`): **retire-source** (extraction correct,
maintainer removes the source sentence) and **rewrite-source** (extraction correct, maintainer trims it).

## Key harvest

- **Proof-route catch (carry-forward confirmed)**: README:8 packets-resume was routed deterministic by
  the agent; relabeled cautilus-eval (R6: "enough state to resume" is behavioral, not a schema check).
  This is the exact "agent over-trusts deterministic" weakness the slice-4 sheet predicted.
- **Recall blind spots caught at HEAD**: both v2 recall prompts fired — README:7 principle ("agents are
  first-class users") and README:29 boundary ("Not for …") were extracted (then graded framing per R16).
- **Flatness is volume, not garbage**: user-product skews T1/T2; genuine T3 minutiae (cli flag/exit-code)
  is small here and concentrated in the deferred developer track.
- **not-a-claim ≠ delete**: clarified a maintainer conflation — not-a-claim drops a claim from the gold
  set (no proof obligation); human-auditable is a real falsifiable claim proven by reading.

## Deferred follow-ups (NOT applied this session)

### A. Source edits — apply as a doc-tightening commit, THEN re-anchor (they shift README/cli anchors)

> **Applied 2026-06-18** (doc-tightening commit `3080482`, claim refresh `36a3588`). Terminology scope:
> the maintainer chose **all prose surfaces** for `linked Markdown` → `linked docs`, not the README-only
> lean below (the `linkedMarkdownDepth` schema field + its report label + flow-log test fixtures stay as a
> deferred breaking-rename follow-up). Re-anchor: ANCHOR.md updated; mechanical line re-number deferred to
> the developer-track HITL (verdicts carry by `claimFingerprint`). See `ANCHOR.md` → "Re-anchor status".

- REMOVE (immediate): README:16, README:19, README:110 (transitional release-boundary disclaimers),
  README:47 + docs/guides/cli.md:32 (stale Homebrew mention). Durable eval capability (README:17/18) stays.
  Coherence pass: the "Current Release Boundary" heading + README:95 "currently stable" phrasing.
- REWRITE: README:54 → just "you can hand setup to an agent" (drop the doctor --next-action loop detail).
- TERMINOLOGY (scope-pending): README:112 "linked Markdown" → "linked docs" (user-facing only; the
  developer contract `claim-discovery-workflow.md` keeps the precise term in its 7 occurrences).

### B. Curator (deferred drop/dedup) — cross-document merge the per-source blind fan-out could not do

- cross-doc dup: install flow README:44 ~ cli:11; dev/app surfaces README:116 ~ cli:274; Homebrew (retired).
- merge: README:129 (context-recovery example) into README:137 (held-out claim) as an excerpt.
- split: cli:207 over-merge → comparison-prepare claim + artifacts-prune claim.
- cross-claim overlap: README:145 improvement-waits ~ README:139 bounded-autonomy (and ~ cli:519 improve-gating).
- doc-redundancy: three-pillar enumeration 3× in README (L3/L5/L108); claim consolidated onto L5.

### C. Out of scope this session

Developer track (232 claims) — next session. Cross-doc semantic dedup lens over the 74 (offered, deferred).

## Reproduce / inspect

- Verdicts + rationale per claim: `gold-set-proposal.user-product.json` (maintainerVerdict + note +
  significanceTier on every entry).
- Full decision log, source-edit list, curator flags: the gitignored runtime
  `.charness/hitl/runtime/hitl-userprod-v2head-20260617/` (decisions.json, rules.yaml R1–R18, scratchpad).
- Durable runtime checkpoint: `charness-artifacts/hitl/latest.md`.
