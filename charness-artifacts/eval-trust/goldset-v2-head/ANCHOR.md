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

## Next anchor move

The HITL queued source edits (see `HITL-CLOSEOUT.md` §A: remove the release-boundary disclaimers + the
Homebrew mention, rewrite README:54, the linked-docs terminology change). Those edit README/cli (claim
sources) and will shift line anchors. They were intentionally NOT applied during the HITL so the anchors
stayed stable. Apply them as a separate doc-tightening commit, then re-anchor this snapshot (re-extract /
re-number) to the new HEAD. Until that lands, this snapshot stays pinned at `558cda7`.

## Contents

- `extraction-input.json` — v2 input packet (template hash `41323548`, 11-epic catalog), HEAD `558cda7`.
- `claims-agent.json` — blind agent proof-plan, 306 candidates, 0 rejected, verbatim-anchored.
- `gold-set-proposal.json` / `.user-product.json` / `.developer.json` — segmented gold set;
  the user-product file carries ratified `maintainerVerdict` + `note` + `significanceTier` on all 74.
- `template-block.json` — the template handed to the blind extractors.
- `HITL-CLOSEOUT.md` — the ratification summary, new rules R16–R18, deferred follow-ups.
