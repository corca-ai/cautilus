# Build contract: Fork B third slice — schema-field-persistence → deterministic (2026-06-22)

Pairs with the measurement [2026-06-21-fork-b-eval-overassignment-measurement.md](./2026-06-21-fork-b-eval-overassignment-measurement.md).
Canonical living contract this realigns: [docs/contracts/facet-decomposition.md](../../docs/contracts/facet-decomposition.md) (Fork B status).
Builds on the first two Fork B slices [2026-06-21-fork-b-named-packet-routing.spec.md](./2026-06-21-fork-b-named-packet-routing.spec.md) and [2026-06-21-fork-b-cli-flag-semantics.spec.md](./2026-06-21-fork-b-cli-flag-semantics.spec.md).
Honors the standing decision `facet-decomposition.md`:69 — **no per-claim facet schema, no `dominant` field**; per-facet routing is absorbed into the routing vocabulary.

## Problem

The deterministic baseline over-routes to `cautilus-eval`.
On the current overlap (`.cautilus/claims/latest.json` ∩ ratified answer key `goldset-v2-reextract-head/gold-set-proposal.json`, 56 fingerprints), the residual `cautilus-eval → deterministic` disagreement is **6** after the CLI-flag slice.
**One** of those six describes a deterministic data-shape mechanism — named schema fields persisting into a stored structure — but reaches the broad noun catch-all (`classifyClaimLine`:1870) because the same line mentions an agent noun:

- **#10** (`88ae4b…`, gold `deterministic`, T3): "Claim-graph facets persist into the applied candidate when the agent emits them: `primaryEpic`, a normalized `supportingEpics` (de-duplicated and led by `primaryEpic`), a derived `multiEpic` boolean, and `edgeRationale` for multi-epic claims." — routed `cautilus-eval` because of `" agent"`.

A claim whose dominant facet is "these named schema fields persist into a data structure" is a deterministic, schema/golden-checkable mechanism; the `agent emits them` clause is the incidental eval noun — the facet-decomposition insight made concrete a third time.
The deterministic mechanism is real and already backed: the source line is [docs/contracts/claim-extraction-template.md](../../docs/contracts/claim-extraction-template.md):178, and the field-persistence behavior is implemented in `internal/runtime/claim_extraction.go` and pinned by `internal/runtime/claim_extraction_test.go` — so routing it `deterministic`/`ready-for-proof` points at a real, existing check, not a wish.

Why the first two discriminators correctly do **not** catch it (deferred on purpose):
- `namedPacketEmissionClaim` requires a versioned `cautilus.<name>.vN` token; #10 names bare schema *field* names with no packet token, so it falls through (explicitly deferred by the named-packet spec:50).
- `cliFlagSemanticsClaim` requires a `--flag` token; #10 has none.

## The lowercasing constraint (load-bearing design fact)

`classifyClaimLine` lowercases its input first (`lower := " " + strings.ToLower(line) + " "`), so **camelCase is destroyed before any `(lower)` discriminator runs** (`primaryEpic` → `primaryepic`).
The "these are schema field names" signal *is* the camelCase shape, so this discriminator must read the **original-case line**.
Decision 1 below threads the original line in; this is a deliberate, documented divergence from the uniform `(lower)` signature the first two discriminators use.
The cheaper lowercased alternative — "≥2 backtick lowercase-identifier tokens + persist" — flips exactly #10 today too (see the over-flip surface), but it would also match a future "persist `init` and `doctor`" line that is not a schema-shape claim; camelCase is the honest, future-robust signal and is pinned by a negative control (NC5).

## Gate admission note (critique S2)

#10 is admitted by `claimLineLooksUseful` only because it says "the agent **emits** them" — `" emits "` is in `defaultClaimLexiconTerms` (`claim_discovery.go`:761). The discriminator's own trigger verb `persist` is **not** in the gate lexicon, so it cannot self-admit a line. This is fine today (the live #10 carries `emits`), and the planned reachable `TestGateRouterCoherence` row uses the live #10 line verbatim, so the coverage guard re-fires if a future maintainer rewords #10 to drop `emits` and silently kills the route. No gate/lexicon edit is needed in this slice.

## Over-flip surface (the load-bearing measurement)

The trigger is a conjunction (`persist` verb AND ≥2 distinct backtick camelCase field tokens), so the touchable set is the intersection of the two signals. Measured 2026-06-22 against the live population (489 candidates):

Every live candidate carrying a persistence verb (`persist`/`persists`/`persisted`) — the complete `persist`-axis set:

| fp | live route | shape | flips? |
| --- | --- | --- | --- |
| `88ae4b…` (#10) | `cautilus-eval` (gold `deterministic`) | facets persist into candidate + 4 camelCase field names | **yes** (`persist` + 4 camelCase) — intended |
| `a06299…` | `human-auditable` | "adapter … should also persist them as files" | no (zero backtick tokens — fails the field-list arm) |

Every live candidate carrying ≥2 distinct backtick camelCase tokens — the **complete** field-list-axis set (all 13, verified 2026-06-22; none but #10 has a persistence verb):

| fp | live route | distinct camelCase | has `persist`? | flips? |
| --- | --- | --- | --- | --- |
| `88ae4b…` (#10) | `cautilus-eval` | 4 | yes | **yes** — intended |
| `a99438…` | `cautilus-eval` | 2 (`byReviewStatus`/`byEvidenceStatus`) | no | no — real eval claim, protected by the persist arm |
| `2d630a…` | `human-auditable` | 5 (`claimUpdates`/`claimFingerprint`/…) | no | no |
| `54f451…` | `deterministic` | 2 | no | no (already deterministic; no change) |
| `0ca50b…` | `deterministic` | 2 | no | no (already deterministic) |
| `d68b06…` | `cautilus-eval` | 2 | no | no — real eval claim, protected by the persist arm |
| `9aa67d…` | `human-auditable` | 2 (`instanceId`/`displayLabel`) | no | no |
| `739593…` | `deterministic` | 2 | no | no (already deterministic) |
| `a3d42a…` | `human-auditable` | 3 (`sourceInventory`/`sourceGraph`/…) | no | no |
| `40d6cb…` | `deterministic` | 4 | no | no (already deterministic) |
| `c27f84…` | `cautilus-eval` | 5 | no | no — real eval claim, protected by the persist arm |
| `6e2916…` | `deterministic` | 4 | no | no (already deterministic) |
| `513133…` | `cautilus-eval` | 4 | no | no — real eval claim, protected by the persist arm |

The intersection of the two axes is **exactly `88ae4b…` (#10)**.
The decisive protection is two-sided: `a06299…` (persist, human-auditable) is held by the **field-list arm** (0 backtick tokens); the four real `cautilus-eval` field-list claims (`a99438…`, `d68b06…`, `c27f84…`, `513133…`) are held by the **persist arm** (no persistence verb).
Neither arm alone is safe; the conjunction is.

## Current Slice

Add one portable deterministic discriminator, `schemaFieldPersistenceClaim`, scoped to the schema-field-persistence shape (#10): a persistence verb plus a multi-field backtick camelCase identifier list, with the shared judgment-verb over-flip guard.
This is the next gold-confirmed subset of the eval→det residual after named-packet and CLI-flag.
Everything stays deterministic; no schema change.

## Fixed Decisions

1. **Signature — `schemaFieldPersistenceClaim(line string)` takes the ORIGINAL-case line.**
   It lowercases internally for the verb/guard substring checks and uses the original case for the camelCase field-token regex (see the lowercasing constraint above). The call site becomes `case schemaFieldPersistenceClaim(line):` — `line` is in scope in `classifyClaimLine` and is the raw `block.text`, original-case (verified: `extractClaimCandidates` passes `block.text` directly, only `normalizeClaimSummary` lowercases, and that runs separately for the summary).
2. **Trigger — a persistence verb AND ≥2 distinct backtick camelCase field tokens.**
   `schemaFieldPersistenceClaim` routes `deterministic`/`ready-for-proof` when the line:
   - (lowercased) contains a persistence verb from the **tight gold-confirmed set**: `" persist "`, `" persists "`, `" persisted "`; **and**
   - (original case) contains **≥2 distinct** backtick camelCase field tokens matching `` `[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*` `` (a backtick-quoted lower-initial identifier with at least one interior uppercase — `primaryEpic`, `supportingEpics`, `multiEpic`, `edgeRationale` all match; a single-field mention or a lowercase backtick token like `` `init` `` does not).
   Both arms are required; #10 satisfies both (4 distinct camelCase tokens, `persist`). The sets are the minimal seed the single gold line justifies and are the precision knobs proven against the full over-flip surface above.
3. **Eval-judgment exclusion guard — judgment VERBS (shared set).**
   The discriminator returns false (falls through to the existing eval cases) when the line asserts a behavior *judgment*: the same set used by `cliFlagSemanticsClaim` — `" judges "`, `" judged "`, `" judgment"`, `" verdict"`, `" grade "`, `" grades "`, `" graded "`, `" grading"`, `" score "`, `" scores "`, `" scored "`, `" scoring"`, `" rate "`, `" rates "`, `" rated "`, `" rating"`, `" better"`, `" worse"`, `" pass "`, `" passes "`, `" fail "`, `" fails "`, `" sound "`, `" unsound "`, `" evaluates whether "`, `" assess "`, `" assesses "`. The bare noun `" judge "` is not excluded (consistent with `cliFlagSemanticsClaim`); #10 contains no judge noun, so this choice does not affect the intended flip and is pinned only as a guard against a constructed judgment line (NC2).
4. **Placement.**
   Insert the case immediately **after** `cliFlagSemanticsClaim` (`classifyClaimLine`:~1656) and before `reviewBudgetConfirmationClaim`. It therefore beats every contested eval predicate (`reviewBudgetConfirmationClaim`, `scanScopeDisplayBehaviorClaim`, `skillOrAgentBehaviorClaim`, `claimNeedsScenario`, `broadEvalSurfaceClaim`) and the broad noun catch-all (`:1870`). It sits below the explicit-human-directive, caveat, ownership-assignment/boundary, premature-review, proof-routing, named-packet, and CLI-flag cases above it — none of which fire on #10 (verified: #10 currently reaches the broad catch-all with `surface=dev/repo`, so no earlier case matches it).
5. **Scope: this slice flips only the schema-field-persistence shape (#10).**
   The other eval→det shapes — packet-emission prose #1, static-taxonomy #2, status-routing #4, R6-ish boundary #8, command-absence #9 — stay deferred to later gold-confirmed discriminators (#9 is the next planned slice), recorded in the measurement, not silently dropped.
6. **Tests in-slice — a frozen-golden ROUTE table mirroring `TestClaimClassificationForkBCLIFlagSemanticsRoutingIsFrozen` (`claim_discovery_test.go`:~4189), plus a `schemaFieldPersistenceClaim` UNIT guard table mirroring `TestCliFlagSemanticsClaimGuard` (~4227), plus a reachable row in `TestGateRouterCoherence` (~4260).**
   Frozen-golden ROUTE cases `{name, line, wantProof, wantReadiness}`:
   - **frozen golden positive:** #10 (the live line) → `deterministic`/`ready-for-proof`;
   - **judgment-guard negative control (load-bearing):** a synthetic carrying a persistence verb AND ≥2 camelCase tokens AND a judgment verb AND an eval noun AND a gate-lexicon verb (`keeps`), so it passes `claimLineLooksUseful` on the **live path** (not only in the gate-bypassing route test) and routes `cautilus-eval` *via the catch-all after the guard rejects it* (not dropped): `"The blind judge grades whether \`primaryEpic\` and \`supportingEpics\` persist correctly and keeps the better agent transcripts."` (`persist` + 2 camelCase would flip; `grades`/`better` guard rejects → ` agent` reaches the broad catch-all → `cautilus-eval`). **Verified 2026-06-22: ADMIT=true, route=`cautilus-eval`.** (Critique B1: the prior draft used a line with no gate-lexicon verb — `claimLineLooksUseful=false` — so it would be dropped on the live path and the route test would prove nothing, exactly the false-G2 trap the CLI-flag slice corrected.)
   - **field-list non-flip control (load-bearing, the persist arm):** the real `a99438…` live line **verbatim** — `"Each action bucket should include \`byReviewStatus\` and \`byEvidenceStatus\` counts so a human can tell whether the queue is already reviewed enough to spend time on or still needs agent triage first."` → must STAY `cautilus-eval` (it reaches the broad catch-all via ` agent`; proves ≥2 camelCase tokens alone, with no persistence verb, do not flip a genuine eval claim). **Verified 2026-06-22: route=`cautilus-eval`.** (Critique B2: the prior draft paraphrased this line and dropped the ` agent` token, so the paraphrase routed `human-auditable` and the `cautilus-eval` assertion would have failed; use the live text verbatim.)
   `schemaFieldPersistenceClaim` UNIT guard cases `{name, line, want bool}` (assert the predicate directly, so no route-cause is claimed):
   - **#10** (the live line) → `true`;
   - **judgment-verb guard:** `"The judge grades whether \`primaryEpic\` and \`supportingEpics\` persist correctly."` → `false`;
   - **single-field control:** `"Cautilus persists \`primaryEpic\` for every applied candidate."` → `false` (the ≥2-distinct-token arm is required);
   - **no-persist control (the field-list arm):** `"Each bucket includes \`byReviewStatus\` and \`byEvidenceStatus\` counts."` → `false` (a persistence verb is required);
   - **persist-no-backtick control (the field-list arm):** `"A named adapter should also persist them as files for later inspection."` → `false` (the `a06299…` shape: persist with zero backtick tokens);
   - **camelCase-required pin (the Decision 1/2 divergence made falsifiable):** `"Cautilus persists \`init\` and \`doctor\` state into the applied candidate."` → `false` (lowercase backtick tokens are NOT camelCase; this pin documents why the discriminator reads the original case and forces review if a future maintainer relaxes the regex to bare backtick tokens).
   Add the flipped route case to the frozen golden so any future broadening re-triggers gold-set review.
7. **Contract realigned in-slice:** `docs/contracts/facet-decomposition.md` Fork B status — record the third per-facet routing discriminator landed (schema-field-persistence) and that the remaining eval→det shapes stay deferred (#9 next).
8. **Re-measure after impl + `npm run claims:refresh:all`:** overlap eval→det count, agreeing count, over-correction signatures, live eval count delta, population shift. Record before/after in the measurement artifact, including any self-extraction from this slice's own contract-realignment prose (the recurring effect prior slices noted).

## Falsifiable Gates (binding)

- **G1 (intended flip):** #10 routes `deterministic`/`ready-for-proof` (frozen golden).
- **G2 (no over-flip):** the judgment-guard synthetic routes `cautilus-eval` (via the catch-all after the guard rejects it, not dropped); the field-list-only `a99438…` shape stays `cautilus-eval`; the unit guard table passes (single-field → `false`, no-persist → `false`, persist-no-backtick → `false`, lowercase-non-camelCase → `false`, judgment-verb → `false`); existing R6/R12, named-packet, CLI-flag, and portable-defaults frozen goldens stay green; `TestGateRouterCoherence` stays green with the new reachable row.
- **G3 (accuracy up, no over-correction):** the overlap `cautilus-eval → deterministic` count drops by exactly 1 (6 → 5, #10) and the agreeing count rises from 36 to 37; **no new** over-correction appears — neither `deterministic → (key cautilus-eval)` (stays 5) nor `deterministic → (key human-auditable)` (stays 0) increases. (The synthetic test lines are not in the live corpus and have zero overlap effect.)
- **G4 (bounded eval loss):** the live `cautilus-eval` population drops by exactly 1 (the #10 flip), from 165 to 164 modulo any self-extraction the measure step records explicitly; the measure step re-verifies no *second* live flip appears (the over-flip surface holds); no unrelated eval claim is lost; recorded exactly.

## Non-Goals / Deliberately Not Doing

- NOT a per-claim facet schema or `dominant` field (honors `facet-decomposition.md`:69).
- NOT broadening the persistence verb set beyond the gold-confirmed seed `{persist, persists, persisted}` (e.g. `stored`/`saved`/`written`/`recorded` are deferred and gold-gated — `recorded`/`written` co-occur with packet-emission shapes and would risk collateral flips).
- NOT relaxing the field-list arm to bare lowercased backtick tokens (the cheaper signature would lose the camelCase precision; pinned by NC5).
- NOT flipping the other deferred eval→det shapes in this slice (recorded, measured; #9 command-absence is the next slice).
- NOT reordering the existing switch cases (only inserting one new case at a safe position).
