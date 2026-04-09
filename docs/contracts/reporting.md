# Reporting

`Cautilus` reports should make it easy to answer one question:

> Is the candidate actually better than the baseline for the behavior we care about?

## Minimum Report Shape

- `candidate`: ref, branch, or path under evaluation
- `baseline`: exact baseline ref or repo path
- `modes_run`: iterate, held-out, comparison, full gate
- `commands`: rendered commands with concrete placeholder values
- `improved`: scenarios or metrics that improved
- `regressed`: scenarios or metrics that regressed
- `unchanged`: scenarios that stayed flat
- `noisy`: scenarios that require more samples
- `human_review_findings`: failures that benchmarks miss
- `recommendation`: `accept-now`, `defer`, or `reject`

## Interpretation Rules

- Prefer scenario-level deltas over single headline scores.
- A held-out regression is usually more important than a train-only win.
- A noisy result should become a sampling decision, not a triumph or panic
  story.
- Human-review failures must be reported even when the benchmark score
  improves.
- Say when a result is narrow. Probe wins are not the same as workflow wins.
