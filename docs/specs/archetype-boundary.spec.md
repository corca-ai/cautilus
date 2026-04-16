# Archetype Boundary

`Cautilus` has exactly three first-class evaluation archetypes:

- `chatbot` for multi-turn conversational behavior in one session
- `skill` for a single skill or agent invocation
- `workflow` for a stateful automation that must recover from known blockers

The public reason for this split is operator clarity.
Each archetype answers a different first question:

- "What conversation should still work after a prompt change?"
- "Does this skill still trigger and execute cleanly?"
- "Can this durable workflow recover when the blocker comes back?"

The deeper implementation fanout behind each archetype is covered by unit and integration tests plus `npm run lint:archetypes`.
This public spec stays at the user-facing boundary: catalog shape, normalization command, and negative-case separation.

## Archetypes

### Chatbot

Use when you are protecting conversational continuity across turns.
The public entry point is `./bin/cautilus scenario normalize chatbot`.
The contract document is `docs/contracts/chatbot-normalization.md`.

### Skill

Use when you are protecting one skill or agent invocation: trigger choice, execution quality, and validation integrity.
The public entry point is `./bin/cautilus scenario normalize skill`.
The contract document is `docs/contracts/skill-normalization.md`.

### Workflow

Use when you are protecting a durable workflow that persists across invocations and must recover from a repeated blocker.
The public entry point is `./bin/cautilus scenario normalize workflow`.
The contract document is `docs/contracts/workflow-normalization.md`.

## Why These Three Stay Separate

The product already exposes both `commands --json` and `scenarios --json`.
That split is deliberate.
`commands` is a full CLI registry.
`scenarios` is the smaller operator-facing archetype catalog.

Keeping the three archetypes distinct prevents one large "normalize anything" surface from hiding important differences in evidence shape and review intent.
It also keeps error handling explicit: a workflow-shaped input should not silently pass through the skill path.

## Executable Proof

```run:shell
$ ./bin/cautilus scenarios --json | grep '"schemaVersion": "cautilus.scenarios.v1"'
  "schemaVersion": "cautilus.scenarios.v1",
$ ./bin/cautilus scenario normalize chatbot --input ./fixtures/scenario-proposals/samples/chatbot-consumer-input.json | grep '"proposalKey": "event-triggered-followup"'
    "proposalKey": "event-triggered-followup",
$ ./bin/cautilus scenario normalize skill --input ./fixtures/scenario-proposals/samples/skill-validation-input.json | grep '"proposalKey": "public-skill-impl-smoke-scenario-regression"'
    "proposalKey": "public-skill-impl-smoke-scenario-regression",
$ ./bin/cautilus scenario normalize workflow --input ./fixtures/scenario-proposals/samples/workflow-recovery-input.json | grep '"proposalKey": "cli-workflow-scan-settings-seed-replay-seed-repeated-screen-no-progress"'
    "proposalKey": "cli-workflow-scan-settings-seed-replay-seed-repeated-screen-no-progress",
$ ./bin/cautilus scenario normalize skill --input ./fixtures/scenario-proposals/samples/workflow-recovery-input.json 2>&1 | grep 'use `cautilus scenario normalize workflow` instead.'
Input uses cautilus.workflow_normalization_inputs.v1; use `cautilus scenario normalize workflow` instead.
```
