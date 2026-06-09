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
