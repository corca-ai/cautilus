# Release Record
Date: 2026-05-18

## Summary

Released Cautilus `v0.16.1`.

## Release Scope

Patch release for claim, proof, spec, and release-surface hardening accumulated since `v0.16.0`.
This release keeps the public product shape stable: installable Cautilus CLI, bundled Cautilus Agent, checked-in claim/spec reports, and GitHub binary release artifacts.

The main shipped changes are:

- claim freshness and selected-status checks now reject stale packets more reliably;
- claim discovery, reviewability, evidence vocabulary, and next-action summaries have more checked-in proof;
- report provenance, budget telemetry, app evidence, and JS report cost attribution are preserved more explicitly;
- GitHub Pages release/report automation was moved off the deprecated Pages action surface;
- setup and quality posture were refreshed against Charness 0.7.0;
- generated Evidence State Markdown now handles empty sample sections without producing invalid Specdown tables.

This release does not claim a new runtime contract, a breaking command change, npm publication, or public Claude/Codex marketplace publication.
The GitHub binary/install surface remains the public release boundary.

## Commits

This release includes 53 commits after `v0.16.0`, ending at the release-prep commit once this record is committed.
Representative commits:

- `e422b5a` Reject stale claim freshness status
- `94b4100` Resolve Pages action deprecation
- `66aa59d` Refresh skill capability inventory
- `c2cb1e7` Satisfy reviewable eval surface spec claims
- `bb7c652` Clear deterministic proof queue
- `ffc22d8` Refresh setup and quality posture
- `65d1a03` Refresh claim state for quality posture

## Review

- Critique: delegated release critique approved a patch bump because the changes are claim/proof/spec hardening, CI/public verification maintenance, and setup/quality refresh rather than a new stable runtime contract or breaking invocation change.
- Critique: act-before-ship findings required preserving or clearing the untracked `docs/specs/.index.spec.md.swp` file before tagging, updating this release record to declare `v0.16.1`, running release prepare, running local gates, and treating tag push as only the start of public workflow verification.
- Critique: counterweight classified CI-only attest/publish parity as a release workflow responsibility, provided post-tag public verification remains mandatory.

## Debug Notes

- `charness-artifacts/debug/debug-2026-05-18-evidence-state-empty-sample-table.md` records the Specdown failure found during the setup/quality refresh and the generator fix.
- The current debug pointer is [charness-artifacts/debug/latest.md](../debug/latest.md).

## Verification

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/release/scripts/resolve_adapter.py --repo-root .`: release adapter valid.
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/release/scripts/current_release.py --repo-root .`: release surface versions were aligned at `0.16.0` before the bump.
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/release/scripts/check_fresh_checkout_probes.py --repo-root . --run-probes --json`: passed.
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/release/scripts/check_real_host_proof.py --repo-root .`: no release-time real-host proof required.
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.7.0/skills/release/scripts/check_requested_review_gate.py --repo-root .`: ok; requested-review enforcement is advisory-only because no commands are configured.
- `npm run release:prepare -- 0.16.1`: green.

Release-close verification still requires:

- `npm run verify`
- `npm run hooks:check`
- `npm run release:publish -- --version 0.16.1 --dry-run --json`
- `npm run release:publish -- --version 0.16.1`
- GitHub Actions verification for `main` and `v0.16.1`
- `node scripts/release/verify-public-release.mjs --version v0.16.1 --repo corca-ai/cautilus --json`
- pinned install smoke for `v0.16.1`

## Public Release

- Target tag: `v0.16.1`.
- Public boundary: pending tag-triggered GitHub binary/install surface.
- Branch push: pending.
- Tag push: pending.
- Workflow publication: pending.
- Public release verification: pending.
- npm publication and public Claude/Codex plugin distribution are not claimed by this release.

## Operator Update Steps

1. Refresh the binary via the install-sh channel:
   `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
   Operators who previously installed via Homebrew should first run `brew uninstall cautilus` and clear shell command caches to avoid stale PATH shadows.
2. Claude Code and Codex plugin consumers pick up the bundled Cautilus Agent refresh via `charness update` or by re-running `cautilus init` in the host repo.
3. Host repos consuming claim discovery and review artifacts should treat this as a patch hardening release, not a new runtime capability release.

## Open Risks

- GitHub release artifact build, attestation, and publish remain CI-only surfaces until the tag workflow completes.
- Requested-review enforcement is advisory-only because `.agents/release-adapter.yaml` has no `requested_review_commands`.
- Public release notes generated by the workflow are intentionally self-contained and minimal.
