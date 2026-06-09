# HITL Runtime Checkpoint

<!-- hitl-runtime-sync
session_id: hitl-20260609-052637
runtime_session_dir: .charness/hitl/runtime/hitl-20260609-052637
runtime_updated_at: 2026-06-09T06:10:07+00:00
target: fixtures/eval/dev/repo/reasoning-soundness-calibration.json
last_presented_chunk_id: case-2-sound-anchor-concise
queue_epoch: 1
queue_status: ready
accepted_rules_digest: 4f53cda18c2baa0c
queue_items_digest: de5bde12ba595dc1
queue_state_digest: 9eb5d3bacfe7bfd7
approval_state_digest: 378bceae8cce3a86
-->

- Synced At: 2026-06-09T06:10:10+00:00
- Synced From Session: `hitl-20260609-052637`
- Runtime Session Dir: `.charness/hitl/runtime/hitl-20260609-052637`
- Runtime Updated At: 2026-06-09T06:10:07+00:00

## Active Target

- Target: `fixtures/eval/dev/repo/reasoning-soundness-calibration.json`
- Status: `concluded_with_realignment`
- Last Presented Chunk ID: `case-2-sound-anchor-concise`
- Queue Epoch: `1`
- Queue Status: `ready`
- Explicit Apply Required: `True`
- Apply Mode: `explicit-after-all-chunks`

## Accepted Rules

- none

## Queue State

- Current Queue Order: `['case-1-sound-anchor-impl', 'case-2-sound-anchor-concise', 'case-3-sound-bug-context-debug', 'case-4-unsound-skip-bootstrap', 'case-5-unsound-cite-then-violate', 'case-6-unsound-right-route-wrong-reason']`
- Reviewed Item IDs: `['case-1-sound-anchor-impl']`
- Superseded Unreviewed Item IDs: `[]`

### Items

- case-1-sound-anchor-impl: reviewed calibration_verdict
- case-2-sound-anchor-concise: unreviewed calibration_verdict
- case-3-sound-bug-context-debug: unreviewed calibration_verdict
- case-4-unsound-skip-bootstrap: unreviewed calibration_verdict
- case-5-unsound-cite-then-violate: unreviewed calibration_verdict
- case-6-unsound-right-route-wrong-reason: unreviewed calibration_verdict
- full_target_review: pending_after_chunks full_target_review

## Next Chunk To Present

- `case-1-sound-anchor-impl`

## Approval Boundaries

- Applied Rewrite Review Status: `inactive`
- Full Target Review Status: `pending_after_chunks`
- Target/Cursor Checked: `False`
- Target/Cursor Check Result: ``

## Runtime Links

- State: `.charness/hitl/runtime/hitl-20260609-052637/state.yaml`
- Queue: `.charness/hitl/runtime/hitl-20260609-052637/queue.json`
- Rules: `.charness/hitl/runtime/hitl-20260609-052637/rules.yaml`
- Scratchpad: `.charness/hitl/runtime/hitl-20260609-052637/hitl-scratchpad.md`
- Events: `.charness/hitl/runtime/hitl-20260609-052637/events.log`
- Durable Artifact: `charness-artifacts/hitl/latest.md`
