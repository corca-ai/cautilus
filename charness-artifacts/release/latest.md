# Release Record
Date: 2026-05-17

## Summary

Released Cautilus `v0.16.0`.

## Release Scope

Minor release for a portable robustness evaluation packet contract.
This release introduces documented `cautilus.robustness_request.v1`, `cautilus.robustness_plan.v1`, and `cautilus.robustness_report.v1` shapes with example fixtures and positive schema/example checks.
The new contract gives operators a packet-first way to describe behavior under robustness pressure, distinguish stimulus mutations from implementation mutations, record expected and observed behavior relations, and carry robustness findings as explicit improvement evidence.

This release does not add a runtime that generates, replays, fuzzes, shrinks, or executes mutation cases.
Host repos and adapters still own mutation selection, raw logs, replay, backend invocation, prompts, product policy, and product-specific oracles.
Schema hardening remains the next implementation gate before callers should treat the robustness schemas as strict invalid-packet enforcement.

## Commits

- `517ad37` Define robustness evaluation packets
- `f3bd5b2` Record robustness packet critique
- `9e5d220` Record robustness schema hardening critique
- `2c05d31` Record narrowed robustness hardening critique

This release also includes the checked-in claim, guide, critique, debug, and release-surface hardening commits accumulated on `main` since `v0.15.4`.

## Review

- Critique: delegated release critique confirmed `v0.16.0` is the lightest honest bump because the slice adds a new product-owned packet contract and fixtures without breaking existing commands.
- Critique: release narrative review required the release notes to say "portable robustness evaluation packet contract" and avoid implying runtime generation, replay, fuzzing, execution, shrinking, automatic fixes, strict schema enforcement, or final schema status.
- Critique: counterweight review classified npm/public plugin publication, full draft-2020-12 validator adoption, and robustness-specific critique packet scanner coverage as out of scope for this release.

## Debug Notes

- `charness-artifacts/debug/debug-2026-05-17-release-prepare-claim-freshness.md` records the release-prepare claim freshness stop after the `0.16.0` version bump and the claim refresh sequence used before retrying release prepare.
- The current debug pointer is [charness-artifacts/debug/latest.md](../debug/latest.md).

## Verification

- `npm run release:prepare -- 0.16.0`: green after refreshing the saved claim packet and generated claim projections.
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.26/scripts/validate_debug_artifact.py --repo-root .`: green.
- `npm run critique:surface-packet:check`: green for the registered `release-packaging` rule families.
- Fresh checkout probes declared in `.agents/release-adapter.yaml`: claim evidence-state check and claim status-report check passed after claim refresh; generated drift check is expected to pass once this release-prep state is committed.
- `./bin/cautilus --version`: `0.16.0`.

The remaining pre-publish gates for this release-prep commit are `npm run hooks:check`, `npm run verify`, `npm run test:on-demand`, `npm run generated:drift:check`, release publish dry-run, and public release verification after tag workflow completion.

## Public Release

- Target tag: `v0.16.0`.
- Public boundary: GitHub tagged binary/install surface.
- npm publication and public Claude/Codex plugin distribution are not claimed by this release.

## Operator Update Steps

1. Refresh the binary via the install-sh channel:
   `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
   Operators who previously installed via Homebrew should first run `brew uninstall cautilus` and clear shell command caches to avoid stale PATH shadows.
2. Claude Code and Codex plugin consumers pick up the bundled Cautilus Agent refresh via `charness update` or by re-running `cautilus init` in the host repo.
3. Host repos that want robustness evaluation should treat this release as a packet contract and fixture baseline.
   They still own mutation selection, replay, backend invocation, and product-specific oracles until a future Cautilus runtime explicitly claims those responsibilities.

## Open Risks

- Robustness schemas currently have positive fixture validation, not strict invalid-packet enforcement.
  The next implementation gate is to add non-empty core arrays, auditable ref shapes, mutation-kind exclusivity, and targeted negative validation tests.
- The public GitHub release workflow and install smoke still need to be verified after `v0.16.0` is tagged.
