# Real-surface judge convergence: the judge grades the actual dogfood reasoning, full-runner provenance closed

Status: result (converged + dogfooded end-to-end through the product binary), 2026-06-19.

This is the productization follow-up that closes the full-runner-provenance step the judge-tier CLI wiring left open.
Until now two worlds were wired but disconnected: the real-surface dogfood (`self-dogfood-eval`) ran a real agent against the real `AGENTS.md` and captured its genuine `routingDecision.reasonSummary`, but scored it deterministically only; the reasoning-soundness judge graded real-shaped reasoning, but on a synthetic island (a separately-harvested blind-subagent paraphrase).
This slice overlays a judge-tier facet onto the real-surface dogfood so the judge grades the dogfood runner's OWN captured `AGENTS.md` reasoning, and the same packet that already carries the deterministic surface matchers now ANDs the judge verdict.

## What this closes (and what it does not)

Closes: "the judge has never graded the real dogfood target; provenance is a separately-harvested paraphrase."
The judge now grades the genuine full-runner capture (`internal-runner-fixture-results.json`), labeled `full-runner-capture-replay`, and the case passes only when the deterministic surface matchers AND the judge both hold — proven inside `cautilus evaluate`.

Still open (honest scope):
- "full-runner-capture-replay" labels the PROVENANCE of the graded reasoning (a genuine codex runner observation), not live reproducibility. The underlying capture (`internal-runner-fixture-results.json`, commit `dd3f5e6`) is a real but historical observation whose live re-run is not currently reproducible; this convergence grades that real capture, it does not re-establish a live run.
- The judge's LLM inference is prove-then-project: the blind verdict for the real reasoning is captured once and replayed deterministically. The CLI orchestrates and composites; it does not call a live judge per run.
- This slice converges the AGENTS.md surface (`self-dogfood-realsurface-judge-eval`). The `cautilus-agent` skill surface (`self-dogfood-eval-skill`) is the next slice.
- The apex `Behavior Evaluation` badge is not flipped. Closing this convergence makes the `declared` exit *available* (the judge now grades the real surface with full-runner provenance and constructed-control reject-capability), but the flip stays a maintainer decision.

## The design: generic engine reads a verdict, adapter-owned enricher produces it from the real capture

The code/intelligence boundary is preserved exactly as the prior wiring established it.

Generic Go engine: unchanged. It already reads the optional per-evaluation `reasoningSoundness` composite and ANDs it into the case status (`internal/runtime/instruction_surface.go`).

Generic runtime runner: unchanged and judge-logic-free. `run-local-eval-test.mjs` keeps capturing `routingDecision.reasonSummary` only.

Shared SOT helper (`scripts/agent-runtime/reasoning-soundness-attach.mjs`):
- `buildReasoningSoundness(claimId, composite, evidence, provenance)` is the single shape both runners emit, with `provenance` a PARAMETER — the routing-regression replay keeps `blind-subagent-harvest-replay`, the real-surface enricher passes `full-runner-capture-replay`, so a label can never leak across.
- `loadCompositeContext` computes the SOT composite per case via `compareVerdicts` and fails closed when the captured judge is rubber-stamp suspected.

Adapter-owned enricher (`scripts/agent-runtime/enrich-eval-with-reasoning-judge.mjs`):
- Reads the real-surface observed packet and attaches `reasoningSoundness` to each evaluation whose id matches a calibration case; evaluations absent from the calibration are left untouched.
- Wired into the real-surface wrapper (`run-self-dogfood-eval.mjs`, new `--reasoning-calibration/--reasoning-verdicts/--reasoning-provenance` flags), so the converged adapter runs the real dogfood path and then the judge tier.

Re-grounded calibration (`fixtures/eval/dev/repo/reasoning-soundness-calibration.dev-repo-realsurface-routing.json`):
- The governing rules transfer unchanged from `dev-repo-routing-regression`; the baseline/sound case carries the REAL captured reasoning, byte-identical to `internal-runner-fixture-results.json["checked-in-agents-routing"].routingDecision.reasonSummary`.
- It declares `codeFacets: ["emitted_find_skills_bootstrap"]` and carries a constructed `realsurface-reason-control` (right route, fabricated reason) so the judge stays load-bearing (an always-sound judge fails the gate).

## PROVE step (one-time blind grade)

Two independent blind sonnet subagents graded the two cases, each given ONLY `buildJudgePrompt()` output (governing rules + observedRoute + reasonSummary, expected label / rationale / kind stripped), instructed to use no tools (both `tool_uses: 0`):
- `checked-in-agents-routing` → **sound** (the genuine dogfood reasoning correctly applies startup_bootstrap then defers to work_skill). This resolved the open probe: the real reasoning grades sound, not a manufactured pass.
- `realsurface-reason-control` → **unsound** (the reason fabricates a "find-skills auto-runs a regression suite to verify routing accuracy" rule the governing rules do not support).

Captured at `fixtures/eval/dev/repo/reasoning-soundness-judge-verdicts.dev-repo-realsurface-routing.json` and replayed deterministically.

## Result: `cautilus evaluate` grades the real reasoning and ANDs the judge tier

`cautilus evaluate fixture --adapter-name self-dogfood-realsurface-judge-eval` →

| case | entryFile matcher | routing matcher | judge tier | provenance | case status |
|---|---|---|---|---|---|
| checked-in-agents-routing (real capture) | passed | passed | sound | full-runner-capture-replay | **passed** |
| realsurface-reason-control (constructed) | passed | passed | unsound | full-runner-capture-replay | **failed (judge alone)** |

Suite `recommendation: reject`; `judgeSummary: { evaluationsWithReasoningJudge: 2, reasoningSound: 1, reasoningUnsound: 1 }`.
The decisive row is the control: the deterministic entry/route matchers PASS it (the route is correct), and the case fails ONLY because the judge flagged the fabricated reason — the regression a token/route check misses, now caught on the REAL dogfood surface inside the product CLI, grading reasoning with genuine full-runner provenance.

## Executable gates

- `node --test scripts/agent-runtime/reasoning-soundness-judge.test.mjs` — the registry auto-picks up the new claim: it replays green, an always-sound judge fails it (load-bearing), and it carries a distinct claimId. (21/21)
- `node --test scripts/agent-runtime/reasoning-soundness-attach.test.mjs` — the shared helper carries a parameterized provenance and refuses an empty label; `loadCompositeContext` fails closed on a rubber-stamp; the enricher attaches verdicts to matching cases only.
- `node --test scripts/run-self-dogfood-eval.test.mjs` — the wrapper rejects a lone reasoning flag and attaches the judge tier when calibration + verdicts are supplied.
- `node --test scripts/on-demand/realsurface-judge-eval-dogfood.test.mjs` — end-to-end through the `cautilus` binary: the baseline passes (surface matchers AND judge sound, full-runner provenance), the control fails solely via the judge, and the baseline reasoning is pinned byte-identical to the real capture (provenance honesty).

## Critique

A bounded fresh-eye subagent critique of the build spec returned READY-WITH-EDITS, no blocker; all five edits were folded into the spec (provenance as a helper parameter, AC3 JSON-path anchor + full route mirroring, the load-bearing-vs-breadth-test reasoning, the AC2 skip-not-fail trap, and the PQ1 unsound branch).
The load-bearing edit landed in code: provenance is a parameter of `buildReasoningSoundness`, and the on-demand test pins the baseline reasoning byte-identical to the real capture so the gate cannot drift back to a paraphrase.

## Source

Spec: `docs/contracts/realsurface-judge-convergence.md` (decisions closed), `docs/contracts/eval-judge-collaboration.md` (forward pointer + the prior wiring section).
Shared helper + enricher: `scripts/agent-runtime/reasoning-soundness-attach.mjs`, `scripts/agent-runtime/enrich-eval-with-reasoning-judge.mjs`; wrapper `scripts/run-self-dogfood-eval.mjs`; adapter `.agents/cautilus-adapters/self-dogfood-realsurface-judge-eval.yaml`.
Fixtures: `fixtures/eval/dev/repo/realsurface-judge-eval-cases.json`, `realsurface-judge-eval-fixture-results.json`, `reasoning-soundness-calibration.dev-repo-realsurface-routing.json`, `reasoning-soundness-judge-verdicts.dev-repo-realsurface-routing.json`; the real capture `internal-runner-fixture-results.json`.
Prior evidence: `charness-artifacts/eval-trust/2026-06-19-judge-tier-cli-wiring.md`.
