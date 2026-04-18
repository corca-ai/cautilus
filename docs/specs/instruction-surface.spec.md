# Instruction Surface

`Cautilus` treats repository instruction files as a first-class evaluation surface.
The narrow claim is not "AGENTS.md exists."
The claim is that the effective instruction surface gives an agent enough truthful routing and boundary information to start in the right place, follow progressive disclosure, and avoid needless improvisation.

The effective instruction surface may include:

- a root `AGENTS.md`
- a root `CLAUDE.md`
- a symlink between them
- nested instruction files inside subdirectories
- linked repo-local follow-up docs that the instruction file intentionally points at

## Intent

This surface should answer bounded behavioral questions such as:

- does the agent find the right entry instruction surface before improvising a repo-local workflow?
- does the agent follow nested instruction overrides without inflating them into repo-wide policy?
- does the agent follow progressive disclosure and read the next linked doc only when needed?
- does the agent prefer installed shared skills before inventing a local replacement?
- does the instruction surface help the agent distinguish source-of-truth docs from secondary notes?

The target is instruction-surface fidelity, not generic doc quality.

## Shipped Surface

The product-owned first slice is:

`checked-in instruction-surface cases -> cautilus instruction-surface test -> observed instruction-surface input -> cautilus instruction-surface evaluate -> instruction-surface summary`

The shipped contracts are:

- [docs/contracts/instruction-surface.md](../contracts/instruction-surface.md)
- `cautilus.instruction_surface_cases.v1`
- `cautilus.instruction_surface_inputs.v1`
- `cautilus.instruction_surface_summary.v1`

The current CLI entrypoints are:

```bash
./bin/cautilus instruction-surface test --repo-root . --adapter-name self-dogfood-instruction-surface
./bin/cautilus instruction-surface evaluate --input ./fixtures/instruction-surface/input.json
```

## Evidence Boundary

The first slice treats instruction-surface artifacts as bounded product-visible evidence.
The observed packet can include:

- the root instruction file actually in use
- any nested instruction file relevant to the scoped task path
- a small bounded set of linked follow-up docs
- the first routing decision
  - including a bootstrap helper and durable work skill as separate lanes when both are honest facts

The packet must not slurp the whole repo.
Instruction-surface evaluation is only useful when the evidence stays bounded and legible.

## Fixture Shapes

The checked-in fixture suite covers these shapes:

1. root `AGENTS.md` only
2. root `CLAUDE.md` only
3. root instruction file plus nested instruction override
4. root instruction file plus linked progressive-disclosure doc
5. root `AGENTS.md` symlinked to `CLAUDE.md`

The product still permits host repos to declare equivalent local instruction aliases through adapter-owned configuration instead of forcing one filename convention.

## Review Questions

The first review surface stays narrow.
It asks whether the current instruction surface helps an agent:

- start from the right file
- escalate to the next linked file only when the task needs it
- prefer installed shared skills before repo-local improvisation
- respect nested scope boundaries

It does not ask for an open-ended judgment of the whole repo handbook.

## Premortem

This surface fails if any of these become true:

1. it becomes a broad prose-quality review of repo markdown
2. it quietly privileges `AGENTS.md` and stops measuring `CLAUDE.md`, symlinks, nested overrides, or linked docs
3. it scores static file presence instead of the first routing move
4. it destroys the bounded evidence story by reading the whole repo

The shipped case suite, observed packet, and summary are intentionally narrow so those failure modes remain visible.

## Non-Goals

This surface should not become:

- a broad prose-quality review of every markdown file in the repo
- a style guide for how every repo must name its instruction files
- a claim that `AGENTS.md` is always the only canonical filename
- a substitute for binary, skill, or self-dogfood proofs

## Decisions

- `instruction-surface` is the preferred product name for this boundary.
- The surface is broader than `AGENTS.md` and covers `CLAUDE.md`, symlinks, nested instruction files, and progressive disclosure.
- The surface is first-class and separate from `skill evaluate`.
- The first self-dogfood pass uses `Cautilus` itself as the initial real consumer while keeping the contract repo-agnostic.
