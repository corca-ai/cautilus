# Go Runtime Consolidation

`Cautilus` already ships a Go CLI as the public entrypoint, but several runtime seams still exist as first-class Node runners.
That split weakens the standalone-binary story and keeps process, timeout, and workspace policy duplicated across two implementations.

## Problem

The current product boundary mixes one Go-owned CLI with one still-active Node runtime layer.
That mixed ownership shows up in three ways:

- public and semi-public runtime seams still have direct `node scripts/agent-runtime/...` entrypoints in docs and adapter examples
- shared subprocess and workspace policy has to be enforced in both Go and JS
- future runtime behavior can accidentally drift into the JS layer even when the shipped CLI contract is supposed to be Go-owned

The goal of this slice is not language purity for its own sake.
The goal is to make the shipped runtime contract singular and honest.

## Current Slice

This slice defines how `Cautilus` should converge runtime ownership onto Go without forcing every JS file out of the repo.
The current contract covers:

- which JS runtime seams should move first
- which JS files may remain as tests or maintainer tooling
- which duplicate runtime surfaces should be deleted rather than preserved
- what counts as done for the public runtime boundary

## Fixed Decisions

- The shipped product runtime should be Go-owned wherever the surface is part of the public CLI contract or a consumer-callable runtime seam.
- Public runtime semantics must not live only in `scripts/agent-runtime/*.mjs`.
- `bin/cautilus` remains the canonical product entrypoint for shipped behavior.
- Once an equivalent Go-owned command path lands, the duplicate direct Node runtime entrypoint should be removed rather than preserved for compatibility.
- JS may remain in the repo for tests, maintainer tooling, release tooling, preview tooling, and explicitly experimental research harnesses.
- Public runtime seams move before pure packet-builder duplicates.
- Workbench and live-run surfaces are part of the runtime boundary and therefore are in scope for Go ownership.
- The repo should prefer one shared Go implementation of timeout, process cleanup, workspace lifecycle, and artifact naming policy.
- The migration should not keep long-lived dual runtime implementations for the same shipped behavior.
- The migration should preserve existing packet contracts unless a contract change is explicitly called out in the same slice.

## Scope Classification

### Immediate Go Migration

These are product runtime seams and should move first:

- `run-executor-variants`
- `evaluate-adapter-mode`
- `discover-workbench-instances`
- `run-live-instance-scenario`
- `run-live-simulator-persona`
- shared helpers that those seams rely on for process execution or workspace lifecycle

### Second-Wave Go Migration

These are not the first operational risk, but they still represent duplicate runtime ownership:

- local eval-test and skill-test runners
- packet builders and prompt/render helpers whose shipped semantics still matter, once the public runtime seams are no longer JS-owned
- active-run and artifact-preparation helpers that remain authoritative only because other Node seams still depend on them

### JS May Remain

These do not need to block runtime consolidation:

- `*.test.mjs` files
- release and packaging scripts
- docs preview, lint, and one-off maintainer utilities
- explicitly experimental harnesses under research or experiments directories

## Probe Questions

- Which packet-builder surfaces actually define shipped semantics strongly enough that they should move to Go after the remaining runtime seams land?
- Which packet-builder surfaces are merely internal composition helpers and can stay JS without weakening the standalone binary story?

## Deferred Decisions

- removing JS-based test harnesses
- rewriting release automation from Node to Go
- removing all JS utility code from the repo
- changing packet schemas only to make the migration more convenient
- reworking experimental optimize-search harnesses that are already explicitly non-shipping

## Non-Goals

- converting every JS file in the repository to Go
- changing maintainer-local tooling merely for language consistency
- broad packet redesign unrelated to runtime ownership
- forcing consumers to adopt a new evaluation workflow shape during the same slice

## Deliberately Not Doing

- We are not treating release tooling as runtime-critical just because it lives in the same repository.
- We are not moving test code to Go unless the test currently encodes shipped runtime semantics that cannot be exercised another way.
- We are not keeping permanent dual implementations for the same shipped runtime behavior.

## Constraints

- Keep manually maintained docs in English.
- Keep the standalone binary story honest while preserving bounded migration risk for current consumers.
- Preserve semantic line breaks in prose markdown.
- Preserve existing packet and artifact contracts unless the same change explicitly updates the corresponding contract docs, fixtures, and tests.
- Keep workbench and live-run migration aligned with the existing Go command registry rather than creating a second Go surface outside the CLI.

## Success Criteria

- Every public or consumer-callable runtime seam has one Go-owned implementation that defines shipped behavior.
- Runtime timeout, process cleanup, workspace lifecycle, and artifact naming policy live in Go-owned helpers for shipped paths.
- Docs and adapter guidance stop recommending direct Node runtime entrypoints for shipped behavior.
- Duplicate direct Node runtime entrypoints disappear once the equivalent Go-owned path lands.
- Remaining JS code is clearly classified as tests, maintainer tooling, or experiments rather than as a second runtime authority.

## Acceptance Checks

- `EveryRegisteredCommandHasAGoHandler` or equivalent command-registry checks still pass for the migrated surfaces.
- runtime regression tests cover timeout, artifact layout, and failure semantics through Go-owned command paths
- docs no longer present direct Node runtime commands as the preferred shipped path for migrated surfaces
- migrated runtime seams no longer need direct Node compatibility wrappers to expose shipped behavior
- `npm run verify`
- `npm run hooks:check`

## Canonical Artifact

This file is the canonical design note for runtime consolidation onto Go-owned shipped surfaces.

## First Implementation Slice

1. Migrate `run-executor-variants` and `evaluate-adapter-mode` semantics fully into Go-owned command paths and treat the current JS implementations as removable duplicates.
2. Move the shared active-run and process-execution invariants that those seams still depend on into Go-owned helpers.
3. Replace public docs and adapter guidance so the preferred shipped path cites `cautilus ...` commands instead of direct `node scripts/agent-runtime/...` commands.
4. Migrate eval-live discovery and live-run execution seams next, because they are also product runtime surfaces with subprocess and workspace risk.
5. Reclassify the remaining JS files into either second-wave runtime migration candidates or explicit non-runtime tooling.

## Premortem

The most likely failure mode is calling the migration complete while direct Node entrypoints still define real shipped behavior.
This contract counters that by defining completion in terms of runtime ownership, not in terms of how many files moved languages.
The second likely failure mode is overreaching and trying to convert every JS file, including release tooling and tests, before the public runtime boundary is stabilized.
This contract counters that by separating immediate runtime seams from second-wave duplicates and from JS that may remain.
