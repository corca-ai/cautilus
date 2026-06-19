# Debug Review: app/prompt Claude live backend rejected a semantic tagline response
Date: 2026-06-19

## Problem

`./bin/cautilus evaluate fixture --repo-root . --adapter-name self-dogfood-app-prompt --runtime claude --output-dir /tmp/cautilus-app-prompt-claude-probe` completed the live Claude backend call but returned `recommendation=reject`.

## Correct Behavior

Given an app/prompt fixture with `expected.finalText`, the current evaluator should pass only when the observed final text contains that exact fragment.
If a model gives a semantically close answer that does not contain the fragment, the evaluator should reject it and the proof docs should not treat that as product-ready app/prompt proof.

## Observed Facts

- Fixture runtime passed with `Fixture response includes behavior.`
- Codex live backend passed with `Cautilus is a workflow system for capturing, tracking, and proving intentful behavior with auditable evidence.`
- Claude live backend returned `Cautilus is a CLI-and-agent product that runs intent-first, auditable evaluations of how AI agents and prompts actually behave.`
- The Claude response includes `behave`, not the exact expected fragment `behavior`.
- The Claude summary records `productProofReady=false`, `requiresProductRunnerProof=true`, and `runnerAssessmentState=missing-assessment`.

## Reproduction

```bash
./bin/cautilus evaluate fixture --repo-root . --adapter-name self-dogfood-app-prompt --runtime claude --output-dir /tmp/cautilus-app-prompt-claude-probe
jq . /tmp/cautilus-app-prompt-claude-probe/eval-summary.json
```

## Candidate Causes

- The app/prompt evaluator intentionally uses exact substring matching for `expected.finalText`, and Claude did not emit the exact substring.
- The Claude model produced an objectively bad product description.
- The runner lost or altered the expected fragment.

## Hypothesis

If the reject is caused by exact substring matching, then the observed Claude response should be non-empty and semantically related to Cautilus while still lacking the exact string `behavior`.

## Verification

Confirmed.
The observed final text names Cautilus and describes intent-first, auditable evaluations, but it does not contain `behavior`.
The matcher code in `internal/runtime/app_prompt_evaluation.go` uses `strings.Contains(observed["finalText"], expected.finalText)`, so the reject is expected under the current contract.

## Root Cause

The app/prompt fixture is evaluated by a brittle string-fragment matcher.
That matcher is useful as a deterministic smoke, but it is not an intent judge.
The Claude response exposed the boundary by using a semantically close verb form instead of the exact expected noun.

## Invariant Proof

- Invariant: app/prompt proof must distinguish deterministic fixture/messaging-backend execution from product-runner or intent-judge proof.
- Producer Proof: the live Claude backend produced a valid `cautilus.app_prompt_evaluation_inputs.v1` packet.
- Final-Consumer Proof: `BuildAppPromptEvaluationSummary` rejected it because the exact expected fragment was absent.
- Interface-Shape Sibling Scan: app/chat has a blind intent-judge replay; app/prompt does not yet.
- Non-Claims: this does not prove Claude is worse than Codex, and it does not prove app/prompt product behavior is bad.

## Detection Gap

- app/prompt proof docs | prior docs described app/prompt mostly as a saved evidence projection and did not surface the string-fragment matcher boundary | add a durable backend probe and spec rows that name Codex pass, Claude matcher reject, and `productProofReady=false`

## Sibling Search

- Mental model: a one-line tagline fixture with a behavior fragment is a good enough app/prompt proof.
- app/chat sibling: app/chat now uses a load-bearing blind intent judge for replayed production behavior; decision: do not silently imply the same for app/prompt; proof: docs/spec update required.
- app/prompt fixture sibling: changing the expected fragment to make Claude pass would hide the useful boundary; decision: preserve the reject as evidence; proof: checked-in backend probe.
- cross-file: docs/specs/user/evaluation.spec.md and docs/specs/index.spec.md need the boundary so the proof debt is not misread.

## Seam Risk

- Interrupt ID: app-prompt-string-fragment-boundary
- Risk Class: none
- Seam: deterministic string matcher versus semantic app/prompt intent
- Disproving Observation: Claude's semantically close response rejected because it lacked the exact fragment
- What Local Reasoning Cannot Prove: whether an app/prompt intent judge should share the app/chat judge contract or use a smaller prompt-specific rubric
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: docs/internal/handoff.md

## Prevention

Record the fresh backend probe and update docs to name the remaining proof boundary.
Do not change the expected fragment just to force a green live Claude run in this slice.
