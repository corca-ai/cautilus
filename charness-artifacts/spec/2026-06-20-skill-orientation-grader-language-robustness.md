# Spec Handoff: make the dev/skill orientation grader language-robust

Source: debug `charness-artifacts/debug/2026-06-20-skill-orientation-live-summary-fragment-language.md` (repeated-symptom of `2026-06-19-skill-no-input-command-fragment.md`).

## Problem

The no-input orientation case (`execution-cautilus-no-input-claim-discovery-status`) grades a sound live orientation by English `requiredSummaryFragments: ["adapter", "claim", "next branch"]`.
This repo's CLAUDE.md mandates Korean responses, so a fresh live `npm run proof:skill-orientation:live` capture summarized adapter/claim/scan/branch state correctly in Korean (`어댑터`, `다음 분기`) and was forced to `failed` because the English literals were absent.
The behavior held; the grader is language-brittle.
The graded cases file already lists Korean variants under `forbiddenSummaryFragments` but not under `requiredSummaryFragments`, so the asymmetry is the defect.

## Why this is a spec decision, not a mechanical fix

It changes a behavior-steering grader that backs the apex "Behavior Evaluation — proven (live-replayed)" badge's dev/skill live re-runnability, and it is the second incident on the same fixture/matcher seam.
The maintainer should choose the grading approach AND decide whether the dev/skill live re-runnability gap changes the badge wording before the fix lands.

## Decision needed

1. Grader direction for orientation summary checks (pick one or combine):
   - assert on the structured `doctor status` packet / action log the agent actually ran (language-independent, strongest);
   - grade the summary with the existing blind intent judge (language-robust by construction);
   - interim: mirror the bilingual coverage `forbiddenSummaryFragments` already has into `requiredSummaryFragments` across all four skill suites.
2. Badge honesty: does a fresh-run failure on the dev/skill live proof (sound behavior, brittle grader) require softening the "Behavior Evaluation — proven" wording or adding a Proof Debt line until the grader is fixed, or is the deterministic-replay + always-sound-judge-fails gate sufficient to keep the badge "proven"?

## Scope / siblings

Four fixtures carry the identical English-only required list:
`fixtures/eval/dev/skill/live/skill-orientation-live-cases.json` (the graded one),
`fixtures/eval/dev/skill/skill-judge-eval-cases.json` (x2),
`fixtures/eval/dev/skill/cautilus-skill-routing.fixture.json`,
`fixtures/eval/dev/skill/internal-runner-cases.json`.
Add a fixture lint that flags single-language `requiredSummaryFragments` on orientation cases (follow-up: skill-orientation-summary-language-robust-grader).

## Recommendation

Lean on the packet/action-log assertion plus the blind intent judge (the repo already treats LLM judges as the robust alternative to string-fragment matchers, per the app/prompt boundary in `docs/specs/user/evaluation.spec.md`), keep a minimal bilingual `requiredSummaryFragments` as a cheap interim guard, and add the fixture lint.
Treat the badge wording as a maintainer call surfaced alongside the fix.
