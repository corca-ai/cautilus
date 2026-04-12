# Version Provenance And Update Checks

This note records the recommended version provenance and update-check surface
for `Cautilus` and similar standalone binary tools.

The goal is to keep release trust, local operator ergonomics, and install-path
honesty aligned in one place instead of scattering those decisions across
installer code, runtime code, and release docs.

## Problem

Standalone binaries need two related but different behaviors:

- record what binary is currently running and where its version came from
- tell operators when a newer release exists without turning every command into
  a noisy update client

Those concerns should stay separate even when they share the same local cache.

## Current Slice

Define one product-owned contract for:

- local version provenance recording
- cached latest-release checks
- interactive update notices
- install-channel-aware upgrade guidance

This slice does not include in-place self-update or package-manager mutation.

## Fixed Decisions

- `Cautilus` should record local version provenance in a user-scoped cache
  directory, not in the repo checkout and not in the installed binary tree.
- Version provenance and update-check cache may live in the same cache file as
  long as the fields stay clearly separated.
- Automatic update checks should run only for interactive CLI usage.
- Automatic update checks should be skipped when:
  - `CI=true`
  - stdout or stderr is not a TTY
  - `CAUTILUS_NO_UPDATE_CHECK=1`
  - the current version cannot be determined
  - the current process is clearly a source checkout or repo shim path rather
    than an installed standalone binary
- Automatic checks should use a 24 hour cache TTL.
- A failed update check must never fail or materially change the user command.
- Update messaging should be install-channel-aware when the install surface can
  be detected honestly:
  - Homebrew users should be told to use `brew upgrade`
  - raw binary / `install.sh` users should be told to reinstall through the
    binary release path
- The current public trust model stays:
  - tagged GitHub binary assets
  - checksum verification
  - GitHub artifact attestations

## Probe Questions

- How much install provenance can be detected locally without pretending to
  know more than the runtime actually knows?
- Should the first user-facing inspection surface be `cautilus version
  --verbose`, `cautilus doctor`, or both?
- Should the cache record the last successful attestation verification time
  once local verification tooling is wired?

## Deferred Decisions

- In-place `cautilus self update`
- Mandatory signing beyond the current checksum + GitHub attestation baseline
- Background daemons, cron jobs, or always-on polling
- Cross-repo shared library extraction for this logic

## Non-Goals

- mutate Homebrew, apt, npm, or other host package managers automatically
- add network traffic to non-interactive automation by default
- block command execution on release API availability
- infer install provenance from fragile heuristics when the runtime does not
  have enough evidence

## Constraints

- Keep the first implementation on Go-owned runtime surfaces.
- Prefer the Go standard library unless an external dependency materially
  simplifies correctness.
- Keep local docs in English.
- Preserve the existing `cautilus --version` behavior as the short machine- and
  shell-friendly path.

## Success Criteria

- `Cautilus` can explain the current version and its immediate provenance in a
  durable local form.
- `Cautilus` can cache the latest successful release check and reuse it for 24
  hours.
- Interactive users can be told about a newer release without breaking command
  behavior when the network or GitHub API is unavailable.
- The product does not pretend that every install path upgrades the same way.

## Acceptance Checks

- unit tests prove version-source precedence and provenance labeling
- unit tests prove cache TTL, cache reuse, and stale-cache refresh behavior
- unit tests prove automatic checks are skipped in CI / non-interactive /
  opt-out cases
- unit tests prove update notices never turn a successful command into a
  failing one
- docs and release notes describe checksum + attestation provenance and the
  update-check policy consistently

## Canonical Artifact

This file is the canonical design note for version provenance and update-check
behavior until the surface stabilizes enough to fold back into broader release
docs.

## First Implementation Slice

1. Add a Go-owned version metadata resolver that reports both version and
   provenance source.
2. Add a user-cache-backed release-check store with a 24 hour TTL.
3. Add `cautilus version --verbose` as the explicit inspection surface.
4. Add interactive-only cached update notices for installed standalone binary
   usage.
5. Keep `cautilus --version` unchanged as the minimal machine-readable path.
