# Release Surface Check
Date: 2026-07-11

## Release Scope

Released Cautilus `v0.19.3`.
This target is prepared as a compatible patch for fail-closed scenario inputs, truthful filesystem and command failures, sanitized deployment diagnostics, and proof-preserving maintainer test orchestration.

Installed binaries receive strict scenario registry/coverage validation and truthful artifact-prune, Agent-overwrite, command-capture, and command-startup failures.
Source-checkout workflows additionally receive deployment-evidence argument, JSON, semantic, and write-error sanitation.
Maintainers receive isolated parallel standard and detailed Go/Node coverage collection.

## Current Version

- previous version: `0.19.2`
- target version: `0.19.3`
- tag: `v0.19.3`
- branch: `main`
- remote: `origin`

## Behavior and Recovery

- Malformed scenario registry or coverage fields now fail consistently in both Go consumers and the maintained JavaScript producer.
  Packet schema versions are unchanged and valid packets need no migration.
  Repair explicit null/non-array fields, non-object entries, empty keys, or non-number/negative counts to the documented array, object, and non-negative-number contract, then rerun.
- Artifact prune, Agent overwrite cleanup, command capture persistence, and command startup no longer report success without completing their required filesystem or process evidence.
  Startup failures use exitCode `-1` only as a no-child-process sentinel and preserve one actionable cause line.
- Deployment-evidence executables reject malformed required values before filesystem access and render syntax, semantic, and write failures as one physical line without Node stacks.
  This is not a structured stderr schema or path-redaction guarantee.
- Standard and detailed coverage commands overlap their isolated Go and Node producers, await both outcomes, and aggregate only fresh successful reports.
  Local measurements show cache/order variability; no global or portable speed percentage is claimed.

## Verification

- Four implementation slices passed focused owner tests, Go race where applicable, eslint, full coverage, coverage floors, and parent-delegated fresh-eye review.
- Release surface packet checks passed for the enumerated release-packaging and CLI/Agent parity rule families.
- Standalone release critique passed two distinct angles plus a separate counterweight: `charness-artifacts/critique/2026-07-11-v0-19-3-release-critique.md`.
- `npm run release:prepare -- 0.19.3` synchronized all five versioned manifests and packaged Agent content.
- Final exact-tree pre-push, hooks, on-demand, history-secret, publisher-policy, fresh-checkout, and dry-run proof remains required before tag publication.

## Release State

- local release mutation: prepared
- release narrative: target-specific and committed with the release preparation slice
- branch/tag push: pending ordered publisher
- workflow publication: pending tag
- public release verification: pending workflow and asset readiness
- install/update readback: pending public assets
- attestation verification: pending one published binary

## Review Proof

- Critique: `charness-artifacts/critique/2026-07-11-v0-19-3-release-critique.md`
- Packet: `charness-artifacts/critique/2026-07-11-133548-packet.md`
- Fresh-eye satisfaction: parent-delegated with clean rail-1 verification.

## Real-Host Proof

No configured release-time real-host trigger matched this delta.
No native macOS proof is claimed; current-host/Linux proof must not be generalized to macOS.

## User Update Steps

- Binary users update by rerunning `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`, then verify `cautilus --version` and `cautilus version --verbose`.
- Binary users roll back by rerunning the installer with `CAUTILUS_VERSION=v0.19.2`, then verify the version.
- Source-checkout users move their checkout or tag to `v0.19.3` to receive the Node workflow changes, or back to `v0.19.2` to roll them back.
- Claude Code and Codex plugin consumers need no Agent behavior migration for this release; refresh repo-local Agent surfaces only when otherwise desired.

## Non-Claims and Deferred Work

- No new public command, packet schema version, install mechanism, or Cautilus Agent behavior contract.
- No provider/live evaluator proof and no global performance percentage.
- The public release-notes asset remains self-contained checksum and asset provenance, not the full operator narrative.
- Native macOS proof and public operator-notes redesign remain explicit follow-up policy/workflow slices rather than patch blockers under the current adapter.
