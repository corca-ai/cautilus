# Surface Honesty Audit: assertion-value floor (residual ③, structural half)

Status: spec (canonical during implementation), 2026-06-20.
Closes the structural half of the documented audit residual recorded at `docs/specs/audit.spec.md:55` and `scripts/agent-runtime/surface-audit-lib.mjs` ("What it still does NOT verify is whether each referencing check's ASSERTION exercises the claimed behavior end-to-end").
Decision route: mirror the just-landed `①b` sizing — take the deterministic, gate-compatible tightening now and leave the replay-only LLM intent-judge deferred, because the audit is a deterministic `npm run lint:specs` gate and an LLM judge structurally cannot run inside it (same constraint that resized the improve slice).

## Problem

The Surface Honesty Audit binds each apex promise badge to its leaf spec through a ladder.
① structural: the leaf spec carries at least one `> check:` block (`checkCount > 0`).
② semantic/reference: every registry-declared evidence file is actually read by a `cautilus-json-file` check in the leaf spec (`evidenceReferenced`), which closes the redirect/hollow gap a purely structural test leaves open.
③ residual: whether the referencing check's ASSERTION actually exercises the claimed behavior — a check can read the right evidence file and still assert something hollow.

The ② check is satisfied by the mere appearance of the evidence file's path in a `cautilus-json-file` `path` column.
It does not look at what that row asserts.
So a route stays observed as `proven` even if its only reference to an evidence file is a hollow well-formedness touch — `schemaVersion equals …` or `someField exists yes` — that proves the file is parseable but proves nothing about the behavior the badge claims.

A survey of every registry-declared evidence file (the files in `docs/specs/audit/surface-registry.json` `evidence` arrays) found this gap is **latent, not active**: today every registry evidence file is already referenced by at least one substantive assertion, so the audit is currently honest.
But nothing enforces it.
Someone could weaken `improvement.spec.md`'s reference to `improve-live-proof-summary.json` down to just `schemaVersion equals cautilus.improve_live_proof.v1`, drop the `seedHeldOutScore`/`winningCandidateHeldOutScore` assertions, and the audit would still report `evidenceReferenced: true` and the badge as `proven`.
This slice converts the latent invariant into an enforced one.

The boundary that keeps this honest about its own limits: the floor is **structural**, not **semantic**.
It can tell that a reference carries a value-bearing comparator on a field other than `schemaVersion`.
It cannot tell whether the asserted value is behaviorally earned — `decision.evidenceStatus equals satisfied` is structurally substantive even if a human might argue "satisfied" is weak.
Judging whether the asserted value actually means the behavior happened is the semantic residual that stays with the leaf-spec author, code review, and the deferred intent-judge.

## Current Slice

Raise the audit's evidence-binding floor from "the evidence file is read by some check" to "the evidence file is read by at least one SUBSTANTIVE check", deterministically, and shrink the audit's self-described residual accordingly.

1. Add a pure classifier that, given a leaf-spec body, returns the set of file paths referenced by at least one substantive `cautilus-json-file` row.
2. Extend the observed-status computation so a route observes as `proven`/`declared` only when every declared evidence file is substantively referenced (`evidenceSubstantive`), in addition to the existing `evidenceReferenced`.
3. Regenerate the manifest (`.cautilus/audit/surface-audit.json`) and the audit page (`docs/specs/audit.spec.md`); the new field lands all-true, so the audit stays honest and green.
4. Update the audit page's "What This Audit Asserts" so the residual paragraph names only the semantic gap that genuinely remains (structural schema-only/exists-only padding is now closed).

## Fixed Decisions

- FD1 — The classifier is structural, with a conservative trivial set.
  A `cautilus-json-file` table row that references a registry evidence file is **trivial** (does not count toward the floor) when its effective json path's final segment is `schemaVersion` (case-insensitive), OR its only populated comparator is `exists`, OR its only populated comparator is `min_number` with a value of `0`.
  A row is **substantive** when it carries a value-bearing comparator — `equals`, `includes`, `min_number` with value ≥ 1, or `meaning` — on a json path whose final segment is not `schemaVersion`.
  A comparator counts only when its table cell is non-empty: the adapter's guards (`if (expectation.equals && …)`, `if (expectation.includes && …)`, `if (expectation.minNumber)` at `scripts/specdown/cautilus-adapter.mjs:215-232`) make an empty `equals`/`includes`/`min_number` cell a runtime no-op equivalent to `exists`, so a row whose only populated comparator is an empty-string cell is trivial, not substantive.
  The effective json path mirrors the adapter: `json_path` column, falling back to the `path` column when `json_path` is absent (`scripts/specdown/cautilus-adapter.mjs:72`).
  Comparator column vocabulary is taken from the adapter exactly: `exists`, `equals`, `includes`, `min_number`, `meaning` (`scripts/specdown/cautilus-adapter.mjs:65-87`).
  The floor requires ≥ 1 substantive row per evidence file; trivial rows may coexist and are not banned, so a legitimate schema-version sanity row alongside a behavioral assertion is fine.

- FD2 — The floor is per-route, evaluated in that route's `proofSpec`.
  `evidence-durable-packets-2026-05-03.json` is declared by both the Reviewable Artifacts and Host Ownership routes; each route's reference is judged in its own leaf spec, exactly like the existing `evidenceReferenced` check.

- FD3 — The new predicate fails closed only when a reader is supplied.
  `computeEvidenceReference` gains a `readSubstantiveFilePaths` reader, mirroring `readReferencedFilePaths`: when no reader is supplied (pure-unit callers that do not exercise this layer) the result defaults to `evidenceSubstantive: true` / `nonSubstantiveEvidence: []`, so existing unit callers are unaffected; the real build always supplies the reader.

- FD4 — No LLM intent-judge in this slice.
  The audit is a deterministic `npm run lint:specs` gate wired into `npm run lint` and `npm run verify`; a replay-only reasoning judge cannot run inside a gate that must pass on every commit (the same structural fact — replay-only, fails closed on novel inputs — that resized the improve slice to `①b`).
  The semantic residual is deferred (Deferred Decisions), recorded as tracked follow-up, not a silent gap.

- FD5 — The audit page's residual paragraph is rewritten to name only the remaining semantic gap.
  The current paragraph says the audit does not verify "whether each referencing check's ASSERTION exercises the claimed behavior end-to-end"; after this slice the structural sub-gap (a reference that is only a schema-version or existence touch) is closed by `evidenceSubstantive`, so the residual narrows to "whether the asserted VALUE is behaviorally earned", which a structural check cannot decide.

## Probe Questions

- PQ1 — Under the new floor, does every current registry evidence file still observe as substantively referenced, so the audit stays honest and green?
  Expected: yes — the survey found each registry evidence file already carries ≥ 1 value-bearing, non-`schemaVersion` assertion (e.g. `seedHeldOutScore equals 0`, `verdict equals sound`, `summary includes …`, `discoveryBoundary.entries[0] equals README.md`), so `evidenceSubstantive` lands all-true.
  Resolved by `npm run audit:surface -- --check` (via `npm run lint`) staying clean after regeneration.
  If any badge unexpectedly drops to `unproven`, that is a genuine finding (a real hollow reference) — surface it and tighten the leaf spec rather than relaxing the classifier to force green.

- PQ2 — Does the classifier reject a synthetic hollow reference (schema-only / exists-only) while accepting a value-bearing one, without depending on a hardcoded path or caseId?
  Resolved by the unit tests (AC2).

## Deferred Decisions

- The semantic intent-judge (residual ③, semantic half): an LLM judge that reads each leaf's assertions plus the claimed behavior and verdicts whether the asserted values are behaviorally earned (e.g. is `decision.evidenceStatus equals satisfied` actually load-bearing, or is `invoked equals true` too weak for the claim).
  Deferred because it is replay-only and cannot run in the deterministic audit gate, so it would add an opt-in semantic layer rather than a gate, and because the structural floor already closes the cheap padding path.
  Pick it up only if per-assertion semantic strength is wanted as a standing (necessarily opt-in) check; it would reuse the `enrich-eval-with-reasoning-judge` prove-then-project pattern.
- Carried from the prior handoff and untouched here: CI Go-version pin freshness, and the deferred improve `①a` replay-parity judge convergence.

## Non-Goals

- Banning trivial assertions; schema-version and existence rows stay legal as long as a substantive row coexists for the same evidence file.
- Judging the semantic strength of a substantive assertion's value (that is the deferred intent-judge).
- Re-running any live agent proof; this slice does not touch live captures or the replay harness.
- The separate specdown rewrite the maintainer plans next; this slice is scoped to the audit binding ladder only.
- Flipping any apex badge; all seven badges keep their current levels and the surface stays honest.

## Deliberately Not Doing

- Adding an LLM judge to the deterministic audit gate — rejected at the direction gate for the same reason `①a` was deferred (replay-only judges cannot gate every commit).
- Classifying assertion strength semantically inside the deterministic classifier — a structural check must not pretend to make a semantic judgment; doing so would over-reject legitimate `equals`/`includes` rows whose values a human might call weak.
- Tightening evidence-less command-proof routes (Readiness) — they carry no evidence to cross-reference and stay bound by title plus their own live `cautilus doctor` checks, unchanged.

## Constraints

- The classifier is a new pure function in `scripts/agent-runtime/surface-audit-lib.mjs`, which is fixture-tested; keep it pure (no fs/git/process), mirroring `extractCheckedFilePaths`.
- The new runtime logic needs executable test coverage and must clear the coverage floor under `npm run verify`.
- Regenerate both generated artifacts with `npm run audit:surface` and commit them; `npm run audit:surface -- --check` (wired into `npm run lint` / `npm run verify`) fails on drift.
- The audit page `docs/specs/audit.spec.md` is generated — do not hand-edit it; change the renderer in `surface-audit-lib.mjs` and regenerate.
- `docs/specs/*.md` are semantic-line-break exceptions, but they are generated here, so the renderer owns their wrapping; this spec under `charness-artifacts/spec/` uses semantic line breaks.
- If editing audit sources makes `git push` fail with `status-summary.json is stale`, run `npm run claims:refresh:all` before pushing; push stays the user's.
- Any bug, error, or regression encountered routes to `charness:debug` before further fixes.

## Success Criteria

- SC1 — `surface-audit-lib.mjs` exposes a pure `extractSubstantiveFilePaths` (or equivalently named) classifier implementing FD1, and `computeObserved` returns `evidenceSubstantive` and `nonSubstantiveEvidence`.
- SC2 — a route observes as `proven`/`declared` only when every declared evidence file is substantively referenced; a route whose evidence is referenced only by trivial rows observes as `unproven` and reports an inconsistency reason naming the hollow reference.
- SC3 — after regeneration, `.cautilus/audit/surface-audit.json` carries `evidenceSubstantive` (all-true for the current surface) and `summary.honest` stays `true`; `docs/specs/audit.spec.md` is regenerated and its residual paragraph names only the semantic gap.
- SC4 — `npm run verify` (including `audit:surface -- --check` and the coverage floor) and `npm run test` stay green.
- SC5 — the deferred semantic intent-judge is recorded in this spec and the handoff, not left as a silent gap.

## Acceptance Checks

- AC1 (SC1) — unit tests assert `extractSubstantiveFilePaths` returns a file path when a `cautilus-json-file` row carries a value-bearing comparator on a non-`schemaVersion` path, and omits it when the only rows for that file are `schemaVersion equals …`, `… exists yes`, or `min_number 0`.
- AC2 (SC2) — a `computeObserved` test shows a route whose evidence is referenced (passes `evidenceReferenced`) but only by trivial rows observes `evidenceSubstantive: false`, `nonSubstantiveEvidence` listing the file, and `observedStatus: unproven`; and an `auditSurface` test shows the resulting inconsistency reason matches the hollow-reference wording.
- AC3 (SC2/SC3) — a regression test (reading the real registry + leaf specs, or asserting on the regenerated manifest) confirms every current registry evidence file observes `evidenceSubstantive: true`, so the floor lands green and a future hollow weakening would flip it.
- AC4 (SC3) — `npm run audit:surface -- --check` is clean after the regenerated manifest and page are committed, and the page's "What This Audit Asserts" gains the substantive-floor bullet and the narrowed residual paragraph.
- AC5 (SC4) — `npm run verify` and `npm run test` are green, and the new classifier meets the coverage floor.
- AC6 (SC5) — the deferred semantic intent-judge follow-up is present in this spec and propagated to `docs/internal/handoff.md`.

## Critique

A bounded fresh-eye subagent critique is delegated before this contract is treated as final, per the repo's subagent-delegation rule; its returned status is recorded here and in the closeout.
`plan_risk_interrupt` is consulted; no forced debug interrupt is expected for a pure-classifier-plus-regenerated-artifact slice.

Load-bearing risks the critique should probe:
the trivial-set definition (does the final-segment `schemaVersion` rule plus `exists`-only plus `min_number 0` correctly capture "hollow" without over-rejecting a legitimate value-bearing row, and is the `min_number` ≥ 1 cutoff right);
the latent-not-active claim (that every current registry evidence file already passes, so this lands green — if any flips to `unproven` it is a real finding, not a bug);
the structural-vs-semantic boundary (that the floor honestly does NOT judge whether `equals satisfied`-style values are behaviorally earned, and the residual paragraph says so);
and the deferral honesty (that the semantic intent-judge is genuinely optional and gate-incompatible, not a hidden coverage hole).

A bounded fresh-eye Sonnet subagent critique of this spec returned READY-WITH-EDITS with no blocker (2026-06-20).
It independently verified the load-bearing claims against the code: the trivial-set rule is correct against the adapter's comparator handlers (`exists`-only, `min_number 0`, and final-segment `schemaVersion` including nested `…observed.schemaVersion`), the latent-not-active claim holds (it spot-checked the riskiest route — Host Ownership's `evidence-durable-packets-2026-05-03.json` is made substantive by `decision.evidenceStatus equals satisfied`, not only its two `…observed.schemaVersion` rows), backward-compat holds under FD3 (the existing `honestWorld()` callers supply no substantive reader and default to true), and the LLM-judge deferral is genuinely gate-incompatible.
The one non-blocking edit — empty-cell comparators (`includes ""`) are runtime no-ops and belong in the trivial set — is folded into FD1 above.

## Canonical Artifact

This document is canonical during implementation.
The durable evidence record lands under `charness-artifacts/` when the slice closes, and the handoff is realigned in the same slice.

## First Implementation Slice

1. Add `extractSubstantiveFilePaths` and a row-parsing helper to `surface-audit-lib.mjs`; unit-test the classifier (AC1, AC2).
2. Thread `readSubstantiveFilePaths` through `computeEvidenceReference` → `computeObserved` → `auditSurface` → `buildManifest`, add `evidenceSubstantive` to `observeStatus`'s `routeOk`, the inconsistency reason, the legend, and the evidence cell; wire the predicate in `build-surface-audit.mjs:generate`.
3. Update `renderAssertions` for the substantive-floor bullet and the narrowed residual paragraph (FD5).
4. Regenerate with `npm run audit:surface`; confirm `evidenceSubstantive` all-true and `summary.honest: true`; add the AC3 regression test.
5. Run `npm run verify` and `npm run test`; confirm the coverage floor.
6. Record the deferred semantic intent-judge in this spec and the handoff; refresh claim packets if claim sources changed; record the durable evidence artifact.
