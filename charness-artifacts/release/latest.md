# Release Record
Date: 2026-05-13

## Summary

Released Cautilus `v0.15.4`.

## Release Scope

Patch release for subagent execution proof, Cautilus Agent delegation stability, and release verification hardening.
The release lets skill tests audit actual subagent execution results for Codex and Claude non-interactive backends instead of accepting a mere attempt to spawn.
It also makes setup and AGENTS guidance more explicit about when requested critique or fresh-eye review must use a real subagent and when the host must stop instead of silently substituting same-agent review.

## Commits

- `2398034` Verify subagent execution dogfood
- `04b5fe2` Refresh claim state after subagent dogfood
- `e1fd0d7` Prepare Cautilus 0.15.4 release
- `4ec5c21` Refresh release claim state
- `62e412f` Stabilize release fresh checkout probes
- `f3d094f` Ignore HITL runtime scratch state

## Review

- Critique: delegated subagent critique after implementation.
  It found a false-positive Claude unavailable diagnostic and a Claude `Task`/`Agent` transcript proof shape without `agentId`; both were fixed before release.
- Critique: release-time self-review found a stale release-note pointer after publication.
  The public release notes asset was replaced with a self-contained note, and the public verifier now rejects that unverifiable pointer in future releases.

## Debug Notes

- `charness-artifacts/debug/debug-2026-05-13-release-prepare-arg-forwarding.md` records the `npm run release:prepare -- 0.15.4` argument-forwarding fix.
- `charness-artifacts/debug/debug-2026-05-13-release-fresh-checkout-shallow-probe.md` records the shallow fresh-checkout probe fix.
- `charness-artifacts/debug/debug-2026-05-13-release-notes-stale-record-pointer.md` records the release-note verifier blind spot fixed after initial publication.
- The current debug pointer is [charness-artifacts/debug/latest.md](../debug/latest.md).

## Verification

- `npm run dogfood:subagent-execution-proof`: green for Codex and Claude.
  Codex and Claude both produced auditable subagent execution proof and `recommendation=accept-now`.
- `npm run dogfood:self:eval`: green after the instruction-surface fixture allowed the current Codex `multi_tool_use.parallel` first-call wrapper.
- Setup inspection for AGENTS delegation guidance: green for the new subagent delegation section and legacy `init-repo` wording removal.
- `npm run lint:skill-disclosure`: green.
- `./bin/cautilus doctor commands --json`: green.
- `./bin/cautilus discover scenarios --json`: green.
- `./bin/cautilus doctor --repo-root . --scope agent-surface`: green.
- `npm run verify`: green at `f3d094f`.
- `npm run hooks:check`: green at `f3d094f`.
- Fresh checkout probes declared in `.agents/release-adapter.yaml`: green.
- `node scripts/release/publish-release.mjs --version 0.15.4 --dry-run --json`: green at `f3d094f`.
- GitHub Actions run `25772500202` for `main`: `verify` succeeded.
- GitHub Actions run `25772500206` for `main`: `spec-report` succeeded.
- GitHub Actions run `25772526897` for `v0.15.4`: `release-artifacts` and `verify-public-release` succeeded.
- `node scripts/release/verify-public-release.mjs --version v0.15.4 --repo corca-ai/cautilus --json`: ok, all expected assets present and checksum manifest complete.
- Pinned installer smoke: `npm run release:smoke-install -- --channel install_sh --version v0.15.4 --repo corca-ai/cautilus --installer-source local --skip-update --json`: ok, installed `0.15.4`.

## Public Release

- Released tag: `v0.15.4`.
- Release commit: `f3d094f6f58c8a142c5ba8f5e812f815f1ae570e`.
- URL: `https://github.com/corca-ai/cautilus/releases/tag/v0.15.4`.
- Published at: `2026-05-13T01:34:05Z`.
- Assets:
  - `cautilus_0.15.4_darwin_arm64.tar.gz`
  - `cautilus_0.15.4_darwin_x64.tar.gz`
  - `cautilus_0.15.4_linux_arm64.tar.gz`
  - `cautilus_0.15.4_linux_x64.tar.gz`
  - `cautilus-v0.15.4-checksums.txt`
  - `cautilus-v0.15.4.sha256`
  - `release-notes-v0.15.4.md`

## Operator Update Steps

1. Refresh the binary via the install-sh channel:
   `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
   Operators who previously installed via Homebrew should first run `brew uninstall cautilus` and clear shell command caches to avoid stale PATH shadows.
2. Claude Code and Codex plugin consumers pick up the bundled Cautilus Agent refresh via `charness update` or by re-running `cautilus init` in the host repo.
3. Host repos that evaluate subagent-spawning skills should keep repo-owned fixtures and prompts, then use Cautilus skill testing to require auditable subagent execution proof from the selected backend.

## Open Risks

- Subagent proof remains bounded by host runtime capability, authentication, model availability, and tool policy.
  The release now surfaces those as readiness diagnostics instead of pretending every machine can run both backends.
- The initial `v0.15.4` asset publication included a generic release-note pointer to a stale checked-in release record.
  The public release notes asset has been replaced, and the verifier now rejects that pointer, but the immutable source tag still contains the older `charness-artifacts/release/latest.md` content.
