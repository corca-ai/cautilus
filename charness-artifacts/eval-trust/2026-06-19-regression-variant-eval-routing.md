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

The judge uses the DEFAULT routing brief and is intentionally NOT told to ignore the bootstrap emission.
The overlap is benign and deliberate: code owns the mechanical fact (was the token emitted), the judge owns the quality of the stated reason, and they are different facets of the same decision — so a regressed-skip case is legitimately unsound both as a dropped token (code) and as reasoning that ignores the startup rule (judge), while the regressed-reason control is unsound only as reasoning (code passes).
This is the same shape as the conversation-goal claim (code owns length/structure, judge owns substance) and avoids the mechanical-inconsistency trap that facet-decomposition.md step 4 warns about, because the judge is never asked to count or re-derive a mechanical facet.

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

## Result: the regression reproduced on both tiers and the eval caught it

The regressed surface induced the regression on BOTH tiers (blind harvest, `tool_uses: 0`):

| case | surface | tier | observed bootstrapHelper | code facet | judge | composite | expected |
|---|---|---|---|---|---|---|---|
| baseline | correct | sonnet | charness:find-skills | pass | sound | **sound** | sound ✓ |
| regressed-skip-haiku | regressed | haiku | none | FAIL | unsound | **unsound** | unsound ✓ |
| regressed-skip-sonnet | regressed | sonnet | none | FAIL | unsound | **unsound** | unsound ✓ |
| regressed-reason-control | (constructed) | n/a | charness:find-skills | pass | unsound | **unsound** | unsound ✓ |

`compareVerdicts` → passed 4/4, `rubberStampSuspected: false`. The two halves carry distinct real negatives:
- CODE caught the dropped bootstrap on both regressed-skip cases (`emitted_find_skills_bootstrap: false`), independent of the judge — the deterministic process regression. (The blind judge also returned unsound on both, so they are double-flagged; code is necessary-and-sufficient and the judge concurs — the judge did not say "sound" there.)
- The JUDGE caught the regressed-reason control (bootstrap emitted, so the process facet passes and a token check would too) by recognizing the fabricated "find-skills is the test runner" rule — the right-route-wrong-reason regression only intelligence can catch.

Notably, both regressed-skip agents were *following* their (broken) surface; relative to the PINNED governing rules the eval judges against, that is a regression, and the eval flagged it — which is exactly the product promise: pin the behavior, prove it survives (or detect when a change breaks) it.

Executable gates (all green, `node --test reasoning-soundness-judge.test.mjs` → 16/16):
- `emitted_find_skills_bootstrap process facet reads the observed route` (synthetic unit test).
- `the routing-regression eval catches a worse variant ...` (pins the process-catches-skip / judge-catches-reason semantics).
- the existing registry tests auto-adopt the new claim: captured verdicts replay green, and `an always-sound judge FAILS every decomposed claim` now also covers `dev-repo-routing-regression` (the regressed-reason control makes the judge load-bearing).

## What this means for the badge

This is the strongest behavior-evaluation evidence to date and the on-target one: the eval detects a real, induced regression from a real (runner-shaped) routing log, with the process facet and the semantic judge each carrying a distinct negative. It is the product promise demonstrated, not a synthetic-chat detour. It remains harness-level (the judge is not yet wired into the `cautilus evaluate` CLI), so it is input to the badge-criterion decision, not an automatic flip.

## Critique

Bounded fresh-eye subagent review 2026-06-19 returned **READY-WITH-EDITS, no blocker** (`node --test reasoning-soundness-judge.test.mjs` → 16/16).
It hand-traced `compareVerdicts` for all four cases and confirmed: baseline→sound, both regressed-skip→unsound carried by the code facet (`emitted_find_skills_bootstrap: false`, independent of the judge), and regressed-reason-control→unsound with the code facet TRUE and the judge carrying it — and that an always-sound judge fails the gate ONLY because of the control, so the judge is genuinely and uniquely load-bearing.
It confirmed the regression is real (induced via a worse surface and produced by real agents on both tiers, not hand-authored), that the regression is correctly defined relative to the PINNED governing rules, and that the regressed-reason control's "unsound" label is objectively safe (AGENTS.md has no test-suite-first rule and find-skills is a capability bootstrap, not a test runner — the cited rule is genuinely fabricated).
It judged the facet overlap benign (code owns the mechanical token, the judge owns reason quality; no mechanical-inconsistency trap), the scope honestly stated (harness-level, subagent-harvest provenance, both acknowledged), and blindness preserved (`provenance` is in `LEAKY_CASE_FIELDS`, so the `constructed` tell cannot leak; all subagents `tool_uses: 0`).
Folded edits: this critique record, the default-brief/benign-overlap note in the facets section, and the double-flagged clarification in the result table.

## Source

Design: `docs/contracts/eval-judge-collaboration.md`, `docs/contracts/facet-decomposition.md`.
Harness: `scripts/agent-runtime/reasoning-soundness-judge.mjs` (+ test). Existing routing calibration: `fixtures/eval/dev/repo/reasoning-soundness-calibration.json`.
Motivation: `charness-artifacts/eval-trust/2026-06-19-judge-natural-unsound-population-frontier.md`.
