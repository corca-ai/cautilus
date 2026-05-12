# HITL Scratchpad: hitl-20260509-161518

- Updated: 2026-05-09T16:35:11+00:00
- Target: docs/specs/user/index.spec.md
- Base Ref: main
- Scope: issue-33-user-workflow-closeout
- Apply Mode: explicit-after-all-chunks

## Agreements

- Propagated accepted HITL rules from previous issue #33 checkpoints: show rewritten chunk after edit, full target readback after chunks, and agent assessment before human decision.

## Open Questions

- Reviewer question for `user-workflow-index`: Should the user-facing workflow index mention source-bound review feedback and reusable learning evidence directly, or keep that concern behind Reviewable Artifacts, Evidence Gaps, and Shared Concerns?
- Applied decision for `user-workflow-index`: add an Agent-Human Resumability concern link and include lightweight reusable-learning wording without exposing packet internals or disposition vocabulary.

## Pre-Edit Constraints
- Accepted Rules: [show-rewritten-chunk-after-edit, full-target-readback-after-chunks, agent-assessment-before-human-decision]
- Active Rules Applied: show-rewritten-chunk-after-edit, full-target-readback-after-chunks, agent-assessment-before-human-decision
- Target/Cursor Checked: true; Target/Cursor Check Result: target=docs/specs/user/index.spec.md; chunk=user-workflow-index; queue item=user-workflow-index; lines=1-40; queue_epoch=1

## Applied Rewrite Review

- Status: inactive until a reviewer-requested rewrite is applied
- Decision Needed: Decide whether the rewritten chunk is accepted or needs another revision.
- Required Surface: applied chunk excerpt with line or hunk anchor when possible, surrounding context, and secondary verification results if available.
- Pending Chunk ID:
- Source Anchor:
- Applied Excerpt:
- Verification: Applied directly under broad closeout instruction; target file edited.
- Review Result: accepted and applied. The user-facing index links Agent-Human Resumability without making learning evidence a primary user-facing concept.

## Accepted Working Text

- Chunk ID: user-workflow-index
- Source Anchor: docs/specs/user/index.spec.md:1-40
- Accepted At: 2026-05-09T16:33:49+00:00
- Text:
  <md>
  - [Agent-Human Resumability](../../../../docs/specs/rules/agent-human-resumability.spec.md): workflow packets, next actions, and source-bound review feedback should let a human or agent resume without relying on chat memory, and can become reusable learning evidence about which discovery or evaluation work was useful.
  </md>

## Full Target Review

- Status: accepted
- Applied At: 2026-05-09T16:33:49+00:00
- Refined At: 2026-05-09T16:35:11+00:00
- Accepted At: 2026-05-09T16:35:11+00:00
- Applied Target: docs/specs/user/index.spec.md
- Review Result: accepted under broad closeout instruction; full target remains user-facing and links the relevant shared concern while naming reusable learning evidence in lightweight language.
