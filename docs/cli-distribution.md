# CLI Distribution Notes

This note records the current distribution decisions for `Cautilus` so future
repos do not have to rediscover the same tradeoffs.

## Current Position

`Cautilus` is still shipping as a standalone Node CLI plus a bundled skill, not
as a native prebuilt binary.

As of the current release line:

- the product-owned runtime no longer depends on `python3`
- the canonical public install surface is tagged GitHub releases plus
  [`install.sh`](../install.sh)
- `install.sh` should install `Cautilus` itself, not operating-system
  dependencies
- Homebrew remains a deferred install surface until the CLI runtime settles
  further

That means the honest operator story today is:

1. install a tagged release with `install.sh`
2. ensure `node` and `npm` are already present
3. confirm `cautilus --version`
4. in each consumer repo, run `cautilus skills install`

## Why The First Public Release Is Not Homebrew-First

Homebrew can work on both macOS and Linux, and it is a good long-term consumer
path. It is not the first release path for `Cautilus` because the current CLI
is still a Node program that installs from a source archive.

That creates a few problems:

- the formula would still need to express runtime dependencies such as `node`
- the install contract would still be source-oriented rather than
  prebuilt-artifact-oriented
- the team is already planning a Go port, so locking in a source-based Homebrew
  formula now would create an install story that is likely to change soon

The release surface is simpler if the first public contract stays:

- GitHub releases as the source of truth
- one checked-in installer script
- one runtime family to explain in operator docs

After the Go port, Homebrew becomes much cleaner because the formula can point
at release tarballs that already contain the final CLI artifact.

## Why `install.sh` Should Not Install System Dependencies

`install.sh` should only install `Cautilus`.

It should not attempt to install `node`, `npm`, `brew`, `apt`, `dnf`, or other
host tooling because:

- dependency installation is OS-specific and package-manager-specific
- silent system mutation makes support and debugging worse
- operator trust is higher when the installer only changes the product-owned
  install root

The right failure mode is:

- detect missing prerequisites
- explain the missing dependency precisely
- exit non-zero without mutating the host package manager state

## Why Node And Python Existed In The First Place

The mixed runtime was not an architectural goal.

It existed because `Cautilus` was extracted from Ceal's workbench boundary in
small safe steps:

- generic bootstrap helpers were copied first
- the minimal standalone CLI and newer runtime slices landed in Node
- product correctness mattered more than an early cross-language rewrite

That extraction bias was pragmatic: preserve proven behavior first, then reduce
runtime seams later.

The product-owned Python seam has now been removed from the standalone CLI
surface. Historical references to the old Python files remain in extraction
notes because they describe where the product came from.

## Prebuilt Binary Tradeoffs

Prebuilt binaries improve install ergonomics more than they improve raw runtime
performance for this product.

Benefits:

- simpler consumer install and update path
- easier version pinning and rollback
- better fit for Homebrew and release assets
- no requirement for users to reason about a runtime toolchain

Costs:

- more release automation and artifact management
- more platform-specific CI coverage
- stricter expectations around checksums, signatures, and reproducible release
  behavior

For `Cautilus`, the main argument for a prebuilt binary is operational
simplicity, not benchmark speed.

## Why Go Is The Next Porting Target

If `Cautilus` moves off Node, Go is the preferred next step.

Reasons:

- `Cautilus` is primarily a CLI orchestrator, not a low-level performance tool
- the product mostly needs subprocess control, file IO, JSON handling, and
  portable release artifacts
- Go makes cross-platform single-binary release automation straightforward
- Go keeps the contribution and maintenance burden lower than Rust for this
  style of tool

Rust is still viable, but it is not the default recommendation for the next
step. The extra type-system and performance benefits do not currently outweigh
the higher rewrite and maintenance cost.

## Recommended Sequence

Use this order unless the product direction changes:

1. ship the first public release from the Node-only standalone CLI surface
2. keep GitHub releases and `install.sh` as the canonical consumer path
3. port the CLI/runtime to Go on a new branch
4. add Homebrew after the Go release artifact shape is stable
5. revisit stronger binary distribution claims only after the Go release path is
   proven in public
