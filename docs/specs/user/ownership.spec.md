---
type: promise
---

# Host Ownership

Before Cautilus can evaluate behavior honestly, the user needs host-specific prompts, models, credentials, runtime wiring, and acceptance policy to stay in the host repo.
Using the `cautilus init adapter`, `cautilus doctor adapter`, and `cautilus doctor` CLI commands with the `cautilus-agent` skill, a user can keep host-owned execution in place while Cautilus standardizes workflow packets and boundaries.

## A user can keep behavior execution in the host repo.

The current adapter evidence proves that adapter-owned claim discovery entries and explicit live instance definitions are validated and normalized without product-owned runtime guessing.

```run:shell
# Show the production Cautilus adapter surface that this repo owns.
cat .agents/cautilus-adapter.yaml
```

```run:shell
# Show the adapter-owned discovery behaviors proven by the latest selected evidence bundle.
jq '[.commandEvidence[] | {command, notableAssertions: .observed.notableAssertions}]' .cautilus/claims/evidence-adapter-discovery-contracts-2026-05-03.json
```

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/evidence-adapter-discovery-contracts-2026-05-03.json | decision.evidenceStatus | satisfied | |
| .cautilus/claims/evidence-adapter-discovery-contracts-2026-05-03.json | commandEvidence[0].observed.notableAssertions[0] | | adapter claim_discovery entries |
| .cautilus/claims/evidence-adapter-discovery-contracts-2026-05-03.json | commandEvidence[1].observed.notableAssertions[0] | | adapter kind: explicit |

## A standalone consumer can install Cautilus, initialize adapter wiring, and reach a first bounded run without Cautilus taking over host policy.

This is the badge's load-bearing proof, and it is **human-auditable**, not a projected bundle.
An operator ran `npm run consumer:onboard:smoke` and vouches for the result: the smoke installs Cautilus, initializes adapter wiring, reaches doctor readiness, and runs one bounded `evaluate fixture` in a fresh temporary git repo whose adapter, fixture, and eval runner are all host-owned — so the host keeps execution while Cautilus brings only the generic workflow.
The check below replays the operator-witnessed capture on every `npm run lint:specs`; the live re-run is opt-in (`npm run consumer:onboard:smoke`) and regenerates the capture without drift.
There is no automated judge — the onboarding outcome is a deterministic invariant the operator witnessed.

```run:shell
# Show the operator-witnessed onboarding invariant and the host-owned runner, adapter, and fixture.
jq '{ready: .onboarding.ready, eval: .onboarding.evalRecommendation, hostOwned: .onboarding.hostOwned, steps: .onboarding.steps}' fixtures/eval/consumer/onboard/live/consumer-onboarding-live-capture.json
```

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| fixtures/eval/consumer/onboard/live/consumer-onboarding-live-capture.json | provenance.kind | operator-witnessed-onboarding | |
| fixtures/eval/consumer/onboard/live/consumer-onboarding-live-capture.json | onboarding.ready | true | |
| fixtures/eval/consumer/onboard/live/consumer-onboarding-live-capture.json | onboarding.evalRecommendation | accept-now | |
| fixtures/eval/consumer/onboard/live/consumer-onboarding-live-capture.json | onboarding.hostOwned.runnerPath | | cautilus-smoke-eval.mjs |

## A user can rely on Cautilus for packets and workflow boundaries, not host policy.

The current durable-packet evidence proves that core command surfaces emit schema-versioned packets another agent can reopen.

```run:shell
# Show the durable packet surfaces proven by the latest selected evidence bundle.
jq '[.commandEvidence[] | {command, schemaVersion: .observed.schemaVersion}]' .cautilus/claims/evidence-durable-packets-2026-05-03.json
```

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/evidence-durable-packets-2026-05-03.json | decision.evidenceStatus | satisfied | |
| .cautilus/claims/evidence-durable-packets-2026-05-03.json | commandEvidence[1].observed.schemaVersion | cautilus.agent_status.v1 | |
| .cautilus/claims/evidence-durable-packets-2026-05-03.json | commandEvidence[2].observed.schemaVersion | cautilus.claim_status_summary.v1 | |

## A user can see which host-owned fields still need focused proof.

The adapter contract still needs focused per-field proof for prompts, model choice, credentials, and runtime launch.
Owner: maintainer.
Next action: enumerate the host-owned fields in [docs/contracts/adapter-contract.md](../../contracts/adapter-contract.md) and attach one focused artifact-viewer or contract test per field.
