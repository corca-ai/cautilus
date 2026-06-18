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
that regeneration for **both audience tracks**: user-product (74/74 ratified, `hitl-userprod-v2head-20260617`)
and developer (232/232 ratified, `hitl-devtrack-v2head-20260618`). The parent `gold-set-proposal.json` is now
**306/306 reviewed, 0 pending**. See `HITL-CLOSEOUT.md` (user-product) and `HITL-CLOSEOUT.developer.md`.

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
`gold-set-proposal*.json` (and the line citations in both closeouts) are still **relative to `558cda7`**,
not HEAD. Per maintainer decision the mechanical re-number stays **deferred**: the ratified verdicts are
durable and carry by `claimFingerprint`, so the snapshot stays a valid verdict record.

The developer-track HITL (`hitl-devtrack-v2head-20260618`) did **not** re-extract or re-number either — the
maintainer ran it against the existing 232 as-anchored at `558cda7` (only `claim-discovery-workflow.md` was
reworded this session, and every affected assertion stayed intact; the other dev sources are content-stable).
So the line re-number now folds into the **next full both-track regeneration** at a clean future HEAD, after
the deferred source edits (the 3 `rewrite-source` trims + the `badly-bounded` curator splits, recorded in
`HITL-CLOSEOUT.developer.md`) land.

Affected entries if/when re-numbered: the 5 `retire-source` entries (README:16/19/47/110 + cli:32) lost
their source line (the maintainer removed it, as ratified) and become `source-removed`; README:54
(`rewrite-source`) and README:112 (`accept`) have new verbatim text; the other ~49 entries only shift
line numbers; the 2 `claim-discovery-workflow.md` entries were word-only edits and keep their line
numbers.

## Contents

- `extraction-input.json` — v2 input packet (template hash `41323548`, 11-epic catalog), HEAD `558cda7`.
- `claims-agent.json` — blind agent proof-plan, 306 candidates, 0 rejected, verbatim-anchored.
- `gold-set-proposal.json` / `.user-product.json` / `.developer.json` — segmented gold set; both audience
  files now carry ratified `maintainerVerdict` + `note` + `significanceTier` (user-product 74, developer 232),
  and the parent mirrors all 306.
- `template-block.json` — the template handed to the blind extractors.
- `HITL-CLOSEOUT.md` — user-product ratification summary, new rules R16–R18, deferred follow-ups.
- `HITL-CLOSEOUT.developer.md` — developer-track ratification summary, proof-route harvest, deferred source-edit + curator follow-ups.
- `RECALL-PROBE-cli.md` (+ `recall-probe-cli/`) — the recall half of the measurement for `cli.md`: gold recall 68/68, over-split refuted, 9 deterministic helper-sub-command gaps recorded for the next regeneration. Evidence: blind oracle outputs, line reconciliation, rule adjudication.
