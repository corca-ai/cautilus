# app/prompt backend probe

Status: result (fresh app/prompt backend probe records two passes and one matcher-boundary reject), 2026-06-19.

This follows the app/chat replay breadth work.
The goal was not to claim app/prompt product-runner readiness.
The goal was to replace a vague saved-bundle projection with a fresh, auditable backend probe and a sharper remaining-debt boundary.

## What ran

The checked-in app/prompt fixture is `fixtures/eval/app/prompt/cautilus-tagline.fixture.json`.
It asks: `Describe Cautilus in one short sentence.`
The expected fragment is `behavior`.

Three commands were run:

```bash
./bin/cautilus evaluate fixture --repo-root . --adapter-name self-dogfood-app-prompt --output-dir /tmp/cautilus-app-prompt-probe
./bin/cautilus evaluate fixture --repo-root . --adapter-name self-dogfood-app-prompt --runtime codex --output-dir /tmp/cautilus-app-prompt-codex-probe
./bin/cautilus evaluate fixture --repo-root . --adapter-name self-dogfood-app-prompt --runtime claude --output-dir /tmp/cautilus-app-prompt-claude-probe
```

## Result

| runtime | harness | recommendation | matcher result | proof boundary |
|---|---|---|---|---|
| fixture | fixture-backend | accept-now | passed | `fixture-smoke`, `productProofReady=false` |
| codex | codex_exec | accept-now | passed | `declared-eval-runner`, `productProofReady=false` |
| claude | claude_code | reject | failed | `declared-eval-runner`, `productProofReady=false` |

The Claude response was:

`Cautilus is a CLI-and-agent product that runs intent-first, auditable evaluations of how AI agents and prompts actually behave.`

That is a reasonable one-sentence Cautilus description, but it does not contain the exact fragment `behavior`.
The current app/prompt evaluator is a string-fragment matcher for `expected.finalText`, so it rejected the response.

## Scope honesty

This does not close app/prompt product-runner proof.
Every run still reports `productProofReady=false`, `requiresProductRunnerProof=true`, and `runnerAssessmentState=missing-assessment`.
It also does not add an app/prompt intent judge.
The useful learning is that app/prompt now has fresh backend evidence and a concrete reason the remaining proof debt should not be described only as an old saved bundle.

## Executable gate

`node --test scripts/on-demand/app-prompt-backend-proof.test.mjs` replays the checked-in capture at `fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json`.
The test asserts the fixture pass, Codex pass, Claude string-fragment reject, and the `productProofReady=false` boundary on all three runs.
