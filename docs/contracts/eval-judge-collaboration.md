# Eval Judge Collaboration: code and bounded intelligence

Status: decided 2026-06-09, maintainer-agreed in session.
This is a design-direction decision that shapes the discover-driven eval design and the judge tier of `cautilus evaluate`.
It is not yet implemented; the prototype step is named at the end.

## Problem

Every current dogfood judge is deterministic code: field-match, fragment-match, or coded log-audit.
There is no intelligence-in-the-loop judge anywhere.
Yet Cautilus's own claim taxonomy already separates `recommendedProof = deterministic | cautilus-eval | human-auditable`, so it conceptually distinguishes "needs an evaluator" from "code is enough."
In practice the `cautilus-eval` (evaluator-dependent) tier has collapsed into more deterministic heuristics.

Two holes follow.
The semantic seat is empty: "did the agent emit the find-skills token" is checked by code, while "was the routing reasoning sound" is checked by nobody, even though the agent's `reasonSummary` is captured.
The observation is self-reported: the dev/repo fixture trusts the agent's own narration of its routing decision, which a misbehaving agent could misreport.

Full problem context: [charness-artifacts/findings/2026-06-09-determinism-intelligence-eval-skew.md](../../charness-artifacts/findings/2026-06-09-determinism-intelligence-eval-skew.md).

## Core decision: intelligence is an independent observer; code is the deterministic comparator

Intelligence is not added as an unbounded oracle that emits a pass/fail verdict.
It is placed as an independent observer that reads the real log or transcript and extracts structured facts, including semantic ones the agent cannot be trusted to self-report.
Code then compares those extracted facts against the expected contract deterministically.

```
real log / transcript  ->  [intelligence judge reads it, extracts structured fields]  ->  code compares to expected
   (what actually happened)     bootstrapHelper, work skill, reasoning_soundness, ...        (deterministic, reproducible)
```

This single move closes both holes at once.
The self-report trust hole closes because an independent judge extracts from the real log instead of trusting the agent's narration.
The determinism skew closes because intelligence does the part it is strong at — reading a messy log for meaning — while code keeps the part it is strong at — reproducible comparison against an expected contract.

This is an evolution, not a rewrite.
The dev/skill episode fixtures already audit the real conversation log with coded audits; the change upgrades the semantic part of those audits from brittle code heuristics to intelligence extraction with a code-checked structured output.

## D1: the judge stays trustworthy through a calibration set

The judge does not get to be the unproven part of an otherwise-proven system.
It carries the same proof discipline Cautilus applies everywhere.

The primary discipline is a calibration set: a small set of cases with a known-correct verdict — obviously sound and obviously unsound examples — that the judge must classify correctly before its verdicts are trusted.
This is the judge's own unit test, and it makes the judge itself a reproducibly evaluable claim.
The judge emits a structured rubric output rather than free-form prose, so its reasoning is inspectable, and verdicts are recorded so a human can spot-check a sample.

## D2: decompose a claim into facets, route each facet

A single claim usually splits into a deterministic facet and an intelligence facet.
"The agent follows AGENTS.md routing" is deterministic in part — did it call find-skills — and intelligence in part — was the routing sensible for the actual context.

A claim is therefore decomposed into facets, each routed to a deterministic check, a bounded-intelligence judge, or human review.
One eval is a composite of code gates plus intelligence judgment, not a single mechanism.

## D3: review the proof-route classification on a gold-set sample, not exhaustively

`discover` assigns `recommendedProof` heuristically, and that classification is itself one of the things the maintainer did not trust.
The classification is raised from heuristic toward confirmed by agent review and then human review on a small gold-set sample, not across the whole claim population.
This converts an unbounded hand-review into a bounded measurement, consistent with the canonicalization-precision finding.

## Alternatives rejected

All-deterministic, the current skew, is rejected because it gives thin token and fragment proxies a green badge and cannot judge whether behavior matched intent.
An unbounded LLM judge that emits free-form verdicts is rejected because it reintroduces the un-reproducible proof the maintainer distrusts, with no answer to "who judges the judge."
All-human review is rejected because it does not scale and is the trap the maintainer already spent weeks in.

## Next step (prototype, small)

Prototype the pattern on the dev/repo anchor.
An intelligence judge reads the dev/repo run log and extracts `reasoning_soundness` — whether the agent's stated reason for routing to find-skills is sound against AGENTS.md — as a structured field, which code then checks against a threshold.
Calibrate the judge first with three to five known cases of clearly sound and clearly unsound routing reasoning.
When this holds, the dev/repo badge can move past a find-skills-token match to a reasoning-backed proof, and only then past `declared`.

## Prototype result (2026-06-09)

The prototype was built and it holds, with one honest narrowing the maintainer chose along the way.

The calibration set is real-grounded rather than hand-authored.
We harvested routing reasonings by running five blind, read-only routing subagents over three discriminating prompts — a clear pickup, a typo-fix trap that tempts skipping the bootstrap, and a complex URL+bug+decision prompt — across two model tiers.
The finding: every run kept the startup find-skills rule, even the weak tier on the trap, so real unsound dev/repo routing did not occur.
The maintainer accepted treating the startup-find-skills robustness as verified by that harvest and declined to manufacture unsound dev/repo cases; the judge's reject-capability is deferred to other claims where natural variation produces unsound reasoning.

The harness is the D-core split made concrete.
`scripts/agent-runtime/reasoning-soundness-judge.mjs` owns the structured rubric schema, a blind prompt builder that strips the expected label, rationale, and case kind, and a deterministic comparator with a rubber-stamp guard.
The judge ran blind (a fixed sonnet subagent per case, given only the rules plus the observed reasoning) and scored 6/6 against the ground truth: all five real reasonings sound, the one labeled rubber-stamp control rejected.
The one-time capture is checked in at `fixtures/eval/dev/repo/reasoning-soundness-judge-verdicts.json` and replayed deterministically by `reasoning-soundness-judge.test.mjs` at zero live cost (prove-then-project).

What this proves and does not.
It proves the mechanism end-to-end on real material — intelligence reads a real reasoning and emits a structured rubric, code checks it reproducibly — and it proves the dev/repo routing reasoning is genuinely sound across clear, trap, and complex prompts at two tiers.
It does not by itself prove the judge reliably rejects unsound reasoning; the single control is a rubber-stamp tripwire, not a population of unsound cases, so reject-capability is carried to the generalization step.
The apex `Behavior Evaluation` badge is therefore NOT auto-flipped: moving it past `declared` to reasoning-backed is a maintainer decision and a separate slice that wires this prototype into the spec projection.

## Generalization and the code/intelligence boundary (2026-06-09)

The harness was generalized to a multi-claim registry and run on two more claims, which sharpened the design materially.

A second routing claim (bug -> debug-first) confirmed the harness is claim-agnostic: the blind judge scored 5/5 and rejected its control.
But across two routing claims, nine real harvested runs, and two model tiers, zero natural unsound reasonings occurred — capable agents (down to haiku, even under a production-urgency trap) reliably follow clear AGENTS.md routing rules.
Two consequences followed.
First, routing is one claim type among many and a tiny one: `discover` surfaces 361 claims and routing is a sliver inside "Agent and skill workflow"; the proof-debt thread over-weighted it only because the trust anchor happened to be a routing claim.
Second, on a clear routing rule a deterministic token check already captures most of the signal, so the intelligence judge's value there is a regression guard (it catches "right route, wrong reason", which the token check passes) rather than a frequently-firing reject.

The judge's real frontier is contestable/semantic claims, so the harness was pointed at one: app-chat conversation goal achievement.
There a natural unsound appeared immediately (a response that answered correctly but ran 240 characters against a stated 200-character limit), and the judge caught it, with code agreeing on the length.
But the judge FAILED calibration 3/4: it judged one case's answer-paragraph-plus-요약-line structure as a "one paragraph" violation while accepting the identical structure in two others — inconsistent on an ambiguous mechanical criterion.
The calibration discipline caught an unreliable judge before it was trusted; the gate records this as a known not-yet-passing claim (`calibrationExpectation`) so the suite stays honest.

The lesson is the operating rule for the whole claim population, design decision D2 now grounded in a run rather than asserted:
the code/intelligence line falls INSIDE a claim, facet by facet, not between claim types.
Mechanical, checkable facets — length, list presence, required-line presence, structure under an agreed interpretation, language — belong to code, which is consistent; genuinely semantic facets — substantive, no fabrication, goal achieved — belong to the bounded judge, which code cannot replace.
Handing a mechanical facet to the judge is what made it inconsistent.
The maintainer disambiguated the ambiguous structure criterion (the 요약 line is a separate required element, exempt from the one-paragraph count) and held the badge at `declared`, since a semantic judge that has not yet passed calibration cannot make the eval surface "proven".
Full detail: [charness-artifacts/findings/2026-06-09-code-intelligence-harmony-boundary.md](../../charness-artifacts/findings/2026-06-09-code-intelligence-harmony-boundary.md).

## Harmony decomposition result (2026-06-09) — 5/5, both halves of the composite exercised

The decomposition was implemented and the prediction held; an adversarial review then closed one real gap.

The harness gained a deterministic format-facet registry (`FORMAT_FACET_CHECKERS`) that a calibration opts into through a `codeFacets` list, and `compareVerdicts` became composite-aware: when a claim declares `codeFacets`, the verdict ANDs the code-computed format facets with the judge's semantic verdict, and the rubber-stamp guard watches the composite so a code-supplied negative still keeps the composite gate non-vacuous.
The conversation-goal calibration was rewritten to route its format facets (language, no-lists, the required 요약 line, a one-paragraph body with the 요약 line exempt per the maintainer-agreed rule, and the stated char limit) to code, leaving the judge only the semantic facets.
The judge was re-captured blind with a semantic-only prompt that explicitly tells it to ignore formatting and length; the four real cases came back content-sound and consistent, with `tool_uses: 0`.
sc4 now passes because code — not the judge — counts its one-paragraph body with the 요약 line exempt, so the structural inconsistency that failed calibration is gone.

An adversarial fresh-eye review then found that the judge was not yet load-bearing: with the only negative (sc2's length) coming from code, an always-sound judge replayed the identical result and the rubber-stamp guard could not see it, because that guard intentionally watches the composite and the composite already had a code-supplied negative.
The fix is a semantic control, the analog of the routing claim's rubber-stamp control: sc5 is format-perfect (every code facet passes) but its regression/smoke definitions are inverted, so reaching the expected unsound requires the judge.
The blind judge caught it (`answered_substantively: false`), and an always-sound judge now FAILS the gate — a permanent invariant is pinned by a test asserting that every decomposed claim rejects an always-sound judge.

The composite verdict is 5/5, with both halves exercised by a real negative: code flags sc2 (length), the judge flags sc5 (inverted content).
This is the honest scope: the judge's reject-capability on this claim is demonstrated by one constructed semantic control, not a population of natural unsound cases — exactly the same standard the routing claims meet with their single control, and the badge stays at `declared` accordingly.
`calibrationExpectation` was promoted from `fail-pending-facet-decomposition` to a passing gate.

The reference implementation is now the template: a claim is a list of `codeFacets` (deterministic checkers) plus semantic `judgeFacets` (a blind judge), composed by AND, with at least one case each half alone can fail.

## Next step (generalize the decomposition to discovered claims)

Apply the same facet-decomposition discipline as the template for routing the `discover` claim population.
Today `discover` tags each whole claim with a single `recommendedProof` (`deterministic | cautilus-eval | human-auditable`), but the harmony finding says that line falls INSIDE a claim, facet by facet.
The generalization is to express `recommendedProof` per facet, not per claim: decompose each discovered claim into facets, route mechanical facets to code checkers, genuinely semantic facets to a bounded judge, and the rest to human review, then AND them.
The decomposition contract for that template lives in [docs/contracts/facet-decomposition.md](./facet-decomposition.md).

## Frontier result (2026-06-19): natural semantic unsound does not occur for capable models on these single-turn surfaces

A slice attempted to close the honest gap stated above — to prove the judge's reject-capability on a *population of natural unsound cases* rather than a single constructed control.
It pre-registered objective ground truths, then harvested 31 blind chat responses across two new semantic claim families and two model tiers: factual-soundness (false-premise traps) and source-grounded faithfulness — the first attempt at the judge-reads-the-source design, with gap, misquote, overclaim, boundary-fabrication, and false-attribute traps over a fictional passage.
Every harvested response was sound: 0 natural unsound, even on the weak tier.
With the prototype's record this is roughly 44 real responses and exactly one natural unsound ever (conversation-goal sc2), which was an instruction-following miss that code owns, never a semantic content error.

The finding: current capable models do not emit natural semantic unsound on well-posed single-turn tasks — they correct false premises, ground to a supplied source, abstain honestly on gaps, resist sycophantic misquotes, and refuse to overclaim or fabricate.
A natural reject-population is therefore impractical to harvest on these surfaces and tiers; this is a property of the generators, not a weakness of the judge, and the no-manufacturing discipline was held.

This reframes the proof rather than defeating it.
The natural harvest is a positive proof that the current behavior is sound, and the judge's reject-capability — its role as a REGRESSION GUARD that fires if a future prompt/skill/model change makes the agent unsound — is exactly what the constructed controls (sc5, the rubber-stamp controls) demonstrate and the load-bearing test pins.
A constructed control is the correct instrument for a regression guard: you cannot wait for a natural regression to prove you would catch one.

Open decision (maintainer): whether constructed-control reject-capability (load-bearing and already pinned) plus a natural-sound behavior harvest is sufficient to move the apex `Behavior Evaluation` badge past `declared`, or whether the product holds the natural-population bar and records it as a known, possibly-permanent limitation.
The badge is unchanged pending that decision.
Full evidence: [charness-artifacts/eval-trust/2026-06-19-judge-natural-unsound-population-frontier.md](../../charness-artifacts/eval-trust/2026-06-19-judge-natural-unsound-population-frontier.md).

## Regression detection proven (2026-06-19): the on-target reframe of reject-capability

The frontier finding redirected the question from "wait for natural unsound" to the product's actual job: when a change makes the pinned behavior worse, the eval must catch it.
That was proven on the dev/repo routing claim.
A deliberately-worse instruction surface (the find-skills startup bootstrap "deprecated, skip it") was run through real routing agents (blind subagents, the same provenance as `dev-repo-startup-routing`), and both tiers regressed — they dropped the bootstrap.
A new decomposed claim `dev-repo-routing-regression` then flags the regressed logs as worse, mapping onto the process-vs-result split exactly:
a CODE process facet (`emitted_find_skills_bootstrap`) catches the dropped bootstrap deterministically, and the JUDGE catches a constructed right-route-wrong-reason control (bootstrap emitted, so the process facet and a token check both pass, but the stated reason fabricates a rule) — the regression only intelligence can catch.
Both halves of the composite carry a distinct real negative, so an always-sound judge fails the gate (the load-bearing invariant), and the eval passes the baseline.

This is the strongest behavior-evaluation evidence so far and the right input to the badge decision: the eval demonstrably catches a real, induced regression from a real (runner-shaped) routing log.
It remains harness-level — the judge is not yet wired into the `cautilus evaluate` CLI command, and provenance is subagent-harvest rather than the full codex/claude runner — so it informs, but does not auto-flip, the badge.
Full evidence: [charness-artifacts/eval-trust/2026-06-19-regression-variant-eval-routing.md](../../charness-artifacts/eval-trust/2026-06-19-regression-variant-eval-routing.md).
