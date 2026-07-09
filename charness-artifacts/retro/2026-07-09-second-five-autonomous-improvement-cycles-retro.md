# Session Retro
Date: 2026-07-09

## Mode

session

## Context

This retro reviews the goal `second-five-autonomous-improvement-cycles`.
The run completed five additional local Cautilus improvement cycles across generated drift coverage, claim status rendering, evidence-state projections, doctor payload schema signaling, and workflow dependency pinning.

## Evidence Summary

- Goal artifact: `charness-artifacts/goals/2026-07-09-second-five-autonomous-improvement-cycles.md`.
- Commits: `13a31b8e`, `c7096eb0`, `f1f9bad7`, `8437f9af`, and `54443966`.
- Broad gates passed: `npm run verify`, `npm run hooks:check`, and `npm run generated:drift:check`.
- Debug memory updated for the generated drift fixture directory failure.
- Fresh-eye reviewers closed all five cycles; Cycle 2 received a SHOULD-FIX on rendering precedence and passed after revision.

## Waste

The first waste was allowing generated drift fixture setup to carry a second hand-maintained directory list.
That list immediately missed the new `.cautilus/specdown` path, causing an ENOENT failure before the test could exercise the intended guard.

The second waste was treating a validated nested `claimSummary` field as a consistency check without first making it the rendering source of truth.
Fresh-eye review caught the mismatch between validation and precedence, and the mixed-shape test now protects that boundary.

The third waste was noticing the claim-source refresh requirement only after the Cycle 4 spec edit.
The repo rule caught it and the refresh landed in the same slice, but future spec-source changes should pre-plan `npm run claims:refresh:all` before the first commit attempt.

## Critical Decisions

- Keep the second run local-only, with no push, release, remote CI, or live proof claims.
- Preserve five scoped improvement commits by amending closeout evidence into the fifth slice rather than adding a sixth improvement-shaped commit.
- Treat generated files and Charness artifacts as repo state when they carry proof or closeout context.
- Prefer small deterministic guards over broad rewrites: list-derived fixture setup, mixed-shape summary tests, bounded Markdown samples, additive schema versioning, and workflow policy tests.

## Expert Counterfactuals

- Engelbart system-improving lens: the better first move for Cycle 1 would have been to make the generated-artifact list the only fixture setup input before adding new paths.
  That would have converted a runtime setup failure into a structural non-issue.
- Decision-quality lens: after adding a validation check for nested packet data, ask which field downstream rendering should trust when legacy and nested shapes disagree.
  That disconfirmer would have found the Cycle 2 precedence gap before review.

## Sibling Search

- n/a — each transferable waste item was applied inside this run: Cycle 1 made fixture directories list-derived, Cycle 2 added mixed-shape precedence coverage, and Cycle 4 refreshed claim packets in the same slice that changed a claim source.

## Next Improvements

- workflow: applied: when editing `docs/specs/promises/*` or other claim sources, include `npm run claims:refresh:all` in the slice plan before closeout.
- workflow: applied: when a packet field is validated as source-of-truth, add a mixed-shape precedence test in the same slice.
- capability: applied: generated-artifact drift fixtures now derive parent directories from `DEFAULT_GENERATED_ARTIFACTS` instead of a copied checklist.

## Persisted

Persisted: yes: charness-artifacts/retro/2026-07-09-second-five-autonomous-improvement-cycles-retro.md
