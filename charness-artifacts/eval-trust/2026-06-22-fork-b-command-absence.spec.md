# Build contract: Fork B fourth slice — command-absence → deterministic (2026-06-22)

Pairs with the measurement [2026-06-21-fork-b-eval-overassignment-measurement.md](./2026-06-21-fork-b-eval-overassignment-measurement.md).
Canonical living contract this realigns: [docs/contracts/facet-decomposition.md](../../docs/contracts/facet-decomposition.md) (Fork B status).
Builds on the first three Fork B slices (named-packet, CLI-flag-semantics, schema-field-persistence).
Honors the standing decision `facet-decomposition.md`:69 — **no per-claim facet schema, no `dominant` field**; per-facet routing is absorbed into the routing vocabulary.

## Problem

The deterministic baseline over-routes to `cautilus-eval`.
On the current overlap (`.cautilus/claims/latest.json` ∩ ratified answer key `goldset-v2-reextract-head/gold-set-proposal.json`, 56 fingerprints), the residual `cautilus-eval → deterministic` disagreement is **5** after the schema-field-persistence slice.
**One** of those five asserts that a named CLI command should NOT exist — a deterministic, statically-checkable capability-absence — but reaches the broad noun catch-all (`classifyClaimLine`:1870) because the line mentions a workflow noun:

- **#9** (`cf9b99…`, gold `deterministic`, T3): "The workflow should avoid a `claim group` command." — routed `cautilus-eval` because of `" workflow"` (catch-all `why`: "depends on model, agent, prompt, skill, workflow, or behavior execution evidence"). Source: `docs/contracts/claim-discovery-workflow.md`:576.

This is the exact inverse of R12 `capabilityExistenceClaim` (which routes "the product ships a named command/capability" → `deterministic`). That a named command does NOT exist in the CLI is just as statically checkable as that it does: grep the command registry. The gold answer is `deterministic`, so routing it deterministic points at a real check, not a wish.

## The danger axis (why the trigger is narrow)

The obvious broad signal — "negation phrasing + command" — is **unsafe**. In the live corpus the generic negations `should not`, `does not`, `without` co-occur with `command` in genuine `cautilus-eval` behavior claims:

| fp | live route | why it must stay eval | generic phrase it carries |
| --- | --- | --- | --- |
| `ab43f0…` | `cautilus-eval` | "an agent **should not mark** the claim satisfied without human judgment …" | `should not`, `without` |
| `c2fd8b…` | `cautilus-eval` | "… the result **does not prove** model or app behavior" | `does not`, `command` |
| `543403…` | `cautilus-eval` | "… resumable **without** hiding workspace ownership" | `without`, `command` |
| `c4c35b…` | `cautilus-eval` | "command artifacts own workflow metadata …" | `command` |

So the trigger must NOT key on bare `should not` / `does not` / `without`. It keys on absence phrasings **tightly bound to command addition** (`avoid a/the/adding`, `should not add`, `should not introduce`, `does not add`), which none of the trap claims carry.

## Over-flip surface (the load-bearing measurement)

Simulated across the full live population (490 candidates, 2026-06-22) with the exact proposed trigger — absence phrasing AND a backtick token AND the word `command`/`subcommand`:

| fp | live route | matches trigger? | flips? |
| --- | --- | --- | --- |
| `cf9b99…` (#9) | `cautilus-eval` (gold `deterministic`) | yes (`avoid a` + `` `claim group` `` + `command`) | **yes** — intended |
| every other live candidate | — | no | no |

Even the **absence-phrasing arm alone** (`avoid a/the/adding`, `should not add`, `should not introduce`, `does not add`) matches **only #9** in the entire corpus — the backtick and `command` arms are precision belt-and-suspenders that also document the "named command" shape and exclude a future generic "avoid a slow command". The four trap claims above do not match the absence arm (verified). The lone other live candidate carrying bare `avoid` (`6e2916…`, "…to avoid…") is already `deterministic` and uses neither `avoid a` nor `avoid the`, so it is untouched.

## Current Slice

Add one portable deterministic discriminator, `commandAbsenceClaim`, scoped to the command-absence shape (#9): a command-addition absence phrasing plus a backtick command token plus the word `command`/`subcommand`, with the shared judgment-verb over-flip guard.
This is the inverse of R12 capability-existence and the next gold-confirmed subset of the eval→det residual.
Everything stays deterministic; no schema change.

## Fixed Decisions

1. **Trigger — a command-addition absence phrasing AND a backtick token AND a command noun.**
   `commandAbsenceClaim(lower)` (the space-padded lower form, consistent with the named-packet/CLI-flag discriminators — no camelCase signal here, command tokens are lowercase) routes `deterministic`/`ready-for-proof` when the line:
   - contains an absence phrasing from the **tight gold-confirmed set**: `" avoid a "`, `" avoid the "`, `" avoid adding "`, `" should not add "`, `" should not introduce "`, `" does not add "`; **and**
   - contains a backtick-quoted token (regex `` `[^`]+` ``), anchoring a specific named command; **and**
   - contains `" command"` or `" subcommand"`.
   #9 satisfies all three (`avoid a`, `` `claim group` ``, `command`). The sets are the minimal seed the single gold line justifies; the absence arm alone already isolates #9 (over-flip surface), the other two arms are documented precision.
2. **Eval-judgment exclusion guard — judgment VERBS (shared set).**
   The discriminator returns false (falls through to the existing eval cases) when the line asserts a behavior *judgment*: the same set used by `cliFlagSemanticsClaim`/`schemaFieldPersistenceClaim` — `" judges "`, `" judged "`, `" judgment"`, `" verdict"`, `" grade "`, `" grades "`, `" graded "`, `" grading"`, `" score "`, `" scores "`, `" scored "`, `" scoring"`, `" rate "`, `" rates "`, `" rated "`, `" rating"`, `" better"`, `" worse"`, `" pass "`, `" passes "`, `" fail "`, `" fails "`, `" sound "`, `" unsound "`, `" evaluates whether "`, `" assess "`, `" assesses "`. The bare noun `" judge "` is not excluded (consistent with the other Fork B discriminators). #9 contains no judgment verb; the guard is insurance against a constructed judgment-plus-avoid-command line (NC1).
3. **Placement.**
   Insert the case immediately **after** `schemaFieldPersistenceClaim` (`classifyClaimLine`:~1718) and before `reviewBudgetConfirmationClaim`. It therefore beats every contested eval predicate (`reviewBudgetConfirmationClaim`, `skillOrAgentBehaviorClaim`, `claimNeedsScenario`, `broadEvalSurfaceClaim`) and the broad noun catch-all (`:1870`). It sits below the explicit-human-directive, caveat, ownership, premature-review, proof-routing, named-packet, CLI-flag, and schema-field-persistence cases above it — none of which fire on #9 (verified: #9 currently reaches the broad catch-all with `surface=dev/repo`, so no earlier case matches it).
4. **Scope: this slice flips only the command-absence shape (#9).**
   The other eval→det shapes — packet-emission prose #1, static-taxonomy #2, status-routing #4, R6-ish boundary #8 — stay deferred to later gold-confirmed discriminators (or, for #8, the R6/R12 family decision), recorded in the measurement, not silently dropped.
5. **Tests in-slice — a frozen-golden ROUTE table mirroring `TestClaimClassificationForkBSchemaFieldPersistenceRoutingIsFrozen`, plus a `commandAbsenceClaim` UNIT guard table mirroring `TestSchemaFieldPersistenceClaimGuard`, plus a reachable row in `TestGateRouterCoherence`.**
   Frozen-golden ROUTE cases `{name, line, wantProof, wantReadiness}`:
   - **frozen golden positive:** #9 (the live line) → `deterministic`/`ready-for-proof`;
   - **judgment-guard negative control (load-bearing):** a synthetic carrying an absence phrasing AND a backtick token AND `command` AND a judgment verb AND an eval noun AND a gate-lexicon verb (`should`), so it passes `claimLineLooksUseful` on the **live path** and routes `cautilus-eval` *via the catch-all after the guard rejects it* (not dropped): `"The judge should avoid a \`rubric\` command and grades the agent's runs better."` (`avoid a` + backtick + `command` would flip; `grades`/`better` guard rejects → ` agent` reaches the broad catch-all → `cautilus-eval`). **Verified 2026-06-22: ADMIT=true, route=`cautilus-eval`.**
   - **broad-negation non-flip control (load-bearing, the danger axis):** the real `c2fd8b…` live line verbatim — `"\`fixture-smoke\` means the product path and command routing can be exercised cheaply, but the result does not prove model or app behavior."` → must STAY `cautilus-eval` (it carries `does not` + backtick + `command` but NOT `does not add`; proves the bare-negation danger axis does not flip a genuine eval claim).
   `commandAbsenceClaim` UNIT guard cases `{name, line, want bool}`:
   - **#9** (the live line) → `true`;
   - **anchored-generalization positive:** `"The CLI should not add a \`claim group\` subcommand."` → `true` (proves `should not add` + backtick + `subcommand` fires);
   - **judgment-verb guard:** `"The judge should avoid a \`rubric\` command and grades the agent's runs better."` → `false`;
   - **no-backtick control:** `"The workflow should avoid a claim group command."` → `false` (the backtick token is required);
   - **R12-inverse / no-absence control:** `"Cautilus ships a \`claim group\` command for bundling."` → `false` (a capability-EXISTENCE claim, no absence phrasing — must not be swept by the absence case);
   - **broad-negation trap pin:** `"The result does not prove the \`command\` routing behaves."` → `false` (`does not prove`, not `does not add` — the danger-axis phrasing must NOT fire).
   Add the flipped route case to the frozen golden so any future broadening re-triggers gold-set review.
6. **Contract realigned in-slice:** `docs/contracts/facet-decomposition.md` Fork B status — record the fourth per-facet routing discriminator landed (command-absence, the R12 inverse) and that the remaining eval→det shapes stay deferred.
7. **Re-measure after impl + `npm run claims:refresh:all`:** overlap eval→det count, agreeing count, over-correction signatures, live eval count delta, population shift (including any self-extraction from this slice's own contract-realignment prose). Record before/after in the measurement artifact.

## Falsifiable Gates (binding)

- **G1 (intended flip):** #9 routes `deterministic`/`ready-for-proof` (frozen golden).
- **G2 (no over-flip):** the judgment-guard synthetic routes `cautilus-eval` (via the catch-all after the guard rejects it, not dropped); the broad-negation `c2fd8b…` live line stays `cautilus-eval`; the unit guard table passes (anchored-generalization → `true`, judgment-verb → `false`, no-backtick → `false`, R12-inverse `ships a` → `false`, broad-negation `does not prove` → `false`); existing R6/R12, named-packet, CLI-flag, schema-field-persistence, and portable-defaults frozen goldens stay green; `TestGateRouterCoherence` stays green with the new reachable row.
- **G3 (accuracy up, no over-correction):** the overlap `cautilus-eval → deterministic` count drops by exactly 1 (5 → 4, #9) and the agreeing count rises from 37 to 38; **no new** over-correction appears — neither `deterministic → (key cautilus-eval)` (stays 5) nor `deterministic → (key human-auditable)` (stays 0) increases.
- **G4 (bounded eval loss):** the live `cautilus-eval` population drops by exactly 1 (the #9 flip), from 164 to 163 modulo any self-extraction the measure step records explicitly; the measure step re-verifies no *second* live flip appears; no unrelated eval claim is lost; recorded exactly.

## Non-Goals / Deliberately Not Doing

- NOT a per-claim facet schema or `dominant` field (honors `facet-decomposition.md`:69).
- NOT keying on bare `should not` / `does not` / `without` (proven to co-occur with `command` in genuine eval claims — the danger axis); the absence phrasings stay tightly bound to command addition.
- NOT broadening the absence set beyond the gold-confirmed seed (e.g. `drop the`, `remove the`, `no longer offers` are deferred and gold-gated).
- NOT flipping the other deferred eval→det shapes in this slice (recorded, measured).
- NOT reordering the existing switch cases (only inserting one new case at a safe position).
- NOT adding a deterministic command-registry assertion test for the absence of `claim group` in this slice; the routing flip is the deliverable, and the `ready-for-proof` readiness points at that check as the next proof step (consistent with R12 capability-existence, which also routes without shipping the existence assertion in-slice).
