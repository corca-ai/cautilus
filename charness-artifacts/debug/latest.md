# Debug Review
Date: 2026-07-08

## Problem

`node --test ... scripts/lint-specs.test.mjs ...` failed after folding the promise-ledger drift check into `lint:specs`.
The first exact symptom was `Specdown entry does not link docs/specs/generated/promise-ledger.spec.md`.
After fixing fixture reachability, the second exact symptom was `specdown: docs/specs/generated/promise-ledger.spec.md: table must define at least one row`.
After the first passing `verify:runtime`, the third symptom was that the removed `lint · promise ledger` phase still appeared as a runtime hotspot from old samples.

## Correct Behavior

Given `lint:specs` full mode now checks generated promise-ledger drift from the strict trace graph, when the fixture repo models the active spec graph, then the fixture entry should link every active `.spec.md` file and the generated ledger file should already match the trace graph.

## Observed Facts

- Focused tests failed before implementation validation completed.
- The production repo `npm run --silent lint:specs` passed and printed `promise ledger check: promise ledger rendered: 7 promise(s), 38 governed-by/implemented-by edge(s)`.
- `scripts/check-specs.mjs` lists every active `docs/specs/**/*.spec.md` file and fails if any is not reachable from `specdown.json` entry.
- The test fixture generated `docs/specs/generated/promise-ledger.spec.md` but did not link it from `docs/specs/index.spec.md`.
- Once reachable, the synthetic fixture's generated ledger had no `governed-by` edges, so the reverse coverage section rendered an empty Markdown table.
- Runtime signal merging copied all prior command labels into a new passing payload, so a phase removed from `run-verify` stayed in `profiles.local-verify.commands`.

## Reproduction

- Run `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/lint-specs.test.mjs scripts/agent-runtime/render-promise-ledger.test.mjs scripts/run-verify.test.mjs`.
- Observed result before repair: the full-mode lint-specs fixture failed before reaching the ledger-stale assertion, then failed in `specdown run` on an empty generated table, then runtime summary kept a stale removed phase.

## Candidate Causes

- The fixture entry omitted the generated ledger link required by `checkSpecs`.
- The new ledger drift check incorrectly required generated pages in target mode.
- The production generated ledger was stale and the fixture failure was masking a real repo failure.
- The ledger renderer assumed at least one cross-cutting rule governs a promise.
- Runtime signal sample merging treated historical command labels as current after full successful runs.

## Hypothesis

- Falsifiable claim: the failures are fixture reachability, a renderer empty-state gap, and stale runtime-signal retention, not the new ledger drift check or production ledger state.
- Disconfirmer: if linking `generated/promise-ledger.spec.md`, rendering a prose empty state for zero rule coverage, and pruning stale labels after a full passing runtime sample still leaves the ledger fold reported as a separate current phase, then the implementation changed the wrong contract.

## Verification

- Result: confirmed before repair by reading `scripts/check-specs.mjs` and observing production `npm run --silent lint:specs` passing.
- Post-repair focused tests remain the required confirmation.

## Root Cause

The fixture started generating a promise-ledger page to satisfy the new drift check, but it did not also model the repo's reachability invariant that every active `.spec.md` is reachable from the specdown entry.
After that was corrected, the renderer exposed a real empty-state gap: with no cross-cutting rule coverage edges, it produced a Markdown table with only headers, which `specdown run` rejects.
The runtime signal layer then exposed a separate operability gap: full passing samples preserved prior command labels even when the current verify phase list no longer emitted them.

## Invariant Proof

- Invariant: any test fixture that creates an active `.spec.md` under `docs/specs/` must link it from the fixture entry unless the test is explicitly about unreachable specs, generated spec pages must avoid empty Markdown tables, and full passing runtime samples must represent the current phase list.
- Producer Proof: the fixture wrote `docs/specs/generated/promise-ledger.spec.md`.
- Final-Consumer Proof: `checkSpecs` reported that exact generated page as unreachable; after reachability was fixed, `specdown run` reported the empty generated table; after the ledger phase was removed, runtime summary still listed the removed phase.
- Interface-Shape Sibling Scan: target-mode fixture creates only the selected product spec and does not generate the ledger page, so it is not the same failure.
- Non-Claims: this note does not claim the production spec graph was broken; production `lint:specs` passed.

## Detection Gap

- surface: fixture construction | what did not fire: the first fixture edit added the generated page without applying the existing reachability convention | smallest change to fire it: keep generated spec links in `writeTypedTraceFixture` whenever it writes generated spec files.
- surface: generated ledger renderer | what did not fire: pure renderer tests did not cover zero rule coverage | smallest change to fire it: add a renderer test for the prose empty state.
- surface: runtime signal merge | what did not fire: tests covered partial-run preservation but not full-run pruning after phase removal | smallest change to fire it: add a full passing merge test that drops absent command labels.

## Sibling Search

- Mental model: adding the generated page is enough to satisfy a generated-page drift check.
- same-file axis: `writeTypedTraceFixture` index body | decision: same bug, fix now | proof: unreachable generated page caused the failure.
- same-file axis: no-typed-documents fixture | decision: same fixture helper, fix now through the shared index link | proof: it overwrites the index and still creates the product spec path.
- cross-file: `renderPromiseLedger` reverse coverage table | decision: related renderer gap, fix now | proof: synthetic graph with zero rule coverage generated a table with no rows.
- cross-file: `withRuntimeSignalSamples` command merge | decision: related operability gap, fix now | proof: runtime summary kept `lint · promise ledger` after it no longer ran.
- cross-file: production `docs/specs/index.spec.md` graph | decision: no repair needed | proof: production `npm run --silent lint:specs` passed.

## Seam Risk

- Interrupt ID: lint-specs-ledger-fixture-reachability-2026-07-08
- Risk Class: none
- Seam: none
- Disproving Observation: production `lint:specs` passes with the folded ledger check.
- What Local Reasoning Cannot Prove: n/a
- Generalization Pressure: none

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When a test fixture writes generated spec pages, update the fixture entry links at the same time so `checkSpecs` reaches the intended assertion instead of failing on graph shape first.
When a generated spec page renders a table from a derived collection, cover the empty collection case with prose instead of emitting a header-only table.
When a full passing runtime sample is written, treat the observed phase list as current; preserve unobserved historical phase samples only for failed partial runs.
