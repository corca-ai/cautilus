# Host Ownership

Using Cautilus adapters and host-owned runners, a user can keep prompts, models, credentials, runtime wiring, and acceptance policy in the host repo while Cautilus standardizes workflow packets and boundaries.

## Acceptance Criteria

### A host repo owns the behavior runtime that Cautilus evaluates.

The current adapter evidence proves that adapter-owned claim discovery entries and explicit live instance definitions are validated and normalized without product-owned runtime guessing.

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/evidence-adapter-discovery-contracts-2026-05-03.json | decision.evidenceStatus | satisfied | |
| .cautilus/claims/evidence-adapter-discovery-contracts-2026-05-03.json | commandEvidence[0].observed.notableAssertions[0] | | adapter claim_discovery entries |
| .cautilus/claims/evidence-adapter-discovery-contracts-2026-05-03.json | commandEvidence[1].observed.notableAssertions[0] | | adapter kind: explicit |

### A standalone consumer can install Cautilus, initialize adapter wiring, and reach a first bounded run without Cautilus taking over host policy.

The consumer onboarding evidence covers install, adapter init, doctor readiness, and first bounded eval behavior in a temporary host repo.

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/evidence-consumer-doctor-onboarding-2026-05-03.json | decision.evidenceStatus | satisfied | |
| .cautilus/claims/evidence-consumer-doctor-onboarding-2026-05-03.json | summary | | doctor onboarding |
| .cautilus/claims/evidence-consumer-doctor-onboarding-2026-05-03.json | commandEvidence[0].observed.notableAssertions[2] | | adapter-init |

### Cautilus standardizes packets and workflow boundaries instead of prompts, credentials, or acceptance policy.

The current durable-packet evidence proves that core command surfaces emit schema-versioned packets another agent can reopen.

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/evidence-durable-packets-2026-05-03.json | decision.evidenceStatus | satisfied | |
| .cautilus/claims/evidence-durable-packets-2026-05-03.json | commandEvidence[1].observed.schemaVersion | cautilus.agent_status.v1 | |
| .cautilus/claims/evidence-durable-packets-2026-05-03.json | commandEvidence[2].observed.schemaVersion | cautilus.claim_status_summary.v1 | |

### Gap: per-field host ownership is not fully proven at the user-spec layer yet.

The adapter contract still needs focused per-field proof for prompts, model choice, credentials, and runtime launch.
Owner: maintainer.
Next action: enumerate the host-owned fields in [docs/contracts/adapter-contract.md](../../contracts/adapter-contract.md) and attach one focused artifact-viewer or contract test per field.
