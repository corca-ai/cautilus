# Surface Honesty Audit: assertion-value floor landed (residual ③, structural half)

Date: 2026-06-20.
Spec: `charness-artifacts/spec/2026-06-20-surface-audit-assertion-value-floor.md`.
Commits: spec `4d263b97`, implementation `b2391e0d`.

## What landed

The Surface Honesty Audit bound each promise badge to its leaf spec through two layers: ① the leaf carries `> check:` blocks, and ② every registry-declared evidence file is read by a `cautilus-json-file` check (`evidenceReferenced`).
Layer ② is satisfied by the mere appearance of the evidence file's path in a check table — it did not look at what the row asserts.
So a route stayed observed as `proven` even if its only reference to an evidence file was a hollow well-formedness touch (`schemaVersion equals …` or `field exists yes`).

This slice adds layer ③ (structural half): `evidenceSubstantive`.
Each registry-declared evidence file must now be read by at least one **substantive** `cautilus-json-file` row — a value-bearing `equals`/`includes`/`min_number`≥1/`meaning` assertion on a json path whose final segment is not `schemaVersion`, with empty-cell comparators (which the specdown adapter treats as no-ops) excluded.
A route whose evidence is referenced only by trivial rows now observes as `unproven` and reports a named inconsistency reason; the `npm run audit:surface -- --check` gate (wired into `npm run lint`/`verify`) fails on it.

## Why it was worth doing even though it lands green

A survey of every registry-declared evidence file found the gap was **latent, not active**: each file was already referenced by ≥ 1 substantive assertion, so the audit was honest and the floor lands all-true.
The value is regression-guarding the latent invariant.
Before this slice, someone could weaken `improvement.spec.md`'s reference to `improve-live-proof-summary.json` down to just `schemaVersion equals cautilus.improve_live_proof.v1`, drop the `seedHeldOutScore`/`winningCandidateHeldOutScore` assertions, and the audit would still report `evidenceReferenced: true` and the badge `proven`.
Now that weakening flips the badge to `unproven` and fails the gate.

## The structural / semantic boundary (kept honest)

The floor is **structural**: it can tell a reference carries a value-bearing comparator on a non-version field.
It deliberately does **not** judge whether the asserted value is behaviorally earned — `decision.evidenceStatus equals satisfied` is structurally substantive even if a human might call "satisfied" weak.
The audit page's "What This Audit Asserts" residual paragraph was rewritten to say exactly this: the structural padding gap (schema-only / exists-only) is now closed; what remains is the semantic value-earned judgment, which a deterministic check cannot make.

## Verification

- `npm run verify` — all phases passed (302s), including `audit:surface -- --check` (clean, 7/7 consistent, honest), the full test suite, and the coverage floor (the new pure classifier meets the floor).
- `node --test scripts/agent-runtime/surface-audit-lib.test.mjs` — 27/27, including the AC3 regression test that reads the real registry + leaf specs and asserts every registry evidence file is substantively referenced, and the auditSurface hollow-reference test that proves a weakened reference flips to `unproven`.
- The new logic stays pure (no fs/process) in `surface-audit-lib.mjs`; the fs predicate lives in `build-surface-audit.mjs`.

## Critique

Two bounded fresh-eye Sonnet subagent critiques, both grounded in the code with file:line citations.
Spec critique: READY-WITH-EDITS, no blocker — verified the trivial-set rule against the adapter handlers, the latent-not-active claim (spot-checked the riskiest route, Host Ownership's `evidence-durable-packets-2026-05-03.json`, which is made substantive by `decision.evidenceStatus equals satisfied`, not only its two `…observed.schemaVersion` rows), and backward-compat; one edit folded (empty-cell comparators are no-ops → trivial).
Impl critique: READY, no blocker, no edits — verified classifier↔FD1, classifier↔adapter, full reader threading with the default-true path, the end-to-end `--check` failure wiring, the regenerated page honesty, and the purity boundary.

## Deferred (tracked, not a silent gap)

The semantic intent-judge (residual ③, semantic half): an LLM judge that verdicts whether each substantive assertion's VALUE is behaviorally earned.
Deferred because the audit is a deterministic `npm run lint:specs` gate and a replay-only reasoning judge cannot run inside a gate that must pass on every commit — the same structural constraint that resized the improve slice to `①b`.
Pick it up only if per-assertion semantic strength is wanted as a (necessarily opt-in) check.

## Badge

No apex badge flips; all seven keep their levels and the surface stays honest.
The audit that backs every badge is now strictly harder to satisfy hollowly.
