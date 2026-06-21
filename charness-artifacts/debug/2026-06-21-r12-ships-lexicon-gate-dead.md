# Debug Review — R12 capability-existence unreachable behind the lexicon gate
Date: 2026-06-21

## Problem

R12 (`capabilityExistenceClaim`, the ratified ownership/capability discriminator landed 2026-06-21) never fires on the live claim-discovery population: `discover claims` cannot extract any "ships X" capability claim, including the README GEPA-seam archetype (`claim-readme-md-140`, README.md:140).

## Correct Behavior

- Given a documented capability-existence claim shaped "`Cautilus` ships a … seam/mechanism/command/capability",
- When `cautilus discover claims` runs the deterministic baseline,
- Then the claim should be extracted and routed `deterministic` by `classifyClaimLine` (R12).

Observed (assumption being tested): the handoff and the R6/R12 measurement attributed R12's dormancy solely to the 260-rune extraction bound (the GEPA line is 280 runes). Separating fact from that prior assumption is the point of this investigation.

## Observed Facts

- `capabilityExistenceClaim` (`internal/runtime/claim_discovery.go`) keys **exclusively** on `" ships "` plus a capability noun: `return strings.Contains(lower, " ships ") && containsAny(lower, []string{" seam", " seams", " mechanism", …})`.
- `defaultClaimLexiconTerms` (the `claimLineLooksUseful` gate) does **not** contain `" ships "`. It has `" installs "`, `" produces "`, `" provides "` but not `" ships "`.
- `extractClaimCandidates` calls `claimLineLooksUseful` first; if `!useful` it `continue`s (drops) before `classifyClaimLine` is ever called.
- This repo's adapter (`.agents/cautilus-adapter.yaml`) declares no `claim_lexicon_terms`, so the adapter-lexicon lane is dead here too.

## Reproduction

Direct diagnostic (`go test ./internal/runtime/ -run TestDiagGepaLexicon`, throwaway):

```
runes=280
default lexicon matches: []string{}        # the GEPA line matches NO gate term
contains ' ships '? true
classifyClaimLine ok=true route=deterministic readiness=ready-for-proof
short R12 line lexicon matches: []string{} # even the <260 R12 unit line matches no gate term
```

So both the 280-rune full line **and** the shortened (<260) R12 unit line are dropped by the gate — length is not the cause.

## Candidate Causes

- Rune upper bound (260) drops the 280-rune line — the prior assumption.
- Lexicon gate (`defaultClaimLexiconTerms`) lacks `" ships "`, so the line is dropped before classification — independent of length.
- `classifyClaimLine` mis-routes the line (control-flow / switch-order) — would show as `ok=false` or a non-deterministic route.
- Adapter `claim_lexicon_terms` could have admitted it, but this repo declares none — so no adapter fallback rescues the shape.

## Hypothesis

If cause 2 is the real one, then a `" ships "`-shaped capability line **under** 260 runes is still dropped (falsifies cause 1 as the sole cause), and `classifyClaimLine` on the line returns `deterministic` (falsifies cause 3).

## Verification

The diagnostic above confirms: the short (<260) R12 line still matches zero gate terms (so the bound is not the gate), and `classifyClaimLine` returns `deterministic` (so routing is correct). Cause 2 confirmed; cause 1 is a *second, additional* filter on the specific 280-rune line but not the operative one for the class; cause 3 refuted.

Measurement (`TestMeasureLexiconShipsGap`, throwaway): 4 blocks contain `" ships "` with no other gate term and are dropped at the gate; exactly **1 routes `deterministic`** (the GEPA seam), the other 3 are route-unclassified (and would stay dropped by the no-route filter even after adding `" ships "`). 0 blocks exceed the 2000-rune sanity cap.

## Root Cause

The 2026-06-21 R6/R12 baseline slice added the **router** case (`capabilityExistenceClaim` in `classifyClaimLine`) but not the matching **gate** term: `claimLineLooksUseful` never admits a `" ships "`-only sentence to the classifier. The router can route a shape the gate refuses to pass, so R12 is structurally unreachable in the deterministic baseline. This is a latent gap in that slice, not a length problem.

## Invariant Proof

- Invariant: a claim shape the router (`classifyClaimLine`) can route must also pass the upstream gate (`claimLineLooksUseful`); otherwise the route is dead code on the live path.
- Producer Proof: `capabilityExistenceClaim` routes `" ships … seam"` → `deterministic` (`TestClaimClassificationR6R12RoutingBoundaryIsFrozen` case `r12-ships-seam`).
- Final-Consumer Proof: `TestDiscoverClaimProofPlanRecoversLongCapabilityClaimAfterBoundRelax` runs the full README GEPA line end-to-end through `DiscoverClaimProofPlan` and asserts it appears with `recommendedProof: deterministic` — the producer→consumer path the unit test alone never exercised.
- Interface-Shape Sibling Scan: see Sibling Search.
- Non-Claims: this fix does not claim the gate now admits every router shape; only that `" ships "` (R12's sole verb) is covered.

## Detection Gap

- Surface: `TestClaimClassificationR6R12RoutingBoundaryIsFrozen` tested R12 by calling `classifyClaimLine` **directly**, bypassing `claimLineLooksUseful`. It could never catch a gate that drops the line before classification.
- Smallest change to fire it: an integration test that drives the R12 archetype through `DiscoverClaimProofPlan` (gate + classifier together). Added as `TestDiscoverClaimProofPlanRecoversLongCapabilityClaimAfterBoundRelax`.

## Sibling Search

- Mental model that produced the bug: "adding a router case makes the route live" — false, because the gate is a separate upstream filter that must also admit the shape.
- token axis: every other `classifyClaimLine` case keys on tokens that are *usually* co-present with a gate verb (most claim sentences carry an incidental `must/should/owns/…`), so they are reachable in practice. R12's `" ships X: A, B, C"` enumeration shape frequently carries **no** other gate verb (measurement: the GEPA line matched zero), which is why R12 specifically is dead. proof: measurement `TestMeasureLexiconShipsGap` (only the `" ships "` class shows the gate-drop).
- cross-file: the gate (`defaultClaimLexiconTerms`) and the router (`classifyClaimLine` cases) live in the same file but are independent lists with no coverage check between them. follow-up: `follow-up: gate-router-coverage` — systematically verify every `classifyClaimLine` trigger token is admissible by the gate (or covered by a co-present verb); out of this slice's scope.
- decision: fix `" ships "` now (confirmed dead + needed for the handoff goal); defer the systematic coverage audit.

## Seam Risk

- Interrupt ID: r12-ships-gate-2026-06-21
- Risk Class: none
- Seam: none
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: charness-artifacts/eval-trust/2026-06-21-rune-bound-recall.spec.md

Critique note: the rune-bound-recall spec already passed a bounded fresh-eye critique; the bounded impl critique at slice close (already planned) covers this fix. Next step is `impl` within that ratified slice.

## Prevention

Add `" ships "` to `defaultClaimLexiconTerms` (maps to the detection-gap fix: gate must admit the router's verb) and keep the new end-to-end test so any future R12-style router/gate split is caught by gate+classifier integration, not unit-only. The systematic gate↔router coverage audit is recorded as `follow-up: gate-router-coverage`.

## Related Prior Incidents

- `2026-06-18-extraction-template-doc-binary-routing-drift.md` — adjacent class (claim-routing surface drift between two surfaces that should agree).
- R6/R12 baseline slice (not a debug artifact): `charness-artifacts/eval-trust/2026-06-21-r6r12-baseline-routing.spec.md` — the slice that introduced this latent gap.
