# Release Record
Date: 2026-05-09

## Summary

Released Cautilus `v0.14.2`.

## Release Scope

Patch release after the `v0.14.0` and `v0.14.1` tag workflows failed before assets were published.
The release purpose remains the same: external host repos need the current eval-only Cautilus slice during the broader contract rewrite.
The release keeps claim discovery, optimize automation, live app-runner workflows, and review-learning capture visible as opt-in surfaces rather than stable cross-repo defaults.

## Commits

- `b5ab598` Checkpoint pending spec HITL review
- `ca0d668` Bound v0.14 adoption to eval-only
- `44f7c28` Prepare Cautilus 0.14.0 release
- `b9eda1d` Prepare Cautilus 0.14.1 release
- `c23cc92` Prepare Cautilus 0.14.2 release

## Review

- Premortem: delegated via Agent subagents.
  Fresh-eye satisfaction: parent-delegated.
- Act before ship:
  - README and packaged Cautilus Agent over-presented `claim`, `eval`, and `optimize` as equal front doors for external consumers.
    Resolved by adding the current eval-only release boundary and marking claim, optimize, live app-runner, and review-learning surfaces as opt-in during the rewrite.
  - Release/public visibility reviewer noted that version surfaces must be bumped and synced before tag publish.
    Resolved by `npm run release:prepare -- 0.14.2`.
  - Release/public visibility reviewer noted that `verify-public-release.mjs` checks a tag but not the unpinned `releases/latest` installer path.
    Resolved by running both pinned and unpinned install-sh smoke tests after GitHub marked `v0.14.2` latest.
- Bundle anyway:
  - Asset naming, OS/arch mapping, checksum manifest generation, and public asset presence verification are aligned across installer, workflow, and verifier.
  - `docs/guides/consumer-adoption.md` already steers the ordinary consumer path toward `install -> doctor -> eval test/evaluate`.
- Valid but defer:
  - Stronger public verification that rehashes uploaded binary bytes can wait.
  - Stable/beta channel design can wait.

## Debug Notes

- `check_real_host_proof.py` initially failed because Cautilus lacked `.agents/surfaces.json`.
  Added the release, CLI/Agent, and promise-spec surface manifest.
- The first release tag workflow failed on a CI-only spec link to ignored local self-dogfood artifacts.
  Fixed the spec to name selected evidence paths as plain code paths instead of Markdown links.
- The second release tag workflow failed because CI pinned Go 1.26.2 while `govulncheck` required Go 1.26.3 for the standard library.
  Updated GitHub workflows and maintainer docs to Go 1.26.3 and recorded the current incident in [charness-artifacts/debug/latest.md](../debug/latest.md).

## Verification

- `npm run release:prepare -- 0.14.2`: surfaces synced, package.json, package-lock.json, marketplace.json, plugin.json (claude + codex) advanced to 0.14.2.
- `python3 current_release.py`: `drift: []` with every surface reporting 0.14.2.
- `npm run verify` (47.24s after CI-only spec-link fix): green.
- `npm run hooks:check`: ready.
- `python3 check_cli_skill_surface.py --run-probes`: status `ok` with 5/5 probes returning 0.
- GitHub Actions run `25596477876` for `v0.14.0` failed before asset publication on a CI-only spec link to ignored local self-dogfood artifacts.
  Resolved in `docs/specs/maintainer/evaluation-surfaces-runners.spec.md` by changing ignored artifact links to selected-evidence code paths.
- GitHub Actions run `25596627243` for `v0.14.1` failed before asset publication because CI pinned Go 1.26.2 and `govulncheck` requires Go 1.26.3 for GO-2026-4971 and GO-2026-4918.
  Resolved by updating GitHub workflows and maintainer docs to Go 1.26.3.
- GitHub Actions run `25596754775` for `v0.14.2`: `release-artifacts` and `verify-public-release` succeeded.
- `node scripts/release/verify-public-release.mjs --version v0.14.2 --json`: ok, all expected assets present and checksum manifest complete.
- Pinned installer smoke: `npm run release:smoke-install -- --channel install_sh --version v0.14.2 --repo corca-ai/cautilus --installer-source local --skip-update --json`: ok, installed `0.14.2`.
- Unpinned latest installer smoke: `npm run release:smoke-install -- --channel install_sh --repo corca-ai/cautilus --installer-source local --skip-update --json`: ok, `releases/latest` resolved to `v0.14.2` and installed `0.14.2`.

## Public Release

- Failed tags without public release: `v0.14.0`, `v0.14.1`.
- Released tag: `v0.14.2`.
- URL: `https://github.com/corca-ai/cautilus/releases/tag/v0.14.2`.
- Published at: `2026-05-09T08:44:19Z`.
- Assets:
  - `cautilus_0.14.2_darwin_arm64.tar.gz`
  - `cautilus_0.14.2_darwin_x64.tar.gz`
  - `cautilus_0.14.2_linux_arm64.tar.gz`
  - `cautilus_0.14.2_linux_x64.tar.gz`
  - `cautilus-v0.14.2-checksums.txt`
  - `cautilus-v0.14.2.sha256`
  - `release-notes-v0.14.2.md`

## Operator Update Steps

1. Refresh the binary via the install-sh channel:
   `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
   Operators who previously installed via Homebrew should first run `brew uninstall cautilus` and clear shell command caches to avoid stale PATH shadows.
2. Claude Code and Codex plugin consumers pick up the bundled Cautilus Agent refresh via `charness update` or by re-running `cautilus install` in the host repo.
3. Host repos adopting this release should stay on the eval-only path from issue [#32](https://github.com/corca-ai/cautilus/issues/32) unless they explicitly opt into claim, optimize, live app-runner, or review-learning slices.

## Open Risks

- The release is intentionally incomplete outside eval-only adoption.
- `v0.14.0` and `v0.14.1` remain failed tags without public releases.
  Do not move or delete them without an explicit maintainer decision.
