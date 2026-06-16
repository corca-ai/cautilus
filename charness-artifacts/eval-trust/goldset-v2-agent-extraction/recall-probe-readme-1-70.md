# Recall Probe — agent claim extraction, README.md:1-70

Status: COMPLETE (2026-06-17), bounded single-region probe.
Spec: [2026-06-16-agent-extraction-curation-layering.md](../../spec/2026-06-16-agent-extraction-curation-layering.md) (Measurement section — recall was the open gap).
Pinned plan item 2 (handoff): close the recall measurement gap the HITL could not reach.

## Why this probe exists

The user-product HITL graded the agent extraction for precision (of what was extracted, how much is not-a-claim) and for label/proof-route correctness.
A precision review reads a list of extracted claims, so it structurally cannot see what is ABSENT: a false negative (a real claim the agent never extracted) leaves no row to inspect.
This probe measures that missing axis on one bounded region.

## Method (independence is the whole point)

1. Pick one bounded region: README.md:1-70, the product-promise + release-boundary + onboarding opening (the agent's highest-value, T1/T2-dense surface).
2. Hand the verbatim region text to a FRESH subagent that has never seen the gold set or the extraction output, with the claim definition, and ask it to enumerate every provable claim it finds — blind.
   Independence matters: the orchestrator has already read the agent extraction, so self-enumeration would anchor on it and undercount misses.
   The blind enumeration is checked in at [recall-probe-readme-1-70.blind.json](./recall-probe-readme-1-70.blind.json).
3. Diff the blind enumeration against the agent's extraction for the same region (full 292 packet, both audience tracks, so a developer-labeled claim is not counted as a miss).
4. Classify each blind line the agent did not extract as a TRUE false negative (no representation anywhere) or a MERGE (the assertion is folded into an adjacent composite agent claim).

## Raw diff

- Blind enumeration: 21 claim-bearing source lines, 38 distinct assertions (the enumerator splits multi-assertion sentences).
- Agent extraction in region: 14 source lines (13 inside the blind claim-line set, plus line 36).
- Naive line-level recall: 13/21 = 61.9%.
- Agent-only line (agent extracted, blind called non-claim): line 36 ("native macOS or native Linux") — a precision/false-positive candidate, a prerequisite read as an install claim.

Note on the diff scope (so the arithmetic is transparent): the diff is against the FULL 292 packet, both audience tracks.
The one in-region line where that matters is README:9 ("commands emit durable packets ... for the next agent to resume").
The agent DID extract it, but labeled it audience=developer, so it is absent from the user-product 121 yet correctly counts as covered (not a miss).
Diffing only against the user-product track would have falsely scored README:9 as a false negative.

The naive 62% is misleading on its own, because most "missed" lines are not lost information — they are merged.

## Classification of the 8 uncovered blind lines (6 merges + 2 genuine false negatives)

The agent aggressively MERGES multi-assertion sentences into one richer composite claim.
Tracing each uncovered blind line to the agent's adjacent summary shows the real loss is small:

| Blind line | Assertion | Folded into | Verdict |
| --- | --- | --- | --- |
| L3 | keeps behavior honest while prompts change (the tagline) | README:4 ("keeps ... honest across prompt, skill, and wrapper changes ...") | MERGE |
| L10 | installs as a machine-level binary | README:13 ("The binary is shared at machine level ...") | MERGE |
| L11 | the binary is shared across repos | README:13 (same composite) | MERGE |
| L12 | agent surface/wiring/prompts are NOT shared | README:13 ("... stay checked into each host repo") | MERGE |
| L17 | the current slice is eval-only / contracts being rewritten | README:18 ("The current external-adoption slice is eval-only: ...") | MERGE |
| L20 | the other slices are opt-in until the rewrite closes | README:18 (same composite) | MERGE |
| L8 | agents are first-class users of the product surface | nothing — README:9 is the durable-packet mechanism, README:136 is "interfaces are agent-facing-first"; neither states the first-class-users principle | **TRUE FALSE NEGATIVE** |
| L30 | NOT for repos with no evaluator-dependent behavior surface | nothing — no scope-exclusion claim anywhere in the 35 README claims | **TRUE FALSE NEGATIVE** |

## Finding

- Assertion-level recall on the agent's strongest surface is HIGH: of 21 source claim-lines, the genuine information loss is 2 — L8 ("agents are first-class users", a stated design principle) and L30 ("not for repos without an evaluator-dependent surface", a negative scope boundary).
  The other six "misses" are MERGES — the agent folds 2-4 assertions into one composite claim (e.g. README:13 carries four; README:18 carries the whole release boundary).
- The merge behavior is the SAME finding as the flatness work, seen from the other side: on README the agent makes few, rich claims (good against flatness), whereas on cli.md it splits finely (the 60-claim "too many" optics, R13).
  Recall and the count optics are source-role-dependent, not a uniform over- or under-extraction.
- Both genuine misses are PRINCIPLE / BOUNDARY-shaped, not capability-shaped: a design principle ("agents are first-class users") and a negative scope exclusion ("not for ...").
  The agent readily extracts positive capability lines while under-extracting principles, exclusions, and limits.
  This is the recall analogue of the proof-route weakness: the agent's blind spot is boundary- and principle-shaped claims, not capability-shaped ones.
- A composite claim spans significance tiers (README:13 bundles a T1 positioning with T3 install detail), which is a direct input to the slice-3 tier/facet design: tiering should attach to the assertion, and a merged claim may need decomposition before a tier is meaningful.

## Honesty caveats (do not over-generalize)

- n = 1 region, 21 claim-lines. This is a directional signal, not a recall rate for the whole 292.
- The region is the agent's BEST surface (curated product promise). The opposite failure mode (over-splitting) lives in cli.md; a second probe should target a cli.md region to test recall AND the merge/split asymmetry where the agent over-produces.
- One blind enumerator. A second independent enumerator would further harden the genuine-FN count (currently 2: L8, L30, both cross-checked against the full 292 as extracted in neither track).
- The auxiliary heuristic-vs-agent fingerprint diff was not run here; it is noise-prone and the blind-enumerator method is the stronger recall signal. Defer unless a cheap cross-check is wanted.

## Next

- Optional widen: repeat on a cli.md region (e.g. the evaluate or doctor section) to measure recall where the agent over-splits, and to confirm the boundary-claim blind spot.
- Slice-3 input: (a) tier/facet attaches to the assertion, and decomposition may precede tiering for composite claims; (b) the extraction template should explicitly prompt for design-PRINCIPLE claims ("X is a first-class ...") and negative/scope-boundary/exclusion claims ("not for", "does not", "opt-in until"), which are the two measured blind spots (L8, L30).
