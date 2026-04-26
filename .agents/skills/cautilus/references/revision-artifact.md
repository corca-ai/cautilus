# Revision Artifact

`Cautilus` should expose one durable revision-artifact seam above an optimize
proposal.

The proposal answers:

- what bounded revision should happen next

The revision artifact answers:

- what exact bounded revision object should an operator, prompt editor, or
  follow-up tool reopen later
- which target file snapshot and evidence files that revision was based on
- which bounded checks must rerun before the revision can be accepted

Use `cautilus.revision_artifact.v1` for that boundary.

## Contents

The artifact should include:

- the source `cautilus.optimize_proposal.v1` file reference and packet
- the source `cautilus.optimize_inputs.v1` file reference
- repo root
- shared behavior intent profile: `cautilus.behavior_intent.v1`
- optimization target and optimizer configuration
- optimization objective and guardrails
- target file reference and optional target snapshot fingerprint
- source evidence file references
  - report file
  - review summary file
  - scenario history file
- report context summary
- bounded revision plan
  - decision
  - revision brief
  - prioritized evidence
  - suggested changes
  - stop conditions
  - follow-up checks
- trial telemetry copied from the proposal

The point is not to inline arbitrary repo state.
The point is to materialize one machine-readable revision object that can be
reviewed, stored, or handed to a bounded follow-up step without rediscovering
the optimize context from scratch.

## Current Use

The first standalone surface is:

```bash
cautilus optimize build-artifact \
  --proposal-file /tmp/cautilus-optimize/proposal.json
```

## Guardrails

- Keep the artifact bounded to explicit optimize inputs and proposal outputs.
- Do not treat the artifact as permission to auto-apply edits.
- Do not inline large prompt or adapter bodies into the product-owned packet.
- Prefer file references plus stable fingerprints for consumer-owned targets.
