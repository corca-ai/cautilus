# HITL Scratchpad: hitl-20260509-135850

- Updated: 2026-05-09T15:54:25+00:00
- Target: docs/specs/model/promise-ledger.spec.md
- Base Ref: main
- Scope: issue-33-promise-ledger-closeout
- Apply Mode: explicit-after-all-chunks

## Agreements

- Propagated accepted HITL rules from previous issue #33 checkpoints: show rewritten chunk after edit, full target readback after chunks, and agent assessment before human decision.

## Open Questions

- Reviewer question for `ledger-agent-human-resumability`: Should the Promise Ledger commitment for Agent-Human Resumability include source-bound review feedback that can become reusable learning evidence?

## Pre-Edit Constraints
- Accepted Rules: [show-rewritten-chunk-after-edit, full-target-readback-after-chunks, agent-assessment-before-human-decision]
- Active Rules Applied: show-rewritten-chunk-after-edit, full-target-readback-after-chunks, agent-assessment-before-human-decision
- Target/Cursor Checked: true; Target/Cursor Check Result: target=docs/specs/model/promise-ledger.spec.md; chunk=ledger-agent-human-resumability; queue item=ledger-agent-human-resumability; lines=27-37; queue_epoch=1

## Applied Rewrite Review

- Status: inactive until a reviewer-requested rewrite is applied
- Decision Needed: Decide whether the rewritten chunk is accepted or needs another revision.
- Required Surface: applied chunk excerpt with line or hunk anchor when possible, surrounding context, and secondary verification results if available.
- Pending Chunk ID:
- Source Anchor:
- Applied Excerpt:
- Verification:
- Review Result: accepted pending apply. Reviewer accepted the narrowed commitment wording that keeps resumability and adds source-bound review feedback as reusable learning evidence.

## Accepted Working Text

- Chunk ID: ledger-agent-human-resumability
- Source Anchor: docs/specs/model/promise-ledger.spec.md:27-37
- Accepted At: 2026-05-09T15:12:18+00:00
- Text:
  <md>
  | [Agent-Human Resumability](../../../../docs/specs/concerns/agent-human-resumability.spec.md) | `concern.agent-human-resumability` | A human or agent can resume from durable packets, next actions, source refs, and source-bound review feedback that can become reusable learning evidence instead of chat memory. | [Readiness](../../../../docs/specs/user/doctor-readiness.spec.md), [Claim Discovery](../../../../docs/specs/user/claim-discovery.spec.md), [Host Ownership](../../../../docs/specs/user/ownership.spec.md) | [Binary And Skill Boundary](../../../../docs/specs/maintainer/binary-skill-boundary.spec.md), [Active Run And Workspace Lifecycle](../../../../docs/specs/maintainer/active-run-workspace.spec.md), [Reporting And Review Variants](../../../../docs/specs/maintainer/reporting-review-variants.spec.md) |
  </md>

## Full Target Review

- Status: accepted
- Applied At: 2026-05-09T15:52:21+00:00
- Accepted At: 2026-05-09T15:54:25+00:00
- Applied Target: docs/specs/model/promise-ledger.spec.md
- Review Result: accepted with Agent-Human Resumability commitment including source-bound review feedback as reusable learning evidence.
