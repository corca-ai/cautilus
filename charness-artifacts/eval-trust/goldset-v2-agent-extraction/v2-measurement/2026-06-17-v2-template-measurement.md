# v2 Extraction Template — Comparison Measurement (slice 4)

Date: 2026-06-17.
Status: directional measurement, decisive on the named per-claim axes, confounded on count-level precision (see Confounds).

## What this measures

Slice 3 shipped the v2 extraction template: per-claim epic facets (`primaryEpic` + `supportingEpics[]`), enabler-based proof routing (R12), and explicit prompts for the two recall blind spots (design-principle and negative/scope-boundary claims).
This slice re-runs the v2 template over the corpus and scores the faceted output against the user-product gold set and its HITL verdicts on the axes the gold set actually grounds: per-claim proof routing, epic assignment, and recall of the two known false negatives.

## Method (apples-to-apples control)

Source content is held constant at the v1 packet commit `0205b0d` (identical to `README@d20e043`, the pre-item-3 README), so the gold-set line anchors line up exactly and the only varied input is the template.
The authentic v2 template block was generated from the binary (`discover claims extraction-input --adapter .agents/cautilus-adapter.yaml --source README.md --source docs/guides/cli.md`), templateHash `sha256:41323548…`, carrying this repo's 11-epic catalog.
Two blind subagents (one per source) extracted claims from the frozen content using only that template block, with no access to the gold set, the epic DAG, the HITL verdicts, or any answer key.
Scoring is mechanical against the pre-existing answer key (`score.mjs` → `scorecard.json`); the extraction was blind, the scoring is not.

Epistemic status of the answer key: the 15 reviewed claims are HITL working-state, not file-ratified.
The HITL (session `hitl-20260611-082742`) is paused at 15/24 with the apply phase not run, so every `maintainerVerdict` in the gold-set file is still `pending`.
Batches b1+b2 (10 claims) were maintainer-confirmed in chat (recorded in `charness-artifacts/hitl/latest.md`); batch b3 (5 claims, including cli.md:391) is agent-proposed and was awaiting confirmation at the pause.
Results below are reported on both bases so the headline does not lean on an unconfirmed verdict.

Scope is README.md + docs/guides/cli.md.
These two sources carry 100% of the 15-claim per-claim answer key (all three proof relabels — two confirmed in b1, cli.md:391 proposed in b3 — and the one badly-bounded case), both genuine recall false negatives, and 92 of the 121 user-product gold entries.
The other two user-product sources (claim-discovery-workflow, claim-extraction-template) were not re-extracted; epic accuracy beyond README+cli is unmeasured.

## Results

### Proof routing — clean signal (same reviewed claims)

On the 10 maintainer-confirmed claims (b1+b2), v2 routed 10/10 correctly; v1 routed 8/10.
v2 fixes both confirmed v1 errors with zero regressions:

| sourceRef | v1 proof | v2 proof | correct | batch | result |
| --- | --- | --- | --- | --- | --- |
| README.md:13 | human-auditable | deterministic | deterministic | b1 confirmed | fixed |
| README.md:113 | deterministic | cautilus-eval | cautilus-eval | b1 confirmed | fixed |
| docs/guides/cli.md:391 | human-auditable | deterministic | deterministic | b3 proposed | fixed (proposed) |
| (other 12 reviewed) | correct | correct | correct | b1/b2 confirmed, b3 proposed | held |

This is the clean, template-attributable signal: the same claims were extracted by both runs, so the routing delta is the template, not run variance.

Including the 5 proposed b3 claims, v2 is 15/15 vs v1 12/15 — v2 also corrects the proposed cli.md:391 relabel.
That third fix depends on the unconfirmed b3 verdict; if the maintainer rejects it, the full tally is v2 14/15 vs v1 12/15, which still shows v2 strictly ahead with no regression.

Corroborated at the aggregate level on a like-for-like denominator (README+cli, user-audience): the `human-auditable` share is 7.4% for v2 (6/81) versus 17.4% for v1 (16/92), the exact direction R12 intends (stop over-hedging structurally-provable capability claims to `human-auditable`).

### Recall — directional signal (n=2, strongest surface)

Both genuine false negatives that v1 missed are now caught:

- `README.md:8` "Agents are first-class users of the product surface." (design-principle shape) — caught.
- `README.md:30` "Not for: repos that only need deterministic lint…" (negative/scope-boundary shape) — caught.

This validates the two v2 recall prompts directionally.
It remains n=2 on README, the agent's strongest surface; a cli.md recall probe is still the recommended follow-up.

### Epic facets — new in v2

Primary-epic exact agreement is 12/15; same-branch agreement is 14/15.
The three primary-epic disagreements are all near-misses, not wrong-branch errors:

- `docs/guides/cli.md:27`: v2 `S2-readiness` vs gold `S1-install` — same Setup branch (install-vs-readiness nuance).
- `docs/guides/cli.md:391`: v2 `E1-evaluate` vs gold `E2-scenarios-experiments` — same Eval branch (evaluate-vs-skill-experiment nuance).
- `README.md:68`: v2 `A2-curation-review` vs gold `D1-discovery` — the one genuinely multi-epic claim in the set. v2 captured BOTH gold epics in `supportingEpics` (`[A2-curation-review, D1-discovery]`) with a correct `edgeRationale`, disagreeing only on which is primary; "the agent curates that packet" arguably reads A2-primary. The multi-epic facet worked as designed.

### Grounding precision

All 203 v2 claims (README 48 + cli 155) have a `verbatim` that exactly matches the frozen source line at the anchored line number, and there are zero duplicate anchors.
No fabricated anchors, no over-split-into-duplicate-lines.

### Count-level precision — confounded

v2 extracted more than v1 in total (README 35→48, cli 78→155), but the blow-up is concentrated in developer-audience CLI spec-detail (cli developer ~18→102), not the user surface: cli user-audience is 53 (v2) vs 60 (v1), i.e. no user-facing over-extraction.
The dense developer-CLI flag/field/exit-code enumeration is the known untiered flatness, which slice 3 deliberately deferred (no significance/tier axis yet), not a new v2 regression.

## Confounds and limitations

- Run variance is not controlled. v1 was produced by a per-source subagent fan-out; v2 here is a single fresh blind subagent per source. Count-level and exact-anchor-overlap metrics therefore mix template effect with agent run variance, which is why the count delta is reported as confounded and the per-claim facet metrics (measured on the SAME 15 shared anchors) are treated as the clean signal.
- Scope is README+cli only (92/121 user-product entries); epic accuracy on the other two sources is unmeasured.
- Recall is n=2 on the strongest surface.
- The answer key is HITL working-state, not file-ratified (b1+b2 maintainer-confirmed, b3 proposed, apply phase not run). The clean headline uses the 10 confirmed claims; the 15-claim figure is reported as confirmed-plus-proposed.
- Scoring is non-blind but mechanical against that frozen, pre-existing answer key; only the extraction needed to be blind, and it was.

## Verdict

On every axis the gold set can ground, v2 is at least as good as v1 and materially better where it was designed to be:
proof routing 8/10 → 10/10 on the maintainer-confirmed claims (12/15 → 15/15 including the proposed b3 batch, or 14/15 if the b3 cli.md:391 relabel is rejected — v2 strictly ahead in every case), the aggregate human-auditable share down from 17.4% to 7.4% on a like-for-like denominator, both measured recall false negatives now caught, and epic facets landing at 14/15 same-branch with the lone multi-epic claim handled correctly.
The v2 template change is validated; no regression surfaced on the user-product surface.
Curation-as-drop stays deferred (still no over-extraction signal on the user surface).

## Reproduce

```
node charness-artifacts/eval-trust/goldset-v2-agent-extraction/v2-measurement/score.mjs
```

Inputs are checked in beside the script: `v2-reextraction-readme.json`, `v2-reextraction-cli.json`, `template-v2-block.json`, the frozen numbered sources, and the gold/DAG artifacts in the parent directory.

## Side finding (routed to debug + fixed this slice)

Generating the authentic v2 packet surfaced a real product bug: `discover claims extraction-input --source <path>` early-returned before loading the adapter, so the slice-3 epic catalog rendered as empty on exactly the `--source` "read-only corpus measurement" path the command advertises.
Root cause, fix, and the detection gap are recorded in `charness-artifacts/debug/debug-2026-06-17-claim-discovery-explicit-source-skips-adapter.md`; the fix (load adapter before applying explicit-source overrides) and a regression test landed in this slice, which is why the packet above renders all 11 epics.
