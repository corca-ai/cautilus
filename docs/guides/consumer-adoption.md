# Consumer Adoption

This guide is the shortest honest path for adopting `Cautilus` in a fresh consumer repo without repo-local lore.
It combines the old onboarding path and the standing migration rules in one place.

Treat this page as the canonical fresh-consumer bootstrap path once `cautilus --version` already works on `PATH`.
Use `docs/maintainers/consumer-readiness.md` for checked-in proof and release-time evidence.

## Goal

Start from:

- a machine where `cautilus --version` already works on `PATH`
- an empty or newly created consumer repo

End at:

- a checked-in `.agents/cautilus-adapter.yaml`
- a checked-in `.agents/skills/cautilus-agent/` tree
- `cautilus doctor --next-action` returning the smallest honest next step while wiring remains incomplete
- `cautilus doctor` returning `ready` after the repo adds at least one runnable command template or executor variant and satisfies the git precondition

## Fixed Rules

- `cautilus --version` must work on `PATH` before any consumer adapter or skill wiring is treated as valid.
- The only official root adapter name is `cautilus-adapter.yaml`.
- The only official named-adapter directory is `cautilus-adapters/`.
- Host repos keep prompts, fixtures, wrappers, policy, and operator-facing workflow details local.
- `Cautilus` only owns the generic workflow contract, CLI, and normalization helpers.

## Operator Path

Inside the consumer repo:

```bash
cautilus init
cautilus doctor
cautilus doctor --next-action
```

What each step proves:

1. `install` materializes the Cautilus Agent into `.agents/skills/cautilus-agent/` and creates the Claude compatibility shim.
2. `doctor` is the full state surface: it tells you whether git is ready, whether the Cautilus Agent is present, whether the default adapter exists, and whether the repo already has a runnable evaluation path.
3. `doctor --next-action` narrows that full state down to one current action plus the exact doctor command to continue with.
4. Follow that loop until `doctor` returns `ready`.
5. `doctor` then proves the repo is ready against the checked-in runtime contract.
   The ready payload now includes `first_bounded_run`, which adds a starter `evaluate fixture -> evaluate observation` packet loop and keeps the `cautilus discover scenarios` catalog nearby only for proposal-input examples.
   If the repo intentionally keeps only named adapters under `.agents/cautilus-adapters/`, use `cautilus doctor --adapter-name <name>` for repo-scope validation.
6. After repo-scope `doctor` is ready, run one bounded evaluation path rather than stopping at wiring.
   Use `first_bounded_run.decisionLoopCommands[*]` for the generic packet loop, and use `first_bounded_run.normalizationFamilies[*].exampleInputCli` only when you want a minimal scenario-normalization packet before reaching for repo-local fixtures.
   If the adapter declares `evaluation_input_default`, the fixture command points at that checked-in default directly; otherwise choose the host-owned fixture before running it.
   The fresh-consumer smoke follows the same loop through `evaluate observation`, so the checked-in capture proves the packet recheck, not only runner invocation.
7. If the repo already knows whether it is starting from chatbot, skill, or workflow behavior, start from the matching [starter kit](../../examples/starters/) instead of hand-authoring the first adapter.
   The starter placeholders prove wiring only; replace them with host-owned runners before claiming real behavior coverage.

## Migration Checklist

1. Add a checked-in root adapter at `.agents/cautilus-adapter.yaml`.
2. If the repo has multiple evaluation surfaces, add named adapters under `.agents/cautilus-adapters/`.
3. Keep any existing `*-adapter.yaml` files only if they remain host-local tools.
4. Point the root adapter at checked-in host-owned prompt files, schema files, wrappers, and command templates.
5. Install the repo-local skill surface with `cautilus init` when the host environment wants a checked-in reusable `Cautilus` skill.
6. Run `cautilus doctor --next-action` after install and keep following it until `cautilus doctor` returns `ready`.
7. Run `cautilus doctor` and require `ready` before claiming live-consumer status.
8. Add at least one repo-local executable check that exercises the adapter through `Cautilus` rather than only validating static YAML.
9. Keep host-specific mining, storage, audit UI, and operator policy in the consumer repo until they are intentionally generalized.

## Git Precondition

`cautilus doctor --scope repo` requires the target directory to be a git repository with at least one commit.
Non-git directories receive `status: "missing_git"` and `ready: false`.
Empty git repositories receive `status: "no_commits"`.
This does not affect `cautilus init`, `cautilus doctor --scope agent-surface`, or `cautilus init adapter`, which still work without git.

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
- runs `cautilus init` inside that temp repo
- runs `cautilus init adapter` inside that temp repo
- seeds one minimal `eval_test_command_templates` entry into the generated adapter so the repo reaches `doctor ready`
- runs `cautilus doctor adapter` inside that temp repo
- runs `cautilus doctor` inside that temp repo
- runs `cautilus evaluate fixture --fixture <fixture.json>` inside that temp repo
- runs `cautilus evaluate observation --input <eval-observed.json> --output <eval-summary.recheck.json>` against the observed packet
- proves the fresh consumer reaches one bounded fixture summary and one packet recheck summary instead of stopping at wiring

To prove the shipped normalization-family starters without mutating a consumer repo:

```bash
npm run consumer:starters:smoke
```

This helper checks [examples/starters/](../../examples/starters/) and requires all three starter kits to resolve, reach `doctor ready`, and emit at least one normalized scenario candidate.

## Deprecated Surface Names

The product owns the behavior-surface vocabulary in `cautilus.behavior_intent.v1`.
The schema version stays at `v1`, but some surface strings have been renamed for legacy vocabulary hygiene.
Old names still work as deprecated input aliases, and Cautilus silently normalizes them, but new emitters should use the canonical name.

| Deprecated name (still accepted on input) | Canonical name |
| --- | --- |
| `workflow_conversation` | `conversation_continuity` |

## Acceptance

A repo counts as a live `Cautilus` consumer only when all of the following are true:

- the `doctor --next-action` loop no longer reports setup work
- `doctor` returns `ready`
- the repo has a checked-in `cautilus-adapter.yaml`
- at least one real `Cautilus` runtime path is exercised in tests or CI
- product claims no longer depend on repo-specific discovery exceptions

## Boundaries

This guide does not claim:

- that the default generated adapter is sufficient for a real consumer workflow
- that prompts, wrappers, or executor variants are already consumer-complete
- that any repo-specific quality gate has been configured
