# Scenario Proposal Normalization Seam

Host repos own the step that turns raw recent activity into normalized proposal
candidates.

`Cautilus` does not yet own those heuristics, but it should provide one bounded
reference seam that proves how host-owned normalized sources become the input
packet consumed by `cautilus scenario propose`.

## Scope

This seam owns:

- a reference command that assembles split normalized sources into one
  `cautilus.scenario_proposal_inputs.v1` packet
- the split-file boundary between host-owned candidate mining and
  product-owned proposal generation

This seam does not own:

- raw log mining or clustering heuristics
- storage-specific readers for Slack, host audit logs, or other host systems

## Reference Command

The first executable reference surface is:

```bash
cautilus scenario prepare-input \
  --candidates ./fixtures/scenario-proposals/candidates.json \
  --registry ./fixtures/scenario-proposals/registry.json \
  --coverage ./fixtures/scenario-proposals/coverage.json \
  --family fast_regression \
  --window-days 14 \
  --now 2026-04-11T00:00:00.000Z \
  --output /tmp/scenario-proposal-input.json
```

This command is intentionally narrow:

- `--candidates` points at normalized proposal candidates
- `--registry` points at the current scenario registry view
- `--coverage` points at recent execution counts
- `--family`, `--window-days`, and `--now` add packet-level metadata

The command emits a single `cautilus.scenario_proposal_inputs.v1` packet that
can be passed directly to `cautilus scenario propose`.

## Split Source Files

The first reference seam expects JSON arrays in three separate files.

`candidates.json`:

```json
[
  {
    "proposalKey": "review-after-retro",
    "title": "Refresh review-after-retro scenario from recent activity",
    "family": "fast_regression",
    "name": "Review After Retro",
    "description": "The user pivots from retro back to review in one thread.",
    "brief": "Recent activity shows a retro turn followed by a review turn.",
    "evidence": []
  }
]
```

`registry.json`:

```json
[
  {
    "scenarioId": "review-after-retro",
    "scenarioKey": "review-after-retro",
    "family": "fast_regression"
  }
]
```

`coverage.json`:

```json
[
  {
    "scenarioKey": "review-after-retro",
    "recentResultCount": 2
  }
]
```

## Fixed Decisions

- Host repos still own normalization heuristics before `candidates.json`
  exists.
- The first executable seam is file-based and explicit, not hidden behind a
  repo-local database query or storage SDK.
- `scenario prepare-input` is a reference assembler, not a mining engine.
- `scenario propose` stays downstream of this seam.

## Probe Questions

- Should a later version also accept stdin or directories instead of explicit
  file flags?
- Should family metadata stay CLI flags, or move fully into checked-in source
  files?

## Deferred Decisions

- any generic library helpers for mapping raw source ports into
  `candidates.json`
- whether `scenario prepare-input` should eventually move registry and coverage
  path discovery into adapter config

## Source References

- [scenario-proposal-sources.md](./scenario-proposal-sources.md)
- [scenario-proposal-inputs.md](./scenario-proposal-inputs.md)
- [build-scenario-proposal-input.mjs](../../../../scripts/agent-runtime/build-scenario-proposal-input.mjs)
