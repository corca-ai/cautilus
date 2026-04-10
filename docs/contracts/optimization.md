# Optimization

`Cautilus` should expose one bounded optimization seam above explicit report,
review, and history evidence.

The goal is not an open-ended self-improvement loop.
The goal is to turn explicit evaluation evidence into one conservative next
revision brief that still respects held-out, comparison, and structured review
gates.

## Input Packet

Use `cautilus.optimize_inputs.v1` for the prepare-input boundary.

The packet should include:

- repo root
- optimization target: `prompt` or `adapter`
- optional current target file reference
- one explicit `cautilus.report_packet.v1`
- optional executor-variant review summary
- optional `cautilus.scenario_history.v1`
- product-owned objective and guardrail constraints

Current surface:

```bash
node ./bin/cautilus optimize prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --review-summary /tmp/cautilus-review/summary.json \
  --history-file /tmp/cautilus-history/history.json \
  --target prompt
```

## Proposal Packet

Use `cautilus.optimize_proposal.v1` for the deterministic next-revision brief.

The proposal should include:

- optimization target and optional target file reference
- current report recommendation
- a bounded decision: `hold`, `revise`, or `investigate`
- prioritized evidence derived from regressions, review findings, noisy
  surfaces, and recent history misses
- suggested changes with explicit change kinds such as `prompt_revision`,
  `adapter_revision`, `sampling_increase`, or `history_followup`
- one revision brief
- stop conditions and follow-up checks

Current surface:

```bash
node ./bin/cautilus optimize propose \
  --input /tmp/cautilus-optimize/input.json
```

## Guardrails

- Do not treat optimizer output as permission to weaken held-out, comparison,
  or structured review gates.
- Do not turn one bounded revision brief into an infinite retry loop.
- Prefer repairing cited regressions over widening scope.
- Keep consumer prompts, policies, and target files consumer-owned even when
  packet assembly and proposal framing are product-owned.
