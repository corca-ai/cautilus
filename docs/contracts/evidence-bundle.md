# Evidence Bundle

`Cautilus` owns a normalized evidence-bundle seam above host-owned raw readers.

The host repo still owns:

- raw log readers
- storage and trace access
- app- or runtime-specific extraction logic

`Cautilus` owns the portable packet boundary that combines normalized sources
before scenario mining or optimization.

## Input Packet

Use `cautilus.evidence_bundle_inputs.v1` for explicit normalized inputs.

The packet may include:

- `cautilus.report_packet.v1`
- `cautilus.scenario_results.v1`
- host-normalized run-audit JSON summary
- `cautilus.scenario_history.v1`
- product-owned objective and constraints

Current surface:

```bash
node ./bin/cautilus evidence prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --scenario-results-file /tmp/cautilus-mode/held_out-scenario-results.json \
  --run-audit-file /tmp/cautilus-run-audit/run-audit-summary.json \
  --history-file /tmp/cautilus-history/scenario-history.snapshot.json
```

## Bundle Packet

Use `cautilus.evidence_bundle.v1` for the merged evidence packet.

The bundle includes:

- source file references
- prioritized normalized signals
- source-kind and severity summary
- bounded mining focus and loop rules

Current surface:

```bash
node ./bin/cautilus evidence bundle \
  --input /tmp/cautilus-evidence/input.json
```

## Guardrails

- Keep raw-reader ownership host-side.
- Do not infer hidden evidence from shell history.
- Use explicit files and explicit schema versions.
- Treat the bundle as bounded evidence for the next slice, not an open-ended
  retry loop.
