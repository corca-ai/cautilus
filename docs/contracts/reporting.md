# Reporting

`Cautilus` reports should make it easy to answer one question:

> Is the candidate actually better than the baseline for the behavior we care about?

## Minimum Report Shape

- `schemaVersion`: `cautilus.report_packet.v2`
- `generatedAt`: when the packet was assembled
- `candidate`: ref, branch, or path under evaluation
- `baseline`: exact baseline ref or repo path
- `intent`: the operator-visible behavior or decision being evaluated
- `intent_profile`: `cautilus.behavior_intent.v1` for the same behavior using the product-owned `behaviorSurface` and dimension catalogs `intent_profile.summary` must exactly match `intent`
- `modes_run`: iterate, held-out, comparison, full gate
- `commands`: rendered commands with concrete placeholder values
- optional `command_observations`: executed command records with timing, exit code, and stdout/stderr artifact paths
- optional `adapter_context`: product-owned adapter identity such as `adapter` or `adapterName` when downstream review or optimize bridges must reuse the same adapter without operator restatement
- optional `telemetry`: wall-clock latency plus any adapter- or provider-owned cost and token metrics
- optional `telemetry.runtimeFingerprint` signals derived from explicit telemetry; see [runtime-fingerprint-optimization.md](./runtime-fingerprint-optimization.md)
- optional `reasonCodes`: machine-readable report-level outcome classification such as `behavior_regression`, `provider_rate_limit_contamination`, or `infrastructure_failure`
- optional `warnings`: machine-readable warnings promoted from persisted artifacts when the evidence is contaminated or otherwise narrow
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
- optional `intentProfile` when present, it must use the product-owned behavior-intent catalog
- `commands`: explicit mode-to-command mapping
- optional `commandObservations`: bounded executed-command records
- optional `adapterContext`: product-owned adapter identity preserved from `mode evaluate` when the run was executed against an explicit adapter path or named adapter
- `modeRuns`: checked-in or persisted mode execution records Each mode run may include one `scenarioResults` packet using `cautilus.scenario_results.v1`.
- optional `improved`, `regressed`, `unchanged`, `noisy`
- optional `humanReviewFindings`
- `recommendation`

This keeps report assembly deterministic.
`Cautilus` should not scrape shell history or infer report structure from loose logs.
When `Cautilus` itself executes adapter-defined mode commands, it should write those command observations into the report input so the final packet preserves how the evidence was gathered.
The same applies to adapter identity when an operator selected a named adapter or explicit adapter path for the run.

## `humanReviewFindings` Shape

`humanReviewFindings` is an array of product-owned finding objects.
The minimum valid object shape is:

```json
{
  "severity": "concern",
  "message": "The first recovery step is still implicit for a first-time operator.",
  "path": "docs/specs/review.spec.md"
}
```

Required fields:

- `severity`: operator-visible level such as `concern`, `warning`, or `blocker`
- `message`: the concrete human-review feedback that should survive into review, evidence, and optimize flows

Optional fields:

- `path`: the file or artifact path that the reviewer wants to anchor

When an operator wants a minimal valid report-input packet without opening the checked-in fixtures, `cautilus report build --example-input` prints one to stdout.
For a fuller canonical packet, see `./fixtures/reports/report-input.json`.

## Versioning

`cautilus.report_packet.v2` is the current report contract.

- `review prepare-input`
- `evidence prepare-input`
- `optimize prepare-input`

all reject legacy `cautilus.report_packet.v1` packets at the boundary.
Rebuild checked-in examples and consumer artifacts with `cautilus report build` instead of relying on deep fallback behavior.

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

The key rule is that cost telemetry must come from an explicit checked-in wrapper or output payload.
`Cautilus` should not guess cost from opaque CLI logs.
The same rule applies to runtime identity.
Model and provider truth should come from explicit runner output, adapter metadata, or checked-in wrappers, not from retroactive log scraping.
Runtime drift codes should be recorded as runtime context rather than primary behavior-outcome reason codes unless a pinned-runtime policy blocks the run.

For `review variants`, the summary packet should use `cautilus.review_summary.v1`, and each per-variant file should use `cautilus.review_variant_result.v1`.

The product-owned execution contract is:

- per-variant execution `status`: `passed`, `blocked`, or `failed`
- per-variant review `verdict`: optional host-level judgment such as `blocker`, `concern`, or `pass`
- `blocked` should carry machine-readable reason codes and a concrete reason instead of free-form prose-only failure
- local executor readiness failures such as missing auth or an unavailable CLI should classify as blocked `unavailable_executor`, not as a negative review finding
- invalid or missing host JSON should be rewritten into a `failed` product-owned packet so downstream tools never have to guess whether the executor actually produced a usable object

The summary packet should also aggregate any explicit numeric telemetry across variants so operators can inspect one top-level view without scraping each verdict file separately.
When one or more variants pass while another variant is blocked or failed, the summary should set `partialSuccess: true` and expose `successfulVariantOutputs` so downstream agents can consume the usable review evidence without scraping the full variants array first.

For scenario-driven evaluation, the same rule applies one level lower: scenario result packets should preserve per-scenario telemetry so `Cautilus` can answer which scenarios are currently the slowest or most expensive.

For held-out and full-gate reporting, mode runs should preserve that same scenario-level telemetry and lift it into a machine-readable report packet.
That packet should summarize both:

- per-mode telemetry
- per-mode scenario telemetry when explicit scenario results are available
- per-mode compare-artifact summaries when compare output exists
- per-mode reason codes and warnings when persisted artifacts show contamination such as provider rate limits
- overall report telemetry across all included modes

When artifact paths are present in command observations or compare artifacts, `Cautilus` may promote contamination signals into the report packet.
The first operator-facing packet should make it legible whether a rejection looks like:

- a clean behavior regression
- runtime or provider contamination
- a pure infrastructure failure

## Interpretation Rules

- Prefer scenario-level deltas over single headline scores.
- A held-out regression is usually more important than a train-only win.
- A noisy result should become a sampling decision, not a triumph or panic story.
- Human-review failures must be reported even when the benchmark score improves.
- Say when a result is narrow.
  Probe wins are not the same as workflow wins.
