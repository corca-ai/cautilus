# Release Record
Date: 2026-05-09

## Summary

Preparing Cautilus `v0.14.0`.

## Release Scope

Minor release for external host repos that need the current eval-only Cautilus slice during the broader contract rewrite.
The release keeps claim discovery, optimize automation, live app-runner workflows, and review-learning capture visible as opt-in surfaces rather than stable cross-repo defaults.

## Commits

- `b5ab598` Checkpoint pending spec HITL review
- `ca0d668` Bound v0.14 adoption to eval-only

## Review

- Premortem: delegated via Agent subagents.
  Fresh-eye satisfaction: parent-delegated.
- Act before ship:
  - README and packaged Cautilus Agent over-presented `claim`, `eval`, and `optimize` as equal front doors for external consumers.
    Resolved by adding the current eval-only release boundary and marking claim, optimize, live app-runner, and review-learning surfaces as opt-in during the rewrite.
  - Release/public visibility reviewer noted that version surfaces must be bumped and synced before tag publish.
    Resolved by `npm run release:prepare -- 0.14.0`.
  - Release/public visibility reviewer noted that `verify-public-release.mjs` checks a tag but not the unpinned `releases/latest` installer path.
    Carry into post-publish verification with an unpinned install smoke after GitHub marks `v0.14.0` latest.
- Bundle anyway:
  - Asset naming, OS/arch mapping, checksum manifest generation, and public asset presence verification are aligned across installer, workflow, and verifier.
  - `docs/guides/consumer-adoption.md` already steers the ordinary consumer path toward `install -> doctor -> eval test/evaluate`.
- Valid but defer:
  - Stronger public verification that rehashes uploaded binary bytes can wait.
  - Stable/beta channel design can wait.

## Debug Notes

- `check_real_host_proof.py` initially failed because Cautilus lacked `.agents/surfaces.json`.
  Added the release, CLI/Agent, and promise-spec surface manifest and recorded the incident in [charness-artifacts/debug/latest.md](../debug/latest.md).

## Verification

- `npm run release:prepare -- 0.14.0`: surfaces synced, package.json, package-lock.json, marketplace.json, plugin.json (claude + codex) advanced to 0.14.0.
- `python3 current_release.py`: `drift: []` with every surface reporting 0.14.0.
- `npm run verify` (53.74s): green.
- `npm run hooks:check`: ready.
- `python3 check_cli_skill_surface.py --run-probes`: status `ok` with 5/5 probes returning 0.
- Pre-publish `npm run release:smoke-install -- --channel install_sh --version v0.14.0 --repo corca-ai/cautilus --installer-source local --skip-update --json`: blocked as expected with GitHub asset 404 because `v0.14.0` assets do not exist before tag publish and release workflow completion.
  Rerun this after public assets are available.

## Public Release

- Pending tag: `v0.14.0`.
- Pending URL: `https://github.com/corca-ai/cautilus/releases/tag/v0.14.0`.
- Pending public verifier: `node scripts/release/verify-public-release.mjs --version v0.14.0 --json`.
- Pending pinned installer smoke after release assets exist.
- Pending unpinned installer smoke after `releases/latest` resolves to `v0.14.0`.

## Operator Update Steps

1. Refresh the binary via the install-sh channel:
   `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
   Operators who previously installed via Homebrew should first run `brew uninstall cautilus` and clear shell command caches to avoid stale PATH shadows.
2. Claude Code and Codex plugin consumers pick up the bundled Cautilus Agent refresh via `charness update` or by re-running `cautilus install` in the host repo.
3. Host repos adopting this release should stay on the eval-only path from issue [#32](https://github.com/corca-ai/cautilus/issues/32) unless they explicitly opt into claim, optimize, live app-runner, or review-learning slices.

## Open Risks

- The release is intentionally incomplete outside eval-only adoption.
- The public release is not complete until GitHub Actions publishes assets, the public verifier passes, and the unpinned installer smoke confirms `releases/latest` resolves to `v0.14.0`.
