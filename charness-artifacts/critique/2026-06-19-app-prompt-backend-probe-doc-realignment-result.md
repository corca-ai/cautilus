# App Prompt Backend Probe Doc Realignment Critique
Date: 2026-06-19

## Execution

Subagent critique completed for the app/prompt backend probe and documentation realignment slice.
Two bounded angle reviewers and one separate counterweight reviewer ran through the host subagent surface.

## Fresh-Eye Satisfaction

parent-delegated

## Packet Consumed

`charness-artifacts/critique/2026-06-19-090258-packet.md`

## Target

`code-critique`

## Change

Review of the fresh app/prompt fixture, Codex, and Claude backend probe capture, the replay test, the debug artifact for the Claude string-fragment reject, the eval-trust artifact, and the README, apex spec, user evaluation spec, and handoff realignment.

## Angles

- Proof honesty and badge wording across user-facing docs
- Probe data integrity and proof-boundary assertions
- Counterweight triage for remaining concerns

## Findings

- The apex initially risked overclaiming `Behavior Evaluation — proven` while app/chat liveness and app/prompt product-runner proof debt remained.
  Fixed by narrowing the apex badge to `Behavior Evaluation — declared, with proven dev surfaces` and by making README/handoff language match that state.
- The eval-trust artifact initially summarized the app/prompt probe as one pass and one reject, but the capture contains two passes and one reject because fixture and Codex both passed while Claude rejected.
  Fixed by updating the status line to record two passes and one matcher-boundary reject.
- The app/prompt spec initially pinned `productProofReady=false`, but did not also pin `requiresProductRunnerProof=true` and `runnerAssessmentState=missing-assessment` for every run.
  Fixed by projecting all three proof-boundary fields for the fixture, Codex, and Claude runs.
- The older eval-surface bundle section initially still read like the current or latest selected evidence source.
  Fixed by calling it a legacy coverage-continuity bundle and pointing readers to the fresher app/chat and app/prompt sections above it.
- The handoff initially flattened app/chat runner/data debt and app/prompt product-runner/intent-judge debt into one app-surface statement.
  Fixed by separating app/chat liveness data/execution-instance debt from app/prompt product-runner assessment and intent-judge proof debt.

## Counterweight Triage

### Act Before Ship

- strong: narrow the apex badge because overall Behavior Evaluation is not proven while app surfaces still carry explicit Proof Debt.
  Done.
- strong: correct the app/prompt eval-trust status count and pin the full proof-boundary fields in the spec.
  Done.

### Bundle Anyway

- strong: mark the older selected eval-surface bundle as legacy coverage continuity.
  Done.
- strong: separate app/chat liveness debt from app/prompt product-runner and intent-judge debt in the handoff.
  Done.

### Over-Worry

- none

### Valid but Defer

- moderate: the apex proof paragraph should make the app/prompt artifact and replay-test route visible.
  Reflected in the proof paragraph, but the underlying product-runner and intent-judge proof remains deferred.

## Deliberately Not Doing

This slice does not close app/chat liveness.
It does not claim app/prompt product-runner proof, and it does not replace the string-fragment matcher with an app/prompt intent judge.
The Claude reject is recorded as a matcher-boundary finding, not as evidence that Claude failed the product intent.

## Next Move

Run the focused gates, commit the source/proof/critique/debug changes, refresh claims because claim-source docs changed, and then choose between app/chat liveness, app/prompt product-runner plus intent-judge proof, or dev natural-unsound harvest.

## Structured Findings

- F1 | bin: act-before-ship | evidence: strong | ref: docs/specs/index.spec.md:35 | action: fix | note: narrow Behavior Evaluation apex badge to declared with proven dev surfaces because app proof debt remains
- F2 | bin: act-before-ship | evidence: strong | ref: charness-artifacts/eval-trust/2026-06-19-app-prompt-backend-probe.md:3 | action: fix | note: correct app-prompt probe status to two passes and one matcher-boundary reject
- F3 | bin: act-before-ship | evidence: strong | ref: docs/specs/user/evaluation.spec.md:106 | action: fix | note: project productProofReady requiresProductRunnerProof and runnerAssessmentState for all three app-prompt backend runs
- F4 | bin: bundle-anyway | evidence: strong | ref: docs/specs/user/evaluation.spec.md:123 | action: fix | note: describe the older selected eval-surface bundle as legacy coverage continuity rather than current latest proof
- F5 | bin: bundle-anyway | evidence: strong | ref: docs/internal/handoff.md:17 | action: fix | note: separate app-chat runner data debt from app-prompt product-runner and intent-judge debt
- F6 | bin: valid-but-defer | evidence: moderate | ref: docs/specs/index.spec.md:43 | action: document | note: add the app-prompt artifact and replay-test route while deferring product-runner and intent-judge proof

## Reviewer Tier Evidence

- Requested tier: high-leverage
- Requested spawn fields: host default subagent fields; no explicit model, reasoning effort, or service tier override was sent
- Host exposure state: host-defaulted
- Application state: host returned subagent ids `019edf1e-a0bf-78d2-85fe-0da927a6de4f`, `019edf1e-bf50-72c3-a5a7-3849d4c324b8`, and `019edf22-b1f0-7cd0-80f1-39001e6f04d1` with completed final messages
