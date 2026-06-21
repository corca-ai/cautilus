# Fork B: residual `cautilus-eval → deterministic` over-assignment (2026-06-21)

Measurement date: 2026-06-21, on the post-(rune-bound-recall) population (`.cautilus/claims/latest.json`, 476 candidates).
Question (item 1 / Fork B): after R6/R12 and the rune-bound-recall slice, what remains of the `cautilus-eval` over-assignment, and what is the smallest contract-honoring fix?

Deterministic measurement (no LLM): fingerprint-overlap against the ratified answer key (`goldset-v2-reextract-head/gold-set-proposal.json`, `.entries[].agentLabels.recommendedProof`).

## Residual disagreements on the overlap (54 fingerprints)

| live → key | n |
| --- | --- |
| `cautilus-eval → deterministic` | 10 |
| `human-auditable → deterministic` | 9 |
| `deterministic → cautilus-eval` | 5 |

The dominant residual is **`cautilus-eval → deterministic` ×10** — the eval over-assignment Fork B targets. (The `human-auditable → deterministic` ×9 are R6/R12 shapes the portable defaults deliberately left unflipped; out of Fork B scope. The `deterministic → cautilus-eval` ×5 are the inverse and not over-assignment.)

## The 10 over-assigned claims (all ratified `deterministic`)

Every one describes a **deterministic mechanism** but is swept to `cautilus-eval` because it mentions an eval/agent/skill/judge/runner/LLM **noun**:

| # | tier | shape | summary (excerpt) |
| --- | --- | --- | --- |
| 1 | T2 | packet emission | "`Cautilus` turns the fixture run into durable eval packets …" |
| 2 | T2 | static taxonomy | "Evaluation uses two top-level surfaces: `dev` … and `app` …" |
| 3 | T2 | CLI flag semantics | "`--codex-home-mode isolated` keeps … `--codex-auth-mode inherit` copies only …" |
| 4 | T3 | status-routing rule | "If repo setup is ready but runner proof is not, that next action can point at runner assessment …" |
| 5 | T3 | **named packet + explicit non-LLM** | "It emits `cautilus.claim_review_input.v1` and does not call an LLM or mark claims satisfied." |
| 6 | T3 | **named packet + fields** | "`cautilus evaluate skill-experiment` emits `cautilus.skill_clone_experiment_report.v1` with `variant_ran`, … delta …" |
| 7 | T3 | extraction behavior | "When `--output-text-key` is present, Cautilus also extracts that JSON narrative span into the rendered prompt …" |
| 8 | T2 | ownership boundary (R6-ish) | "This keeps the product agent-first without making the binary a host-specific agent runtime." |
| 9 | T3 | command absence | "The workflow should avoid a `claim group` command." |
| 10 | T3 | schema-field persistence | "Claim-graph facets persist into the applied candidate when the agent emits them: `primaryEpic`, … `edgeRationale` …" |

## Firing analysis (why they route eval)

The `classifyClaimLine` switch is top-down. The named-packet cases (#5, #6, #10) name a versioned `cautilus.<name>.vN` payload **without the literal word "packet"/"schema"/"json"**, so `deterministicCommandPacketClaim` (which requires those words in its group-1) does not catch them; they fall through to the broad noun catch-all (`classify…:1775`, `containsAny " agent"/" skill"/" llm"/" eval "/…`) and route `cautilus-eval`.

This is the facet-decomposition insight made concrete: a `cautilus-eval`-tagged claim "almost always still has deterministic facets that code should own" — here the **dominant** facet (the named packet's existence/shape, the explicit non-LLM, the static taxonomy) is deterministic and the eval noun is incidental.

## Contract constraint on the fix

`facet-decomposition.md`:69 already decided: **no per-claim facet schema and no `dominant` field ship** in `discover`; per-facet routing is "absorbed into the routing/hint vocabulary." So Fork B is **not** a schema change and **not** the runtime code∧judge harness (that stays the per-facet *proof* template). Fork B = add deterministic-mechanism discriminators that route to the dominant facet, mirroring R6/R12's scoped-and-frozen discipline.

## Proposed first slice (highest precision, lowest risk)

**Named Cautilus packet/payload emission → deterministic.** A line that names a versioned `cautilus.<name>.vN` payload together with an emit/output verb (**#5, #6**), or that explicitly says it "does not call an llm" / "does not mark claims satisfied" (#5), describes a schema/golden-checkable deterministic mechanism. Route it `deterministic` with an **eval-judgment exclusion guard** (judge/grades/verdict/rate/better/worse/pass/fail/scored/sound/…) so a genuine eval that merely *emits a result packet* stays `cautilus-eval`. Placed above the broad noun catch-all and the early eval predicates. Frozen golden + synthetic eval negative controls + a `claim_eval_plan.v1` collateral non-flip control. Build contract: [2026-06-21-fork-b-named-packet-routing.spec.md](./2026-06-21-fork-b-named-packet-routing.spec.md).

Deferred to later Fork B slices (measured, not silently dropped):
- **#10 schema-field-persistence** ("the agent emits them: `primaryEpic`, `supportingEpics`, …") — names bare schema *field* names, **no** `cautilus.*.vN` token, so the named-packet discriminator does not (and must not) catch it; it is a distinct shape with its own over-flip surface (a future "agent emits named fields" discriminator).
- static-taxonomy (#2), CLI-flag-semantics (#3), status-routing (#4), extraction-behavior (#7), command-absence (#9), R6-ish boundary (#8) — each needs its own gold-confirmed discriminator and carries more over-flip risk than the named-packet shape.

## After: named-packet discriminator landed (2026-06-21)

Re-measured after `npm run claims:refresh:all`:

| metric | before (post rune-bound) | after (Fork B slice 1) |
| --- | --- | --- |
| overlap `cautilus-eval → deterministic` | 10 | **8** (#5, #6 resolved) |
| overlap agreeing count | 30 | **34** |
| over-correction `deterministic → (key cautilus-eval)` | 5 | **5** (no new) |
| over-correction `deterministic → (key human-auditable)` | 0 | **0** |
| live `cautilus-eval` total | 170 | **168** (−2, exactly the flips) |

Gates met: **G1** #5/#6 route `deterministic`; **G2** the synthetic eval-judgment controls stay `cautilus-eval` and the `claim_eval_plan.v1` collateral stays `human-auditable` (frozen golden + guard unit test); **G3** the overlap eval→det dropped 10→8 and the agreeing count rose 30→34 with zero new over-corrections; **G4** the live eval population dropped by exactly 2 (the flips) — no unrelated eval claim lost.

Measurement-fidelity note: the live population also grew by ~11 deterministic candidates that are claim-shaped sentences in this slice's own contract realignment (`facet-decomposition.md` Fork B paragraph) — self-extraction, separate from the routing change, the same effect the prior slices noted. The routing effect itself is the 2 eval→det flips above.

Remaining after named-packet (next Fork B slices): overlap eval→det was 8 (the deferred shapes: schema-field-persistence #10, static-taxonomy #2, CLI-flag #3, status-routing #4, extraction #7, command-absence #9, R6-ish boundary #8). `human-auditable → deterministic` ×9 stays an R6/R12-scope question, not Fork B.

## After: CLI-flag-semantics discriminator landed (2026-06-21, Fork B slice 2)

Re-measured after `npm run claims:refresh:all` on an unchanged 488-candidate population (HEAD vs post-slice diff confirms no population shift).
Build contract: [2026-06-21-fork-b-cli-flag-semantics.spec.md](./2026-06-21-fork-b-cli-flag-semantics.spec.md).

| metric | before (Fork B slice 1) | after (Fork B slice 2) |
| --- | --- | --- |
| overlap `cautilus-eval → deterministic` | 8 | **6** (#3, #7 resolved) |
| overlap agreeing count | 34 | **36** |
| over-correction `deterministic → (key cautilus-eval)` | 5 | **5** (no new) |
| over-correction `deterministic → (key human-auditable)` | 0 | **0** |
| live `cautilus-eval` total | 168 | **165** (−3) |

The `cliFlagSemanticsClaim` discriminator (long `--[a-z][a-z0-9-]+` flag token + gold-confirmed flag-effect verb `{keeps, copies, extracts}`, with a judgment-verb guard that allows the bare noun `judge`) flipped exactly **three** live candidates:
- **#3** (`8e3786…`, gold `deterministic`, T2) — `keeps`/`copies` on the codex `--codex-home-mode`/`--codex-auth-mode` flags;
- **#7** (`84f315…`, gold `deterministic`, T3) — `extracts` on `--output-text-key` ("so the judge can read" — bare-noun `judge`, intentionally allowed);
- **`5eb5…`** (NOT-IN-KEY) — off-overlap collateral, `keeps writing to stdout` on the `--input`/`--output` canonical-filename contract; deterministic-shaped, recorded honestly, no gold answer to validate against.

The over-flip surface held: the three flag-bearing eval claims that must stay `cautilus-eval` did — `78e2…` (flag-usage *when*-guidance, verb outside the set), `3d2a…` (`--output-dir` precedence, verb outside the set), and the decisive `a8e4…` (`doctor status --json` gives the Cautilus Agent a packet so it can **choose** a branch — genuine agent behavior, protected by the tight verb set, not the guard).

Gates met: **G1** #3/#7 route `deterministic`; **G2** judgment-guard synthetic stays `cautilus-eval`, agent-behavior `a8e4` stays `cautilus-eval`, unit guard table green (bare-noun allowed, judgment-verb/`no-flag`/`isolates`-synonym rejected); **G3** overlap eval→det dropped 8→6, agreeing rose 34→36, zero new over-correction; **G4** live eval dropped by exactly 3 = two overlap flips (#3, #7) + one recorded off-overlap collateral (`5eb5`), no unrelated eval claim lost, population unchanged at 488.

Accepted residual (recorded, fresh-eye critique): an agent-behavior flag claim that used a flag-effect verb (`extracts` etc.) *would* flip; zero such lines exist in the live corpus today, and this re-measurement confirms no third unexpected flip. If one appears later it surfaces as an unexpected over-flip and forces an actor-guard.

Measurement-fidelity note: the clean routing measurement above (488 population) was taken before the contract realignment. After editing this slice's `facet-decomposition.md` paragraph and re-running `claims:refresh:all`, the population grew by exactly 1 deterministic self-extracted candidate (a claim-shaped sentence in the realignment prose), 488 → 489 — the same self-extraction effect the prior slices noted, separate from the routing change. The live `cautilus-eval` total stayed 165 and every gate above held unchanged.

Authority-vs-flip note (2nd fresh-eye review, counterfactual-confirmed): in the live corpus `cliFlagSemanticsClaim` is the routing authority for **7** candidates, but only **3** are true flips (#3, #7, `5eb5`). The other 4 (`04ac0c0a`, `05cfeb55`, `40340b4a`, and this slice's own self-extracted prose `79c8f8c3`) were already `deterministic` via later switch cases, so the new case claims them earlier without changing their outcome. Disabling the discriminator reverts exactly the 3 flips and nothing else — so "drop of exactly 3" is complete, not a partial count.

Overlap-denominator note: the fingerprint overlap denominator grew 54 → 56 across the two Fork B slices (population growth + self-extraction), so the slice-2 deltas (agreeing 34 → 36, eval→det 8 → 6) are reported on the current 56-fingerprint overlap, not slice 1's 54.

Remaining (next Fork B slices): overlap eval→det is now **6** — the deferred shapes packet-emission prose #1, static-taxonomy #2, status-routing #4, R6-ish boundary #8, command-absence #9, schema-field-persistence #10. `human-auditable → deterministic` ×9 stays an R6/R12-scope question, not Fork B.

## Reproduction

```
jq -n --slurpfile live .cautilus/claims/latest.json \
  --slurpfile ak charness-artifacts/eval-trust/goldset-v2-reextract-head/gold-set-proposal.json \
  '($live[0].claimCandidates|map({(.claimFingerprint):{route:.recommendedProof,summary:.summary}})|add) as $lm
   | ($ak[0].entries|map(select(.claimFingerprint!=null))
      | map(select($lm[.claimFingerprint]!=null and $lm[.claimFingerprint].route=="cautilus-eval" and .agentLabels.recommendedProof=="deterministic"))
      | map({tier:.significanceTier, summary:$lm[.claimFingerprint].summary}))'
```
