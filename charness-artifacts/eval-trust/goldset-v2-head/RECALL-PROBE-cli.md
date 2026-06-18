# Recall Probe — `docs/guides/cli.md`

Probe date: 2026-06-18.
Target gold set: `gold-set-proposal.json` cli.md segment (68 claims: 18 user-product + 50 developer).
Anchor: git commit `558cda7` (the version the gold set's line anchors are valid against; see `ANCHOR.md`).

This is the **recall** half of the gold-set measurement.
Precision was settled by the two ratification passes (`HITL-CLOSEOUT.md`, `HITL-CLOSEOUT.developer.md`): every gold claim is a correctly-extracted, correctly-labelled real claim.
The open question this probe answers is the inverse — **did the curated gold set MISS real claims in `cli.md`, or over-split the ones it kept?**
`cli.md` was chosen because it is the densest command surface (68 of 306 parent claims) and the handoff flagged it as the most likely over-split surface.

## Method: blind oracle -> line reconciliation -> rule adjudication

1. **Blind re-extraction (no gold-set access).**
   Two independent sub-agents re-extracted claims from `cli.md` @`558cda7`, each given only the source and the extraction contract (`docs/contracts/claim-extraction-template.md`), explicitly blind to the gold set.
   Two lenses on purpose, to reduce a single agent's blind spot: lens A walked structure/commands top-to-bottom (143 claims); lens B read for cross-cutting capability/boundary promises (105 claims).
   This reproduces the original v2 extraction conditions (template-only, no R1-R18), so the oracle surfaces candidates liberally and the curation filter is applied afterward, not baked in.
2. **Line reconciliation.**
   Each gold claim was checked for a blind match within +-2 lines (recall of the gold set's own claims; see finding 1 for the exact-line-overlap caveat).
   Each blind claim with no gold entry within +-2 lines was flagged as a recall-gap candidate (42 candidates).
   Cluster density per line region was compared (gold count vs blind count) to test the over-split hypothesis.
3. **Rule adjudication (independent, then maintainer exception-ratify).**
   A third sub-agent classified all 42 candidates under the locked R1-R18 against source + the full 68-claim gold list: `dup` / `granularity` / `real-gap` / `not-a-claim`.
   The maintainer ratified by exception (same operating model as the developer track); the 9 real-gaps and their proof/tier were spot-checked against the gold list and accepted.

## Result

### 1. Gold recall of its own claims: 68 / 68 confirmed on a real assertion line
A blind extractor surfaced a claim at the exact source line of **64 / 68** gold claims (blind-A 61/68 = 90%, blind-B 52/68 = 76%, either = 94%), and within +-2 lines for 66 / 68; the remaining two (incl. L11) sit one block from the nearest blind claim (L18).
So every gold claim is confirmed to sit on a line that an independent reader also reads as an assertion — no gold claim is a phantom or an over-extraction the source does not support.
**Honesty caveat (structural re-anchoring, not full independence):** `cli.md` places each command on its own labeled comment/heading line, so a ~90% exact-line agreement is largely the two extractors keying off the same structural anchors, not fully independent corroboration. The recall claim this supports is "every gold line carries a real assertion," not "two independent readers re-derived each claim from scratch."

### 2. Over-split hypothesis: not systematic (mildly under-split instead)
Across the 23 clustered regions (>=2 gold claims within 3 lines), comparing the **exact** gold-cluster window: the blind union (max of A, B) is >= gold in **21 / 23** clusters.
Gold split finer than **both** extractors in only **2** clusters — L110-111 (gold 2 vs A1/B1) and L120-122 (gold 3 vs A2/B2), each a single-claim delta in the doctor-command region (one likely tied to the already-flagged `cli:81` doctor over-merge).
Per-extractor the picture is noisier (blind-A alone dipped below gold in 3 clusters, blind-B in 3), which is why the headline reads off the union, not either extractor alone.
There is no **systematic** over-split: only 2 of 23 clusters have gold finer than the oracle, by one claim each.
If anything `cli.md` is mildly **under**-split — the gold set folded helper sub-commands into family-representative claims (see finding 3). The full per-cluster table is in `recall-probe-cli/reconciliation.json` (`overSplitTable`).

### 3. Real recall gaps: 9 helper sub-commands (all deterministic; 4x T2, 5x T3)
Of the 42 blind-only candidates: **dup 30** (code-block comment lines restating a prose claim curated a few lines down), **granularity 2** (`normalize skill`/`normalize workflow` rolling up into the gold `normalize {chatbot,skill,workflow}` family at L226), **not-a-claim 1** (L400 rhetorical "what is the first decision packet?" framing, R17), **real-gap 9**:

| line | command | proof | tier |
| --- | --- | --- | --- |
| L238 | `discover scenarios prepare-input` (assemble proposal-input from split normalized files) | deterministic | T2 |
| L255 | `discover scenarios render-conversation-review-html` | deterministic | T3 |
| L259 | `discover scenarios summarize-telemetry` (cost/token/duration) | deterministic | T3 |
| L408 | `evaluate review prepare-input` (durable review packet around a report) | deterministic | T2 |
| L413 | `evaluate review build-prompt-input` (product-owned meta-prompt packet) | deterministic | T2 |
| L432 | `evaluate review render-prompt` | deterministic | T3 |
| L502 | `evaluate evidence prepare-input` (gold has only the evidence bundle, L509) | deterministic | T2 |
| L557 | `claude plugins validate` (checked-in marketplace/plugin manifest) | deterministic | T3 |
| L561 | `check-codex-marketplace.mjs` (Codex discovers the repo-local marketplace entry) | deterministic | T3 |

## Interpretation

- **The recall gap is a single systematic curation pattern, not scattered misses.**
  The gold set kept the family-representative command of each `scenarios` / `evaluate review` / `evidence` chain (`propose`, `variants`, `bundle`) and skipped the `prepare-input` / `render-*` / `summarize` / `validate` helper sub-commands of the same families.
  All 9 are deterministic packet-assembly or static-render or release-surface checks — the low-significance tail, not load-bearing behavior.
- **The predicted "principle / boundary" blind spot did NOT materialize.**
  The handoff predicted recall blind spots would be cross-cutting principles and ownership/boundary promises.
  The probe found the opposite: every boundary/ownership/determinism promise the capability-lens extractor surfaced (codex isolation L55, binary/consumer split L190, stale-rejection gate L148, proof-class downgrade L74/L317, no-LLM determinism L136/L143) is already present in the gold set.
  The gold set's recall of high-value claims is strong; only the minutiae tail leaks.
- **Proof-route corroboration.**
  The adjudicator demoted 4 blind `cautilus-eval` proofGuesses to `deterministic` (L163/L175/L436/L531) — the same direction as the developer-track relabel harvest (agents over-route toward agent-behavior proof; the truth is the static/structural route).
  An independent blind oracle reproducing the exact misroute direction strengthens the slice-3 case.

## Limitations (what this method cannot certify)

- **Co-skipped regions are out of reach.** Both the gold extraction and both blind extractors skipped the same example-dense regions (notably L322-389 skill-testing invocations and the ~L535 GEPA pointer). A claim that all three missed is a *shared* blind spot this probe cannot detect by construction — it inherits the oracle's skip list. A direct spot-check of those regions found no leaking behavior assertion (L322-389 is repeated `evaluate fixture --adapter-name X` usage examples of an already-claimed capability; the asserting prose at L390 *is* in the gold set), so no concrete missed claim is known — but "no principle/boundary blind spot" is certified only for the regions at least one extractor read, not for the co-skipped example blocks.
- **Recall is structurally re-anchored, not independently re-derived** (see finding 1 caveat): the strength of the 64/68 exact-line agreement is partly the source's one-command-per-labeled-line structure.

## Disposition (NOT applied this session)

The 9 real-gaps are **recorded, not added** to the gold set now — consistent with the developer-track discipline of deferring curation edits to the re-extraction session rather than mutating a clean 306/306 answer key mid-stream.

**Granularity policy (maintainer, 2026-06-18): family-representative.** Each family keeps its representative claim (`propose` / `variants` / `bundle`); the helper sub-commands (`prepare-input` / `render-*` / `summarize` / `validate`) stay folded under it with a coverage note rather than each becoming its own claim — keeping the gold set lean per R16 ("less but better") and avoiding a T3-minutiae blow-up. The 9 fold into the re-extraction session (alongside the deferred curator splits and the line renumber); the coverage note lands when that session recurates.

No principle/boundary recall gap means no urgent gold-set patch is owed; the measurement is the deliverable.

**Incidental finding -> binary bug (now fixed):** the doubled-verb `evaluate evaluate review` was not a mere doc typo — tracing it found the binary's own command registry (`internal/cli/command-registry.json`) advertising the unroutable form in `cautilus evaluate review --help`, propagated to 23 doc/skill sites. Routed to `charness:debug`, root-caused (hand-authored registry strings + a test that asserted the doubled form), and fixed with a structural regression guard that requires every usage/example to lead with its command's path (commit `dc1837c`; diagnosis in `charness-artifacts/debug/2026-06-18-evaluate-review-doubled-verb.md`). `cli.md` itself was corrected in `3bc1b06`.

## Reproduce / inspect

- Source snapshot: `git show 558cda7:docs/guides/cli.md` (583 lines; HEAD differs only by the Homebrew-removal block above the first claim anchor).
- Blind oracle outputs: `recall-probe-cli/blind-A.json` (structural, 143), `recall-probe-cli/blind-B.json` (capability, 105).
- Line reconciliation: `recall-probe-cli/reconciliation.json` (68 gold coverage + 42 blind-only candidates + over-split table).
- Rule adjudication: `recall-probe-cli/adjudication.json` (per-candidate class + proof/tier under R1-R18).
