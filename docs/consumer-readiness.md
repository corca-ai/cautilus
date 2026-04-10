# Consumer Readiness

This note records how `Cautilus` currently maps onto the three intended test
targets under `~/`:

- `ceal`
- `charness`
- `crill`

The goal is to keep product claims honest.
All three repos now expose an official `cautilus-adapter`, but they do not yet
exercise the same depth of evaluator surface.

## Snapshot

The checks below were recorded on 2026-04-10 UTC with the current
`/home/ubuntu/cautilus/bin/cautilus` binary.

## Ceal

Current role: live consumer

Evidence:

- `node ./bin/cautilus doctor --repo-root /home/ubuntu/ceal`
  returns `ready`
- checked-in adapter:
  [/home/ubuntu/ceal/.agents/cautilus-adapter.yaml](/home/ubuntu/ceal/.agents/cautilus-adapter.yaml)
- checked-in named adapters:
  [/home/ubuntu/ceal/.agents/cautilus-adapters/code-quality.yaml](/home/ubuntu/ceal/.agents/cautilus-adapters/code-quality.yaml)
  and
  [/home/ubuntu/ceal/.agents/cautilus-adapters/skill-smoke.yaml](/home/ubuntu/ceal/.agents/cautilus-adapters/skill-smoke.yaml)

What this means:

- `ceal` is the first repo that already satisfies the current adapter discovery
  contract.
- It remains the primary live test target for adapter resolve/init/doctor and
  review-variant surfaces.
- It is also the primary reference for `chatbot` normalization behavior.

## charness

Current role: live consumer and primary `skill` normalization reference

Evidence:

- `node ./bin/cautilus doctor --repo-root /home/ubuntu/charness`
  returns `ready`
- checked-in `Cautilus` adapter:
  [/home/ubuntu/charness/.agents/cautilus-adapter.yaml](/home/ubuntu/charness/.agents/cautilus-adapter.yaml)
- existing repo-local adapter asset:
  [/home/ubuntu/charness/.agents/quality-adapter.yaml](/home/ubuntu/charness/.agents/quality-adapter.yaml)

What this means:

- `charness` now satisfies the official adapter discovery contract.
- Its current root adapter is intentionally narrow: it lifts the repo-owned
  `quality` gate into one official `Cautilus` entrypoint.
- It remains the primary reference for `skill` normalization inputs, especially
  public skill, profile, and validation drift patterns.

## crill

Current role: live consumer and primary durable-workflow normalization
reference

Evidence:

- `node ./bin/cautilus doctor --repo-root /home/ubuntu/crill`
  returns `ready`
- checked-in `Cautilus` adapter:
  [/home/ubuntu/crill/.agents/cautilus-adapter.yaml](/home/ubuntu/crill/.agents/cautilus-adapter.yaml)
- existing repo-local adapter assets include:
  [/home/ubuntu/crill/.agents/concept-review-adapter.yaml](/home/ubuntu/crill/.agents/concept-review-adapter.yaml)
  and other single-purpose `*-adapter.yaml` files

What this means:

- `crill` now satisfies the official adapter discovery contract.
- Its current root adapter lifts repo-wide validation and workflow review into
  one official `Cautilus` entrypoint.
- It remains the strongest reference for blocked durable workflow artifacts,
  replay seed regressions, and operator-recovery patterns.

## Product Positioning

Right now the honest product stance is:

- `ceal` is the deepest live consumer and the primary `chatbot` reference
- `charness` is a live consumer and the primary skill-validation reference
- `crill` is a live consumer and the primary durable-workflow reference

This split is acceptable.
It keeps one official adapter contract while still grounding the normalization
layer in multiple real repos with different product shapes.

## Near-Term Implications

1. Keep proving the deepest binary/skill behavior against `ceal`.
2. Keep checked-in consumer-shaped normalized packet examples for
   `ceal`, `charness`, and `crill`.
3. Deepen `charness` and `crill` from root-adapter readiness into richer named
   adapters or scenario surfaces where needed.
