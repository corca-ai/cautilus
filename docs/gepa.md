# GEPA-Style Prompt Search

`Cautilus` includes a bounded prompt search seam above the one-shot optimization flow.
It is inspired by DSPy's `GEPA`, adapted to Cautilus's file-based, consumer-owned boundary rather than importing DSPy's runtime directly.

## Current search behavior

- `cautilus optimize search prepare-input` materializes a canonical search packet from explicit optimize, held-out, and review evidence.
- `cautilus optimize search run` keeps a seed candidate, evolves a bounded multi-generation frontier with reflective prompt mutations, can synthesize one bounded merge candidate from complementary parents, reevaluates candidates on held-out scenarios, can run review checkpoints either across ranked frontier finalists or at frontier-promotion time, runs final-only full-gate checkpoints across ranked frontier finalists, and selects from a Pareto-style frontier over per-scenario scores.
- Cost and latency are recorded as telemetry and tie-break signals rather than dominating the primary behavior objective.
  Declared selection caps make over-budget candidates ineligible for final selection without removing them from the frontier search record.
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

## Scope and bounds

This is intentionally a bounded first slice, not the final word on prompt evolution.
The current implementation closes multi-generation reflective mutation, bounded two- or three-parent merge synthesis, held-out reevaluation, frontier-promotion review checkpoints, scenario-aware checkpoint-feedback reinjection, scenario-aware bounded merge selection, scenario-aware merge-prompt feedback from rejected frontier siblings, severity-aware retention for review-rejected lineage, final-only checkpoint fallback, selection-cap filtering across ranked frontier finalists, search-readiness blocking, and proposal bridging.

Later slices can still add richer merge heuristics and stronger self-dogfood loops.
