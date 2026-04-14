# Consumer Migration

This note describes how a host repo adopts `Cautilus` as a standalone binary
and skill without widening adapter discovery.

For the shortest end-to-end onboarding path, see
[external-consumer-onboarding.md](./external-consumer-onboarding.md).

## Fixed Rules

- `cautilus --version` must work on `PATH` before any consumer adapter or skill
  wiring is treated as valid.
- The only official root adapter name is `cautilus-adapter.yaml`.
- The only official named-adapter directory is `cautilus-adapters/`.
- Host repos keep prompts, fixtures, wrappers, policy, and operator-facing
  workflow details local.
- `Cautilus` only owns the generic workflow contract, CLI, and normalization
  helpers.

## Migration Checklist

1. Add a checked-in root adapter at `.agents/cautilus-adapter.yaml`.
2. If the repo has multiple evaluation surfaces, add named adapters under
   `.agents/cautilus-adapters/`.
3. Keep any existing `*-adapter.yaml` files only if they remain host-local
   tools. Do not rely on them for `Cautilus` discovery.
4. Point the root adapter at checked-in host-owned prompt files, schema files,
   wrappers, and command templates.
5. Install the repo-local skill surface with `cautilus install --repo-root .` when
   the host environment wants a checked-in reusable `Cautilus` skill.
6. Run `cautilus doctor --repo-root <repo>` and require `ready`
   before claiming live-consumer status.
7. Add at least one repo-local executable check that exercises the adapter
   through `Cautilus` rather than only validating static YAML.
8. Keep host-specific mining, storage, audit UI, and operator policy in the
   consumer repo until they are intentionally generalized.

## Root Adapter Split Rule

The root `cautilus-adapter.yaml` should stay the default operator entrypoint.
Move work into named `cautilus-adapters/` when:

- the repo needs two different default decisions, for example release gating
  versus workflow-smoke diagnosis
- one surface needs different prompts, schemas, executor variants, or report
  paths than the default surface
- the root adapter starts mixing unrelated artifacts or human-review questions
- operators would need repo lore to know which commands in the root adapter
  actually matter for the default path

Keep the root adapter lean.
It should answer "what is the default `Cautilus` evaluation for this repo?"
without forcing the operator to mentally sort multiple unrelated workflows.

## Repo Notes

### Ceal

- current role: primary live consumer
- keep using it to prove `adapter resolve`, `adapter init`, `doctor`, and
  `review variants`
- migrate generic runtime seams first, not Ceal's storage or audit surfaces

### Charness

- current role: live consumer and primary `skill` normalization reference
- current state: root `cautilus-adapter` exists and points at the repo-owned
  quality gate
- boundary note:
  [docs/charness-consumer-boundary.md](./charness-consumer-boundary.md)
- split trigger: add named adapters once charness needs a second operator
  decision beyond the current default quality gate
- do not treat `quality-adapter.yaml` as the product contract

### Crill

- current role: live consumer and durable-workflow normalization reference
- current state: root `cautilus-adapter` exists and points at repo-wide
  validation plus workflow review
- split trigger: add named adapters once repo-wide validation and workflow
  review need distinct prompts, report paths, or recommendation logic
- keep single-purpose local adapters if they help operators, but wire one
  explicit `Cautilus` entrypoint

## Acceptance

A repo counts as a live `Cautilus` consumer only when all of the following are
true:

- `doctor` returns `ready`
- the repo has a checked-in `cautilus-adapter.yaml`
- at least one real `Cautilus` runtime path is exercised in tests or CI
- product claims no longer depend on repo-specific discovery exceptions
