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

The checked-in fixture suite is intentionally narrow.
It carries one product hypothesis: cautilus's own real `AGENTS.md` should steer the agent's first routing decision in line with the repo's stated contract.

Mechanical capabilities of the runner — alternative root filename conventions, nested overrides, linked progressive-disclosure follow-up docs, and `AGENTS.md` ↔ `CLAUDE.md` symlinks — are exercised through unit tests on `instruction-surface-support.mjs`, not through the on-demand self-dogfood fixture.
Host repos still declare equivalent local instruction aliases through adapter-owned configuration when their own conventions differ.

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
- The surface stays archetype-neutral and the runner still supports `CLAUDE.md`, symlinks, nested instruction files, and linked follow-up docs at the schema level.
  Whether each of those mechanical capabilities deserves a dogfood-level fixture is a content decision the suite expresses, not a contract claim.
- The surface is currently first-class and separate from `skill evaluate`.
  Whether to keep it separate or fold it into a chatbot-shaped system-prompt evaluation is left as an explicit redesign question (see `Open Redesign`).
- The first self-dogfood pass uses `Cautilus` itself as the initial real consumer while keeping the contract repo-agnostic.

## Open Redesign

The current self-dogfood suite carries one product hypothesis and routes mechanical capability checks back to unit tests.
Before broadening the suite again, the surface itself needs a redesign pass:

- Is `instruction-surface` evaluation conceptually a special shape of chatbot system-prompt evaluation, or a separate first-class surface?
- If it stays separate, what dimensions (routing fidelity, contract adherence, progressive disclosure, scope-boundary fidelity) should each have a dedicated dogfood fixture using cautilus's real instruction surface and real linked docs?
- If it folds into chatbot evaluation, how does the chatbot surface accept a workspace-shaped system prompt (file tree with overlays / nesting / symlinks) instead of a plain string?

Resolve the redesign question before adding new fixtures to the suite.
