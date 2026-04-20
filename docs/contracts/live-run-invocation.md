# Live Run Invocation Contract

Issue `#18` closes only if `Cautilus` can ask a consumer to run one bounded scenario packet against one selected live instance without inheriting the consumer's route layout.
The missing seam is a neutral invocation contract, not another consumer-specific HTTP endpoint.

## Current Slice

`Cautilus` now defines one request packet and one result packet for local-first live-run invocation.
The adapter owns the command that executes the request against the selected instance.
The product owns the request intent, result summary shape, and failure semantics.
The selected instance is one live consumer target returned by workbench discovery, not a scenario definition or an adapter name.

## Fixed Decisions

- The selected `instanceId` comes from `cautilus.workbench_instance_catalog.v1`.
- The adapter-owned command runs one request against one selected instance.
- The request packet carries product-owned scenario execution intent, not consumer route details.
- The result packet distinguishes `completed`, `blocked`, and `failed` execution states.
- `blocked` and `failed` results must carry operator-facing diagnostics.
- The contract does not define remote auth, sessions, or a generic admin transport.

## Request Packet

Use `cautilus.live_run_invocation_request.v1`.

Required top-level fields:

- `schemaVersion`
- `requestId`
- `instanceId`
- `scenario`
- `timeoutMs`

The embedded `scenario` object must include:

- `scenarioId`
- `name`
- `description`
- `maxTurns`
- `sideEffectsMode`
- `simulatorTurns`

Optional request fields:

- `intentProfile`
- `captureTranscript`
- `operatorNote`

The first request packet deliberately carries only the scenario-execution subset that the live runner needs.
It does not force the full draft-scenario envelope or any consumer-owned storage paths into the invocation boundary.

## Result Packet

Use `cautilus.live_run_invocation_result.v1`.

Required top-level fields:

- `schemaVersion`
- `requestId`
- `instanceId`
- `executionStatus`
- `summary`

Optional result fields:

- `startedAt`
- `completedAt`
- `durationMs`
- `scenarioResult`
- `diagnostics`
- `artifactPaths`

When `executionStatus` is `completed`, the result should usually include `scenarioResult`.
When `executionStatus` is `blocked` or `failed`, the result should include one or more `diagnostics` entries with `code`, `severity`, and `message`.

The first `scenarioResult` summary may include:

- `scenarioId`
- `status`
- `summary`
- `transcriptExcerpt`

## Failure Semantics

Use `completed` when the consumer finished the bounded run and can summarize what happened.
Use `blocked` when the consumer intentionally refused to start or continue the run because of a declared precondition or live-instance state.
Use `failed` when the consumer attempted the run but could not produce a bounded scenario summary because the invocation itself broke.

These states keep behavior failure separate from transport or runtime failure.
That separation is the main reason this seam should be a product-owned packet instead of an ad hoc route response.

## Adapter Boundary

The adapter-owned entry lives under `live_run_invocation` in `cautilus-adapter.yaml`.
The `command_template` receives one selected instance id plus one request/output file pair.
When `command_template` points at the product-owned `cautilus workbench run-live` command, the adapter must also provide a consumer-owned `consumer_command_template` so the command can dispatch the bounded run without recursively calling itself.
The consumer may implement that command in any language or host runtime as long as it preserves the packet boundary.

## Deferred Decisions

- replay or resume semantics for partially completed live runs
- streaming transcript updates
- shared retry policy across consumers
- generic remote invocation transport

## Non-Goals

- copying Ceal's current `run-simulation` route
- defining multi-instance discovery in this slice
- forcing one consumer-owned run artifact layout
- bundling broader audit or compliance browsing into the invocation seam

## Success Criteria

- `Cautilus` can ask for one bounded live run using a product-owned request packet.
- The consumer can return a machine-readable result without exposing its route layout.
- Operators can distinguish scenario failure, blocked execution, and invocation failure.
- The same command seam works whether the consumer wraps a CLI, a local daemon, or another host-owned runtime primitive.

## Acceptance Checks

- `go test ./internal/runtime ./internal/app`
- request example at [fixtures/live-run-invocation/example-request.json](../../fixtures/live-run-invocation/example-request.json) validates against [fixtures/live-run-invocation/request.schema.json](../../fixtures/live-run-invocation/request.schema.json)
- completed result example at [fixtures/live-run-invocation/example-result-completed.json](../../fixtures/live-run-invocation/example-result-completed.json) validates against [fixtures/live-run-invocation/result.schema.json](../../fixtures/live-run-invocation/result.schema.json)
- blocked result example at [fixtures/live-run-invocation/example-result-blocked.json](../../fixtures/live-run-invocation/example-result-blocked.json) validates against [fixtures/live-run-invocation/result.schema.json](../../fixtures/live-run-invocation/result.schema.json)

## Canonical Artifact

The canonical request artifact for this slice is `cautilus.live_run_invocation_request.v1`.
The canonical result artifact for this slice is `cautilus.live_run_invocation_result.v1`.

## Premortem

The most likely failure mode is letting consumer runtime details leak into the packet until the contract becomes a disguised route clone.
This slice counters that by limiting the request to scenario intent plus one selected instance id and by keeping transport details adapter-owned.
The second likely failure mode is flattening every non-success into one vague error state.
This slice counters that by making `completed`, `blocked`, and `failed` explicit and by requiring operator-facing diagnostics on the non-success paths.
