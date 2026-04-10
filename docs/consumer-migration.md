# Consumer Migration

This note describes how a host repo adopts `Cautilus` as a standalone binary
and skill without widening adapter discovery.

## Fixed Rules

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
5. Run `node ./bin/cautilus doctor --repo-root <repo>` from the `Cautilus`
   repo and require `ready` before claiming live-consumer status.
6. Add at least one repo-local executable check that exercises the adapter
   through `Cautilus` rather than only validating static YAML.
7. Keep host-specific mining, storage, audit UI, and operator policy in the
   consumer repo until they are intentionally generalized.

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
- next likely step: split richer evaluator surfaces into named
  `cautilus-adapters/`
- do not treat `quality-adapter.yaml` as the product contract

### Crill

- current role: live consumer and durable-workflow normalization reference
- current state: root `cautilus-adapter` exists and points at repo-wide
  validation plus workflow review
- next likely step: split more targeted evaluator surfaces out of the root
  adapter only when the default surface becomes overloaded
- keep single-purpose local adapters if they help operators, but wire one
  explicit `Cautilus` entrypoint

## Acceptance

A repo counts as a live `Cautilus` consumer only when all of the following are
true:

- `doctor` returns `ready`
- the repo has a checked-in `cautilus-adapter.yaml`
- at least one real `Cautilus` runtime path is exercised in tests or CI
- product claims no longer depend on repo-specific discovery exceptions
