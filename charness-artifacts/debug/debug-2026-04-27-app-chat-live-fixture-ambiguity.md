# Debug Review: app chat live fixture ambiguity
Date: 2026-04-27

## Problem

`npm run dogfood:app-chat:live` executed the app/chat runner successfully, but the final evaluation returned `recommendation=reject`.
The failing summary said `First-touch greeting names cautilus final response did not contain the expected fragment under openai/gpt-5.4-mini.`

## Correct Behavior

Given the checked-in app/chat fixture claims to test whether the onboarding response names Cautilus, when the live Codex messaging runner executes the fixture, then the fixture prompt should actually ask about Cautilus and the expected fragment should match the product name the prompt requests.

## Observed Facts

- `npm run dogfood:app-prompt:live` passed with `recommendation=accept-now`.
- `npm run dogfood:app-chat:live` produced a valid `cautilus.app_chat_evaluation_inputs.v1` packet through the new runner.
- The live final text was `Run the onboarding command or open the app, then follow the first prompt to connect your workspace and start.`
- The fixture expected the fragment `cautilus`, but the user message only said `I just installed this tool`.
- The system prompt used lowercase `cautilus` and did not explicitly require naming the product.

## Reproduction

```bash
npm run dogfood:app-chat:live
sed -n '1,160p' artifacts/self-dogfood/app-chat-live/latest/eval-summary.json
```

Before the fix, the command completed but the summary recommendation was `reject`.

## Candidate Causes

- The runner may have dropped the system prompt or message history before calling Codex.
- The evaluator may have used case-sensitive matching that made a valid `Cautilus` response fail.
- The fixture may have been ambiguous: its display name and expected fragment required naming Cautilus, but its user input did not.

## Hypothesis

If the fixture user message explicitly says `I just installed Cautilus` and the system prompt asks the assistant to name Cautilus directly, then the live Codex response should include the expected fragment and the same app/chat runtime path should return `accept-now`.

## Verification

Updated `fixtures/eval/app/chat/cautilus-onboarding-greeting.fixture.json` so the system prompt and user message match the expected behavior.
The expected fragment is now `Cautilus`.

## Root Cause

The fixture encoded a stronger expectation than its prompt justified.
The live model answered the generic wording reasonably, so the evaluator rejected the run because the product name was not present.

## Seam Risk

- Interrupt ID: app-chat-live-fixture-ambiguity
- Risk Class: none
- Seam: app/chat fixture wording to live model behavior evidence
- Disproving Observation: a live run produced a valid onboarding answer that failed only because the fixture had not asked for the product name it expected
- What Local Reasoning Cannot Prove: whether future app fixtures encode expectations that are not plainly requested by their prompts
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep fixture expected fragments directly grounded in the system prompt or user input.
When a fixture display name says a response must name a product, include the product name in the user turn or make the system prompt explicit.
