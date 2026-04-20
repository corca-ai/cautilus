# Live Run Invocation Contract

Issue `#18` closes only if `Cautilus` can ask a consumer to run one bounded scenario packet against one selected live instance without inheriting the consumer's route layout.
The missing seam is a neutral invocation contract, not another consumer-specific HTTP endpoint.

## Current Slice

`Cautilus` now defines one request packet and one result packet for local-first live-run invocation.
The adapter may either execute that packet directly as one bounded command or let `Cautilus` own a multi-turn chatbot loop above a consumer-owned single-turn command.
The product owns the request intent, result summary shape, and failure semantics.
When the product-owned loop is active, `Cautilus` also owns one stable per-request workspace directory under `<output_file>.d/workspace/` and may run one optional prepare hook before the first turn.
The selected instance is one live consumer target returned by workbench discovery, not a scenario definition or an adapter name.

## Fixed Decisions

- The selected `instanceId` comes from `cautilus.workbench_instance_catalog.v1`.
- The adapter-owned seam still routes by one selected instance id per invocation.
- The request packet carries product-owned scenario execution intent, not consumer route details.
- The result packet distinguishes `completed`, `blocked`, and `failed` execution states.
- `blocked` and `failed` results must carry operator-facing diagnostics.
- The first product-owned loop slice supports public `scripted` turns plus one provider-agnostic `persona_prompt` simulator kind.
- Consumer-specific metadata stays opaque to `Cautilus`.
- Product-owned workspace lifecycle stays off the public packet shape and instead flows through adapter template placeholders.
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
- either `simulator.kind: scripted` plus `simulator.turns`
- or `simulator.kind: persona_prompt` plus `simulator.instructions`
- or the legacy `simulatorTurns`

Optional request fields:

- `intentProfile`
- `captureTranscript`
- `consumerMetadata`
- `operatorNote`

`consumerMetadata` is an opaque object that `Cautilus` round-trips into the consumer-owned single-turn seam when the adapter uses the product-owned loop.
For `persona_prompt`, the product owns the loop boundary, the request packet, the persona prompt shaping, and the result normalization.
The adapter still owns backend selection and provider-specific flags through the simulator command template.
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
- `stopReason`
- `scenarioResult`
- `transcript`
- `diagnostics`
- `artifactPaths`

When `executionStatus` is `completed`, the result should usually include `scenarioResult`.
When `executionStatus` is `blocked` or `failed`, the result should include one or more `diagnostics` entries with `code`, `severity`, and `message`.

The first `scenarioResult` summary may include:

- `scenarioId`
- `status`
- `summary`
- `evaluation`
- `transcriptExcerpt`

When the adapter opts into post-run evaluation, `scenarioResult.evaluation` uses `cautilus.live_run_evaluator_result.v1`.
That evaluator verdict is consumer-owned in method but product-owned in transport and result placement.
The first shipped evaluator result shape includes:

- `schemaVersion`
- `status`
  - `passed`, `failed`, or `error`
- `overallScore`
- `summary`
- `details`

The product-managed evaluator input packet uses `cautilus.live_run_evaluator_input.v1`.
It carries the normalized transcript, `stopReason`, and optional artifact paths.

When the adapter opts into the product-owned loop, `stopReason` records why the bounded episode ended.
The first shipped vocabulary is intentionally small:

- `scripted_turns_exhausted`
- `turn_limit_reached`
- `timeout_reached`
- `blocked_by_consumer`
- `consumer_turn_failed`
- `goal_satisfied`
- `simulator_persona_failed`

## Failure Semantics

Use `completed` when the consumer finished the bounded run and can summarize what happened.
Use `blocked` when the consumer intentionally refused to start or continue the run because of a declared precondition or live-instance state.
Use `failed` when the consumer attempted the run but could not produce a bounded scenario summary because the invocation itself broke.

These states keep behavior failure separate from transport or runtime failure.
That separation is the main reason this seam should be a product-owned packet instead of an ad hoc route response.

## Adapter Boundary

The adapter-owned entry lives under `live_run_invocation` in `cautilus-adapter.yaml`.
The minimal legacy path still uses one `consumer_command_template` that reads `request_file` and writes `output_file`.
For the product-owned chatbot loop, the adapter instead points `command_template` at `cautilus workbench run-live` and provides:

- `consumer_single_turn_command_template`
  - called once per simulated turn with `{turn_request_file}` and `{turn_result_file}`
- `workspace_prepare_command_template`
  - optional one-time hook called once per request before the product-owned loop starts
  - receives the stable `{workspace_dir}` placeholder
- `simulator_persona_command_template`
  - required when `simulator.kind` is `persona_prompt`
  - usually points at `cautilus workbench run-simulator-persona`
  - called once per persona-generated turn with `{simulator_request_file}` and `{simulator_result_file}`
- `consumer_evaluator_command_template`
  - optional post-run hook with `{evaluator_input_file}` and `{evaluation_output_file}`
  - `{transcript_file}` remains available as a compatibility placeholder, but the canonical evaluator contract now flows through `cautilus.live_run_evaluator_input.v1`

The consumer may implement those commands in any language or host runtime as long as they preserve the packet boundary.
The workspace directory contents stay consumer-owned even when `Cautilus` owns the directory allocation and one-time prepare timing.

The product-owned loop also materializes supporting JSON artifacts when that path is active:

- `cautilus.live_run_evaluator_input.v1`
- `cautilus.live_run_evaluator_result.v1`
- `cautilus.live_run_simulator_request.v1`
- `cautilus.live_run_simulator_result.v1`
- `cautilus.live_run_turn_request.v1`
- `cautilus.live_run_turn_result.v1`
- `cautilus.live_run_transcript.v1`

## Deferred Decisions

- replay or resume semantics for partially completed live runs
- streaming transcript updates
- richer stop-reason vocabulary beyond the current bounded set
- shared provider presets for persona backends
- shared retry policy across consumers
- generic remote invocation transport
- adapter-configurable workspace roots beyond the current artifact-root-relative path

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
- A consumer-owned single-turn command can reuse one stable workspace across the bounded episode without inventing its own turn-1 bootstrap protocol.

## Acceptance Checks

- `go test ./internal/runtime ./internal/app`
- request example at [fixtures/live-run-invocation/example-request.json](../../fixtures/live-run-invocation/example-request.json) validates against [fixtures/live-run-invocation/request.schema.json](../../fixtures/live-run-invocation/request.schema.json)
- completed result example at [fixtures/live-run-invocation/example-result-completed.json](../../fixtures/live-run-invocation/example-result-completed.json) validates against [fixtures/live-run-invocation/result.schema.json](../../fixtures/live-run-invocation/result.schema.json)
- blocked result example at [fixtures/live-run-invocation/example-result-blocked.json](../../fixtures/live-run-invocation/example-result-blocked.json) validates against [fixtures/live-run-invocation/result.schema.json](../../fixtures/live-run-invocation/result.schema.json)
- evaluator input example at [fixtures/live-run-invocation/example-evaluator-input.json](../../fixtures/live-run-invocation/example-evaluator-input.json) validates against [fixtures/live-run-invocation/evaluator-input.schema.json](../../fixtures/live-run-invocation/evaluator-input.schema.json)
- evaluator result example at [fixtures/live-run-invocation/example-evaluator-result.json](../../fixtures/live-run-invocation/example-evaluator-result.json) validates against [fixtures/live-run-invocation/evaluator-result.schema.json](../../fixtures/live-run-invocation/evaluator-result.schema.json)
- turn request example at [fixtures/live-run-invocation/example-turn-request.json](../../fixtures/live-run-invocation/example-turn-request.json) validates against [fixtures/live-run-invocation/turn-request.schema.json](../../fixtures/live-run-invocation/turn-request.schema.json)
- simulator request example at [fixtures/live-run-invocation/example-simulator-request.json](../../fixtures/live-run-invocation/example-simulator-request.json) validates against [fixtures/live-run-invocation/simulator-request.schema.json](../../fixtures/live-run-invocation/simulator-request.schema.json)
- simulator result example at [fixtures/live-run-invocation/example-simulator-result.json](../../fixtures/live-run-invocation/example-simulator-result.json) validates against [fixtures/live-run-invocation/simulator-result.schema.json](../../fixtures/live-run-invocation/simulator-result.schema.json)
- turn result example at [fixtures/live-run-invocation/example-turn-result.json](../../fixtures/live-run-invocation/example-turn-result.json) validates against [fixtures/live-run-invocation/turn-result.schema.json](../../fixtures/live-run-invocation/turn-result.schema.json)
- transcript example at [fixtures/live-run-invocation/example-transcript.json](../../fixtures/live-run-invocation/example-transcript.json) validates against [fixtures/live-run-invocation/transcript.schema.json](../../fixtures/live-run-invocation/transcript.schema.json)

## Canonical Artifact

The canonical request artifact for this slice is `cautilus.live_run_invocation_request.v1`.
The canonical result artifact for this slice is `cautilus.live_run_invocation_result.v1`.
The supporting evaluator, simulator, per-turn, and transcript artifacts are `cautilus.live_run_evaluator_input.v1`, `cautilus.live_run_evaluator_result.v1`, `cautilus.live_run_simulator_request.v1`, `cautilus.live_run_simulator_result.v1`, `cautilus.live_run_turn_request.v1`, `cautilus.live_run_turn_result.v1`, and `cautilus.live_run_transcript.v1`.

## Premortem

The most likely failure mode is letting consumer runtime details leak into the packet until the contract becomes a disguised route clone.
This slice counters that by limiting the request to scenario intent plus one selected instance id and by keeping transport details adapter-owned.
The second likely failure mode is flattening every non-success into one vague error state.
This slice counters that by making `completed`, `blocked`, and `failed` explicit and by requiring operator-facing diagnostics on the non-success paths.
