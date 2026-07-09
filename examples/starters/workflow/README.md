# Workflow Starter Kit

Smallest Cautilus wiring for evaluating a durable, stateful automation.
Copy this directory into your consumer repo, then gradually replace the smoke placeholders in `cautilus-adapter.yaml` with your real evaluation commands.

## What this Normalization Family Covers

Stateful automation that persists across multiple invocations and must recover when it hits a known blocker: CLI workflows, long-running agent sessions, pipelines that keep getting stuck on the same step.
The `scenario normalize workflow` proposal-input lineage owns the input shape; see [workflow-normalization.md](../../../docs/contracts/workflow-normalization.md) and the evaluation claim in [evaluation.spec.md](../../../docs/specs/promises/evaluation.spec.md).

## Setup

1. Copy `cautilus-adapter.yaml` and `input.json` from this directory into your consumer repo.
   The adapter can live at the repo root or under `.agents/cautilus-adapter.yaml`.
2. Install the repo-local Cautilus Agent and confirm the starter resolves clean:

   ```bash
   cautilus init --repo-root .
   cautilus doctor adapter --repo-root .
   cautilus doctor --repo-root .
   cautilus doctor --repo-root . --next-action
   ```

The starter ships a `node -e` smoke placeholder for `eval_test_command_templates`, so `doctor` returns `ready` immediately.
Treat that as bootstrap help, not product-behavior proof.
Replace the placeholder with a host-owned command template that `cautilus evaluate fixture` can invoke over time.

## Run the workflow entry point

`input.json` is a copy of the canonical workflow normalization fixture that ships with Cautilus (kept byte-identical by a drift test).
Use it to confirm the pipeline is wired, then substitute your own run summaries:

```bash
cautilus discover scenarios normalize workflow --input input.json
```

Each run summary needs `targetId`, `status` (`blocked`, `degraded`, `failed`, or `passed`), `surface`, and `blockedSteps` where progress stalled.
Runs with repeated blocked steps become `operator_workflow_recovery` candidates.

See [workflow-normalization.md](../../../docs/contracts/workflow-normalization.md) for the full input shape.

## Next

- Replace the smoke placeholders with real commands.
- Feed your own automation run summaries into `cautilus discover scenarios normalize workflow`.
- When the helper flags a blocker pattern, pipe the proposals into `cautilus discover scenarios propose` to produce a repeatable recovery scenario.
