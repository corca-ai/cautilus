# Release Record
Date: 2026-04-24

## Summary

Released Cautilus `v0.12.2`.

## Release Scope

- Bundled `skills/cautilus/SKILL.md` now uses a CLI-first progressive disclosure shape.
- Broad command discovery and packet examples are delegated to `cautilus --help`, `cautilus commands --json`, `cautilus scenarios --json`, and command-owned `--example-input`.
- The packaged plugin skill copy is synchronized with the repo-owned skill source.
- The skill now treats requested-but-unavailable review variants as a gate defect to fix or explicitly waive before release.

## Commits

- `d13a184` Tighten Cautilus skill CLI disclosure
- `7aa1e50` Prepare Cautilus 0.12.2 release

## Review

- Local review: completed against skill progressive disclosure, CLI ownership, packaged skill sync, install/doctor agent-surface behavior, and release surface.
- `charness:quality` skill ergonomics inventory: completed for `skills/cautilus/SKILL.md`; core is 110 non-empty lines under the 180-line review limit.
- `cautilus install` plus `doctor --scope agent-surface`: verified in a temporary consumer repo.
- Delegated review: not run in this host turn because this was a bounded skill-copy cleanup and no fresh-eye gate was required by the repo artifact for this patch release.

## Verification

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.10/skills/quality/scripts/inventory_skill_ergonomics.py --repo-root . --skill-path skills/cautilus/SKILL.md --max-core-lines 180 --json`
- `./bin/cautilus commands --json`
- `./bin/cautilus scenarios --json`
- `./bin/cautilus install --repo-root /tmp/cautilus-skill-install-93gSOx --json`
- `./bin/cautilus doctor --repo-root /tmp/cautilus-skill-install-93gSOx --scope agent-surface`
- `npm run lint:links`
- `npm run verify`
- `npm run hooks:check`
- `npm run release:publish -- --version 0.12.2 --dry-run --json`
- `npm run release:publish -- --version 0.12.2 --json`
- GitHub Actions `verify`: success
- GitHub Actions `spec-report`: success
- GitHub Actions `release-artifacts`: success, including `verify-public-release`
- `npm run release:smoke-install -- --channel install_sh --version v0.12.2 --repo corca-ai/cautilus --installer-source local --skip-update --json`

## Public Release

- URL: https://github.com/corca-ai/cautilus/releases/tag/v0.12.2
- Tag: `v0.12.2`
- Head: `7aa1e503636ecbe078d741d331eea06c1528e023`
- Assets: checksum manifest, release notes, and darwin/linux arm64/x64 binary archives.
