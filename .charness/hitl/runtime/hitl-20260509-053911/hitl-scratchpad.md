# HITL Scratchpad: hitl-20260509-053911

- Updated: 2026-05-09T05:39:11+00:00
- Target: docs/specs/index.spec.md
- Base Ref: main
- Scope: specs-index-restart
- Apply Mode: explicit-after-all-chunks

## Agreements

- For `specs-index-entry-map`, revise the top-level Evidence State description so it does not imply proof is centralized away from individual Specdown pages.

## Open Questions

- Reviewer question for `specs-index-entry-map`: Evidence State should not replace self-contained Specdown evidence on each spec page. Clarify whether the top-level index should say each spec owns local proof while Evidence State is only the cross-spec ledger for selected, stale, and open evidence.

## Pre-Edit Constraints
- Accepted Rules: [show-rewritten-chunk-after-edit, full-target-readback-after-chunks, agent-assessment-before-human-decision]
- Active Rules Applied: show-rewritten-chunk-after-edit, full-target-readback-after-chunks, agent-assessment-before-human-decision
- Target/Cursor Checked: true; Target/Cursor Check Result: target=docs/specs/index.spec.md; chunk=specs-index-entry-map; queue item=specs-index-entry-map; lines=1-37; queue_epoch=1

## Applied Rewrite Review

- Status: pending
- Decision Needed: Decide whether the rewritten chunk is accepted or needs another revision.
- Required Surface: applied chunk excerpt with line or hunk anchor when possible, surrounding context, and secondary verification results if available.
- Pending Chunk ID: specs-index-entry-map
- Source Anchor: docs/specs/index.spec.md:1-37
- Applied Excerpt:
  <md>
  ## Reading Path

  1. Start with the [User Workflow](user/index.spec.md) to see what Cautilus helps a user do.
  2. Read the [Maintainer View](maintainer/index.spec.md) to see which contracts, fixtures, and evidence routes keep those workflows true.
  3. Use the [Promise Model](model/index.spec.md) when you need the compact map of names, keys, and links.
  4. Use [Shared Concerns](concerns/index.spec.md) when checking reviewability, evidence visibility, ownership, vocabulary, or packet freshness across workflows.
  5. Use [Evidence State](proof/index.spec.md) as the cross-spec ledger for selected evidence, stale evidence, and open proof gaps.

  Each spec page should still carry its own local proof or visible proof gap.
  </md>
- Verification: Working-text rewrite only; target file not edited yet.
- Review Result:

## Full Target Review

- Status: pending after all chunks and apply/stage boundary
- Decision Needed: Review the full updated target before accepting the target as complete.
