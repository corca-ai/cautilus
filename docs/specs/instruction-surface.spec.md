# Instruction Surface

Status: planned for the next implementation slice.
This page is a design-level contract, not yet a standing shipped proof.
Do not treat it as evidence that the surface is already product-complete.

`Cautilus` should treat repository instruction files as a first-class evaluation surface.
The narrow claim is not "AGENTS.md exists."
The claim is that the effective instruction surface gives an agent enough truthful routing and boundary information to start in the right place, follow progressive disclosure, and avoid needless improvisation.

The effective instruction surface may include:

- a root `AGENTS.md`
- a root `CLAUDE.md`
- a symlink between them
- nested instruction files inside subdirectories
- linked repo-local follow-up docs that the instruction file intentionally points at

## Intended Scope

This surface should answer bounded behavioral questions such as:

- does the agent find the right entry instruction surface before improvising a repo-local workflow?
- does the agent follow nested instruction overrides without inflating them into repo-wide policy?
- does the agent follow progressive disclosure and read the next linked doc only when needed?
- does the agent prefer installed shared skills before inventing a local replacement?
- does the instruction surface help the agent distinguish source-of-truth docs from secondary notes?

The target is instruction-surface fidelity, not generic doc quality.

## Non-Goals

This surface should not become:

- a broad prose-quality review of every markdown file in the repo
- a style guide for how every repo must name its instruction files
- a claim that `AGENTS.md` is always the only canonical filename
- a substitute for binary, skill, or self-dogfood proofs

## Planned Fixture Shapes

The first implementation slice should cover at least these fixture shapes:

1. root `AGENTS.md` only
2. root `CLAUDE.md` only
3. root instruction file plus nested instruction override
4. root instruction file plus linked progressive-disclosure docs

The product should also permit host repos to declare equivalent local instruction aliases through adapter-owned configuration instead of forcing one filename convention.

## Planned Review Questions

The first review surface should stay narrow.
It should ask whether the current instruction surface helps an agent:

- start from the right file
- escalate to the next linked file only when the task needs it
- prefer installed shared skills before repo-local improvisation
- respect nested scope boundaries

It should not ask for an open-ended judgment of the whole repo handbook.

## Planned Evidence Boundary

The first implementation slice should treat instruction files as product-visible artifacts in the same way other first-class surfaces already carry checked-in artifacts.
That means the review packet should be able to include:

- the root instruction file actually in use
- any nested instruction file relevant to the task path
- a small bounded set of linked follow-up docs

The packet should avoid slurping the whole repo.
Instruction-surface evaluation is only useful when the evidence stays bounded and legible.

## Decisions

- `instruction-surface` is the preferred product name for this boundary.
- The surface is broader than `AGENTS.md` and must cover `CLAUDE.md`, symlinks, nested instruction files, and progressive disclosure.
- The first implementation slice should add this as a first-class evaluation surface, not bury it inside generic discoverability prose.
- The first self-dogfood pass should use `Cautilus` itself as the initial real consumer, but the contract must stay repo-agnostic.
