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

## Deprecated Surface Names

The product owns the behavior-surface vocabulary in
`cautilus.behavior_intent.v1`. The schema version stays at `v1`, but
some surface strings have been renamed for archetype-vocabulary
hygiene. Old names still work as deprecated input aliases — Cautilus
silently normalizes them — but new emitters should use the canonical
name.

| Deprecated name (still accepted on input) | Canonical name |
| --- | --- |
| `workflow_conversation` | `conversation_continuity` |

Host fixtures, evidence packets, and prompt templates that emit a
deprecated name keep working with no migration step required. The
recommended action is to update emitters at the next routine touch so
the alias map can eventually retire.

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

Consumer archetype evidence (chatbot, skill-validation, durable-workflow) is
grouped in [consumer-readiness.md](./consumer-readiness.md). Specific consumer
repo names stay in that appendix rather than becoming part of the product
vocabulary here.

## Acceptance

A repo counts as a live `Cautilus` consumer only when all of the following are
true:

- `doctor` returns `ready`
- the repo has a checked-in `cautilus-adapter.yaml`
- at least one real `Cautilus` runtime path is exercised in tests or CI
- product claims no longer depend on repo-specific discovery exceptions
