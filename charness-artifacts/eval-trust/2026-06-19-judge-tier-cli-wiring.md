# Judge tier wired into `cautilus evaluate`: the semantic seat filled in the product CLI

Status: result (wired + dogfooded end-to-end through the product binary), 2026-06-19.

This is the stage-2(a) productization follow-up to the regression-detection breadth finding.
Until now the reasoning-soundness judge ran only in a Node test harness; the product CLI `cautilus evaluate` computed an all-deterministic verdict (field/fragment matchers), leaving the semantic seat empty — the exact determinism skew the eval-judge-collaboration contract opened against.
This slice wires the judge tier into `cautilus evaluate` and proves, through the product binary, that the eval catches the routing regression — including the right-route-wrong-reason regression only the judge can see.

## What this closes (and what it does not)

Closes: "the judge is not wired into the `cautilus evaluate` CLI command."
The product CLI now consumes a reasoning-soundness verdict in its verdict.
A case the all-deterministic matchers would pass (a correct route) now fails when the judge flags the stated reason unsound — proven inside `cautilus evaluate`, not only in the harness.

Still open (honest scope):
- The judge's LLM inference is prove-then-project: the blind verdicts are captured once and replayed deterministically.
  The CLI orchestrates and composites the verdict; it does not invoke a live judge per run.
  This is the same discipline the harness uses, paid once per claim.
- Provenance is still blind-subagent-harvest, NOT full codex/claude product-runner capture.
  Reproducing the regression pair through the full runner is the remaining fidelity step.
- The apex `Behavior Evaluation` badge is not flipped by this wiring; moving it past `declared` stays a maintainer decision.

## The design: generic engine reads a verdict, adapter-owned runner produces it

The code/intelligence boundary is preserved at the product edge, so the generic product never learns repo-specific judge logic.

Generic Go engine (`internal/runtime/instruction_surface.go`):
- A new optional per-evaluation `reasoningSoundness` field on the observed packet carries the COMPOSITE verdict (`sound` | `unsound`) plus an audit breakdown (`judgeVerdict`, `codeFacets`, `confidence`, `evidence`, `claimId`, `provenance`).
- `evaluateReasoningSoundness` turns it into an expectation result; `expectationFailed` ANDs it with the deterministic matchers, so an `unsound` verdict fails the case and drives the suite recommendation to `reject`.
- It is additive and backward-compatible: a case with no verdict is `not_applicable` and behaves exactly as before, and the `judgeSummary` block is attached only when at least one evaluation carried a judge tier.
- `normalizeReasoningSoundnessVerdict` fails closed: an invalid `verdict`/`judgeVerdict` value or an out-of-range `confidence` errors the whole build rather than defaulting to sound.
- The engine never imports the judge harness or re-derives a repo-specific facet; it only reads a structured field and composites deterministically (the product-import-isolation guard stays green).

Adapter-owned runner (`scripts/agent-runtime/run-reasoning-judge-eval.mjs`, repo-specific):
- Recomputes the composite through the single-source-of-truth harness (`compareVerdicts` over the calibration + captured blind verdicts), so the runner and the harness can never disagree on a verdict.
- Emits an `evaluation_observed.v1` packet whose `routingDecision` comes from the harvested `observedRoute` and whose `reasoningSoundness` carries the composite.
- Refuses to emit when the captured judge is rubber-stamp suspected (fail-closed against a vacuous green).
- Wired as the adapter's `eval_test_command_templates` in `.agents/cautilus-adapters/self-dogfood-routing-regression-eval.yaml`, so the product CLI runs it generically.

## Result: `cautilus evaluate` flags the regression

`cautilus evaluate fixture --repo-root . --adapter-name self-dogfood-routing-regression-eval` →

| case | route | deterministic routing matcher | judge tier | case status |
|---|---|---|---|---|
| baseline | correct | passed | sound | **passed** |
| regressed-skip-haiku | dropped bootstrap | failed | unsound | **failed** |
| regressed-skip-sonnet | dropped bootstrap | failed | unsound | **failed** |
| regressed-reason-control | correct | passed | unsound | **failed (judge alone)** |

Suite `recommendation: reject`; `judgeSummary: { evaluationsWithReasoningJudge: 4, reasoningSound: 1, reasoningUnsound: 3 }`.
The decisive row is the control: the deterministic routing matcher PASSES it (the route is correct), and the case fails ONLY because the judge tier flagged the fabricated reason — the regression a token/route check would miss, now caught inside the product CLI.

## Executable gates

- `go test ./internal/runtime/ -run TestBuildEvaluationSummary` — the engine composites the judge verdict (unsound fails the case ANDed with deterministic matchers; the control fails via the judge with the routing matcher passing), omits the judge summary without a verdict, and rejects an invalid verdict value.
- `node --test scripts/agent-runtime/run-reasoning-judge-eval.test.mjs` — the runner replays captured verdicts into an observed packet (code facet carries regressed-skip, judge carries the control) and fails closed on a rubber-stamp-suspected judge.
- `node --test scripts/on-demand/judge-tier-eval-dogfood.test.mjs` — end-to-end through the `cautilus` binary: the eval recommends reject, baseline passes, the control fails solely via the judge tier.

## Critique

Bounded fresh-eye subagent review 2026-06-19 returned **READY-WITH-EDITS, no blocker** (all three test commands green).
It confirmed: the generic boundary holds (no Go import/shell-out to the harness, no re-derived facet; `grep` over `internal/`+`cmd/` for the judge symbols returns zero hits); the compositing is correct and additive (the control fails via the judge alone, non-judge evals keep their exact prior shape); no SOT drift (the runner emits `compareVerdicts`' output verbatim); validation fails closed; and the honest scope is right (replay fidelity + subagent-harvest provenance both still open, badge not flipped).
Its load-bearing finding was doc drift: the contract, the three regression calibration fixtures, and the two prior evidence artifacts still said "the judge is not yet wired into `cautilus evaluate`", which this slice made false.
Folded edits: this evidence record; the contract's new wiring section plus its two corrected forward-looking lines; the three fixtures' `doesNotProve` lines; the two prior artifacts' present-tense "remains harness-level" lines (now past-tense with a forward pointer here); and the handoff re-scope to the remaining full-runner-provenance step.

## Source

Design: `docs/contracts/eval-judge-collaboration.md` (the 2026-06-19 wiring section), `docs/contracts/facet-decomposition.md`.
Engine: `internal/runtime/instruction_surface.go` (+ `instruction_surface_test.go`).
Runner + adapter: `scripts/agent-runtime/run-reasoning-judge-eval.mjs` (+ test), `.agents/cautilus-adapters/self-dogfood-routing-regression-eval.yaml`, `fixtures/eval/dev/repo/routing-regression-eval-cases.json`.
Replayed calibration: `fixtures/eval/dev/repo/reasoning-soundness-{calibration,judge-verdicts}.dev-repo-routing-regression.json`.
Prior evidence: `charness-artifacts/eval-trust/2026-06-19-regression-variant-{eval-routing,breadth}.md`.
