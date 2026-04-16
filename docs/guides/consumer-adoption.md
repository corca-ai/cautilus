# Consumer Adoption

This guide is the shortest honest path for adopting `Cautilus` in a fresh consumer repo without repo-local lore.
It combines the old onboarding path and the standing migration rules in one place.

Use [install.md](../../install.md) for machine-level installation.
Use [consumer-readiness.md](../maintainers/consumer-readiness.md) for checked-in proof and release-time evidence.

## Goal

Start from:

- a machine where `cautilus --version` already works on `PATH`
- an empty or newly created consumer repo

End at:

- a checked-in `.agents/cautilus-adapter.yaml`
- a checked-in `.agents/skills/cautilus/` tree
- `cautilus doctor --repo-root <repo>` returning `ready` after the repo adds at least one runnable command template or executor variant

## Fixed Rules

- `cautilus --version` must work on `PATH` before any consumer adapter or skill wiring is treated as valid.
- The only official root adapter name is `cautilus-adapter.yaml`.
- The only official named-adapter directory is `cautilus-adapters/`.
- Host repos keep prompts, fixtures, wrappers, policy, and operator-facing workflow details local.
- `Cautilus` only owns the generic workflow contract, CLI, and normalization helpers.

## Operator Path

Inside the consumer repo:

```bash
cautilus install --repo-root .
cautilus adapter init --repo-root .
cautilus adapter resolve --repo-root .
cautilus doctor --repo-root .
```

What each step proves:

1. `install` materializes the bundled skill into `.agents/skills/cautilus/` and creates the Claude compatibility shim.
2. `adapter init` creates the canonical root adapter path: `.agents/cautilus-adapter.yaml`.
3. Fill in at least one runnable command template or executor variant in the generated adapter so the repo declares a real execution surface.
4. `adapter resolve` proves the repo now satisfies official adapter discovery.
5. `doctor` proves the repo is ready against the checked-in contract.
   The ready payload points at `cautilus scenarios`, which prints the three first-class evaluation archetypes plus an example input path and next-step CLI per archetype.

## Migration Checklist

1. Add a checked-in root adapter at `.agents/cautilus-adapter.yaml`.
2. If the repo has multiple evaluation surfaces, add named adapters under `.agents/cautilus-adapters/`.
3. Keep any existing `*-adapter.yaml` files only if they remain host-local tools.
4. Point the root adapter at checked-in host-owned prompt files, schema files, wrappers, and command templates.
5. Install the repo-local skill surface with `cautilus install --repo-root .` when the host environment wants a checked-in reusable `Cautilus` skill.
6. Run `cautilus doctor --repo-root <repo>` and require `ready` before claiming live-consumer status.
7. Add at least one repo-local executable check that exercises the adapter through `Cautilus` rather than only validating static YAML.
8. Keep host-specific mining, storage, audit UI, and operator policy in the consumer repo until they are intentionally generalized.

## Git Precondition

`cautilus doctor --scope repo` requires the target directory to be a git repository with at least one commit.
Non-git directories receive `status: "missing_git"` and `ready: false`.
Empty git repositories receive `status: "no_commits"`.
This does not affect `cautilus install` or `cautilus adapter init`, which still work without git.

## Named Adapter Split Rule

The root `cautilus-adapter.yaml` should stay the default operator entrypoint.
Move work into named `cautilus-adapters/` when:

- the repo needs two different default decisions, for example release gating versus workflow-smoke diagnosis
- one surface needs different prompts, schemas, executor variants, or report paths than the default surface
- the root adapter starts mixing unrelated artifacts or human-review questions
- operators would need repo lore to know which commands in the root adapter actually matter for the default path

Keep the root adapter lean.
It should answer "what is the default `Cautilus` evaluation for this repo?" without forcing the operator to mentally sort multiple unrelated workflows.

## Product-Owned Smoke Helper

To prove the onboarding path end-to-end without mutating a real consumer repo:

```bash
npm run consumer:onboard:smoke
```

This helper:

- creates a temp git repo
- runs `cautilus install --repo-root <temp-repo>`
- runs `cautilus adapter init --repo-root <temp-repo>`
- seeds one minimal `held_out_command_templates` entry into the generated adapter so the repo reaches `doctor ready`
- runs `cautilus adapter resolve --repo-root <temp-repo>`
- runs `cautilus doctor --repo-root <temp-repo>`

## Deprecated Surface Names

The product owns the behavior-surface vocabulary in `cautilus.behavior_intent.v1`.
The schema version stays at `v1`, but some surface strings have been renamed for archetype-vocabulary hygiene.
Old names still work as deprecated input aliases, and Cautilus silently normalizes them, but new emitters should use the canonical name.

| Deprecated name (still accepted on input) | Canonical name |
| --- | --- |
| `workflow_conversation` | `conversation_continuity` |

## Acceptance

A repo counts as a live `Cautilus` consumer only when all of the following are true:

- `doctor` returns `ready`
- the repo has a checked-in `cautilus-adapter.yaml`
- at least one real `Cautilus` runtime path is exercised in tests or CI
- product claims no longer depend on repo-specific discovery exceptions

## Boundaries

This guide does not claim:

- that the default generated adapter is sufficient for a real consumer workflow
- that prompts, wrappers, or executor variants are already consumer-complete
- that any repo-specific quality gate has been configured
