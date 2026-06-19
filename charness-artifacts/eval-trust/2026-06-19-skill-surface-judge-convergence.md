# Skill-surface judge convergence: the judge grades the Cautilus Agent's genuine orientation reasoning

Status: result (converged + dogfooded end-to-end through the product binary), 2026-06-19.

This extends the AGENTS.md real-surface judge convergence (`2026-06-19-realsurface-judge-convergence.md`) to the `cautilus-agent` skill surface.
Until now the skill dogfood (`self-dogfood-eval-skill`) ran a real no-input orientation and captured a genuine `summary`, but scored it with deterministic fragment matchers only; the reasoning-soundness judge had never graded the skill surface at all.
This slice overlays a judge-tier facet onto the skill surface so the judge grades the Cautilus Agent's OWN captured no-input orientation reasoning, and the same packet that already carries the deterministic surface matchers now ANDs the judge verdict.

## What this closes (and what it does not)

Closes: "the skill surface has the determinism skew the judge tier exists to close, with no judge over it, and only a hand-authored stand-in for the orientation reasoning."
The judge now grades a genuine fresh full-runner skill capture (`internal-runner-fixture-results.json`, no-input case, labeled `full-runner-capture-replay`), and the case passes only when the deterministic surface matchers AND the judge both hold — proven inside `cautilus evaluate`.

Two facts made this larger than the AGENTS.md slice:
- No genuine capture existed. The AGENTS.md baseline reused a real historical codex capture (`dd3f5e6`); the skill surface had only a hand-authored stand-in with no real-capture upgrade commit. The no-manufacturing discipline required producing one, so this slice ran a FRESH live codex capture of the no-input orientation and checked it in over the stand-in — the same honesty upgrade `dd3f5e6` made for AGENTS.md, and stronger (a fresh genuine run, not a historical one).
- The generic engine did not composite a judge verdict on the skill packet. `instruction_surface.go` already read `reasoningSoundness`; `skill_evaluation.go` did not. The slice extended the skill engine with the same generic verdict-compositing (symmetric with the instruction surface), reusing the same helpers — NOT repo-specific judge logic.

Still open (honest scope):
- The judge's LLM inference is prove-then-project: the blind verdict for the real reasoning is captured once and replayed deterministically. The CLI orchestrates and composites; it does not call a live judge per run.
- The apex `Behavior Evaluation` badge is not flipped. With AGENTS.md and the skill surface both closed, the `declared` exit is now available on both surfaces, but the flip stays a separate maintainer decision and slice.

## Mid-slice debug detour: the orientation fixture required a non-existent command

The fresh live capture surfaced a latent bug. The no-input fixture required the command fragment `agent status`, which is not a real Cautilus command — the orientation command that emits the `cautilus.agent_status.v1` packet is `doctor status` (SKILL.md, `app.go`).
The genuine capture correctly ran `./bin/cautilus doctor status --repo-root . --json` and oriented soundly, yet was forced to `failed` on the missing `agent status` fragment.
The stale fragment had hidden because fixture mode passes `commandText = null`, so the command matcher is never exercised; the live capture was the first time it met real command text.
Routed through `charness:debug` (`charness-artifacts/debug/2026-06-19-skill-no-input-command-fragment.md`) and fixed in both fixtures (`cautilus-skill-routing.fixture.json`, `internal-runner-cases.json`): the fragment is now `doctor status`.

## The design: generic engine composites a verdict, adapter-owned enricher produces it from the real capture

The code/intelligence boundary is preserved exactly as the prior convergence established it.

Generic Go engine: extended with generic verdict-compositing, not judge logic. `skill_evaluation.go` now reads the optional per-evaluation `reasoningSoundness`, ANDs it into the case status (an `unsound` composite turns a passed case to failed), attaches it flat to the payload, and accumulates a `judgeSummary` — reusing the same-package helpers `normalizeReasoningSoundnessVerdict`, `evaluateReasoningSoundness`, and `accumulateReasoningSoundnessSummary` the instruction surface already used. A missing verdict is `not_applicable`, so existing skill cases behave exactly as before. No facet or judge computation enters Go.

Generic runtime runner: unchanged and judge-logic-free. `run-local-skill-test.mjs` keeps capturing the `summary` only.

Shared SOT helper + adapter-owned enricher: the existing generic `enrich-eval-with-reasoning-judge.mjs` is reused unchanged — it matches by `evaluationId` and operates on any packet's `evaluations` array, and the skill packet carries `evaluations[].evaluationId`. The provenance label `full-runner-capture-replay` is the enricher's parameter, never a hardcoded string.

New skill process facet (`held_no_input_orientation`): reads the structured `observedOrientation` signal the real skill capture carries (invoked, passed, no forbidden escalation), so a real regression — the agent failing to orient or escalating to eval/refresh/commit — fails the process half, and the judge owns the semantic half. Registered in `FORMAT_FACET_CHECKERS` (the same registry the routing facets live in), in pattern.

Re-grounded calibration (`reasoning-soundness-calibration.dev-skill-no-input-orientation.json`): the governing rules are rewritten from the skill's own `SKILL.md` "No-Input Orientation" (`orient_first`, `summarize_then_stop`, `scan_confirmation_separate_from_review`, `no_auto_escalation`), not transferred from AGENTS.md. The baseline/sound case carries the REAL captured `summary`, byte-identical to the checked-in capture. It declares `codeFacets: ["held_no_input_orientation"]` and carries a constructed `skill-orientation-reason-control` (right actions, fabricated rule) so the judge stays load-bearing (an always-sound judge fails the gate). The registry tests now scan `dev/skill` too, so the claim inherits the load-bearing/replay coverage.

## PROVE step (one-time blind grade)

Two independent blind sonnet subagents graded the two cases, each given ONLY `buildJudgePrompt()` output (governing rules + observedOrientation + summary, expected label / rationale / kind stripped), instructed to use no tools (both `tool_uses: 0`):
- `execution-cautilus-no-input-claim-discovery-status` → **sound** (the genuine orientation reads the read-only status packet, summarizes, presents refresh/inspect/compare/stop as separate user-chosen branches, and stops at branch selection). This resolved the open probe: the real reasoning grades sound, not a manufactured pass.
- `skill-orientation-reason-control` → **unsound** (the reason fabricates that `doctor status` auto-refreshes the saved claim packet from the latest git diff — a behavior the skill does not support; status is read-only and refresh is a separate branch).

Captured at `fixtures/eval/dev/skill/reasoning-soundness-judge-verdicts.dev-skill-no-input-orientation.json` and replayed deterministically.

## Result: `cautilus evaluate` grades the real skill reasoning and ANDs the judge tier

`cautilus evaluate fixture --adapter-name self-dogfood-skill-judge-eval` →

| case | summary matchers | code facet (held_no_input_orientation) | judge tier | provenance | case status |
|---|---|---|---|---|---|
| no-input orientation (genuine capture) | passed | passed | sound | full-runner-capture-replay | **passed** |
| skill-orientation-reason-control (constructed) | passed | passed | unsound | full-runner-capture-replay | **failed (judge alone)** |

Suite `recommendation: reject`; `judgeSummary: { evaluationsWithReasoningJudge: 2, reasoningSound: 1, reasoningUnsound: 1 }`.
The decisive row is the control: the deterministic summary matchers PASS it and the code facet PASSES it (the orientation is held), and the case fails ONLY because the judge flagged the fabricated rule — the regression a fragment/outcome check misses, now caught on the real skill surface inside the product CLI, grading reasoning with genuine full-runner provenance.

## Executable gates

- `node --test scripts/agent-runtime/reasoning-soundness-judge.test.mjs` — the registry (now scanning `dev/skill`) auto-picks up the new claim: it replays green, an always-sound judge fails it (load-bearing), it carries a distinct claimId, and the `held_no_input_orientation` facet has focused unit coverage. (23/23)
- `go test ./internal/runtime/ -run TestSkillEvaluation` — the engine ANDs an unsound verdict into the case status (a passed case becomes failed), keeps a passed case passed when sound, accumulates the judgeSummary, and treats a missing verdict as `not_applicable` with the case byte-unchanged.
- `node --test scripts/on-demand/skill-judge-eval-dogfood.test.mjs` — end-to-end through the `cautilus` binary: the genuine baseline passes (surface matchers AND judge sound, full-runner provenance), the control fails solely via the judge (its summary carries no "Expectation failure", proving the surface matchers passed), the baseline reasoning is pinned byte-identical to the genuine capture (provenance honesty), and displayed === graded for every case.
- `npm run verify` — all phases green, coverage floor green (`skill_evaluation.go` above floor).

## Honest nuances

- In fixture mode the runner passes `commandText = null`, so the COMMAND-fragment matchers are inert; the surface gate that actually runs is the summary-fragment matchers. The load-bearing proof rests on the summary matchers + the code facet + the judge, and the control would also pass the command matchers under a real command log (it runs only the read-only `doctor status`).
- `full-runner-capture-replay` labels the PROVENANCE of the graded reasoning (a genuine codex runner observation), not live reproducibility.

## Critique

A bounded fresh-eye subagent critique of the build spec returned READY-WITH-EDITS, no blocker; all four edits were folded (the registry-coverage misread — extend the registry tests to scan `dev/skill`; the FLAT skill payload shape; the runner-side fragment matchers; the exact-id enricher binding).
A bounded fresh-eye subagent critique of the IMPLEMENTATION returned READY, no blocker, no edits: boundary honesty clean, the judge is the sole gate on the control, the baseline is a genuine byte-identical real capture graded sound by a real blind pass, the registry picks up the new claim and an always-sound judge fails it, and a missing verdict leaves cases byte-unchanged. Its one non-blocking observation (command matchers inert in fixture mode) is recorded above.

## Source

Spec: `docs/contracts/skill-surface-judge-convergence.md` (decisions closed), `docs/contracts/eval-judge-collaboration.md` (forward pointer).
Engine: `internal/runtime/skill_evaluation.go` (+ `skill_evaluation_reasoning_test.go`). Facet + registry: `scripts/agent-runtime/reasoning-soundness-judge.mjs` (+ test). Enricher (reused): `scripts/agent-runtime/enrich-eval-with-reasoning-judge.mjs`. Adapter: `.agents/cautilus-adapters/self-dogfood-skill-judge-eval.yaml`.
Fixtures: `fixtures/eval/dev/skill/skill-judge-eval-cases.json`, `skill-judge-eval-fixture-results.json`, `reasoning-soundness-calibration.dev-skill-no-input-orientation.json`, `reasoning-soundness-judge-verdicts.dev-skill-no-input-orientation.json`; the genuine capture `internal-runner-fixture-results.json` (no-input case).
Debug: `charness-artifacts/debug/2026-06-19-skill-no-input-command-fragment.md`.
Prior: `charness-artifacts/eval-trust/2026-06-19-realsurface-judge-convergence.md`.
