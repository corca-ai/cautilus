# External Consumer Onboarding

This note is the shortest honest path for proving that `Cautilus` can adopt a
fresh consumer repo without repo-local lore.

It is not the adapter contract itself.
Use [consumer-migration.md](./consumer-migration.md) for boundary rules and
[install.md](../install.md) for machine-level installation.

## Goal

Start from:

- a machine where `cautilus --version` already works on `PATH`
- an empty or newly created consumer repo

End at:

- a checked-in `.agents/cautilus-adapter.yaml`
- a checked-in `.agents/skills/cautilus/` tree
- `cautilus doctor --repo-root <repo>` returning `ready` after the repo adds at
  least one runnable command template or executor variant

## Operator Path

Inside the consumer repo:

```bash
cautilus install --repo-root .
cautilus adapter init --repo-root .
cautilus adapter resolve --repo-root .
cautilus doctor --repo-root .
```

What each step proves:

1. `install` materializes the bundled skill into `.agents/skills/cautilus/`
   and creates the Claude compatibility shim.
2. `adapter init` creates the canonical root adapter path:
   `.agents/cautilus-adapter.yaml`.
3. fill in at least one runnable command template or executor variant in the
   generated adapter so the repo declares a real execution surface.
4. `adapter resolve` proves the repo now satisfies official adapter discovery.
5. `doctor` proves the repo is ready against the checked-in contract. The
   ready payload now ships a `next_steps` hint pointing at
   `cautilus scenarios`, which prints the three first-class evaluation
   archetypes (chatbot / skill / workflow) plus one example input path
   and next-step CLI per archetype, so an operator can pick which
   normalize command applies without re-reading this doc.

## Product-Owned Smoke Helper

To prove the onboarding path end-to-end without mutating a real consumer repo:

```bash
npm run consumer:onboard:smoke
```

This helper:

- creates a temp git repo
- runs `cautilus install --repo-root <temp-repo>`
- runs `cautilus adapter init --repo-root <temp-repo>`
- seeds one minimal `held_out_command_templates` entry into the generated
  adapter so the repo reaches `doctor ready`
- runs `cautilus adapter resolve --repo-root <temp-repo>`
- runs `cautilus doctor --repo-root <temp-repo>`

Use it when:

- checking that the current standalone binary plus bundled skill still adopt a
  fresh repo cleanly
- validating release candidates on another machine before claiming consumer
  readiness
- confirming that product changes did not reintroduce host-specific paths into
  the onboarding flow

## Boundaries

This onboarding proof does not claim:

- that the default generated adapter is sufficient for a real consumer workflow
- that prompts, wrappers, or executor variants are already consumer-complete
- that any repo-specific quality gate has been configured

It only claims that the product-owned binary and bundled skill can establish
the canonical `Cautilus` starting surface in a new consumer repo and reach
`doctor ready` once one minimal runnable execution path is wired.
