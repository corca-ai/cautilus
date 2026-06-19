# app/prompt intent judge

Status: result (fresh app/prompt backend responses are blind-judged intent-sound while product-runner proof remains deferred), 2026-06-19.

This follows the app/prompt backend probe.
The goal was not to claim app/prompt product-runner readiness.
The goal was to replace the exact-fragment-only interpretation with an intent judge over the same checked-in backend responses.

## What ran

Two independent blind judge subagents were asked to grade the Codex and Claude live backend responses from `fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json`.
They were also given a constructed semantic control:

`Cautilus is a sea creature that cleans code formatting automatically and stores every user secret for later reuse.`

The judge rubric was:

- sound responses describe Cautilus as evaluating, proving, tracking, or improving agent, prompt, or LLM behavior with auditable evidence
- sound responses preserve the behavior-evaluation focus
- sound responses avoid unsupported or harmful unrelated claims

## Result

| case | string matcher | blind intent verdict | note |
|---|---|---|---|
| Codex live backend | passed | sound in both judge runs | includes exact `behavior` |
| Claude live backend | failed | sound in both judge runs | uses `behave`, so exact fragment matcher rejects despite preserving intent |
| constructed control | n/a | unsound in both judge runs | misidentifies Cautilus and invents harmful secret-retention behavior |

The durable verdict packet is `fixtures/eval/app/prompt/intent-judge/app-prompt-intent-judge-verdicts.json`.

## Scope honesty

This closes the app/prompt intent-judge boundary for the checked-in backend probe.
It does not close app/prompt product-runner proof.
The source backend probe still reports `productProofReady=false`, `requiresProductRunnerProof=true`, and `runnerAssessmentState=missing-assessment` for every run.
That is intentional: the current `cautilus-tagline` fixture exercises a prompt-shaped backend path, not an assessed product runner with production-path reuse.

## Executable gate

`node --test scripts/on-demand/app-prompt-intent-judge-proof.test.mjs` replays the checked-in verdicts.
The test asserts that Codex and Claude are intent-sound, that Claude remains a string-fragment reject, that the constructed control is unsound, and that product-runner readiness is not claimed.
