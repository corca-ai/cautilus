# CLI Distribution Notes

This note records the current distribution decisions for `Cautilus` so future
repos do not have to rediscover the same tradeoffs.

## Current Position

`Cautilus` is now shipping as a standalone Go CLI through tagged prebuilt
binary assets plus a bundled skill.

As of the current release line:

- the product-owned runtime no longer depends on `python3`
- the canonical public install surface is tagged GitHub releases plus
  [`install.sh`](../install.sh) and Homebrew
- the operator-facing step-by-step install guide lives in
  [install.md](../install.md)
- `install.sh` should install `Cautilus` itself, not operating-system
  dependencies
- `install.sh` now downloads the matching tagged binary asset for the host
  platform
- `install.sh` verifies the downloaded asset against the tagged checksum
  manifest before unpacking it
- tagged release binaries now also carry GitHub artifact attestations derived
  from the checksum manifest
- installed binaries can cache latest-release checks and surface interactive
  update notices without changing the non-interactive CLI contract
- `cautilus install` is the canonical repo-local skill/bootstrap command after
  the binary is already present on `PATH`
- `cautilus update` is the canonical explicit lifecycle update command

That means the honest operator story today is:

1. install a tagged release with `install.sh`
2. or install with `brew install corca-ai/tap/cautilus`
3. confirm `cautilus --version`
4. use `cautilus version --verbose` when you need local version provenance and
   cached update-check state
5. in each consumer repo, run `cautilus install --repo-root .`
6. use `cautilus update` when you want the CLI to apply its supported update
   path explicitly

The current supported native-host matrix is:

- macOS + `install.sh`
- macOS + Homebrew
- Linux + `install.sh`
- Linux + Homebrew

## Why Homebrew Is Now Honest

Homebrew is now an honest install surface because the standalone release path
has a stable tagged archive contract, a checked-in formula renderer, and a tap
publication workflow that updates the formula alongside the GitHub release.

That means the operator story can support both channels without inventing a
second release dialect:

- GitHub releases stay the source of truth for tagged binaries and checksums
- `install.sh` stays the zero-state bootstrap path
- Homebrew stays a supported package-manager path for operators who prefer tap
  installs
- `cautilus update` keeps the post-install lifecycle inside the Go CLI surface

That means the right question is no longer "is Homebrew only aspirational?" but
"did this release line pass the expected smoke matrix?"

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

It existed because `Cautilus` was extracted from an earlier host-embedded skill in
small safe steps:

- generic bootstrap helpers were copied first
- the minimal standalone CLI and newer runtime slices landed in Node
- product correctness mattered more than an early cross-language rewrite

That extraction bias was pragmatic: preserve proven behavior first, then reduce
runtime seams later.

The product-owned Python seam has now been removed from the standalone CLI
surface, and the public installer no longer depends on the old Node runtime
surface either. Historical references to the old Python and Node files remain
in extraction notes because they describe where the product came from.

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
- stricter expectations around checksums, provenance attestations, and
  reproducible release behavior

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

1. keep GitHub releases and `install.sh` as the zero-state consumer path
2. keep the tagged binary asset matrix stable across releases
3. keep checksum plus attestation verification as the default provenance story
4. keep Homebrew publication automated from the same tagged release workflow
5. keep `cautilus install` and `cautilus update` as the canonical lifecycle
   surface after the binary exists on the machine
