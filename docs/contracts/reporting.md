# Reporting

`Cautilus` reports should make it easy to answer one question:

> Is the candidate actually better than the baseline for the behavior we care about?

## Minimum Report Shape

- `schemaVersion`: `cautilus.report_packet.v2`
- `generatedAt`: when the packet was assembled
- `candidate`: ref, branch, or path under evaluation
- `baseline`: exact baseline ref or repo path
- `intent`: the operator-visible behavior or decision being evaluated
- `intent_profile`: `cautilus.behavior_intent.v1` for the same behavior
  using the product-owned `behaviorSurface` and dimension catalogs
  `intent_profile.summary` must exactly match `intent`
- `modes_run`: iterate, held-out, comparison, full gate
- `commands`: rendered commands with concrete placeholder values
- optional `command_observations`: executed command records with timing,
  exit code, and stdout/stderr artifact paths
- optional `telemetry`: wall-clock latency plus any adapter- or provider-owned
  cost and token metrics
- `improved`: scenarios or metrics that improved
- `regressed`: scenarios or metrics that regressed
- `unchanged`: scenarios that stayed flat
- `noisy`: scenarios that require more samples
- `human_review_findings`: failures that benchmarks miss
- `recommendation`: `accept-now`, `defer`, or `reject`

## Input Packet

The standalone builder should start from an explicit input packet:

- `schemaVersion`: `cautilus.report_inputs.v1`
- `candidate`
- `baseline`
- `intent`
- optional `intentProfile`
  when present, it must use the product-owned behavior-intent catalog
- `commands`: explicit mode-to-command mapping
- optional `commandObservations`: bounded executed-command records
- `modeRuns`: checked-in or persisted mode execution records
  Each mode run may include one `scenarioResults` packet using
  `cautilus.scenario_results.v1`.
- optional `improved`, `regressed`, `unchanged`, `noisy`
- optional `humanReviewFindings`
- `recommendation`

This keeps report assembly deterministic.
`Cautilus` should not scrape shell history or infer report structure from
loose logs.
When `Cautilus` itself executes adapter-defined mode commands, it should write
those command observations into the report input so the final packet preserves
how the evidence was gathered.

## Versioning

`cautilus.report_packet.v2` is the current report contract.

- `review prepare-input`
- `evidence prepare-input`
- `optimize prepare-input`

all reject legacy `cautilus.report_packet.v1` packets at the boundary.
Rebuild checked-in examples and consumer artifacts with `cautilus report build`
instead of relying on deep fallback behavior.

## Telemetry Shape

`Cautilus` should treat telemetry as explicit evidence, not hidden scraping.

Minimum product-owned latency surface that can be measured generically:

- `started_at`
- `completed_at`
- `duration_ms`

Optional adapter- or provider-owned telemetry fields:

- `provider`
- `model`
- `prompt_tokens`
- `completion_tokens`
- `total_tokens`
- `cost_usd`

The key rule is that cost telemetry must come from an explicit checked-in
wrapper or output payload. `Cautilus` should not guess cost from opaque CLI
logs.

For `review variants`, the summary packet should also aggregate any explicit
numeric telemetry across variants so operators can inspect one top-level view
without scraping each verdict file separately.

For scenario-driven evaluation, the same rule applies one level lower:
scenario result packets should preserve per-scenario telemetry so `Cautilus`
can answer which scenarios are currently the slowest or most expensive.

For held-out and full-gate reporting, mode runs should preserve that same
scenario-level telemetry and lift it into a machine-readable report packet.
That packet should summarize both:

- per-mode telemetry
- per-mode scenario telemetry when explicit scenario results are available
- per-mode compare-artifact summaries when compare output exists
- overall report telemetry across all included modes

## Interpretation Rules

- Prefer scenario-level deltas over single headline scores.
- A held-out regression is usually more important than a train-only win.
- A noisy result should become a sampling decision, not a triumph or panic
  story.
- Human-review failures must be reported even when the benchmark score
  improves.
- Say when a result is narrow. Probe wins are not the same as workflow wins.
