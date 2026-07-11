# Second Autonomous Repository Improvement Retro
Date: 2026-07-11

## Mode

session

## Context

The user requested another autonomous Cautilus improvement pass across bugs, test speed, and code quality without push.
This retro binds to goal `second-autonomous-repo-improvement`.

## Evidence Summary

- The minimal reproduction showed that Go byte slicing could emit invalid UTF-8 and JSON could replace the split code point with `U+FFFD`.
- Commit `c72891f5` made Go and Node review excerpts code-point-safe and added cross-language boundary and scenario-to-render tests.
- Focused coverage measured `BuildReviewPromptInputFromScenario` at 73.3% and `RenderReviewPrompt` at 85.4%.
- `npm run verify` passed in 60.38s and `npm run hooks:check` reported the hooks ready.
- Current runtime evidence identified `lint · specs` as the dominant stable phase, but did not establish a proof-preserving repo-owned optimization seam.

## Waste

The broad quality inventory was intentional exploration, not waste, because the user explicitly requested multiple improvement dimensions.
The reducible cost was closeout bookkeeping after the implementation was already stable: Slice Plan/Log numbering drift caused one avoidable reviewer follow-up.
That instance was corrected, but no low-noise general guard was established and this retro does not count the correction as applied workflow improvement.
The 60.38-second final verify is a necessary broad gate sample, while its cold Go/race variance and the stable specdown cost remain measured gate-baseline signals rather than proof of duplicated work.

## Critical Decisions

- Fix both Go and Node producers in one slice because the review packet contract is cross-language even though only the Go reproduction emitted invalid UTF-8.
- Define the existing “chars” wording as Unicode code points and explicitly avoid claiming grapheme, token, or byte-budget preservation.
- Defer test-speed changes because specdown run and strict trace carry distinct proof and no safe shared-artifact, cache, or parallelization seam was established.
- Add an observable scenario-to-render test instead of a whole-prompt snapshot or percentage-driven test expansion.

## Expert Counterfactuals

- An Ousterhout-style complexity lens would make the semantic unit explicit at the narrowest shared boundary, which would have led directly from the “chars” label to code-point fixtures in both implementations.
- A Klein-style premortem would ask how a locally correct Go fix could still fail in production; the answer is JavaScript's unpaired-surrogate state, which the parity review caught with `toWellFormed()` and a regression test.

## Sibling Search

- same layer: Go and Node review excerpt producers | decision: same waste, fix now | proof: both implementations now share code-point fixtures and focused tests.
- abstraction up: review packet schema and rendered prompt wording | decision: intentional boundary | proof: existing fields and “chars” wording remain internally consistent without a schema change.
- specialization down: report-packet and scenario-packet entry points | decision: diagnostic-only | proof: both reuse the repaired helper; the scenario path has direct behavior proof while report-packet coverage remains advisory.
- mental-model siblings: grapheme, token, and byte prompt budgets | decision: intentional boundary | proof: no current product contract claims those units.

## Next Improvements

- capability: applied — code-point semantics and malformed JavaScript-string handling now have deterministic cross-language tests.

## Persisted

Persisted: yes: charness-artifacts/retro/2026-07-11-second-autonomous-repo-improvement-retro.md

Packet Consumed: n/a (no adapter sections)
