# Release Surface Check
Date: 2026-07-11

Preparing Cautilus `v0.19.2`.

## Release Scope

`v0.19.2` is a patch release for review-input fidelity, failure-path correctness, workspace mutation safety, and proof-preserving maintainer test economics.
Installed binaries receive Unicode-safe claim-review excerpts and fail-closed consumer-prompt reads instead of silently omitting a captured prompt that became unreadable.
Source-checkout workflows additionally receive whitespace-safe active-run resolution and pre-mutation validation in `workspace-start`, `prepare-compare-worktrees`, and `prune-workspace-artifacts`.
The release also removes one duplicated quality-runner test invocation and reuses one immutable Git fixture in the focused compare-worktree parser suite.

This patch does not change packet schemas, structured stdout, install mechanisms, or the Cautilus Agent behavior contract.
It does not claim repo-wide parser hardening, a global verification-speed percentage, grapheme or token-budget semantics, or live evaluator/provider proof.

## Current Version

- previous version: `0.19.1`
- target version: `0.19.2`
- target tag: `v0.19.2`
- git branch: `main`
- git remote: `origin`

## Behavior and Recovery

- Claim-review source excerpts now truncate by Unicode code points rather than bytes, so multilingual prefixes remain valid UTF-8.
- A consumer prompt recorded as present but later unreadable now returns a path-bearing error in both Go and Node renderers.
  Restore the referenced prompt or regenerate the prompt-input/review packet, then rerun; absent, `exists:false`, and readable-empty optional prompts remain omitted.
- All-whitespace optional active-run paths now mean absent in the Node helper, while non-empty path identity, including surrounding or internal spaces, remains unchanged.
- Option-like or whitespace-only required values now fail before the three named Node mutators create run directories, register Git worktrees, or delete recognized artifacts.
- The measured prepare-compare-worktrees suite median changed from `1.85s` to `1.57s` on this machine with its five malformed cases and mutation oracles unchanged; no total-suite percentage is claimed.

## Verification

- Release preparation: `npm run release:prepare -- 0.19.2` passed and synchronized all five versioned JSON surfaces plus the packaged Agent tree.
- Claim freshness: passed during release preparation.
- Release critique: `charness-artifacts/critique/2026-07-11-v0-19-2-release-critique.md`.
- Critique packet: `charness-artifacts/critique/2026-07-11-105243-packet.md`; both configured surface sections reported `ready` for their enumerated rule families.
- Fresh-eye critique: two independent angle reviewers plus a separate counterweight completed with clean shared-tree fingerprints.
- Focused correctness proof: Go runtime tests and the owning Node suites passed at every implementation boundary.
- Full verification, hooks, on-demand, requested-review, and fresh-checkout gates: pending final prepared-tree execution.

## Release State

- local release mutation: prepared for `0.19.2`, not yet committed.
- branch/tag push: pending.
- GitHub release record: pending.
- public release surface verification: pending and intentionally not claimed before tag publication.
- post-publish install readback: pending.

## Review Proof

- Act Before Ship: commit the prepared target surface, complete broad/fresh verification, and publish only from a clean tree.
- Bundle Anyway: keep binary and source-checkout audiences distinct, include prompt recovery, and bound parser and timing claims.
- Over-Worry: pre-tag absence of public assets is expected and the ordered publisher owns post-tag verification; no observed consumer requires raw leading-dash relative values.
- Valid but Defer: reconsider whether the generated public notes asset should carry the operator story in a separate release-infrastructure slice.

## Real-Host Verification

- No configured release-time real-host proof trigger matched this slice.

## User Update Steps

- Operators with an existing install refresh the binary by rerunning `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`, then check `cautilus --version` and `cautilus version --verbose`.
- Roll back by rerunning the installer with `CAUTILUS_VERSION=v0.19.1`, then verify the reported version.
- Source-checkout users move their checkout or tag to receive or roll back the Node helper changes.
- Claude Code and Codex plugin consumers need no Agent behavior migration; use `charness update` or rerun `cautilus init` only when refreshing repo-local installed surfaces.
