# Debug Review
Date: 2026-07-11

## Problem

Both Go and Node review-prompt renderers silently omit a declared consumer prompt when its recorded file exists but the file read fails, shrinking behavior-steering evaluator input without an error.

## Correct Behavior

Given a `defaultPromptFile` record with `exists: true`, when the renderer cannot read its `absolutePath`, then rendering must fail with a path-bearing error; omission is valid only when the record has no path, records `exists: false`, or the readable file is empty.

## Observed Facts

- Go `RenderReviewPrompt` discards `maybeReadConsumerPrompt` errors inside `err == nil && ...`.
- Node `maybeReadConsumerPrompt` catches every `readFileSync` error and returns an empty addendum.
- Both renderers include a readable non-empty consumer prompt in existing happy-path tests.
- A stale file record can occur when prompt input is captured before a file is moved, removed, or loses permissions.

## Reproduction

- Node: call `renderReviewPrompt` with `defaultPromptFile.absolutePath=/definitely/missing/cautilus.prompt.md` and `exists=true`; current code returns a prompt without the addendum instead of throwing.
- Go: add a focused test with the same stale record; current `RenderReviewPrompt` returns `nil` error and omits the addendum.

## Candidate Causes

- Missing consumer prompts were intentionally treated as optional regardless of the captured `exists` state.
- The renderer assumed the file record and filesystem could not diverge between capture and render.
- Error suppression was added to keep rendering resilient but erased a behavior-steering dependency.
- Go and Node implementations copied the same fail-open policy independently.

## Hypothesis

- Falsifiable claim: both renderers confuse an absent optional record with a failed declared dependency; stale-record tests will succeed silently on the old code, and propagating read errors only for `exists:true` will make them fail closed while absent/readable cases remain unchanged | disconfirmer: run focused stale-record tests against both current implementations before repair.

## Verification

- confirmed — focused Go and Node tests both failed on the old implementations because rendering returned successfully instead of surfacing the missing declared prompt.

## Root Cause

Both renderers collapsed two distinct states—an optional prompt record that is absent and a prompt record declared present whose read fails—into the same empty-addendum result.
That fail-open policy discarded a behavior-steering dependency and its diagnostic path.

## Invariant Proof

- Invariant: a consumer prompt declared present is either included as readable text after the existing whitespace trim or causes rendering to fail with its path.
- Producer Proof: focused stale-record tests failed against both old suppression branches; readable prompt inclusion remains covered by existing tests.
- Final-Consumer Proof: the repaired Go renderer returns a path-bearing error, the exported Node renderer throws a path-bearing error, and Node `main` already maps thrown renderer errors to process failure.
- Interface-Shape Sibling Scan: both language implementations own the same prompt-input contract and must carry the same absent-versus-unreadable distinction.
- Non-Claims: the fix does not validate prompt semantics, file freshness after a successful read, or provider use of the rendered prompt.

## Detection Gap

- Go/Node review prompt tests | happy-path prompt inclusion did not exercise a captured-present/file-missing race | add one stale-record failure case per implementation and retain existing absent/readable proof.

## Sibling Search

- Mental model: optional at capture time means read failures remain optional after the record declares the dependency present.
- same layer axis: Go `maybeReadConsumerPrompt` and Node `maybeReadConsumerPrompt` | decision: same bug, fix now | proof: static branches plus focused stale-record reproductions.
- abstraction up axis: packet file records consumed after capture | decision: same class, diagnostic-only for this slice | proof: artifact/report file readers already propagate errors; no action needed because only consumer prompt readers suppress declared-file failures.
- specialization down axis: CLI renderer entrypoints | decision: same bug, fix now | proof: Go returns an error channel and Node `main` catches thrown errors, so producer propagation reaches the operator boundary.
- mental-model axis: truly absent or empty optional prompts | decision: intentional plain-text or non-rendering boundary | proof: missing path, `exists:false`, and readable empty files do not declare behavior text to preserve.
- cross-file: `internal/runtime/review.go` and `scripts/agent-runtime/render-review-prompt.mjs` are the two contract implementations.

## Seam Risk

- Interrupt ID: consumer-prompt-read-failure-suppression
- Risk Class: none
- Seam: captured prompt file record to rendered evaluator prompt
- Disproving Observation: either stale-record renderer already returns an error, or a declared missing prompt is intentionally documented as optional after capture.
- What Local Reasoning Cannot Prove: provider behavior after receiving the rendered prompt.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Make absent and unreadable states distinct in both renderers, prove language parity with focused failure cases, and reuse existing error channels instead of adding a new gate.
