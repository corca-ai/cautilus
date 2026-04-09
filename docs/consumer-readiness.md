# Consumer Readiness

This note records how `Cautilus` currently maps onto the three intended test
targets under `~/`:

- `ceal`
- `charness`
- `crill`

The goal is to keep product claims honest.
`Cautilus` should not pretend every reference repo is already a full live
consumer when some of them currently serve only as normalization-shape
references.

## Snapshot

The checks below were recorded on 2026-04-09 UTC with the current
`/home/ubuntu/cautilus/bin/cautilus` binary.

## Ceal

Current role: live consumer

Evidence:

- `node ./bin/cautilus doctor --repo-root /home/ubuntu/ceal`
  returns `ready`
- checked-in adapter:
  [/home/ubuntu/ceal/.agents/workbench-adapter.yaml](/home/ubuntu/ceal/.agents/workbench-adapter.yaml)
- checked-in named adapters:
  [/home/ubuntu/ceal/.agents/workbench-adapters/code-quality.yaml](/home/ubuntu/ceal/.agents/workbench-adapters/code-quality.yaml)
  and
  [/home/ubuntu/ceal/.agents/workbench-adapters/skill-smoke.yaml](/home/ubuntu/ceal/.agents/workbench-adapters/skill-smoke.yaml)

What this means:

- `ceal` is the first repo that already satisfies the current adapter discovery
  contract.
- It remains the primary live test target for adapter resolve/init/doctor and
  review-variant surfaces.
- It is also the primary reference for `chatbot` normalization behavior.

## charness

Current role: normalization-shape reference, not yet a live `Cautilus`
consumer

Evidence:

- `node ./bin/cautilus doctor --repo-root /home/ubuntu/charness`
  returns `missing_adapter`
- checked-in adapter-like asset:
  [/home/ubuntu/charness/.agents/quality-adapter.yaml](/home/ubuntu/charness/.agents/quality-adapter.yaml)
- no checked-in
  [/home/ubuntu/charness/.agents/workbench-adapter.yaml](/home/ubuntu/charness/.agents/workbench-adapter.yaml)

What this means:

- `charness` already contains durable evaluation and adapter-shaped metadata,
  but not in the current `workbench-adapter` discovery path that `Cautilus`
  expects.
- It is a valid reference for `skill` normalization inputs, especially public
  skill, profile, and validation drift patterns.
- It should not yet be described as a full standalone binary consumer without
  either:
  - adding a real `workbench-adapter` surface, or
  - explicitly broadening `Cautilus` discovery rules beyond the current
    contract

## crill

Current role: normalization-shape reference, not yet a live `Cautilus`
consumer

Evidence:

- `node ./bin/cautilus doctor --repo-root /home/ubuntu/crill`
  returns `missing_adapter`
- checked-in adapter-like assets include:
  [/home/ubuntu/crill/.agents/concept-review-adapter.yaml](/home/ubuntu/crill/.agents/concept-review-adapter.yaml)
  and other single-purpose `*-adapter.yaml` files
- no checked-in
  [/home/ubuntu/crill/.agents/workbench-adapter.yaml](/home/ubuntu/crill/.agents/workbench-adapter.yaml)

What this means:

- `crill` is a strong reference for blocked durable workflow artifacts, replay
  seed regressions, and operator-recovery patterns.
- It is not yet a live adapter consumer under the current `Cautilus`
  discovery rules.
- The repo is useful now as a `skill` normalization reference, not as proof
  that the current adapter contract is already sufficient for every consumer.

## Product Positioning

Right now the honest product stance is:

- `ceal` is the live adapter consumer
- `charness` is the primary skill-validation normalization reference
- `crill` is the primary durable-workflow normalization reference

This split is acceptable.
It keeps the product boundary clean while still grounding the normalization
layer in multiple real repos.

## Near-Term Implications

1. Keep proving live binary/skill behavior against `ceal`.
2. Keep checked-in consumer-shaped normalized packet examples for
   `ceal`, `charness`, and `crill`.
3. Do not claim `charness` or `crill` are full adapter consumers until the
   adapter-discovery contract is intentionally widened or those repos gain a
   real `workbench-adapter` surface.
