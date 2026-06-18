# Regression-variant eval: prove the eval catches a deliberately-worse routing variant

Status: pre-registration (written before any variant was harvested), 2026-06-19.

This is the on-target follow-up to the natural-unsound frontier finding.
That finding showed capable models do not emit natural semantic unsound, so the judge's reject-capability cannot be proven by *waiting* for bad behavior.
The product's actual job is regression detection: when a prompt/skill/model change makes the pinned behavior worse, the eval must catch it.
So instead of waiting for spontaneous badness, we INDUCE a regression — a deliberately-worse instruction surface — run it through a real routing agent, and prove the eval flags the regressed log as worse while passing the baseline.
This is a real change evaluated on a real log, not a hand-edited "bad output"; it is exactly the product's intended use.

## What this closes

The runner machinery already exists (the dev/repo self-dogfood runner produces an observed log with `routingDecision` + `loadedInstructionFiles`, and has a deterministic fixture-replay mode), and the reasoning-soundness judge already reads routing reasonings.
But two things were never proven: (1) that the eval detects a regressed variant as worse, and (2) the judge's load-bearing reject demonstrated on a routing regression that a deterministic token check would miss.
This slice closes both on the dev/repo routing claim, reusing the reasoning-soundness-judge harness (the reference implementation of facet decomposition).

## The claim and its facets (decomposed: process + semantic)

`dev-repo-routing-regression`: when the instruction surface regresses (the find-skills startup bootstrap is removed/deprecated), the eval must flag the resulting routing as worse — both the deterministic process facet (was the find-skills bootstrap emitted) and the semantic facet (is the stated routing reasoning sound against the pinned governing rules).

This is a DECOMPOSED claim, mapping directly onto the maintainer's process-vs-result model:
- CODE process facet `emitted_find_skills_bootstrap`: `observedRoute.bootstrapHelper === "charness:find-skills"`. Deterministic, reproducible. This is the "did the tool-call process include the pinned bootstrap" check.
- JUDGE semantic facet (the default routing facets `cites_governing_rule`, `rule_application_correct`, `no_unsupported_claim`): is the stated reasoning sound against the governing rules.
- Composite verdict = code AND judge.

The governing rules are the pinned dev/repo routing contract (startup find-skills bootstrap, work-skill choice after bootstrap), identical to the existing `dev-repo-startup-routing` calibration.

## The two instruction surfaces (the variant)

Baseline surface (the real AGENTS.md Skill Routing contract):

> At session startup in this repo, call the shared/public charness skill `find-skills` once before broader exploration. Over-applying the bootstrap is cheap and skipping it is the documented failure mode. After that bootstrap pass, choose the durable work skill that best matches the request.

Regressed surface (the deliberately-worse variant under test):

> Begin directly with the user's task using your own judgment. The find-skills bootstrap is deprecated and no longer required; skip it and route straight to the work you think fits.

Same task prompt for both (the typo-fix request, a simple task where the baseline contract still requires the bootstrap): "README.md 소개 문장의 오타 하나만 고쳐줘."

## Harvest protocol (real routing logs, same provenance as the existing calibration)

Routing decisions are harvested from blind subagents acting as the routing agent — the same provenance as the existing `dev-repo-startup-routing` cases (which were harvested from blind read-only routing subagents, not the full codex runner; the observed-log shape matches the runner's `routingDecision`).
- baseline: one subagent given the baseline surface + prompt (sonnet). Expectation: emits the find-skills bootstrap, sound reasoning.
- regressed: subagents given the regressed surface + the same prompt (haiku and sonnet). Expectation (the induced regression): skips the find-skills bootstrap, reasoning follows the broken surface.

The regression is real if a regressed subagent's `observedRoute.bootstrapHelper` is not `charness:find-skills`.
If even the weak tier still bootstraps (overrides the broken surface), that is recorded and the regressed surface is strengthened, not faked.

## Case structure (the gate)

- baseline (real harvest): bootstrap emitted (code pass) + sound reasoning (judge sound) → expected SOUND.
- regressed-skip (real harvest, induced regression): bootstrap NOT emitted (code FAIL) → expected UNSOUND. This is the deterministic regression the process facet catches.
- regressed-reason (constructed control, the sc5 analog): bootstrap IS emitted (code pass) but the reasoning is unsound — it cites a fabricated/wrong rule for the route ("right route, wrong reason") → expected UNSOUND, catchable ONLY by the judge. This is the regression a token check passes but the judge must catch, and it makes the judge load-bearing on this claim.

Both halves of the composite carry a real negative: code carries regressed-skip, the judge carries regressed-reason — the same standard the conversation-goal claim meets (sc2 code-carried, sc5 judge-carried).

## Sufficiency bar

1. The regressed surface actually induces the regression: at least one regressed harvest has `bootstrapHelper !== charness:find-skills`.
2. The blind judge + code composite verdicts every regressed case UNSOUND and the baseline SOUND, with `rubberStampSuspected: false`, and an always-sound judge FAILS the gate (the load-bearing invariant the harness test already enforces for decomposed claims).
3. The new `emitted_find_skills_bootstrap` code facet has a unit test on synthetic inputs.

## Scope and honesty

- Provenance is subagent-harvest at the same fidelity as the existing dev/repo calibration; running the full codex/claude runner end-to-end on the regressed surface is a fidelity upgrade left for the productization step (wiring the judge into `cautilus evaluate`, which this slice does NOT do).
- regressed-reason is a constructed control, openly labeled, the documented instrument for a regression guard (you cannot wait for a natural "right route, wrong reason" to prove you would catch one).
- The badge is not flipped here; this slice produces regression-detection evidence that is the right input to the badge-criterion decision.

## Source

Design: `docs/contracts/eval-judge-collaboration.md`, `docs/contracts/facet-decomposition.md`.
Harness: `scripts/agent-runtime/reasoning-soundness-judge.mjs` (+ test). Existing routing calibration: `fixtures/eval/dev/repo/reasoning-soundness-calibration.json`.
Motivation: `charness-artifacts/eval-trust/2026-06-19-judge-natural-unsound-population-frontier.md`.
