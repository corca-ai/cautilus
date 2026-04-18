# GEPA-Style Prompt Search

`Cautilus` includes a bounded prompt search seam above the one-shot optimization flow.
It is inspired by DSPy's `GEPA`, adapted to Cautilus's file-based, consumer-owned boundary rather than importing DSPy's runtime directly.

## Current search behavior

- `cautilus optimize search prepare-input` materializes a canonical search packet from explicit optimize, held-out, and review evidence.
- Adapters may override the repo's default search tier and per-tier search limits through `optimize_search`, while the product still keeps the shared tier labels `light`, `medium`, and `heavy`.
- `cautilus optimize search run` currently keeps a seed candidate, attempts one bounded reflective mutation above that seed, reevaluates the candidate on held-out scenarios, and selects from a Pareto-style frontier over per-scenario scores.
- Cost and latency are recorded as telemetry and late tie-break signals rather than dominating the primary behavior objective.
- The canonical search packet records `searchConfigSources` so the operator can see which search knobs came from product defaults, adapter presets, or explicit overrides.
- Sparse evidence blocks search early with machine-readable JSON so an agent or operator can discuss what is missing before generating candidates.
- The selected candidate bridges back into the bounded `cautilus optimize propose` and `cautilus optimize build-artifact` flow.

## Commands

Run the GEPA-style bounded prompt search seam above an optimize packet:

```bash
cautilus optimize search prepare-input \
  --optimize-input /tmp/cautilus-optimize/input.json \
  --held-out-results-file /tmp/cautilus-mode/held_out-scenario-results.json \
  --budget medium

cautilus optimize search run \
  --input /tmp/cautilus-run/optimize-search-input.json

cautilus optimize propose \
  --from-search /tmp/cautilus-run/optimize-search-result.json
```

If the repo is not search-ready yet, `optimize search run` returns a blocked machine-readable result instead of improvising candidate prompts from weak evidence.

For `light` searches, the default review checkpoint policy stays `final_only`.
For `medium` and `heavy`, it defaults to `frontier_promotions` unless overridden explicitly.
Merge remains opt-in through the resolved search packet.
The current runner preserves merge intent in the packet, but does not yet synthesize merge candidates from it.

## Scope and bounds

This is intentionally a bounded first slice, not the final word on prompt evolution.
The current implementation closes packet assembly, adapter-owned budget preset resolution, truthful machine-readable Codex token telemetry capture, one reflective mutation attempt above the seed candidate, held-out reevaluation, search-readiness blocking, and proposal bridging.

Later slices can still add true multi-generation execution, merge synthesis, selection-cap enforcement, richer checkpoint runners, and stronger self-dogfood loops.
