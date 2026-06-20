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

## Resolution (decided + landed, 2026-06-20)

Maintainer decided the grader direction in-session: the orientation summary's semantic check is owned by the language-robust reasoning-soundness judge, which ALREADY exists, already grades the captured Korean orientation `sound` blind, and already replays a recorded verdict.
The interim bilingual `requiredSummaryFragments` was REJECTED (a band-aid on the string matcher; the only place a Korean summary meets the matcher is a live run, which already pays for the LLM the judge needs, so the judge covers exactly that case and bilingual is unnecessary).

Decision 1 — grader direction: remove the brittle English `requiredSummaryFragments` from the no-input orientation case (and the constructed control that shares the prompt); keep `requiredCommandFragments` (the read-only `doctor status` packet ran) and `forbiddenSummaryFragments`/`forbiddenCommandFragments` (no forbidden escalation) as the language-INDEPENDENT packet/escalation guards; the semantic "did it summarize the required state" dimension stays with the reasoning judge.
Decision 2 — badge: keep "Behavior Evaluation — proven (live-replayed)". The deterministic-replay + always-sound-judge-fails gate keeps `audit:surface:check` honest, and the fix removes the only failing dimension of the opt-in live re-run, so no Proof Debt is warranted; the opt-in paid live confirmation is offered as a closing step, not a blocker.

Residual sibling (deferred, surfaced by the fix-slice critique): `fixtures/eval/dev/skill/improve/skill-orientation-improve.fixture.json` carries the same English `requiredSummaryFragments: ["adapter", "claim", "branch"]` on a no-input orientation summary, but its remedy differs and it is out of this slice's scope.
Two facts make it distinct: its prompt deliberately WITHHOLDS the orientation recipe (a held-out test that the agent follows SKILL.md without being told), and that surface has NO reasoning-soundness judge backstop — so the fix there is NOT removal (which would leave zero orientation coverage) but language-robustification (bilingual fragments or a judge on the improve surface).
It is latent, not actively failing (the recent `proof:improve:live` re-run passed), and it belongs to the `Bounded Improvement` live-proof pillar.
The new lint intentionally does NOT flag it (its prompt does not match the no-input orientation signature, by design).
Follow-up: `improve-orientation-summary-language-robust`.

Landed:
- Removed `requiredSummaryFragments` from the orientation case in `skill-orientation-live-cases.json`, `skill-judge-eval-cases.json` (orientation + control), `cautilus-skill-routing.fixture.json`, `internal-runner-cases.json`.
- New lint `scripts/check-orientation-summary-language-robust.mjs` (+ test), wired into `npm run lint` as `lint:skill-orientation-grader`, flags re-introduction of `requiredSummaryFragments` on any case matching the no-input orientation prompt signature (follow-up `skill-orientation-summary-language-robust-grader` is now satisfied).
- `scripts/on-demand/skill-orientation-live-proof.mjs` header/outcome comments made honest: the live re-run is language-independent (invocation + `doctor status` ran + no escalation); the summary's semantic soundness is carried by the reasoning judge.
- Gates green: new lint test, runner tests, live-proof replay, reasoning-judge test, convergence dogfood, `lint:specs`, full node suite, and `audit:surface:check` (honest, 7/7).
- The generic Go engine/runtime is unchanged (no repo-specific judge logic moved); the captures, recorded verdicts, and calibration are byte-unchanged.
