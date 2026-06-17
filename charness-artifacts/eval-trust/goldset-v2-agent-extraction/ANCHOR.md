# Eval-Trust Snapshot Anchor

This directory is the frozen eval-trust snapshot for the agent-extraction claim-graph work.

## Anchor commit

All ground-truth artifacts here are anchored at git commit `0205b0d` (the v1 extraction packet commit, byte-identical to `README@d20e043`, i.e. the README before the item-3 user-value lead rewrite).
Line anchors in `gold-set-proposal*.json`, `epic-dag-proposal.json`, and `recall-probe-readme-1-70.*` are valid as-of that commit, not against current HEAD.

## Why it is pinned, not re-mapped

The item-3 README rewrite (`6d707c3`) shifted README line numbers, which is why the spec parked the snapshot as "frozen against `README@d20e043`, re-anchored when slice 3's v2 template is re-run."
Slice 4 is that re-run, and the honest re-anchor is to make the anchor explicit and durable here rather than re-number frozen ground truth: ground truth is superseded by a fresh gold set, never silently re-anchored in place.

## Slice-4 re-anchor outcome

The v2 comparison measurement (`v2-measurement/`) re-extracted README + cli.md at this same `0205b0d` anchor, so its scores are apples-to-apples against this snapshot.
A future full gold-set regeneration over the v2 template (all sources, both audience tracks) is what would establish the next anchor, at the then-current HEAD; until that lands, this snapshot stays pinned at `0205b0d` and the v2 measurement is read against it.

## Contents

- `claims-agent.json` — v1 agent extraction, 292 claims, packet commit `0205b0d`.
- `gold-set-proposal.json` / `.user-product.json` / `.developer.json` — segmented gold set (ground truth), pending verdicts in-file; HITL verdicts recorded in `charness-artifacts/hitl/latest.md`.
- `epic-tree-proposal.json` (R14 tree) / `epic-dag-proposal.json` (R15 DAG) — epic ground truth.
- `recall-probe-readme-1-70.*` — bounded recall probe (item 2).
- `v2-measurement/` — slice-4 blind v2 re-extraction, scoring script, scorecard, and measurement write-up.
