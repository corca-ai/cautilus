# HITL Scratchpad: hitl-20260509-053911

- Updated: 2026-05-09T13:20:22+00:00
- Target: docs/specs/index.spec.md
- Base Ref: main
- Scope: specs-index-restart
- Apply Mode: explicit-after-all-chunks

## Agreements

- For `specs-index-entry-map`, revise the top-level Evidence State description so it does not imply proof is centralized away from individual Specdown pages.

## Open Questions

- Reviewer question for `specs-index-entry-map`: Evidence State should not replace self-contained Specdown evidence on each spec page. Clarify whether the top-level index should say each spec owns local proof while Evidence State is only the cross-spec summary for selected, stale, and open evidence.
- Reviewer follow-up for `specs-index-entry-map`: The top-level description still does not make clear what Evidence State contains. Include concrete examples or actual current data.
- Reviewer challenge for `specs-index-entry-map`: The reviewer is not yet convinced Evidence State is needed at all because each spec could carry its own proof. The response must justify the page as a cross-spec status board, not as duplicate proof storage.
- Full-target review issue: The accepted text named `gap.optimize-held-out-cycle`; the reviewer flagged that this would become stale when the gap closes. Replace transient gap id with stable evidence-state categories.

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

  1. Start with User Workflow (`docs/specs/user/index.spec.md`) to see what Cautilus helps a user do.
  2. Read Maintainer View (`docs/specs/maintainer/index.spec.md`) to see which contracts, fixtures, and evidence routes keep those workflows true.
  3. Use Promise Model (`docs/specs/model/index.spec.md`) when you need the compact map of names, keys, and links.
  4. Use Shared Concerns (`docs/specs/concerns/index.spec.md`) when checking reviewability, evidence visibility, ownership, vocabulary, or packet freshness across workflows.
  5. Use Evidence State (`docs/specs/proof/index.spec.md`) to see the product-wide proof status without rereading every spec, including expensive evidence selected instead of rerun, stale evidence that needs refresh, and proof gaps that remain open.

  Each spec page should still carry its own local proof or visible proof gap.
  Evidence State summarizes cross-spec status; it does not replace the proof owned by each spec.
  </md>
- Verification: Working-text rewrite only; target file not edited yet.
- Review Result: accepted, then refined during full-target review to avoid naming a transient gap id in the top-level index.

## Accepted Working Text

- Chunk ID: specs-index-entry-map
- Source Anchor: docs/specs/index.spec.md:1-37
- Accepted At: 2026-05-09T10:51:42+00:00
- Text:
  <md>
  ## Reading Path

  1. Start with User Workflow (`docs/specs/user/index.spec.md`) to see what Cautilus helps a user do.
  2. Read Maintainer View (`docs/specs/maintainer/index.spec.md`) to see which contracts, fixtures, and evidence routes keep those workflows true.
  3. Use Promise Model (`docs/specs/model/index.spec.md`) when you need the compact map of names, keys, and links.
  4. Use Shared Concerns (`docs/specs/concerns/index.spec.md`) when checking reviewability, evidence visibility, ownership, vocabulary, or packet freshness across workflows.
  5. Use Evidence State (`docs/specs/proof/index.spec.md`) to see the product-wide proof status without rereading every spec, including expensive evidence selected instead of rerun, stale evidence that needs refresh, and proof gaps that remain open.

  Each spec page should still carry its own local proof or visible proof gap.
  Evidence State summarizes cross-spec status; it does not replace the proof owned by each spec.
  </md>

## Full Target Review

- Status: accepted
- Applied At: 2026-05-09T12:19:56+00:00
- Refined At: 2026-05-09T13:18:14+00:00
- Accepted At: 2026-05-09T13:20:22+00:00
- Applied Target: docs/specs/index.spec.md
- Review Result: accepted after replacing transient gap id with stable evidence-state categories.
