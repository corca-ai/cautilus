# improve held-out orientation: language-robust, live-confirmed

Date: 2026-06-20.
Spec: `charness-artifacts/spec/2026-06-20-improve-orientation-summary-language-robustness.md`.
Sibling of the landed skill-surface fix (`charness-artifacts/eval-trust/2026-06-20-skill-orientation-grader-language-robust-live-confirmed.md`).

## What landed

The bounded-improvement held-out fixture `fixtures/eval/dev/skill/improve/skill-orientation-improve.fixture.json` graded its no-input orientation summary with English `requiredSummaryFragments: ["adapter", "claim", "branch"]`.
Those English-literal matchers brittle-fail a behaviorally correct recovered candidate that summarizes in this repo's mandated Korean ("분기" ≠ "branch"), which can break `proof:improve:live`'s candidate-recovers invariant.
The fix removes the brittle matcher and proves the loop still holds, without adding a replay-only judge layer the live loop cannot use.

This was the right-sized fix (`①b`) chosen after the maintainer picked the reasoning-judge direction over a bilingual matcher, then chose the smaller fix once the live-loop trace showed the judge cannot run in the live improve loop.

## Why the fix is sound (the trace)

- Seed-FAIL is carried by the language-independent forbidden command guard.
  The refreshed seed capture fails with `command log included forbidden fragment: doctor --repo-root . --next-action; command log included forbidden fragment: --next-action` and no summary-fragment failure — the command guards alone discriminate the degraded seed after the English matcher was removed.
- The brittleness bit only candidate-RECOVER; removing the matcher makes a Korean recovered candidate countable again.
- The reasoning judge cannot run in the live improve loop: the enricher (`scripts/agent-runtime/enrich-eval-with-reasoning-judge.mjs:85`) fails closed when no checked-in verdict matches, and the live loop grades fresh novel candidates with no pre-captured verdict.
  So the live loop's candidate scoring stays command-guard-only with or without a judge — the same posture as the proven skill-surface live proof.
- The backend-asymmetry landmine is already closed: `scripts/agent-runtime/skill-test-claude-backend.mjs:188` applies `applyObservationExpectations` with `extractClaudeCommandText`, so the command guards are load-bearing on the claude backend the live proof uses.

## Live proof

`proof:improve:live` re-run under the fragment-free fixture (codex mutation + claude candidate eval, Sonnet-delegated), EXIT 0:
seed held-out score 0, winning candidate `g1-1-codex-exec` held-out score 100, mutationInvocationCount 1, candidateCount 2.
Capture checked in under `fixtures/eval/dev/skill/improve/live/`; the deterministic replay `scripts/on-demand/improve-live-proof.test.mjs` stays green (7/7).
`npm run verify` (all phases, coverage floor OK) and `npm run test:on-demand` are green.

## Regression guard

The orientation lint guard (`scripts/check-orientation-summary-language-robust.mjs`) now also covers this held-out case via `HELD_OUT_ORIENTATION_PROMPT_SIGNATURE` (the held-out prompt withholds the explicit orientation recipe and so cannot carry `ORIENTATION_PROMPT_SIGNATURE`), so a brittle English summary matcher cannot creep back onto the improve held-out surface.
Unit-covered both detection and the cleaned-fixture pass.

## Deferred (tracked, not a silent gap)

`①a` replay-parity judge convergence on the improve surface (a co-located calibration `dev-skill-improve-orientation`, a surface-clean control, blind verdicts, a `self-dogfood-improve-judge-eval` adapter, the registry-test scan extended to `dev/skill/improve`, and an on-demand dogfood test).
Deferred because the judge is replay-only and cannot grade live novel candidates, so it adds replay-only semantic parity for a behavior already judge-proven on the skill surface.
Pick it up if strict per-surface replay parity is wanted; the engine compositing it would need already landed in `internal/runtime/skill_evaluation.go`.

## Badge

The apex `Bounded Improvement` badge stays `proven` and is now language-robust; no badge flip and no Proof Debt change.
