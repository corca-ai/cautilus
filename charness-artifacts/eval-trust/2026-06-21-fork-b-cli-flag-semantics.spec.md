# Build contract: Fork B second slice — CLI-flag-semantics → deterministic (2026-06-21)

Pairs with the measurement [2026-06-21-fork-b-eval-overassignment-measurement.md](./2026-06-21-fork-b-eval-overassignment-measurement.md).
Canonical living contract this realigns: [docs/contracts/facet-decomposition.md](../../docs/contracts/facet-decomposition.md) (Fork B status).
Builds on the first Fork B slice [2026-06-21-fork-b-named-packet-routing.spec.md](./2026-06-21-fork-b-named-packet-routing.spec.md).
Honors the standing decision `facet-decomposition.md`:69 — **no per-claim facet schema, no `dominant` field**; per-facet routing is absorbed into the routing vocabulary.

## Problem

The deterministic baseline over-routes to `cautilus-eval`.
On the current overlap (`.cautilus/claims/latest.json` ∩ ratified answer key `goldset-v2-reextract-head/gold-set-proposal.json`), the residual `cautilus-eval → deterministic` disagreement is **8** after the named-packet slice.
**Two** of those eight describe what a named CLI flag *does* to config, session state, auth, or IO — a deterministic command-contract mechanism — but reach the broad noun catch-all (`classifyClaimLine`:1818) because the same line also mentions an eval/judge noun:

- **#3** (`8e3786…`, gold `deterministic`, T2): "For `codex_exec`, `--codex-home-mode isolated` keeps user config and session state out of the eval while `--codex-auth-mode inherit` copies only Codex auth into the isolated home." — routed `cautilus-eval` because of `" eval "`.
- **#7** (`84f315…`, gold `deterministic`, T3): "When `--output-text-key` is present, Cautilus also extracts that JSON narrative span into the rendered prompt so the judge can read the realized output directly." — routed `cautilus-eval` because of `" prompt"`/`" judge "`.

A claim whose dominant facet is "this flag keeps/copies/extracts config or IO" is a deterministic, golden/command-contract-checkable mechanism; the eval/judge noun it co-mentions is incidental — the facet-decomposition insight made concrete again.

## Over-flip surface (the load-bearing measurement)

Every live `cautilus-eval` candidate whose summary carries a long CLI-flag token (`--[a-z][a-z0-9-]+`) — the complete set the discriminator could touch — measured 2026-06-21:

| fp | gold route | shape | flips? |
| --- | --- | --- | --- |
| `8e3786…` (#3) | `deterministic` | flag keeps/copies config+auth | **yes** (`keeps`,`copies`) — intended |
| `84f315…` (#7) | `deterministic` | flag extracts JSON span | **yes** (`extracts`) — intended |
| `5eb5…` | NOT-IN-KEY | canonical-filename `--input`/`--output` contract; "keeps writing to stdout …" | **yes** (`keeps`) — off-overlap collateral, deterministic-shaped, recorded |
| `78e2…` | NOT-IN-KEY | "Use `--codex-home-mode isolated` when the eval should not load …" | no (verb `load`/`use` not in set) |
| `3d2a…` | NOT-IN-KEY | `--output-dir` precedence chain + emits `Active run:` | no (verbs `follows`/`emits` not in set) |
| `a8e4…` | NOT-IN-KEY | "`doctor status --json` gives Cautilus Agent a packet so it can **choose** a branch" | **no** — genuine agent-behavior, must stay eval |

The decisive case is `a8e4…`: it carries a `--json` flag token but is a real `cautilus-eval` claim (the Cautilus Agent choosing a next branch).
A broad verb set would wrongly flip it.
The tight verb set `{keeps, copies, extracts}` — **not** the judgment guard — is therefore the primary precision control here: `a8e4…`'s verbs are `gives`/`choose`, not flag-effect verbs, so it is never reached.

**Accepted residual (recorded, fresh-eye critique 2026-06-21):** the tight verb set protects an agent-behavior flag claim only when its actor verb is outside the set. A *constructed* line "When `--json` is set, the Cautilus Agent extracts the next branch it should choose." (agent-behavior + `extracts`) *would* flip to `deterministic`, because the discriminator keys on the flag-effect verb, not on who acts. This is an accepted residual of the tight-verb-set approach, not a guard hole: **zero** such lines exist in the live corpus today (the only agent-behavior flag claim, `a8e4…`, uses `gives`/`choose`), and the measure step re-verifies that no live eval claim combining agent-behavior with a flag-effect verb appears. If one ever does, it surfaces as an unexpected flip in the over-flip re-measurement and forces an actor-guard before it can land.

## Current Slice

Add one portable deterministic discriminator, `cliFlagSemanticsClaim`, scoped to the CLI-flag-semantics shape (#3, #7) with a tight, gold-confirmed flag-effect verb set and a judgment-verb over-flip guard.
This is the highest-precision next subset of the eval→det residual after named-packet.
Everything stays deterministic; no schema change.

## Fixed Decisions

1. **Trigger — a long CLI-flag token AND a gold-confirmed flag-effect verb.**
   `cliFlagSemanticsClaim(lower)` routes `deterministic`/`ready-for-proof` when the line:
   - contains a long CLI-option token matching `--[a-z][a-z0-9-]+` (a standalone `--` or a single dash is not a flag); **and**
   - contains a flag-effect-on-config/state/IO verb from the **tight gold-confirmed set**: `" keeps "`, `" copies "`, `" extracts "`.
   Both #3 (`keeps`,`copies`) and #7 (`extracts`) are gold-confirmed. The verb set is intentionally the minimal seed that the gold lines justify; it is the precision knob proven against the full over-flip surface above.
2. **Eval-judgment exclusion guard — judgment VERBS only, NOT the bare noun `" judge "`.**
   The discriminator returns false (falls through to the existing eval cases) when the line asserts a behavior *judgment*:
   `" judges "`, `" judged "`, `" judgment"`, `" verdict"`, `" grade "`, `" grades "`, `" graded "`, `" grading"`, `" score "`, `" scores "`, `" scored "`, `" scoring"`, `" rate "`, `" rates "`, `" rated "`, `" rating"`, `" better"`, `" worse"`, `" pass "`, `" passes "`, `" fail "`, `" fails "`, `" sound "`, `" unsound "`, `" evaluates whether "`, `" assess "`, `" assesses "`.
   **Deliberate divergence from `namedPacketEmissionClaim`** (which excludes the bare noun `" judge "`): #7 says "… so the judge can read the realized output directly" — here `judge` is the *reader* of the deterministic flag output, not a quality judgment. Excluding bare `" judge "` would block the gold-confirmed #7 flip. This narrowing is safe because the tight verb set already excludes the only live agent-behavior flag claim (`a8e4…`, whose verb is `choose`), and it is pinned by negative controls NC2/NC3 below.
3. **Placement.**
   Insert the case immediately **after** `namedPacketEmissionClaim` (`classifyClaimLine`:~1604) and before `reviewBudgetConfirmationClaim`. It therefore beats every contested eval predicate and the broad noun catch-all (`:1818`). It sits below the explicit-human-directive, caveat, ownership-assignment/boundary, premature-review, and proof-routing cases above it — none of which fire on #3/#7 (verified: both currently reach the broad catch-all, so no earlier case matches them).
4. **Scope: this slice flips only the CLI-flag-semantics shape (#3, #7), plus one recorded off-overlap collateral (`5eb5…`).**
   The other eval→det shapes — packet-emission prose #1, static-taxonomy #2, status-routing #4, R6-ish boundary #8, command-absence #9, schema-field-persistence #10 — stay deferred to later gold-confirmed discriminators, recorded in the measurement, not silently dropped.
   `78e2…` (flag-usage *when*-guidance) is deliberately **not** flipped: its verb (`load`/`use`) is outside the gold set; broadening to catch it is deferred and gold-gated.
5. **Tests in-slice — a frozen-golden ROUTE table mirroring `TestClaimClassificationForkBNamedPacketRoutingIsFrozen` (`claim_discovery_test.go`:~4126), plus a `cliFlagSemanticsClaim` UNIT guard table mirroring `TestNamedPacketEmissionClaimGuard` (~4163).**
   Frozen-golden ROUTE cases `{name, line, wantProof, wantReadiness}`:
   - **frozen golden positives:** #3 (codex flags `keeps`/`copies`) and #7 (`--output-text-key` `extracts` … "so the judge can read") → `deterministic`/`ready-for-proof`;
   - **judgment-guard negative control (load-bearing, corrected per critique):** a synthetic carrying a flag-effect verb AND a judgment verb AND an eval noun so it routes `cautilus-eval` *via the catch-all after the guard rejects it* (the prior draft omitted the eval noun and the line would be DROPPED, not routed eval — a false G2): `"With \`--rubric-strict\`, the judge grades the agent's behavior harder and the run keeps only the failing transcripts."` (`--flag` + `keeps` would flip; `grades` guard rejects → `agent's behavior` reaches the broad catch-all → `cautilus-eval`);
   - **agent-behavior non-flip control (load-bearing):** the real `a8e4…` shape — `"\`doctor status --json\` gives the Cautilus Agent a packet so it can choose a next branch."` → must STAY `cautilus-eval` (proves the tight verb set, not the guard, protects genuine agent-behavior flag claims whose verb is outside the set).
   `cliFlagSemanticsClaim` UNIT guard cases `{name, line, want bool}` (these assert the predicate directly, so no route-cause is claimed):
   - #3, #7 → `true`;
   - **bare-noun control (load-bearing, the Decision 2 divergence):** `"When \`--transcript-key\` is set, Cautilus copies the transcript so the judge can read it."` → `true` (proves bare `" judge "` does NOT block the predicate; note this line routes `human-auditable` today, not eval, so it is proven at the predicate level, not as an eval→det flip);
   - **judgment-verb guard:** `"With \`--rubric-strict\`, the judge grades the variant harder and keeps only failures."` → `false`;
   - **no-flag control:** `"The runner keeps the workspace clean between cases."` → `false` (the `--flag` token is required);
   - **synonym false-negative pin (deferral made falsifiable, critique suggestion):** `"\`--codex-home-mode isolated\` isolates user config and session state from the eval."` → `false` (a `isolates` synonym is deliberately NOT in the verb set; this pin forces gold review if a future maintainer broadens the set).
   Add the flipped route cases to the frozen golden so any future broadening re-triggers gold-set review.
6. **Contract realigned in-slice:** `docs/contracts/facet-decomposition.md` Fork B status — record the second per-facet routing discriminator landed (CLI-flag-semantics) and that the remaining eval→det shapes stay deferred.
7. **Re-measure after impl + `npm run claims:refresh:all`:** overlap eval→det count, agreeing count, over-correction signatures, live eval count delta, and the off-overlap collateral flip. Record before/after in the measurement artifact.

## Falsifiable Gates (binding)

- **G1 (intended flips):** #3, #7 route `deterministic` (frozen golden).
- **G2 (no over-flip):** the judgment-guard synthetic routes `cautilus-eval` (via the catch-all after the guard rejects it, not dropped); the agent-behavior `a8e4…` shape stays `cautilus-eval`; the unit guard table passes (bare-noun → `true`, judgment-verb → `false`, no-flag → `false`, `isolates` synonym → `false`); existing R6/R12, named-packet, and portable-defaults frozen goldens stay green.
- **G3 (accuracy up, no over-correction):** the overlap `cautilus-eval → deterministic` count drops by exactly 2 (8 → 6, #3 + #7) and the agreeing count rises from 34 to 36; **no new** over-correction appears — neither `deterministic → (key cautilus-eval)` nor `deterministic → (key human-auditable)` on the overlap increases. (The synthetic test lines are not in the live corpus and have zero overlap effect.)
- **G4 (bounded eval loss):** the live `cautilus-eval` population drops only by the count of flipped claims — the two overlap flips (#3, #7) plus the one recorded off-overlap collateral `5eb5…`; the measure step re-verifies no *third* live flip appears (no agent-behavior-plus-flag-effect-verb residual); no unrelated eval claim is lost; recorded exactly.

## Non-Goals / Deliberately Not Doing

- NOT a per-claim facet schema or `dominant` field (honors `facet-decomposition.md`:69).
- NOT broadening the verb set beyond the gold-confirmed seed `{keeps, copies, extracts}` (e.g. `sets`/`selects`/`uses`/`includes`/`excludes` are deferred and gold-gated — adding them now would risk the `a8e4…`-class over-flip and the `78e2…` unmeasured flip).
- NOT flipping the other deferred eval→det shapes in this slice (recorded, measured).
- NOT reordering the existing switch cases (only inserting one new case at a safe position).
