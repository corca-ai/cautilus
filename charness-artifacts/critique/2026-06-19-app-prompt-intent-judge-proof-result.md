# App Prompt Intent Judge Proof Critique
Date: 2026-06-19

## Execution

Subagent critique completed for the app/prompt intent-judge proof slice.
Two bounded angle reviewers and one separate counterweight reviewer ran through the host subagent surface.

## Fresh-Eye Satisfaction

parent-delegated

## Packet Consumed

`charness-artifacts/critique/2026-06-19-094735-packet.md`

## Target

`code-critique`

## Change

Review of the checked-in app/prompt intent-judge verdict packet, the replay assertions and tests, the eval-trust artifact, the README, apex spec, user evaluation spec, handoff, and the claim-discovery spec realignment exposed by focused specdown.

## Angles

- Proof honesty and documentation truth across user-facing surfaces
- Data integrity and replay-test load-bearing behavior
- Counterweight triage for existing concerns after fixes

## Findings

- The first replay helper did not make the two independent `judgeRuns` load-bearing.
  Fixed by asserting exactly two runs, exact case sets, no duplicate case IDs, no tool use, aggregate agreement, and per-run facet values for sound and control cases.
- The README and handoff needed to say the blind intent judge is over the backend probe, not product-runner proof.
  Fixed by narrowing README language and adding the intent-judge artifact to the handoff read-first and evidence lists.
- The control wording initially risked overselling an easy constructed control as on-topic-looking.
  Fixed by describing it as a constructed semantically wrong control.
- Focused specdown exposed stale `claim-discovery` bucket expectations that still projected seven current action buckets while the checked-in status summary has six.
  Fixed by realigning the current projection and recording a debug artifact for the drift.
- Raw judge prompts and transcripts are not preserved.
  This is valid provenance debt, but this slice preserves two judge runs, agent IDs, verdicts, facets, aggregate consensus, and no-tool metadata.

## Counterweight Triage

### Act Before Ship

- strong: make independent `judgeRuns` load-bearing instead of trusting only the aggregate verdicts.
  Done.
- strong: align the current claim-discovery action-bucket spec projection to the checked-in six-bucket status summary after focused specdown exposed stale expectations.
  Done.

### Bundle Anyway

- strong: add the app/prompt intent-judge artifact to handoff pickup references.
  Done.
- moderate: clarify in README that the blind intent judge is over the backend probe, not over a product runner.
  Done.
- moderate: soften control wording so it does not imply a harder near-miss than the constructed control actually is.
  Done.

### Over-Worry

- moderate: a product-runner overclaim blocker is not present after the wording changes because `productProofReady=false` and product-runner proof debt remain explicit.

### Valid but Defer

- moderate: raw judge prompt and transcript preservation would improve provenance, but it is not required to close this fixture-backed intent-judge proof slice.
- moderate: a harder near-miss control could strengthen future judge calibration, but the current constructed control is honestly labeled and remains load-bearing.

## Deliberately Not Doing

This slice does not claim app/prompt product-runner proof.
It does not close app/chat liveness.
It does not preserve raw judge transcripts retroactively.
It does not replace future app/prompt product-path assessment with the backend-probe intent judge.

## Next Move

Run local verification, commit the source/proof/critique/debug changes, refresh claims because claim-source docs changed, then commit the generated claim refresh.

## Structured Findings

- F1 | bin: act-before-ship | evidence: strong | ref: scripts/on-demand/app-prompt-intent-judge-proof.mjs:57 | action: fix | note: make independent judgeRuns load-bearing against aggregate verdicts and facets
- F2 | bin: act-before-ship | evidence: strong | ref: docs/specs/user/claim-discovery.spec.md:235 | action: fix | note: align current action-bucket spec projection to checked-in six-bucket status summary after specdown debug
- F3 | bin: bundle-anyway | evidence: strong | ref: docs/internal/handoff.md:9 | action: fix | note: add app-prompt intent-judge artifact to pickup references
- F4 | bin: bundle-anyway | evidence: moderate | ref: README.md:16 | action: fix | note: clarify intent judge is over backend probe not product runner
- F5 | bin: bundle-anyway | evidence: moderate | ref: fixtures/eval/app/prompt/intent-judge/app-prompt-intent-judge-verdicts.json:134 | action: fix | note: soften control wording from on-topic-looking to constructed semantic control
- F6 | bin: valid-but-defer | evidence: moderate | ref: fixtures/eval/app/prompt/intent-judge/app-prompt-intent-judge-verdicts.json:15 | action: defer | note: raw judge prompt and transcript provenance deferred until broader judge-provenance contract
- F7 | bin: valid-but-defer | evidence: moderate | ref: fixtures/eval/app/prompt/intent-judge/app-prompt-intent-judge-verdicts.json:123 | action: defer | note: harder near-miss control deferred while current constructed semantic control remains honestly labeled

## Reviewer Tier Evidence

- Requested tier: high-leverage
- Requested spawn fields: host default subagent fields; no explicit model, reasoning effort, or service tier override was sent
- Host exposure state: host-defaulted
- Application state: host returned angle subagent ids `019edf47-b8c6-71d1-bb54-bfa8277a4eea` and `019edf47-d617-7af2-98d3-104cd0504d5e`, plus counterweight subagent id `019edf4d-9e4a-7351-95f7-7f3a6dec545c`, with completed final messages
