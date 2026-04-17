# Deployment Evidence Contract

Internal adopters will ask one practical question before they trust `Cautilus`
for repeated validation work:

> On which archetype, on which runtime and model, with what success rate, time,
> token use, and cost, did this actually work?

`Cautilus` already has the raw ingredients for that answer in
`skill_evaluation_summary` packets and `scenario_results` packets.
What it lacked was a small product-owned seam that turns those packets into one
deployment-facing evidence table without forcing operators to hand-roll ad hoc
spreadsheets.

## Scope

This seam is intentionally narrow.

It owns:

- one normalized row shape for deployment-facing evidence
- one aggregate packet that groups rows by `surface`, `runtime`, `provider`,
  and `model`
- success-rate and budget summaries that can be quoted in internal rollout docs

It does not yet own:

- replaying the underlying evaluations
- choosing which repos or models to run
- Codex token or cost inference from human-oriented stderr logs

## Input Boundary

Use `cautilus.deployment_evidence_inputs.v1`.

Each row should describe one already-observed evaluation unit:

- `surface`
  - `chatbot`
  - `skill`
  - `workflow`
- `scenarioId`
- optional `scenarioLabel`
- `runtime`
- `sourceKind`
  - `skill_evaluation_summary`
  - `scenario_results`
- `status`
- `sampleCount`
- `successCount`
- optional `provider`
- optional `model`
- optional `duration_ms`
- optional `total_tokens`
- optional `cost_usd`
- optional `sourcePath`

`sampleCount` and `successCount` are explicit so the row can represent either:

- one observed run
- or one repeated sampled summary such as `skill test` trigger consensus

This keeps deployment evidence honest.
The packet should not guess hidden sample counts from prose.

## Preparation Boundary

The repo now ships a thin preparer script:

`node ./scripts/agent-runtime/prepare-deployment-evidence-input.mjs`

Current supported sources:

- `skill_evaluation_summary`
- `scenario_results`

That script is allowed to translate existing product-owned packets into
deployment-evidence rows because those source packets are already normalized.

## Output Boundary

Use `cautilus.deployment_evidence.v1`.

The output should include:

- `overall`
  - row count
  - scenario count
  - sample totals
  - successful sample totals
  - overall success rate
  - p50 / p90 for duration, tokens, and cost when present
- `rows`
  - normalized input rows with explicit `successRate`
- `summaries`
  - grouped by `surface`, `runtime`, `provider`, and `model`
  - each summary should expose:
    - row count
    - scenario count
    - total samples
    - successful samples
    - success rate
    - status counts
    - p50 / p90 duration
    - p50 / p90 tokens
    - p50 / p90 cost

## Current Limits

- Claude `skill test` summaries now carry model, token, and cost telemetry, so
  this seam can answer deployment questions for that runtime directly.
- Codex `skill test` summaries currently preserve model and duration, but not
  product-owned token or cost values, because the current Codex CLI exposes
  those through human-oriented stderr output rather than a stable machine
  packet.
- `scenario_results` rows need the caller to decide which statuses count as
  success when the source mode is comparison-shaped.
  The preparer therefore accepts explicit `--pass-status` overrides.

## Fixed Decisions

- Deployment evidence is a derived packet, not a new execution workflow.
- The product may aggregate only explicit machine-readable telemetry.
- Success-rate math should be driven by `sampleCount` and `successCount`, not
  by parsing prose summaries.
- `chatbot`, `skill`, and `workflow` remain first-class top-level surfaces in
  the evidence output.
