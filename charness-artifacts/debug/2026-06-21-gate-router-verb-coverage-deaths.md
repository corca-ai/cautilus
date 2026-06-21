# Debug Review — gate↔router verb-coverage: latent structural-death class
Date: 2026-06-21

## Problem

The `follow-up: gate-router-coverage` recorded by the R12 ships incident is resolved here.
A systematic audit found that the ships debug's assumption — "every other `classifyClaimLine` case keys on tokens usually co-present with a gate verb, so they are reachable in practice" — is **false for 5 router cases**.
Each is a latent structural death of the same class as ships: `classifyClaimLine` can route the shape, but `claimLineLooksUseful` refuses to admit a realistic line of that shape, so the case is dead on the live path.

## Correct Behavior

- Given a claim shape that `classifyClaimLine` (the router) is written to classify,
- When `cautilus discover claims` runs the deterministic baseline,
- Then a realistic line of that shape should pass the upstream gate `claimLineLooksUseful` and reach the router (otherwise the router case is dead code on the live path).

This is the same producer→gate invariant the ships incident established; the audit checks it across every router case rather than only R12.

## Observed Facts

- The gate (`claimLineLooksUseful`, claim_discovery.go ~1408) admits a line only if it contains a `defaultClaimLexiconTerms` verb (~760) as a substring (or an adapter lexicon term; this repo declares none).
- The lexicon is 27 verbs: must/should/can/will/owns/keeps/uses/emits/writes/runs/routes/discovers/evaluates/improves/verifies/validates/proves/supports/requires/guarantees/provides/belongs/remains/stays/installs/produces/ships.
- 5 router cases key on verbs/nouns absent from that lexicon, with no lexicon companion in their predicate:
  - `deterministicCLIGatingClaim` — "is not gated"/"not blocked"/"works without credentials" → `deterministic`. **Highest impact** (lost deterministic provable claim, the ships-twin route). Plus a **double-miss**: the lexicon-bearing rephrase "the doctor command runs without any credential" passes the gate (` runs `) but the router case does not match "runs without", so it routes nowhere either.
  - `claimNeedsScenario` — "X needs/missing a … scenario" → `cautilus-eval / needs-scenario`. Verb `needs`/`missing` not in lexicon.
  - `providerFailoverBehaviorClaim` — "fallback/backup provider takes over/handles …" → `cautilus-eval / app-prompt`. Both predicate groups are nouns; the natural verbs (takes over/handles/happens) are non-lexicon.
  - `historicalObservationClaim` — "past sessions/recent runs showed …" → `human-auditable / blocked`. Verb `showed` not in lexicon. Lower impact (a dropped historical observation is arguably the gate filtering a non-claim).
  - `providerCaveatClaim` branch 3 — "… prints to stderr while exit still looks successful" → `human-auditable / blocked`. Only the `can wrap` token carries a lexicon verb; the fatal/stderr/structured_output companions do not. Lower impact.
- Partial deaths (verbless form dropped, but a lexicon verb is natural and admitted): lint-gate "enforces", installer "drops" (lexicon has only ` installs `, not the noun `installer`), html "turns into", several deterministic packet/provenance/review-prompt noun branches. These silently drop the verbless variant but realistic prose usually carries a lexicon verb.
- **Real-corpus impact today = ZERO**: grepping the claim sources (docs/specs, docs/contracts, README.md, AGENTS.md, docs/guides, docs/maintainers) for each dead shape returns 0 hits. The deaths are latent, exactly as ships was before the GEPA-seam line was written.

## Reproduction

Throwaway `internal/runtime/zz_gate_audit_scratch_test.go` (created, run, deleted; tree clean) calling both functions. A FINDING is `ADMIT=false` AND `ROUTE_OK=true`:

```
ADMIT=false ROUTE_OK=true route="deterministic"  | The doctor command is not gated behind any provider credential.
ADMIT=false ROUTE_OK=true route="deterministic"  | Claim discovery is not gated behind any provider credential or network access.
ADMIT=false ROUTE_OK=true route="cautilus-eval"  | This behavior needs a protected scenario before it becomes a fixture.
ADMIT=false ROUTE_OK=true route="cautilus-eval"  | Context recovery across turns needs a candidate scenario authored first.
ADMIT=false ROUTE_OK=true route="cautilus-eval"  | On primary outage the fallback provider takes over the runner automatically.
ADMIT=false ROUTE_OK=true route="human-auditable"| Past sessions showed the operator skipped the bootstrap step entirely.
ADMIT=false ROUTE_OK=true route="human-auditable"| A codex exec failure prints to stderr while exit still looks successful.
ADMIT=false ROUTE_OK=true route="deterministic"  | A lint gate enforces the import boundary at build time.
ADMIT=false ROUTE_OK=true route="deterministic"  | The installer drops a standalone binary into each host repo.
ADMIT=true  ROUTE_OK=false route=""              | The doctor command runs without any provider credential.   # double-miss control
```

Corpus impact: `grep -rniE "<shape>" docs/specs docs/contracts README.md AGENTS.md docs/guides docs/maintainers` → 0 hits for each shape.

## Candidate Causes

- The router and gate are two independent lists with no coverage invariant between them; a router verb can be absent from the lexicon (confirmed; the ships root cause, generalized).
- Some router cases are noun-only predicates (`providerFailoverBehaviorClaim`) whose natural verbs are all non-lexicon, so no co-present verb rescues them (confirmed).
- A few cases pair a lexicon-bearing token with non-lexicon companions in an OR group, so the non-lexicon path is reachable verbless (`providerCaveatClaim` branch 3, `ownershipBoundaryClaim` `while … -owned` path) (confirmed for the named branches).
- The gate normalizes (`normalizeClaimSummary`) before matching while the router space-pads differently — could explain a mismatch, but the scratch run shows the deaths come from missing lexicon verbs, not normalization (refuted as the operative cause).

## Hypothesis

If the cause is "router verb absent from the gate lexicon, no lexicon companion", then a verbless line of each shape is dropped at the gate (`ADMIT=false`) while still being routable (`ROUTE_OK=true`); and adding the verb / restructuring would flip `ADMIT` to true.
Falsified if any constructed line is admitted as-is.

## Verification

The scratch run above confirms all 5 cases plus the 2 partial deaths: each verbless line is `ADMIT=false, ROUTE_OK=true`.
The control line ("runs without any credential") is `ADMIT=true, ROUTE_OK=false`, confirming the `deterministicCLIGatingClaim` double-miss (the admitted phrasing misses the router case).
Corpus grep confirms zero live lines of any dead shape, so the bugs are latent (no current measurement error).

## Root Cause

The R6/R12-era and earlier router cases were added without a coverage invariant tying each router trigger to the admission gate.
The ships fix patched one instance (` ships `) but left the class open; this audit finds 5 more router cases (plus partial deaths) whose triggers the gate never admits.
The ships debug's "other cases are co-occurrence-safe" claim was an untested assumption — true for most cases, but false for noun-only and credential-absence/scenario-need/historical shapes whose natural prose carries no lexicon verb.

## Invariant Proof

- Invariant: every claim shape the router (`classifyClaimLine`) can route must also pass the upstream gate (`claimLineLooksUseful`); otherwise the route is dead on the live path.
- Producer Proof: `classifyClaimLine` routes each of the 5 shapes (scratch `ROUTE_OK=true`).
- Final-Consumer Proof: NONE — these are latent deaths; no end-to-end test drives these shapes through `DiscoverClaimProofPlan`, and (per the fix-scope decision) none is being fixed in this diagnosis slice. Recorded as a non-claim, not asserted as resolved.
- Interface-Shape Sibling Scan: see Sibling Search.
- Non-Claims: this artifact does NOT claim any of the 5 deaths is fixed. It diagnoses the class and hands the fix-scope decision (which verbs to admit, whether to add a coherence meta-test) to a decision/spec step. Lexicon blast radius differs sharply per verb (` enforces `/` showed ` low-blast; ` needs ` very high-blast), so a blanket lexicon add is explicitly NOT taken here.

## Detection Gap

- Surface: the frozen-golden routing tests (`TestClaimClassificationR6R12RoutingBoundaryIsFrozen`, `…ForkBNamedPacketRoutingIsFrozen`, `…ForkBCLIFlagSemanticsRoutingIsFrozen`) all call `classifyClaimLine` directly, bypassing `claimLineLooksUseful` — they can never catch a gate that drops a routable shape. The ships incident noted this for R12 but added only an R12-specific end-to-end test, not a class-level coherence check.
- What did not fire: there is no test asserting gate↔router coherence (every router case admissible by the gate).
- Smallest change to fire it: a coherence meta-test that, for a curated representative line per router case, asserts `claimLineLooksUseful == true`. That single test would have caught ships and all 5 of these, and would re-fire whenever a new router case is added with an unadmitted verb.

## Sibling Search

- Mental model that produced the bug: "adding a `classifyClaimLine` case makes the route live" — false; the gate is an independent upstream filter that must also admit the shape. (Same wrong model as ships, now shown to recur 5×.)
- token axis: noun-only and credential-absence/need/historical shapes carry no lexicon verb; verb-bearing shapes are mostly safe. proof: scratch run (only these shapes show `ADMIT=false`); corpus grep (0 live hits → latent). decision: diagnosed, fix deferred to decision/spec.
- case axis: 5 confirmed deaths + ~12 partial deaths enumerated above; each classified `latent` (zero corpus impact). proof: scratch + grep.
- structural axis: the durable fix is the coherence meta-test (one gate, all cases), not per-verb patching. proof: the meta-test would have caught the whole class including ships.
- cross-file: gate (`defaultClaimLexiconTerms`) and router (`classifyClaimLine` cases) are independent lists in the same file with no coverage check — the ships incident named this exact cross-file sibling. follow-up: `follow-up: gate-router-coherence-test` (the meta-test) and `follow-up: gate-router-deadcase-fixes` (per-verb admissions, blast-radius-scoped).

## Seam Risk

- Interrupt ID: gate-router-coverage-2026-06-21
- Risk Class: none
- Seam: none (pure local logic, single file)
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none — both functions are pure and locally testable.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: spec
- Handoff Artifact: charness-artifacts/debug/2026-06-21-gate-router-verb-coverage-deaths.md

Note: diagnosis only — no repair landed in this slice. Next step is a fix-scope decision/spec (lexicon blast radius; whether to land the coherence meta-test now), not a direct hand to `impl`; any fix slice carries its own review.

## Prevention

The durable, class-level prevention is the gate↔router coherence meta-test (`follow-up: gate-router-coherence-test`): for each router case, a representative line must pass `claimLineLooksUseful`. This maps to the detection gap (no coherence check exists) and the structural sibling axis (one guard for the whole class), and it freezes coverage so any future router case with an unadmitted verb fails the build — exactly what would have caught ships.

LANDED 2026-06-22: `TestGateRouterCoherence` (`internal/runtime/claim_discovery_test.go`) implements this — 10 reachable router cases assert gate admission, the 5 latent deaths are a documented allowlist asserting they stay dropped (so fixing one forces moving it to the reachable set). Per-verb dead-case repairs stay deferred as `follow-up: gate-router-deadcase-fixes` (blast-radius-scoped: ` needs ` must restructure the case to require a lexicon companion rather than be admitted; zero live-corpus impact means no current urgency).
Per-verb admissions (`follow-up: gate-router-deadcase-fixes`) are scoped by blast radius: ` enforces `/` showed `/` not gated ` are low-blast; ` needs ` is very high-blast (a near-ubiquitous word) and should be handled by restructuring the case to require a lexicon companion rather than admitting the bare verb. These are deferred to the fix-scope decision, not taken in this diagnosis.

## Related Prior Incidents

- `2026-06-21-r12-ships-lexicon-gate-dead.md` — the first instance of this exact class and the source of `follow-up: gate-router-coverage`, which this artifact resolves. That artifact's "other cases are co-occurrence-safe" claim is refuted here for 5 cases.
- `2026-06-19-claim-discovery-bucket-spec-drift.md` — adjacent claim-discovery routing-surface drift.
