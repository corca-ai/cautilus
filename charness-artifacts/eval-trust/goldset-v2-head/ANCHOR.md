# Eval-Trust Snapshot Anchor — goldset-v2-head

This directory is the fresh user-product gold set built by blind v2 re-extraction of the HEAD discovery
corpus. It supersedes the sibling `../goldset-v2-agent-extraction/` snapshot (anchored at the v1 packet
commit `0205b0d`), which stays frozen for the slice-4 v2-vs-v1 measurement.

## Anchor commit

All ground-truth artifacts here are anchored at git commit `558cda7` (the commit the
`extraction-input.json` was generated against; README reflects the item-3 user-value rewrite `6d707c3`).
Line anchors in `gold-set-proposal*.json` (`sourceRef: README.md:N`, `cli.md:N`, …) are valid as-of that
commit. The working tree was clean and only `charness-artifacts/` changed during the HITL, so the anchors
hold at the HITL commits as well.

## Why this is the new anchor

`ANCHOR.md` in the v1 snapshot predicted: "A future full gold-set regeneration over the v2 template (all
sources, both audience tracks) is what would establish the next anchor, at the then-current HEAD." This is
that regeneration for the **user-product track** (74/74 ratified). The developer track (232) is deferred.

## Re-anchor status (2026-06-18)

The `HITL-CLOSEOUT.md` §A source edits are now **applied** (doc-tightening commit `3080482`, claim-packet
refresh `36a3588` = current HEAD): the release-boundary disclaimers and the stale Homebrew notes were
removed from README + `docs/guides/cli.md`, README:54 was trimmed to the durable "hand setup to an agent"
claim, and the `linked Markdown` → `linked docs` terminology change was applied to **all prose surfaces**
(README, `docs/claims/maintainer-facing.md`, the developer contract, and the contract spec — the
maintainer chose full scope over the closeout's README-only lean). The schema field `linkedMarkdownDepth`,
its rendered "linked Markdown depth" report label, and the 3 flow-log test fixtures were intentionally
left unchanged (renaming them is a breaking schema change, not doc-tightening), leaving a known
doc↔report-label mismatch recorded as a deferred follow-up.

Those edits shifted README/cli line numbers, so the `sourceRef: README.md:N` / `cli.md:N` anchors in
`gold-set-proposal*.json` (and the line citations in `HITL-CLOSEOUT.md`) are still **relative to
`558cda7`**, not HEAD. Per maintainer decision, the mechanical re-number is **deferred**, not done here:
the 74/74 ratified verdicts are durable and carry by `claimFingerprint`, so the snapshot stays a valid
verdict record. The actual line re-number folds into the next milestone — the developer-track (232) HITL,
which re-extracts the same shared corpus and re-numbers both tracks at once.

Affected entries if/when re-numbered: the 5 `retire-source` entries (README:16/19/47/110 + cli:32) lost
their source line (the maintainer removed it, as ratified) and become `source-removed`; README:54
(`rewrite-source`) and README:112 (`accept`) have new verbatim text; the other ~49 entries only shift
line numbers; the 2 `claim-discovery-workflow.md` entries were word-only edits and keep their line
numbers.

## Contents

- `extraction-input.json` — v2 input packet (template hash `41323548`, 11-epic catalog), HEAD `558cda7`.
- `claims-agent.json` — blind agent proof-plan, 306 candidates, 0 rejected, verbatim-anchored.
- `gold-set-proposal.json` / `.user-product.json` / `.developer.json` — segmented gold set;
  the user-product file carries ratified `maintainerVerdict` + `note` + `significanceTier` on all 74.
- `template-block.json` — the template handed to the blind extractors.
- `HITL-CLOSEOUT.md` — the ratification summary, new rules R16–R18, deferred follow-ups.
