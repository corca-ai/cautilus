# Finding: where the code/intelligence line actually falls (empirical D2 boundary)

Status: resolved by the decomposition slice, 2026-06-09 — the fix below was applied, and after an adversarial review added a semantic control the claim passes 5/5 with the judge load-bearing.
Date: 2026-06-09.
Origin: the maintainer's founding concern (DF-2) that the eval is skewed all-deterministic and that "지능을 쓰는 부분과 코드를 쓰는 부분이 조화롭게 협업해야 하는데 왠지 치우친 느낌."
This finding answers that concern with data, by running the reasoning-soundness judge on a SEMANTIC claim instead of a routing claim.

## What was run

The judge harness (`scripts/agent-runtime/reasoning-soundness-judge.mjs`), proven claim-agnostic on two routing claims, was pointed at a first SEMANTIC claim: app-chat conversation goal achievement — "did the assistant answer the question AND honor every answer-format preference the user stated in the turn."
Four real chat responses were harvested (haiku and sonnet, a 3-constraint and a 4-constraint-with-200-char-limit variant).
Calibration fixture: `fixtures/eval/dev/repo/reasoning-soundness-calibration.conversation-goal.json`.
Captured blind judge verdicts: `...judge-verdicts.conversation-goal.json`.

## Result: the judge FAILED calibration (3/4), and that is the valuable part

- A natural unsound finally occurred: sc2 (haiku, 4 constraints) answered correctly but ran 240 characters against a stated 200-character limit, dropping a stated preference. Routing claims never produced this across nine runs; the semantic claim produced it immediately.
- The judge CAUGHT sc2 (verdict unsound, length violation), and the deterministic length check agrees (240 > 200). On an unambiguous criterion, judge and code converge.
- The judge MISSED sc4: it judged the answer-paragraph-plus-요약-line structure as "two paragraphs" violating "one paragraph" — while accepting the IDENTICAL structure in sc1 and sc3. An inconsistent application of an ambiguous mechanical criterion.
- So the judge is reliable where the criterion is clear (length) and unreliable where a mechanical criterion is ambiguous (structure). The calibration discipline caught an untrustworthy judge BEFORE it was trusted — which is exactly its job. We do not move any badge; we fix the judging.

## The boundary, stated

The line between code and intelligence is not "routing vs semantic claims." It is finer, and it falls INSIDE a single claim, facet by facet:

- Mechanical, checkable facets — length, presence of bullet/numbered lists, presence of a required line, language — belong to CODE. They are deterministic; handing them to intelligence makes them inconsistent (the sc4 failure is the proof).
- Genuinely semantic facets — is the answer substantive and correct, did the conversation achieve the user's intent, is the output actually good — belong to the bounded INTELLIGENCE judge. Code cannot check these.

The conversation-goal claim's `format_constraints_met` facet was mis-assigned: it bundled deterministic sub-checks (length, lists, required line) with structure, and gave the whole thing to the judge. That is why the judge was inconsistent.

## Fix applied (2026-06-09) — 4/4, prediction held

The decomposition was implemented and the claim now passes.

- Code computes the deterministic facets through the harness `FORMAT_FACET_CHECKERS` registry, which the calibration opts into via `codeFacets` (char count vs stated limit, list/bullet regex, 요약-line presence, one-paragraph body with the 요약 line exempt, language) — consistently, every time.
- The judge was re-captured blind with a SEMANTIC-ONLY prompt (`answered_substantively`, `no_fabrication`) and is explicitly told to ignore format and length; four independent sonnet subagents returned all four content-sound, with `tool_uses: 0` (genuinely blind).
- `compareVerdicts` is now composite-aware: the verdict ANDs the code facets with the judge's semantic verdict, and the rubber-stamp guard watches the composite so the gate stays non-vacuous when the real negative comes from code.

Outcome: the four real cases came back consistent, exactly as predicted, because the only inconsistency was the judge doing code's job.
sc4 now passes (code counts its one-paragraph body with the 요약 line exempt, and the judge — no longer asked about structure — judges content sound).

An adversarial fresh-eye review then caught a real gap: the judge was not yet load-bearing.
The only negative (sc2's length) came from code, so an always-sound judge replayed the identical result and the rubber-stamp guard could not see it (the guard watches the composite, which already had a code-supplied negative).
The fix is a semantic control sc5 — the analog of the routing rubber-stamp control — that is format-perfect (every code facet passes) but has its regression/smoke definitions inverted, so only the judge can fail it.
The blind judge caught it, and a pinned test now asserts that every decomposed claim rejects an always-sound judge.
The gate is now 5/5 with both halves exercised by a real negative: code flags sc2 (length), the judge flags sc5 (inverted content).
The judge's reject-capability here rests on one constructed control, not a population — the same honest standard the routing claims meet, and the badge stays at `declared`.

That decomposition is the code+intelligence harmony made concrete, and it is the empirical answer to the founding concern: not "more intelligence" and not "all code," but each facet on the tool that is reliable for it, with code keeping the judge honest on the checkable parts and a semantic control keeping the judge load-bearing.

The reference implementation is the conversation-goal claim:
`fixtures/eval/dev/repo/reasoning-soundness-calibration.conversation-goal.json` (declares `codeFacets` + semantic-only judge facets) and its `...judge-verdicts.conversation-goal.json` (the semantic re-capture), gated by `scripts/agent-runtime/reasoning-soundness-judge.test.mjs`.

## Why this matters beyond one claim

`discover` surfaces 361 claims; 140 are heuristically tagged `cautilus-eval` (intelligence), but on inspection that pile is mixed and the classification is mostly heuristic.
This finding gives the operating rule for that whole population: do not route a CLAIM to intelligence wholesale; decompose it into facets and route each facet.
A claim is a composite of code gates and intelligence judgment, never a single mechanism — which is design decision D2, now backed by a run instead of asserted.
