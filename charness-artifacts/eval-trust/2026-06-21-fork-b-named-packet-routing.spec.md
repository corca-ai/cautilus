# Build contract: Fork B first slice — named-packet-emission → deterministic (2026-06-21)

Pairs with the measurement [2026-06-21-fork-b-eval-overassignment-measurement.md](./2026-06-21-fork-b-eval-overassignment-measurement.md).
Canonical living contract this realigns: [docs/contracts/facet-decomposition.md](../../docs/contracts/facet-decomposition.md) (Fork B status).
Honors the standing decision `facet-decomposition.md`:69 — **no per-claim facet schema, no `dominant` field**; per-facet routing is absorbed into the routing vocabulary.

## Problem

The deterministic baseline over-routes to `cautilus-eval`. On the post-rune-bound-recall population, the dominant residual disagreement vs the ratified answer key is `cautilus-eval → deterministic` ×10 (measurement). **Two** of those name a versioned `cautilus.<name>.vN` payload as the claim's subject (#5 `cautilus.claim_review_input.v1`, #6 `cautilus.skill_clone_experiment_report.v1`) but reach the broad noun catch-all (`classifyClaimLine`:1775) because `deterministicCommandPacketClaim` requires the literal word `packet`/`schema`/`json` in its group-1 and these lines instead name the payload directly. A claim whose dominant facet is "emits a named, versioned, schema-checkable packet" is a deterministic mechanism; the eval/skill/LLM noun it also mentions is incidental.

(Spec critique 2026-06-21 correction: gold line #10 — "facets persist … the agent emits them: `primaryEpic`, …" — carries **no** `cautilus.*.vN` token; it names bare schema *field* names, a distinct schema-field-persistence shape with its own over-flip surface. It is moved to deferred, not flipped by this discriminator.)

## Current Slice

Add one portable deterministic discriminator, `namedPacketEmissionClaim`, scoped to the named-packet shape (#5, #6, #10) plus the explicit non-LLM mechanism, with an eval-judgment exclusion guard. This is the highest-precision, lowest-over-flip-risk subset of the eval→det residual. Everything stays deterministic; no schema change.

## Fixed Decisions

1. **Trigger — named versioned Cautilus payload + emit verb, OR explicit non-LLM.**
   `namedPacketEmissionClaim(lower)` routes `deterministic`/`ready-for-proof` when either:
   - the line names a versioned payload matching `cautilus\.[a-z0-9_]+\.v[0-9]` **and** carries an emit/output verb (` emit`/` emits`/` emitted`/` outputs`/` output `/` produces `/` writes `/` records `); or
   - the line explicitly says it does not use an LLM (` does not call an llm`, ` without calling an llm`, ` does not mark claims satisfied`).
   Both are golden/schema-checkable deterministic facts; "whether the emitted behavior is good" is a separate eval facet that this routing does not claim.
2. **Eval-judgment exclusion guard (the over-flip guard) — reuse the codebase's canonical verb set (critique 2026-06-21).**
   The discriminator returns false (falls through to the existing eval cases) when the line asserts a behavior *judgment* whose packet is merely the output. The verb set must be **at least as broad as** the existing `reviewPromptModelJudgmentClaim` set (`claim_discovery.go`:~2034): ` judge `/` judges `/` judged `/` judgment`/` verdict`/` grade `/` grades `/` graded `/` grading`/` score `/` scores `/` scored `/` scoring`/` rate `/` rates `/` rating`/` better`/` worse`/` pass `/` passes `/` fail `/` fails `/` sound `/` unsound `/` evaluates whether `/` assess `/` assesses `.
   Rationale (critique): the narrower hand-rolled list would let "the judge rates X better than baseline and writes `cautilus.eval_summary.v1`" slip through (no `judge`-verb in the narrow list matched `rates`/`better`). Reusing the canonical set closes the largest over-flip vector.
   (Note: ` rubric match` as a packet *field name* — present in gold-confirmed #6 — must NOT be excluded; the guard keys on judgment *verbs*, not the noun `rubric`. ` sound ` is s-o-u-n-d and does not match #6's "source coverage".)
3. **Placement.**
   Insert the case immediately above `reviewBudgetConfirmationClaim` (the first contested eval case, `classifyClaimLine`:~1562), so it beats every eval predicate and the broad noun catch-all. It sits below the explicit-human-directive, caveat, and R6 ownership-assignment cases above it (a named-packet line is none of those; where it overlaps an R6 assignment the route is `deterministic` either way).
4. **Scope: this slice flips only the named-packet shape (#5, #6).**
   The other eval→det shapes — schema-field-persistence (#10), static taxonomy (#2), CLI-flag semantics (#3), status-routing (#4), extraction-behavior (#7), R6-ish boundary (#8), command-absence (#9) — are deferred to later gold-confirmed discriminators, recorded in the measurement, not silently dropped. They carry more over-flip risk and need their own controls.
5. **Tests in-slice — mirror `TestClaimClassificationR6R12RoutingBoundaryIsFrozen`'s table shape (`claim_discovery_test.go`:~4085), `{name, line, wantProof, wantReadiness}`:**
   - frozen golden positives: #5 (`emits cautilus.claim_review_input.v1 and does not call an LLM`), #6 (`emits cautilus.skill_clone_experiment_report.v1 with … rubric match …`) → `deterministic`/`ready-for-proof`;
   - **eval negative control (load-bearing, synthetic):** no live line co-occurs an eval-judgment verb with a `cautilus.*.vN` packet (critique: this protects against drift, not a current residual), so use a synthetic line — `The blind judge grades the agent's reasoning and emits cautilus.eval_summary.v1.` — which must STAY `cautilus-eval`; and a second `rates … better … writes cautilus.eval_summary.v1` line (proves the broadened guard from Decision 2). Analog of R12's does-X-improve negative;
   - rubric-field control: a named-packet line whose fields include `rubric match` (#6) is NOT excluded (proves the guard keys on verbs, not the noun);
   - **collateral non-flip control (critique N2):** `cautilus.claim_eval_plan.v1` ownership line — "It emits `cautilus.claim_eval_plan.v1` … while preserving the host boundary …" — must STAY `human-auditable`, protected by `ownershipBoundaryClaim` sitting above the insertion point. Pin it so a future re-order cannot silently expose it;
   - no-version control: `emits a durable report` with no `.vN` and no explicit non-LLM token is not flipped by this discriminator (it may still route via existing cases).
   Add the flipped cases to a frozen golden so any future broadening re-triggers gold-set review.
6. **Contract realigned in-slice:** `docs/contracts/facet-decomposition.md` Fork B status — record the first per-facet routing discriminator landed (named-packet) and that the remaining eval→det shapes stay deferred.
7. **Re-measure after impl + `npm run claims:refresh:all`:** overlap eval→det count, agreeing count, over-correction signatures, live eval count delta. Record before/after in the measurement artifact.

## Falsifiable Gates (binding)

- **G1 (intended flips):** #5, #6 route `deterministic` (frozen golden). (#10 is deferred — see Decision 4.)
- **G2 (no over-flip):** both synthetic eval-judgment negative controls stay `cautilus-eval`; the `claim_eval_plan.v1` collateral line stays `human-auditable`; existing R6/R12 and portable-defaults frozen goldens stay green.
- **G3 (accuracy up, no over-correction):** the overlap `cautilus-eval → deterministic` count drops (≥2 of the 10 resolved — #5, #6) and the agreeing count rises from 30; **no new** over-correction appears — neither `deterministic → (key cautilus-eval)` nor `deterministic → (key human-auditable)` on the overlap increases.
- **G4 (bounded eval loss):** the live `cautilus-eval` population drops only by the count of flipped claims (no unrelated eval claims lost); recorded exactly.

## Non-Goals / Deliberately Not Doing

- NOT a per-claim facet schema or `dominant` field (honors `facet-decomposition.md`:69).
- NOT the runtime code∧judge harness (that is the per-facet *proof* template, separate from discover-time routing).
- NOT flipping the other 6 eval→det shapes in this slice (deferred, measured).
- NOT reordering the existing switch cases (only inserting one new case at a safe position).
