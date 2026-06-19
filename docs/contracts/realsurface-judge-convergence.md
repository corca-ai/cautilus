# Real-surface judge convergence: the judge grades the actual dogfood reasoning

Status: spec (decisions closed, ready for `impl`), 2026-06-19.
Refines the next step of [eval-judge-collaboration.md](./eval-judge-collaboration.md) and the handoff's "judge ↔ 실제-surface dogfood 수렴" lead.

## Problem

Two worlds are wired but not connected.

The real-surface dogfood reads the real surface but scores it deterministically only.
`self-dogfood-eval` (and the default adapter's real-surface flow) runs a real agent against the real `AGENTS.md`, and `run-local-eval-test.mjs` already captures the genuine `routingDecision.reasonSummary` the agent produced.
But that packet is scored only by field/fragment matchers (entry file, required instruction files, expected routing) — the exact determinism skew the judge tier exists to close.

The judge tier grades real-shaped reasoning, but on a synthetic island.
`self-dogfood-routing-regression-eval` replays a `reasoningSoundness` composite into `cautilus evaluate`, but the reasoning it grades comes from a separately-harvested blind subagent paraphrase, not from the real-surface dogfood runner.
So the judge has never graded the actual `AGENTS.md` reasoning the dogfood captured.

The gap is one step, not a rebuild.
The real capture already exists at `fixtures/eval/dev/repo/internal-runner-fixture-results.json` with genuine full-runner provenance (committed by "replace the hand-authored stand-in with the real capture", `dd3f5e6`).
The generic engine already reads `reasoningSoundness` and ANDs it into the case status.
What is missing is producing a judge verdict for that real reasoning and attaching it to the packet the real-surface dogfood emits.

## Current Slice

Overlay a judge-tier facet onto the AGENTS.md real-surface dogfood, grading the real captured reasoning, so a case passes only when the deterministic surface matchers AND the reasoning-soundness judge both hold.
Close the handoff's open decisions first (below), then implement, dogfood, and pin with an executable test.

## Fixed Decisions

- FD1 — judge-verdict provenance is prove-then-project on the real surface, not a live judge per run.
  The real captured reasoning is blind-graded once against the governing rules and the verdict is replayed deterministically, exactly the discipline every prior judge slice uses.
  This keeps the dogfood gate deterministic and zero-live-cost, and — because the graded reasoning is now the dogfood runner's own `AGENTS.md` capture — the provenance is genuinely full-runner, labeled `full-runner-capture-replay`.
  Rejected: a live judge LLM call per run (option a).
  It reintroduces per-run cost and non-determinism into a standing gate the whole repo keeps deterministic, with no fidelity gain over grading the already-captured real reasoning.

- FD2 — AGENTS.md first (`self-dogfood-eval` / the default adapter's real-surface flow); the `cautilus-agent` skill surface (`self-dogfood-eval-skill`) is a separate following slice.
  AGENTS.md is the simpler surface and its real capture already exists, so the convergence is provable here with the least new machinery.

- FD3 — transfer the governing rules, re-ground the sound case on the real capture.
  The governing rules (`startup_bootstrap`, `work_skill`) and the constructed `realsurface-reason-control` transfer unchanged from `dev-repo-routing-regression`.
  The baseline/sound case must carry the real captured `reasonSummary` and `observedRoute` from `internal-runner-fixture-results.json` — not the blind-subagent paraphrase — because grading the real reasoning is the entire point of the convergence.
  The `observedRoute` mirrors the full real `routingDecision` (`workSkill: "charness:impl"`, `firstToolCall: "functions.exec_command"`), not the regression baseline's `workSkill: "none"`, so the route fields are the real capture's, never re-paraphrased or silently normalized.
  The decomposition declares `codeFacets: ["emitted_find_skills_bootstrap"]`, since the real route emits the bootstrap, so the deterministic process facet stays the code half and the judge owns the semantic half.

- FD4 — attach via adapter-owned enrichment; the generic runtime runner stays pure.
  `run-local-eval-test.mjs` (a generic instruction-surface runtime, reused by host repos) gains no judge logic; it keeps capturing `reasonSummary` only.
  The composite-to-`reasoningSoundness` mapping is factored into a single source-of-truth helper that computes from the SOT `compareVerdicts`, with the provenance string as a parameter of the helper — so the routing-regression runner keeps emitting `blind-subagent-harvest-replay` while the real-surface enricher passes `full-runner-capture-replay`, never a hardcoded label.
  An adapter-owned step attaches the result to the real-surface packet per case.
  The generic Go engine is unchanged: it already reads `reasoningSoundness` and ANDs it.
  This preserves the code/intelligence boundary the contract pins (no repo-specific judge logic in the generic engine or the generic runtime).

## Probe Questions

- PQ1 — does the real captured `reasonSummary` actually grade `sound` blind?
  It cites `startup_bootstrap` and defers the work-skill choice (permitted), so `sound` is expected, but the one-time blind grade must confirm it rather than assume it.
  Resolved by running the blind judge once on the real reasoning and checking in the captured verdict.
  If it grades `unsound`, the slice blocks and reopens through `charness:debug` — the calibration would then hold two `unsound` cases and zero `sound`, so the gate could still pass while SC2 ("the real sound reasoning passes") is false; that branch must not ship a green gate that proves the opposite of the convergence's point.

- PQ2 — does attaching the judge tier leave the existing deterministic real-surface dogfood gate green?
  The enrichment is additive (a case with no verdict is unchanged), but the AND composite could surface a latent disagreement; resolved by running the existing self-dogfood gate after wiring.

## Deferred Decisions

- The apex `Behavior Evaluation` badge stays at `declared`.
  Closing this convergence makes the `declared` exit *available* — the judge now grades the real dogfood surface with full-runner provenance and constructed-control reject-capability — but the flip is a maintainer decision and a separate spec-projection slice, unchanged here.
- The `cautilus-agent` skill-surface convergence (`self-dogfood-eval-skill`) is the next slice after this one lands.

## Non-Goals

- Wiring the `cautilus-agent` skill surface this slice.
- A live per-run judge.
- Flipping the apex badge.
- Per-facet routing residue, epic-structure ratification, and consumer-shaped corpus replication (external validity), all of which the handoff lists as separate residual work.

## Deliberately Not Doing

- Re-harvesting the baseline reasoning from a fresh live run.
  The real full-runner capture already exists and is checked in; the convergence grades it rather than regenerating it, keeping the no-manufacturing discipline and avoiding a needless live cost.
- Manufacturing a natural unsound dogfood case.
  The frontier finding established that capable models do not emit natural unsound routing here; the judge's reject-capability is proven by the constructed right-route-wrong-reason control, the documented instrument for a regression guard.
- Teaching `run-local-eval-test.mjs` or the Go engine the judge logic, which would breach the generic boundary.

## Constraints

- The generic Go engine and the generic runtime runner must not gain repo-specific judge logic; the judge half lives in adapter-owned `scripts/`.
- The judge verdict is recomputed through the SOT `compareVerdicts`, so the runner and the harness can never disagree.
- The new calibration must carry a control the judge alone can fail (the load-bearing invariant the breadth test pins), and a distinct `claimId`.
- No manufactured ground truth: the sound case is the real capture; only the control is constructed, and its fabrication is objective.
- Claim-source edits require `npm run claims:refresh:all` before push; push stays the user's.
- Any bug, error, or regression encountered routes to `charness:debug` before further fixes.

## Success Criteria

- SC1 — the AGENTS.md real-surface dogfood packet carries a `reasoningSoundness` composite with provenance `full-runner-capture-replay`, computed via SOT `compareVerdicts`.
- SC2 — a case passes only when the deterministic surface matchers AND the judge both hold; the real sound reasoning with the correct route passes.
- SC3 — the judge is load-bearing on the real surface: a constructed right-route-wrong-reason reasoning fails the case via `reasoningSoundness` even though the deterministic surface matchers pass it.
- SC4 — the new real-surface calibration passes its own gate, is load-bearing (an always-sound judge fails it), and replays green in the registry.
- SC5 — the existing deterministic real-surface dogfood gate stays green (no regression from the wiring).

## Acceptance Checks

- AC1 (SC1, SC2, SC3) — a new on-demand test (mirroring `scripts/on-demand/judge-tier-eval-dogfood.test.mjs`) drives the converged real-surface eval in fixture mode and asserts: the enriched packet carries `reasoningSoundness` with provenance `full-runner-capture-replay`; the baseline passes (surface matchers AND judge sound); and a constructed control fails solely via `reasoningSoundness.status` with the surface/routing matchers passing.
- AC2 (SC4) — `node --test scripts/agent-runtime/reasoning-soundness-judge.test.mjs` picks up the new calibration through the registry and its existing invariants assert it passes its gate, an always-sound judge fails it, and the captured verdicts replay green.
  The replay invariant *skips* (does not fail) a calibration whose sibling verdicts file is absent, so AC2 is only real once the blind grade of step 3 is checked in; a missing verdicts file is a vacuous green, not proof.
- AC3 (SC4) — the new calibration carries the real captured baseline reasoning and a constructed `realsurface-reason-control`; a unit assertion (in the SOT test or the dogfood test) pins that the baseline `reasonSummary` is byte-identical to `internal-runner-fixture-results.json["checked-in-agents-routing"].routingDecision.reasonSummary`, so the gate cannot silently drift back to a paraphrase.
- AC4 (SC5) — `npm run verify` and the existing real-surface dogfood path stay green after wiring.

## Critique

Bounded fresh-eye subagent critique is delegated before this contract is treated as final (per the repo's subagent-delegation rule); its returned status is recorded in the closeout.
No forced debug interrupt is open (`plan_risk_interrupt` reports `not-applicable`).

The load-bearing risk: the converged calibration reuses the `emitted_find_skills_bootstrap` process facet, so the only thing keeping the judge load-bearing on this claim is the constructed control — if the control is dropped or the baseline reasoning is the sole case, an always-sound judge would pass and the convergence would be a thin proxy wearing a judge label.
The load-bearing guarantee is carried by the always-sound-fails registry test (which iterates every decomposed claim, so it covers the new one) plus the control — *not* by the breadth-invariant test, whose hardcoded three-claim map and `facetsSeen.size === 3` deliberately do not see the new claimId.
Facet reuse is therefore safe; a later refactor that adds `dev-repo-realsurface-routing` to the breadth map, or makes the breadth test assert global facet uniqueness, would be a breaking change and must keep the always-sound-fails coverage intact.
The second risk: the provenance label `full-runner-capture-replay` is only honest if the graded `reasonSummary` is byte-identical to the real capture (AC3) and the label is a helper parameter rather than a hardcoded string (FD4), so the routing-regression runner cannot leak its `blind-subagent-harvest-replay` label onto the real-surface packet.

A bounded fresh-eye subagent critique of this spec returned READY-WITH-EDITS with no blocker; all five edits are folded in above and across FD3, FD4, PQ1, AC2, and AC3.

## Canonical Artifact

This document is canonical during implementation.
[eval-judge-collaboration.md](./eval-judge-collaboration.md) carries a short forward-pointer to it; the durable evidence record lands under `charness-artifacts/eval-trust/` when the slice closes.

## First Implementation Slice

One slice, because the real capture already exists.

1. Factor the composite-to-`reasoningSoundness` mapping out of `run-reasoning-judge-eval.mjs` into a shared SOT helper, with the provenance string as a parameter (the regression runner keeps `blind-subagent-harvest-replay`).
2. Add `fixtures/eval/dev/repo/reasoning-soundness-calibration.dev-repo-realsurface-routing.json`: baseline = the real captured reasoning/route from `internal-runner-fixture-results.json` (`expectedVerdict: sound`), plus the constructed `realsurface-reason-control`, with `codeFacets: ["emitted_find_skills_bootstrap"]` and the transferred governing rules.
3. Blind-grade once (PROVE): run the blind judge on those two cases and check in `reasoning-soundness-judge-verdicts.dev-repo-realsurface-routing.json`.
4. Add an adapter-owned enricher that attaches the SOT composite to the real-surface dogfood packet per case (provenance `full-runner-capture-replay`), and wire it so `self-dogfood-eval`'s packet carries it without touching the generic runtime runner.
5. Add the on-demand dogfood test (AC1); confirm the registry tests (AC2) and the deterministic gate (AC4) stay green.
6. Realign living docs in the same slice (the forward-pointer, the handoff), refresh claim packets if claim sources changed, and record the durable evidence artifact.
