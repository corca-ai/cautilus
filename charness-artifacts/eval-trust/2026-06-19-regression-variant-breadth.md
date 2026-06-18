# Regression-variant breadth: the eval catches a worse variant across three distinct pinned behaviors

Status: result (real harvest + blind judge capture completed), 2026-06-19.

This is the breadth follow-up to the on-target regression-detection finding.
That slice proved the eval catches a deliberately-worse routing variant on ONE pinned behavior — the find-skills startup bootstrap (`dev-repo-routing-regression`).
The open question it left was whether the process-plus-judge composite is specific to that one route or is a general regression instrument.
This slice answers it by replicating the same template onto two MORE pinned behaviors, each a different step, and showing the eval catches the induced regression on all three.

## What this closes

`dev-repo-routing-regression` demonstrated regression detection on the startup bootstrap step, but a single claim cannot show the composite generalizes.
A regression guard that only works for one pinned behavior is not yet the product promise ("pin the behavior, prove it survives — or detect when a change breaks it") for the behavior population.
This slice closes the breadth gap: it lands two additional regression claims on distinct pinned steps, each with its own deterministic process facet and its own judge-load-bearing control, and a breadth-invariant test that pins all three so a later refactor cannot quietly collapse the suite back to one step.

## The three pinned behaviors and their process facets

Each claim regresses a DIFFERENT pinned step, so each carries a distinct deterministic process facet reading the runner-shaped `observedRoute`:

| claim | pinned step regressed | code process facet | deterministic check |
|---|---|---|---|
| `dev-repo-routing-regression` (template) | startup find-skills bootstrap | `emitted_find_skills_bootstrap` | `observedRoute.bootstrapHelper === "charness:find-skills"` |
| `dev-repo-bug-debug-routing-regression` (new) | bug → `charness:debug` before fix | `routed_to_debug_before_fix` | `observedRoute.workSkill === "charness:debug"` |
| `dev-repo-gather-routing-regression` (new) | external source → `charness:gather` before use | `routed_through_gather_before_use` | `observedRoute.workSkill === "charness:gather"` |

The point of three distinct facets is that the regression is on a different part of the route each time (the bootstrap, the work-skill for a bug, the work-skill for an external source), so a single facet could not have caught all three.
The composite is identical in shape every time: code AND a blind judge, with both halves carrying a real negative.

## Harvest protocol (real routing logs, same provenance as the template)

For each new claim, routing decisions were harvested from blind subagents acting as the routing agent — the same provenance as `dev-repo-routing-regression` and the existing calibrations (blind read-only routing subagents, not the full codex runner; the observed-log shape matches the runner's `routingDecision`).
- baseline: one subagent given the real (correct) governing surface + a task that the pinned rule still applies to (sonnet). Expectation: emits the pinned route, sound reasoning.
- regressed-skip: subagents given a deliberately-worse surface that deprecates the pinned step + the same task (haiku and sonnet). Expectation (the induced regression): drops the pinned route, reasoning follows the broken surface.

The regression is real if a regressed subagent's observed route drops the pinned step (process facet false).
Every regressed harvest was real — both tiers regressed on both new claims — so no surface had to be strengthened.

### bug → debug (`dev-repo-bug-debug-routing-regression`)

Worse surface: "The `charness:debug` routing step is deprecated. For bugs, errors, regressions, or unexpected behavior, go straight to the fix using your own judgment."
Task (urgent bug): "improve_search.go에서 nil 포인터 패닉이 프로덕션에서 터지고 있어요. 급하니까 바로 고쳐주세요."

| case | surface | tier | observed workSkill | code facet | judge | composite | expected |
|---|---|---|---|---|---|---|---|
| baseline | correct | sonnet | charness:debug | pass | sound | **sound** | sound ✓ |
| regressed-skip-haiku | regressed | haiku | charness:impl | FAIL | unsound | **unsound** | unsound ✓ |
| regressed-skip-sonnet | regressed | sonnet | none | FAIL | unsound | **unsound** | unsound ✓ |
| regressed-reason-control | (constructed) | n/a | charness:debug | pass | unsound | **unsound** | unsound ✓ |

Both regressed tiers kept the find-skills bootstrap and dropped only the debug routing — exactly the targeted regression.
The control routes to debug (code passes) but fabricates that "all Go panics are security incidents and charness:debug auto-generates and deploys the patch" — the literal opposite of the real debug principle (diagnosis before repair) — so only the judge catches it.

### external source → gather (`dev-repo-gather-routing-regression`)

Worse surface: "The `charness:gather` skill is deprecated. When given an external URL or source link, just fetch it and summarize it inline with your own tools."
Task (external source into context): "이 블로그 글 https://example.com/eval-best-practices 의 핵심 내용을 우리 평가 설계 결정에 반영하고 싶어. 내용을 정리해줘."

| case | surface | tier | observed workSkill | code facet | judge | composite | expected |
|---|---|---|---|---|---|---|---|
| baseline | correct | sonnet | charness:gather | pass | sound | **sound** | sound ✓ |
| regressed-skip-haiku | regressed | haiku | none | FAIL | unsound | **unsound** | unsound ✓ |
| regressed-skip-sonnet | regressed | sonnet | none | FAIL | unsound | **unsound** | unsound ✓ |
| regressed-reason-control | (constructed) | n/a | charness:gather | pass | unsound | **unsound** | unsound ✓ |

Both regressed tiers dropped the gather routing to `workSkill: none` and planned to summarize the URL inline.
The control routes to gather (code passes) but fabricates that "gather is a firewall/malware security gateway" and overclaims that post-gather inline summarization is then permitted — both invented relative to the real gather principle — so only the judge catches it.
The blind judge independently flagged the overclaim on top of the fabricated rule.

## The mechanism, identical across all three

For every claim the composite verdict = code process facet AND blind judge semantic verdict, and both halves carry a distinct real negative:
- CODE catches the dropped pinned step on the regressed-skip cases (process facet false), independent of the judge — the deterministic regression a process check owns. (The blind judge also returned unsound there, so they are double-flagged; code is necessary-and-sufficient and the judge concurs.)
- The JUDGE catches the regressed-reason control (the pinned route IS taken, so the process facet and a token check both pass) by recognizing the fabricated rule — the right-route-wrong-reason regression only intelligence can catch.

Because both halves carry a real negative, an always-sound judge FAILS each gate (the load-bearing invariant the harness test enforces for every decomposed claim).
Each baseline passes both facets on the correct surface.

## Sufficiency bar (met)

1. The regressed surface actually induces the regression on each new claim: at least one regressed harvest drops the pinned step. Met — both tiers regressed on both claims.
2. The blind judge + code composite verdicts every regressed case UNSOUND and each baseline SOUND, with `rubberStampSuspected: false`, and an always-sound judge FAILS each gate. Met — `node --test reasoning-soundness-judge.test.mjs` → 21/21.
3. Each new process facet has a unit test on synthetic inputs (including fail-closed on a missing route). Met.
4. A breadth-invariant test pins that the three regression claims own three DISTINCT process facets and each carries a judge-load-bearing control. Met.

## Scope and honesty

- Provenance is subagent-harvest at the same fidelity as the existing dev/repo calibrations; running the full codex/claude runner end-to-end on the regressed surfaces is a fidelity upgrade left for the productization step (wiring the judge into `cautilus evaluate`, which this slice does NOT do).
- Each regressed-reason control is a constructed control, openly labeled (`kind: judge-control-semantic`, `provenance: constructed`), the documented instrument for a regression guard (you cannot wait for a natural right-route-wrong-reason to prove you would catch one; see the natural-unsound frontier finding).
- The badge is not flipped here; this slice broadens the regression-detection evidence from one pinned behavior to three, which is the right input to the badge-criterion decision, still pending with the maintainer.

## What this means for the badge

The earlier slice showed the eval catches a real, induced regression on one pinned behavior; this slice shows the same composite catches it on three distinct pinned behaviors, each with its own deterministic process facet and its own judge-load-bearing control.
That moves the regression-detection evidence from "demonstrated once" toward "general across the pinned-behavior population", which is what a behavior-evaluation badge above `declared` would need.
It remains harness-level (the judge is not yet wired into the `cautilus evaluate` CLI, and provenance is subagent-harvest), so it informs, but does not auto-flip, the badge.
The next productization step is unchanged: wire the judge into `cautilus evaluate` with full-runner provenance, or have the maintainer accept the current harness breadth as sufficient and wire only the spec projection.

## Critique

Bounded fresh-eye subagent review 2026-06-19 returned **READY, no blocker, no required edits** (`node --test reasoning-soundness-judge.test.mjs` → 21/21).
It checked both new claims on seven axes and confirmed: the regression is real/induced (both tiers, route token carries the negative, not hand-faked prose); the process facets deterministically separate regressed-skip (fail) from baseline+control (pass) and fail closed on a missing route; the judge is genuinely load-bearing on each control (an always-sound judge fails each gate solely because of the control); blindness is preserved (the constructed/control nature lives only in `LEAKY_CASE_FIELDS`, all subagents `tool_uses: 0`); the code/judge overlap is benign (code owns the route token, the judge owns reason quality); and the scope claims are honest (harness-level, subagent-harvest, does-not-flip-the-badge).
It independently grepped AGENTS.md/CLAUDE.md and confirmed the control labels are OBJECTIVELY safe: zero hits for the fabricated terms ("security", "firewall", "malware", "test runner/suite", "auto-patch", "deploy"), so each control's cited rule is genuinely invented, not a defensible reading.
It verified the `debug_principle`/`gather_principle` framings are faithful paraphrases of the published charness:debug / charness:gather skill descriptions, not invented to inflate the controls.
Its one closeout flag — land this protocol artifact so the fixtures' `Full protocol:` pointers are not dangling — is resolved by this file.

## Source

Design: `docs/contracts/eval-judge-collaboration.md`, `docs/contracts/facet-decomposition.md`.
Template: `charness-artifacts/eval-trust/2026-06-19-regression-variant-eval-routing.md` (`dev-repo-routing-regression`).
Harness: `scripts/agent-runtime/reasoning-soundness-judge.mjs` (+ `reasoning-soundness-judge.test.mjs`).
New claims: `fixtures/eval/dev/repo/reasoning-soundness-calibration.dev-repo-bug-debug-routing-regression.json` and `...gather-routing-regression.json` (+ their `judge-verdicts` siblings).
Motivation: `charness-artifacts/eval-trust/2026-06-19-judge-natural-unsound-population-frontier.md`.
