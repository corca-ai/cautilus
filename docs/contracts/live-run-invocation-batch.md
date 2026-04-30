# Live Run Invocation Batch Contract

Issue `#22` starts with the smallest honest batch primitive:
`Cautilus` accepts either an explicit file of already-materialized live-run request packets or an agent-friendly batch-prepare packet for one selected instance, schedules the resulting requests in-process, and emits one aggregated result packet.
This slice exists to stop adopters from re-implementing the per-scenario scheduler once `cautilus eval live run` already owns the single-request runtime semantics.

## Current Slice

Use `cautilus eval live prepare-request-batch` when an agent has either draft scenarios or a normalized consumer-catalog candidate packet and needs a deterministic request-batch artifact.
That prep command accepts either `cautilus.live_run_invocation_batch_prepare_input.v1` or `cautilus.live_run_invocation_batch_prepare_catalog_input.v1` and emits `cautilus.live_run_invocation_request_batch.v1`.
Use `cautilus eval live run-scenarios` with `--instance-id`, `--requests-file`, and `--output-file` once that explicit request batch exists.
The command reuses the same adapter-owned `live_run_invocation` seam that powers `cautilus eval live run`, but it executes many request packets inside one product-owned scheduler instead of spawning one new `cautilus` subprocess per scenario.
This slice now owns request synthesis from:

- checked-in `cautilus.scenario.v1` draft scenarios plus exact `scenarioIds` filtering and `samplesPerScenario` expansion
- normalized consumer-catalog candidate packets plus exact `scenarioIds` and `requiredTags` filtering

Raw consumer catalog probing and host-specific schema interpretation remain consumer-owned.

## Fixed Decisions

- The batch scheduler still routes to one selected `instanceId` per invocation.
- Each embedded request must already be a valid `cautilus.live_run_invocation_request.v1` packet.
- The scheduler writes one nested per-request result file per attempt under `<output-file>.d/runs/`.
- The top-level batch result embeds the canonical per-request `cautilus.live_run_invocation_result.v1` packets instead of inventing a second result shape.
- Concurrency is product-owned at the scheduler layer, not adapter-owned.
- Retry stays scheduler-owned at the batch layer and is driven only by explicit product-readable transient classes.
- Raw provider-error interpretation stays consumer-owned.

## Request Packet

Use `cautilus.live_run_invocation_request_batch.v1`.

Required top-level fields:

- `schemaVersion`
- `instanceId`
- `requests`

Optional top-level fields:

- `retryPolicy`

`requests` must be a non-empty array of valid `cautilus.live_run_invocation_request.v1` packets.
Every embedded request must use the same `instanceId` as the batch and the CLI flag.
The batch also requires unique `requestId` values inside the batch so nested artifact paths stay stable and machine-readable.

When `retryPolicy` is present, it uses:

- `maxAttempts`
- `retryOnClasses`
  - current values: `rate_limit`, `transient_provider_failure`

## Batch-Prepare Packet

Use `cautilus.live_run_invocation_batch_prepare_input.v1`.

Required top-level fields:

- `schemaVersion`
- `instanceId`
- `timeoutMs`
- `samplesPerScenario`
- `scenarios`

Optional top-level fields:

- `requestIdPrefix`
- `captureTranscript`
- `consumerMetadata`
- `operatorNote`
- `scenarioIds`
- `retryPolicy`

`scenarios` is a non-empty array of `cautilus.scenario.v1` draft scenarios.
When `scenarioIds` is present, the prep command keeps only those exact `scenarioId` values.
For each kept scenario, the command expands `samplesPerScenario` into deterministic request ids and emits the canonical batch request packet.

## Catalog-Candidate Batch-Prepare Packet

Use `cautilus.live_run_invocation_batch_prepare_catalog_input.v1`.

Required top-level fields:

- `schemaVersion`
- `instanceId`
- `timeoutMs`
- `samplesPerScenario`
- `scenarioCandidates`

Optional top-level fields:

- `requestIdPrefix`
- `captureTranscript`
- `consumerMetadata`
- `operatorNote`
- `retryPolicy`
- `scenarioIds`
- `requiredTags`

`scenarioCandidates` is a non-empty array of normalized product-readable scenario candidates.
Each candidate already carries the scenario execution shape that `prepare-request-batch` needs; the product does not read raw consumer catalog storage directly in this slice.
When `scenarioIds` is present, the prep command keeps only those exact `scenarioId` values.
When `requiredTags` is present, the prep command keeps only candidates that include every required tag exactly.

## Result Packet

Use `cautilus.live_run_invocation_batch_result.v1`.

Required top-level fields:

- `schemaVersion`
- `instanceId`
- `summary`
- `counts`
- `attemptCounts`
- `transientClassCounts`
- `results`

`counts` includes:

- `total`
- `completed`
- `blocked`
- `failed`

`attemptCounts` includes:

- `total`
- `retriedRequests`

`transientClassCounts` currently includes:

- `rate_limit`
- `transient_provider_failure`

Each `results[]` entry includes:

- `requestId`
- `scenarioId`
- `outputFile`
- `attemptCount`
- `attempts`
- `result`

`result` is the same `cautilus.live_run_invocation_result.v1` packet that `cautilus eval live run` would have written for that request.
`attempts[]` records each attempt in order with its nested `outputFile` and canonical `result`.
`outputFile` and `result` at the top level duplicate the final attempt for convenience.

## CLI Surface

```bash
cautilus eval live prepare-request-batch \
  --input /tmp/prepare-input.json \
  --output /tmp/request-batch.json

cautilus eval live run-scenarios \
  --repo-root /path/to/repo \
  --instance-id ceal \
  --requests-file /tmp/request-batch.json \
  --output-file /tmp/batch-result.json \
  --concurrency 4
```

`--concurrency` defaults to `1`.
The command writes the aggregated batch packet to `--output-file`.
It also writes one nested request and result pair per attempt under `<output-file>.d/runs/<request>/attempt-<nn>/`.

## Deferred Decisions

- cross-instance batches

## Non-Goals

- forcing adopters onto one scenario-catalog schema
- moving benchmark pass-rate or score-floor policy into `Cautilus`
- reopening the single-request simulator or workspace lifecycle contracts

## Success Criteria

- Consumers can hand `Cautilus` many explicit live-run request packets in one file.
- Consumers can hand `Cautilus` a normalized catalog-candidate prep packet without teaching the product a raw host-specific catalog schema.
- The product schedules those requests without a host-side wrapper spawning one `cautilus eval live run` subprocess per scenario.
- Operators receive one aggregated packet plus stable per-attempt artifacts.
- The batch scheduler preserves the existing single-request runtime contract instead of inventing a second adapter seam.

## Acceptance Checks

- `go test ./internal/runtime ./internal/app`
- batch prepare example at [fixtures/live-run-invocation/example-batch-prepare-input.json](../../fixtures/live-run-invocation/example-batch-prepare-input.json) validates against [fixtures/live-run-invocation/batch-prepare-input.schema.json](../../fixtures/live-run-invocation/batch-prepare-input.schema.json)
- catalog prepare example at [fixtures/live-run-invocation/example-batch-prepare-catalog-input.json](../../fixtures/live-run-invocation/example-batch-prepare-catalog-input.json) validates against [fixtures/live-run-invocation/batch-prepare-catalog-input.schema.json](../../fixtures/live-run-invocation/batch-prepare-catalog-input.schema.json)
- request batch example at [fixtures/live-run-invocation/example-request-batch.json](../../fixtures/live-run-invocation/example-request-batch.json) validates against [fixtures/live-run-invocation/request-batch.schema.json](../../fixtures/live-run-invocation/request-batch.schema.json)
- batch result example at [fixtures/live-run-invocation/example-result-batch.json](../../fixtures/live-run-invocation/example-result-batch.json) validates against [fixtures/live-run-invocation/result-batch.schema.json](../../fixtures/live-run-invocation/result-batch.schema.json)
- `go test ./internal/app -run 'TestCLIWorkbench(PrepareRequestBatchAcceptsCatalogCandidates|RunScenariosExecutesExplicitRequestBatch|RunScenariosRetriesTransientFailures)$'`

## Canonical Artifact

The canonical batch-prepare artifact for this slice is `cautilus.live_run_invocation_batch_prepare_input.v1`.
The canonical catalog-derived batch-prepare artifact for this slice is `cautilus.live_run_invocation_batch_prepare_catalog_input.v1`.
The canonical batch request artifact for this slice is `cautilus.live_run_invocation_request_batch.v1`.
The canonical batch result artifact for this slice is `cautilus.live_run_invocation_batch_result.v1`.
The nested per-request artifacts remain `cautilus.live_run_invocation_request.v1` and `cautilus.live_run_invocation_result.v1`.
