# Live Run Invocation Batch Contract

Issue `#22` starts with the smallest honest batch primitive:
`Cautilus` accepts one explicit file of already-materialized live-run request packets for one selected instance, schedules them in-process, and emits one aggregated result packet.
This slice exists to stop adopters from re-implementing the per-scenario scheduler once `cautilus workbench run-live` already owns the single-request runtime semantics.

## Current Slice

Use `cautilus workbench run-scenarios` with `--instance-id`, `--requests-file`, and `--output-file`.
The requests file uses `cautilus.live_run_invocation_request_batch.v1`.
The command reuses the same adapter-owned `live_run_invocation` seam that powers `cautilus workbench run-live`, but it executes many request packets inside one product-owned scheduler instead of spawning one new `cautilus` subprocess per scenario.
This first slice accepts only an explicit request batch and an optional `--concurrency` override.
It does not yet own request synthesis from a scenario catalog, sample expansion, retry policy, or noise taxonomy.

## Fixed Decisions

- The batch scheduler still routes to one selected `instanceId` per invocation.
- Each embedded request must already be a valid `cautilus.live_run_invocation_request.v1` packet.
- The scheduler writes one nested per-request result file under `<output-file>.d/runs/`.
- The top-level batch result embeds the canonical per-request `cautilus.live_run_invocation_result.v1` packets instead of inventing a second result shape.
- Concurrency is product-owned at the scheduler layer, not adapter-owned.
- Retry and noise policy stay deferred for now.

## Request Packet

Use `cautilus.live_run_invocation_request_batch.v1`.

Required top-level fields:

- `schemaVersion`
- `instanceId`
- `requests`

`requests` must be a non-empty array of valid `cautilus.live_run_invocation_request.v1` packets.
Every embedded request must use the same `instanceId` as the batch and the CLI flag.
The first slice also requires unique `requestId` values inside the batch so nested artifact paths stay stable and machine-readable.

## Result Packet

Use `cautilus.live_run_invocation_batch_result.v1`.

Required top-level fields:

- `schemaVersion`
- `instanceId`
- `summary`
- `counts`
- `results`

`counts` includes:

- `total`
- `completed`
- `blocked`
- `failed`

Each `results[]` entry includes:

- `requestId`
- `scenarioId`
- `outputFile`
- `result`

`result` is the same `cautilus.live_run_invocation_result.v1` packet that `cautilus workbench run-live` would have written for that request.

## CLI Surface

```bash
cautilus workbench run-scenarios \
  --repo-root /path/to/repo \
  --instance-id ceal \
  --requests-file /tmp/request-batch.json \
  --output-file /tmp/batch-result.json \
  --concurrency 4
```

`--concurrency` defaults to `1`.
The command writes the aggregated batch packet to `--output-file`.
It also writes one nested request and result pair per scheduled request under `<output-file>.d/runs/`.

## Deferred Decisions

- scenario catalog inputs plus product-owned filtering
- sample expansion (`samples-per-scenario`)
- retry policy
- noise or rate-limit classification
- cross-instance batches

## Non-Goals

- forcing adopters onto one scenario-catalog schema
- moving benchmark pass-rate or score-floor policy into `Cautilus`
- reopening the single-request simulator or workspace lifecycle contracts

## Success Criteria

- Consumers can hand `Cautilus` many explicit live-run request packets in one file.
- The product schedules those requests without a host-side wrapper spawning one `cautilus workbench run-live` subprocess per scenario.
- Operators receive one aggregated packet plus stable per-request artifacts.
- The batch scheduler preserves the existing single-request runtime contract instead of inventing a second adapter seam.

## Acceptance Checks

- `go test ./internal/runtime ./internal/app`
- request batch example at [fixtures/live-run-invocation/example-request-batch.json](../../fixtures/live-run-invocation/example-request-batch.json) validates against [fixtures/live-run-invocation/request-batch.schema.json](../../fixtures/live-run-invocation/request-batch.schema.json)
- batch result example at [fixtures/live-run-invocation/example-result-batch.json](../../fixtures/live-run-invocation/example-result-batch.json) validates against [fixtures/live-run-invocation/result-batch.schema.json](../../fixtures/live-run-invocation/result-batch.schema.json)
- `go test ./internal/app -run TestCLIWorkbenchRunScenariosExecutesExplicitRequestBatch`

## Canonical Artifact

The canonical batch request artifact for this slice is `cautilus.live_run_invocation_request_batch.v1`.
The canonical batch result artifact for this slice is `cautilus.live_run_invocation_batch_result.v1`.
The nested per-request artifacts remain `cautilus.live_run_invocation_request.v1` and `cautilus.live_run_invocation_result.v1`.
