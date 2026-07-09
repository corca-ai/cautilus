# Session Retro
Date: 2026-07-09

## Mode

session

## Context

This retro reviews the goal `fourth-five-autonomous-improvement-cycles`.
The run completed five additional local Cautilus improvement cycles across claim status review projection, generated drift CLI parsing, review-input summary schema validation, canonical spec index parsing, and Node standing test script parity.

## Evidence Summary

- Goal artifact: `charness-artifacts/goals/2026-07-09-fourth-five-autonomous-improvement-cycles.md`.
- Commits before closeout: `3c78d241`, `9a218a2d`, `e7377d35`, and `cd73da76`.
- Final closeout commit carries Cycle 5, debug RCA, retro, host probe, disposition review, and goal completion.
- Broad gates passed after RCA fix: `npm run verify`, `npm run hooks:check`, and `npm run generated:drift:check`.
- Fresh-eye reviewers closed all five cycles; Cycle 1, Cycle 4, and Cycle 5 received concrete findings that were fixed before commit.
- Debug artifact: `charness-artifacts/debug/latest.md` records the final verify failure RCA for stale reviewable artifact proof-marker metadata.

## Waste

The largest waste was Cycle 1's initial mental model.
I first treated active review-result projection as "fields still equal the current claim packet" instead of "review update identity still targets a current claim."
Fresh-eye review caught this twice, and the final projection module now matches `apply-current-review-results` identity semantics, including display-id drift and evidence-ref rewrite behavior.

The second waste was a missed sibling surface in Cycle 1.
I updated renderer wording and report tests, but did not update `docs/contracts/reviewable-artifact-projections.json`.
The broad `npm run verify` caught the stale proof marker later, forcing a debug interruption near closeout.

The third waste was Cycle 5's first test guard being too weak.
It checked only direct `scripts/on-demand/` glob prefixes, so a broader recursive glob could still include on-demand tests while preserving script parity.
Fresh-eye review caught the gap and the test now locks exact standing and on-demand glob sets.

## Critical Decisions

- Kept each cycle local and committed; no push, release, remote CI, or live proof was attempted.
- Treated generated reports, matrix metadata, and readable packet summaries as product behavior, not incidental documentation.
- Accepted a broader generated claim status report diff in Cycle 1 because it made report projection consistent with the application/replay identity contract.
- Used debug rather than ad hoc patching when final `npm run verify` failed, so the proof-marker drift has durable RCA memory.

## Expert Counterfactuals

- Invariant-first lens: before changing a renderer proof sentence, ask which registry or matrix consumes that sentence as executable proof.
  That would have found the reviewable artifact projection matrix during Cycle 1 instead of during final verify.
- Replay-contract lens: when a projection summarizes replay/application state, compare it directly with the replay identity contract before writing field-level filters.
  That would have avoided Cycle 1's two rework rounds.

## Sibling Search

- Renderer wording siblings: applied in-session by updating `docs/contracts/reviewable-artifact-projections.json` and validating `reviewable-artifact-projections.test.mjs`.
- CLI repeated-option siblings: applied in-session for `check-generated-artifact-drift --path`; broader parser normalization was intentionally not generalized without evidence.
- Test-script parity siblings: applied in-session by locking standing and on-demand Node test globs.

## Next Improvements

- workflow: applied: include registry/matrix proof-marker tests when changing operator-facing renderer marker text.
- workflow: applied: compare projection semantics against the producer/replay contract before adding filters.
- quality: applied: exact allowlist tests now guard standing Node test scripts from accidentally including on-demand tests.

## Persisted

Persisted: yes: charness-artifacts/retro/2026-07-09-fourth-five-autonomous-improvement-cycles-retro.md
