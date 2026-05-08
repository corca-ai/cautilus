# HITL Scratchpad: hitl-20260508-222100

- Updated: 2026-05-08T22:21:00+00:00
- Target: docs/specs/index.spec.md
- Base Ref: main
- Scope: specs-index-restart
- Apply Mode: explicit-after-all-chunks

## Agreements

- User restarted HITL from `docs/specs/index.spec.md`.
- Review target is the top-level executable claim-spec report entry, not the user-facing or maintainer-facing sub-index yet.
- Do not edit the target during chunk review; collect feedback first.
- The first chunk is the full current `docs/specs/index.spec.md` file, lines 1-14.
- After a requested rewrite is applied, show the changed chunk text before advancing.
- After all chunks for this target are reviewed, show the full updated target before closing it.
- Before asking for human judgment on a HITL chunk, provide the agent's assessment, risks or gaps, and a non-binding recommended disposition.
- Charness issue https://github.com/corca-ai/charness/issues/123 tracks making this recommendation requirement explicit in the public HITL skill.

## Open Questions

- Should the top-level index remain a compact router, or should it state a stronger acceptance-story promise before linking to the user and maintainer views?
- Does the phrase "claim-spec report entry" help the intended reader, or is it too maintainer-facing for the first line of this surface?
- User asked why cross-cutting promises do not have separate docs.
  They do have user-facing pages at `docs/specs/user/reviewable-artifacts.spec.md` and `docs/specs/user/evidence-gaps.spec.md`; the top-level index currently hides that by linking only to the user and maintainer views.
- User is considering whether cross-cutting should become a separate view, or whether cross-cutting concerns should exist on both the user and maintainer sides.
  Current repo memory supports the second direction: cross-cutting stories stay visible, and maintainer side maps which invariants constrain which stories.
  If that direction holds, the phrase `Cross-cutting user stories such as ...` is too narrow.
- User later terminated HITL and asked for whole-structure rewrite with flexible expert-lens subagent review.
  Further spec changes belong to the normal spec/impl flow, not this HITL runtime.

## Pre-Edit Constraints
- Accepted Rules: show-rewritten-chunk-after-edit, full-target-readback-after-chunks, agent-assessment-before-human-decision
- Active Rules Applied: show-rewritten-chunk-after-edit, full-target-readback-after-chunks, agent-assessment-before-human-decision
- Target/Cursor Checked: true; Target/Cursor Check Result: target=docs/specs/index.spec.md; chunk=specs-index-entry-map; queue item=specs-index-entry-map; lines=1-14; queue_epoch=1

## Applied Rewrite Review

- Status: pending
- Decision Needed: Decide whether the rewritten chunk is accepted or needs another revision.
- Required Surface: applied chunk excerpt with line or hunk anchor when possible, surrounding context, and secondary verification results if available.
- Pending Chunk ID: specs-index-entry-map
- Source Anchor: docs/specs/index.spec.md:1-14
- Applied Excerpt:

```md
# Cautilus Claim Specs

This is the top-level entry for checking what `Cautilus` promises, how those promises are verified, and which maintainer-owned contracts keep the evidence current.

This report keeps the promise map readable:

- The user view explains what Cautilus promises and shows how those promises are checked.
- The maintainer view maps those promises to the contracts, adapters, fixtures, proof routes, and evidence gaps that maintainers must keep current.
- Cross-cutting concerns such as reviewable artifacts and evidence gaps appear across both views: the user view states what must stay visible, and the maintainer view maps the contracts and proof routes that keep those invariants current.

## Views

- [User View](user/index.spec.md)
- [Maintainer View](maintainer/index.spec.md)
```

- Verification: Checked `docs/specs/user/index.spec.md`, `docs/specs/user/doctor-readiness.spec.md`, `docs/specs/user/claim-discovery.spec.md`, `docs/specs/user/reviewable-artifacts.spec.md`, `docs/specs/user/evidence-gaps.spec.md`, `docs/specs/maintainer/index.spec.md`, and `docs/internal/working-patterns.md` for established vocabulary and cross-cutting policy.
- Review Result:
  HITL terminated by user before chunk review closed.

## Full Target Review

- Status: pending after all chunks and apply/stage boundary
- Decision Needed: Review the full updated target before accepting the target as complete.
