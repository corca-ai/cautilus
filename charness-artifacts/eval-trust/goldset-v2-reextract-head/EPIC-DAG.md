# Epic DAG — goldset-v2-reextract-head

Date: 2026-06-19 (③ Epic DAG).
This realizes the R14 claim tree + R15 epic DAG over the ratified `goldset-v2-reextract-head` answer key.
It is the post-ratification follow-up the `ANCHOR.md` Deferred section and the handoff routed here, on the same precedent as the `../goldset-v2-agent-extraction/` DAG but built a different way (see "How this differs" below).

## What was built

Six artifacts, mirroring the gold-set file convention (`{,.user-product,.developer}`):

| scope | claims | tree | DAG |
| --- | --- | --- | --- |
| combined (headline) | 365 | `epic-tree-proposal.json` | `epic-dag-proposal.json` |
| user-product | 69 | `epic-tree-proposal.user-product.json` | `epic-dag-proposal.user-product.json` |
| developer | 296 | `epic-tree-proposal.developer.json` | `epic-dag-proposal.developer.json` |

The DAG covers the gold CLAIMS only.
`maintainerVerdict` `accept` (346) + `relabel` (19) = 365 claims; the 10 `not-a-claim` entries are not claims and never enter the DAG, even though the template still stamped epic facets on them.
Combined 365 = user-product 69 + developer 296 (the audience segmentation is a disjoint partition).

## How this differs from the agent-extraction DAG

The older sibling (`scripts/build-epic-dag.mjs`) carried a HARDCODED `EDGE_MAP` keyed to the agent-extraction claimIds, because that track's tree gave each claim a single parent and the 16 cross-epic edges had to be hand-routed from `claimSemanticGroup`.
That generator's slice-3 `openQuestions` concluded, repeatedly, that the extraction template SHOULD emit per-claim facets directly.

The reextract-head gold set realizes exactly that: every entry carries `agentLabels.{primaryEpic, supportingEpics, edgeRationale, multiEpic}`.
So this DAG is no longer derived — it is READ.
`scripts/build-epic-dag-from-facets.mjs` loads the gold claims, reads each claim's facets verbatim, validates them against the closed 11-epic registry, and projects the tree (group by `primaryEpic`) and the DAG (`supportingEpics[]`, many-to-many, acyclic).
The old generator + its pinned 121-claim test stay untouched; they still serve the slice-3 design baseline.

## Combined coverage (epic = inverse of supportingEpics)

`primary` = claims whose home (`primaryEpic`) is this epic; `+support` = claims that edge in from another home; `total` = the full support set.

| epic | branch | primary | +support | total |
| --- | --- | --- | --- | --- |
| `APEX` | APEX | 5 | 5 | 10 |
| `A1-orchestration` | Agent | 30 | 16 | 46 |
| `A2-curation-review` | Agent | 30 | 16 | 46 |
| `S1-install` | Setup | 28 | 19 | 47 |
| `S2-readiness` | Setup | 21 | 9 | 30 |
| `D1-discovery` | Discover | 85 | 22 | 107 |
| `D2-review-refresh` | Discover | 61 | 17 | 78 |
| `E1-evaluate` | Eval | 49 | 15 | 64 |
| `E2-scenarios-experiments` | Eval | 13 | 9 | 22 |
| `I1-bounded-improvement` | Improve | 10 | 6 | 16 |
| `M1-proven-on-itself` | Meta/Cross | 33 | 8 | 41 |

Invariants: `totalClaims=365`, `orphanCount=0`, `multiEpicClaimCount=138`, `acyclicByConstruction=true`, `pass=true`.
No thin epics (every epic has `total > 2`).
The earlier agent-extraction DAG flagged `A2-curation-review` and `I1-bounded-improvement` as thin coverage signals; on the full ratified corpus both are well-covered (A2 total 46, I1 total 16), because the developer track documents the agent-curation actor and the improve surface far more than the 121-claim user-product slice did.

## Status: DRAFT — epic structure pending maintainer ratification

This is the honest scope of what is ratified vs authored:

- RATIFIED: the maintainer verdict (claim / not-a-claim / relabel) and the proof-route, from `hitl-reextract-v2head-20260618` (see `HITL-CLOSEOUT.md`).
- NOT YET RATIFIED: the epic assignments. `primaryEpic`, `supportingEpics`, and `edgeRationale` are agent-assigned at extraction and carried forward into the gold set; the HITL pass did not separately ratify the epic STRUCTURE.

So the DAG is a faithful realization of the template-emitted facets, pending a maintainer epic-structure ratification pass.
A future maintainer who wants to ratify (or correct) the structure edits the facets on the gold-set entries and re-runs the generator; the real-artifact test guards that the DAG cannot drift from the gold facets unnoticed.

## Reproduce

```bash
D=charness-artifacts/eval-trust/goldset-v2-reextract-head
# combined (headline)
node scripts/build-epic-dag-from-facets.mjs --track combined \
  --input $D/gold-set-proposal.user-product.json \
  --input $D/gold-set-proposal.developer.json \
  --out-tree $D/epic-tree-proposal.json --out-dag $D/epic-dag-proposal.json
# per-track: pass a single --input with --track user-product | developer
```

`scripts/build-epic-dag-from-facets.test.mjs` pins the unit behavior and the real-artifact realization (365 claims, 138 multi-epic, 0 orphans, coherent facets, combined == user + developer per-epic).
