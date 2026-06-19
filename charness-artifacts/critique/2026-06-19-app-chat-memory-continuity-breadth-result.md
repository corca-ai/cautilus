# App Chat Memory Continuity Breadth Critique
Date: 2026-06-19

## Execution

Subagent critique completed for the app/chat memory-continuity breadth slice.

## Fresh-Eye Satisfaction

parent-delegated

## Packet Consumed

`charness-artifacts/critique/2026-06-19-080627-packet.md`

## Target

`code-critique`

## Change

Review of the private external chat product replay fixture expansion, blind Sonnet memory-continuity verdicts, app/chat proof tests, user/apex spec sync, handoff refresh, and memory-continuity evidence artifact.

## Angles

- Problem framing, proof honesty, and spec/truth-surface synchronization
- Runtime test coupling and fixture data integrity
- Counterweight triage for remaining concerns

## Findings

- The original test selected the secret sound verdict by `kind === "real-external-capture"`.
  After adding the memory-continuity sound verdict, that could mix the first secret pass with the second memory pass while still passing the independent-sound assertion.
  Fixed by selecting secret, artifact, and memory verdicts by `caseId`.
- The secret sound verdicts did not carry `observedResponse`, so only the new memory verdict was bound to the captured final response.
  Fixed by adding `observedResponse` to both secret verdict files and asserting it matches the capture.
- The memory capture lookup dereferenced the `.find(...)` result without an existence assertion.
  Fixed by adding a shared `findEvaluation` helper that asserts the expected capture exists.
- The evidence artifact could be read as proving isolated persistent-memory retrieval.
  Fixed by narrowing the wording to remembered-location continuity after a real memory write and explicitly deferring cross-session or context-withheld memory proof.
- The spec projection was strengthened with `caseId` / `evaluationId` rows so the app/chat proof does not rely only on array position.

## Counterweight Triage

### Act Before Ship

- strong: fix the `real-external-capture` selector ambiguity and bind secret verdicts to the captured observed response.
  Done.

### Bundle Anyway

- strong: add symmetric `evaluationId` / `caseId` projection rows for the memory proof.
  Done.

### Over-Worry

- moderate: redesigning the verdict schema because there are multiple real captures is not needed in this slice.
  The deterministic test now uses `caseId` plus `observedResponse` equality.

### Valid but Defer

- moderate: owner-confirmed direct scenario metadata could become structured fixture metadata in a later auditability slice.
- moderate: generic normalization proof, live app-agent rerun, and cross-session durable-memory retrieval proof belong to separate slices.

## Deliberately Not Doing

This slice does not close app/chat liveness, prove isolated persistent-memory causality, normalize the memory scenario through the generic chatbot normalizer, or close app/prompt proof debt.

## Next Move

Run the full repo gates, commit the source/proof/critique changes, refresh claims because claim-source specs changed, and continue with clarification-first breadth, app/chat liveness, or app/prompt proof debt.
