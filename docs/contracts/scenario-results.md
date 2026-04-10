# Scenario Results

`Cautilus` should not accept loose benchmark arrays once a mode run becomes
part of the durable product surface.

Use `cautilus.scenario_results.v1` for the explicit packet that carries one
mode's scenario-level outcomes.

## Contents

Minimum fields:

- `schemaVersion`: `cautilus.scenario_results.v1`
- `results`: scenario-level result entries

Optional but recommended fields:

- `generatedAt`
- `source`
- `mode`
- `compareArtifact`

Each result entry may include:

- `scenarioId`
- `status`
- `overallScore`
- `passRate`
- `timestamp`
- `startedAt`
- `completedAt`
- `durationMs`
- `telemetry`

## Compare Artifact

When a mode command produces richer deltas, it may embed one
`cautilus.compare_artifact.v1` object beside `results`.

That artifact should summarize:

- the high-level verdict
- the most useful improved/regressed/unchanged/noisy buckets
- optional finer-grained deltas
- optional artifact paths worth reading directly

This gives `report build`, `review prepare-input`, and review prompt rendering
one shared machine-readable compare surface.

## Current Use

The current standalone chain is:

1. `mode evaluate` asks the adapter command to write one scenario-results file
2. `report build` lifts that packet into `cautilus.report_packet.v1`
3. `review prepare-input` and `review build-prompt-input` keep the same compare
   surface visible to review variants

## Guardrails

- Do not accept ad-hoc arrays or shell logs as the durable product contract.
- Keep raw log mining and storage readers consumer-owned.
- Keep compare artifacts explicit instead of re-deriving them from prose later.
